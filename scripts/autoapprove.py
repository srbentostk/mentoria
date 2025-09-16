import os
import time
import cv2
import mss
import numpy as np
import pyautogui

# ================== CONFIG ==================
TEMPLATE_FILES = os.getenv("JPD_TEMPLATES", "approve_once.png,allow_once.png").split(",")
TEMPLATE_FILES = [t.strip() for t in TEMPLATE_FILES if t.strip()]

THRESHOLD = float(os.getenv("JPD_THRESHOLD", "0.86"))   # 0..1 (reduza se necessário)
SCAN_INTERVAL = float(os.getenv("JPD_INTERVAL", "0.20"))
CLICK_COOLDOWN = float(os.getenv("JPD_COOLDOWN", "0.50"))  # s (por posição)
MIN_DIST = float(os.getenv("JPD_MIN_DIST", "32"))          # px (NMS por frame)
DRY_RUN = os.getenv("JPD_DRYRUN", "0") == "1"

# tolerância a mudanças de DPI/zoom
SCALES = [0.75, 0.85, 0.95, 1.00, 1.05, 1.15, 1.25]

# quantização de posição para chave do cooldown
CLICK_GRID = 24  # px

pyautogui.FAILSAFE = True  # mouse no canto sup-esq aborta

# ================== UTILS ==================
def load_template(path: str):
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise FileNotFoundError(f"Não achei a imagem: {path}")
    if img.ndim == 3 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return gray

def find_candidates(frame_gray, mon, name, template_gray):
    """Retorna lista de candidatos [(name, score, gx, gy, (w,h))] para um template."""
    th, tw = template_gray.shape[:2]
    cands = []
    for scale in SCALES:
        nw, nh = int(tw * scale), int(th * scale)
        if nw < 10 or nh < 10:
            continue
        tmpl = cv2.resize(template_gray, (nw, nh), interpolation=cv2.INTER_AREA)
        res = cv2.matchTemplate(frame_gray, tmpl, cv2.TM_CCOEFF_NORMED)
        yloc, xloc = np.where(res >= THRESHOLD)
        for (x, y) in zip(xloc, yloc):
            score = float(res[y, x])
            cx = mon["left"] + x + nw // 2
            cy = mon["top"] + y + nh // 2
            cands.append((name, score, cx, cy, (nw, nh)))
    return cands

def nms_by_distance(candidates, min_dist=MIN_DIST):
    """Non-maximum suppression simples por distância (greedy por score)."""
    candidates.sort(key=lambda c: c[1], reverse=True)  # score desc
    kept = []
    for cand in candidates:
        _, _, cx, cy, _ = cand
        too_close = False
        for _, _, kx, ky, _ in kept:
            if (cx - kx) ** 2 + (cy - ky) ** 2 < (min_dist ** 2):
                too_close = True
                break
        if not too_close:
            kept.append(cand)
    return kept

def quantize(x, q):
    return int(round(x / q))

# ================== MAIN LOOP ==================
def main():
    # Carrega templates
    templates = {}
    for path in TEMPLATE_FILES:
        name = os.path.basename(path)
        templates[name] = load_template(path)

    print(f"[i] Rodando para sempre. Templates: {', '.join(templates.keys())}")
    print(f"[i] threshold={THRESHOLD}  interval={SCAN_INTERVAL}s  cooldown={CLICK_COOLDOWN}s  dryrun={DRY_RUN}")
    print("[i] Ctrl+C ou mouse no canto superior esquerdo para sair.")

    last_click_time = {}  # chave: (template, qx, qy) -> timestamp

    with mss.mss() as sct:
        monitors = sct.monitors[1:] if len(sct.monitors) > 1 else [sct.monitors[0]]

        while True:
            all_cands = []
            # captura e detecção em todos os monitores
            for mon in monitors:
                scr = np.array(sct.grab(mon))  # BGRA
                frame_gray = cv2.cvtColor(scr, cv2.COLOR_BGRA2GRAY)
                for name, tmpl in templates.items():
                    all_cands.extend(find_candidates(frame_gray, mon, name, tmpl))

            # NMS por distância no frame (evita múltiplos cliques colados)
            all_cands = nms_by_distance(all_cands, MIN_DIST)

            now = time.time()
            for name, score, cx, cy, wh in all_cands:
                key = (name, quantize(cx, CLICK_GRID), quantize(cy, CLICK_GRID))
                if now - last_click_time.get(key, 0.0) >= CLICK_COOLDOWN:
                    if DRY_RUN:
                        pyautogui.moveTo(cx, cy, duration=0.12)
                        print(f"[·] {name} @({cx},{cy}) score={score:.3f} (DRY_RUN)")
                    else:
                        pyautogui.click(cx, cy)
                        print(f"[✓] clique em {name} @({cx},{cy}) score={score:.3f}")
                    last_click_time[key] = now

            time.sleep(SCAN_INTERVAL)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[.] Encerrado pelo usuário.")
