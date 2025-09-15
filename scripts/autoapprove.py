import os
import sys
import time
import cv2
import numpy as np
import mss
import pyautogui

# ======= CONFIGURAÇÕES RÁPIDAS =======
BUTTON_IMAGE = "approve_once.png"  # imagem do botão (captura da sua tela)
THRESHOLD = float(os.getenv("JPD_THRESHOLD", "0.86"))  # confiança mínima (0-1)
SCALES = [0.75, 0.85, 0.95, 1.00, 1.05, 1.15, 1.25]   # multi-escala p/ DPI diferentes
SCAN_INTERVAL = 0.25   # segundos entre varreduras
CLICK_ONCE = False      # True = clica e sai; False = continua clicando sempre que aparecer
DRY_RUN = False        # True = só mover o mouse (sem clicar) para testar

pyautogui.FAILSAFE = True  # mover mouse p/ canto sup-esq aborta o script

def load_template(path: str) -> np.ndarray:
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise FileNotFoundError(f"Não achei a imagem do botão: {path}")
    # Ignora alpha se houver e converte pra escala de cinza
    if img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return gray

def match_on_monitor(sct: mss.mss, monitor: dict, template_gray: np.ndarray):
    scr = np.array(sct.grab(monitor))  # BGRA
    frame_gray = cv2.cvtColor(scr, cv2.COLOR_BGRA2GRAY)

    best_val = 0.0
    best_loc = None
    best_wh = None

    for scale in SCALES:
        th, tw = template_gray.shape[:2]
        nw, nh = int(tw * scale), int(th * scale)
        if nw < 10 or nh < 10:
            continue
        tmpl = cv2.resize(template_gray, (nw, nh), interpolation=cv2.INTER_AREA)

        res = cv2.matchTemplate(frame_gray, tmpl, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, max_loc = cv2.minMaxLoc(res)

        if max_val > best_val:
            best_val = max_val
            best_loc = max_loc
            best_wh = (nw, nh)

    if best_val >= THRESHOLD and best_loc and best_wh:
        x, y = best_loc
        w, h = best_wh
        # Converte p/ coordenadas globais do sistema
        gx = monitor["left"] + x + w // 2
        gy = monitor["top"] + y + h // 2
        return best_val, gx, gy, (w, h)

    return None

def main():
    template = load_template(BUTTON_IMAGE)
    print(f"[i] Vigiando '{BUTTON_IMAGE}' (threshold={THRESHOLD}) — Ctrl+C ou mouse canto sup-esq para abortar.")

    with mss.mss() as sct:
        # monitors[0] = bounding box de todos; [1:] = cada monitor
        monitors = sct.monitors[1:] if len(sct.monitors) > 1 else [sct.monitors[0]]

        while True:
            for mon in monitors:
                hit = match_on_monitor(sct, mon, template)
                if hit:
                    score, gx, gy, wh = hit
                    print(f"[+] Encontrei (score={score:.3f}) em ({gx},{gy}) tam={wh}")
                    if DRY_RUN:
                        pyautogui.moveTo(gx, gy, duration=0.15)
                    else:
                        pyautogui.click(gx, gy)
                    if CLICK_ONCE:
                        print("[✓] Clique realizado. Encerrando.")
                        return
            time.sleep(SCAN_INTERVAL)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[.] Parou por atalho do teclado.")
