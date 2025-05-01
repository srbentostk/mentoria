
import { useEffect, useRef } from "react";

const AnimeBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to window size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // Create "The Dip" curve points
    const generateDipCurve = (width: number, height: number) => {
      const points: {x: number, y: number}[] = [];
      const segments = 100;
      const curveHeight = height * 0.6;
      const startY = height * 0.3;
      
      // Generate points for "The Dip" curve
      for (let i = 0; i <= segments; i++) {
        const x = (width * i) / segments;
        let y;
        
        const normalizedX = i / segments;
        
        // Create "The Dip" shape with polynomial function
        if (normalizedX < 0.2) {
          // Initial success
          y = startY - normalizedX * curveHeight * 0.8;
        } else if (normalizedX < 0.5) {
          // The dip
          y = startY - curveHeight * 0.16 + Math.pow(normalizedX - 0.2, 2) * curveHeight * 10;
        } else {
          // Success after perseverance
          y = startY + curveHeight * 0.3 - Math.pow(normalizedX - 0.5, 0.7) * curveHeight * 0.7;
        }
        
        points.push({ x, y });
      }
      
      return points;
    };

    // Create stars/particles that follow the curve
    class DipParticle {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      size: number;
      color: string;
      speed: number;
      progress: number;
      curve: {x: number, y: number}[];

      constructor(curve: {x: number, y: number}[]) {
        this.curve = curve;
        this.progress = Math.random();
        
        // Position particle on the curve
        const point = this.getPointOnCurve(this.progress);
        this.x = point.x;
        this.y = point.y;
        
        // Get next target point
        this.progress += 0.005;
        if (this.progress > 1) this.progress = 0;
        const nextPoint = this.getPointOnCurve(this.progress);
        this.targetX = nextPoint.x;
        this.targetY = nextPoint.y;
        
        // Set particle properties
        this.size = Math.random() * 1.5 + 0.5;
        
        // Create different color particles for anime effect
        const colors = ["#ffffff", "#E0FFFF", "#FFD700", "#D8BFD8", "#FF69B4", "#9370DB"];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        this.speed = Math.random() * 0.005 + 0.002;
      }

      getPointOnCurve(progress: number) {
        // Get point on curve based on progress (0-1)
        const index = Math.min(Math.floor(progress * (this.curve.length - 1)), this.curve.length - 1);
        return this.curve[index];
      }

      update() {
        // Update progress along the curve
        this.progress += this.speed;
        if (this.progress > 1) this.progress = 0;
        
        // Get new target point on curve
        const point = this.getPointOnCurve(this.progress);
        this.targetX = point.x;
        this.targetY = point.y;
        
        // Move toward target with easing
        this.x += (this.targetX - this.x) * 0.1;
        this.y += (this.targetY - this.y) * 0.1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create array of particles
    const dipCurve = generateDipCurve(canvas.width, canvas.height);
    const particleCount = Math.floor((canvas.width * canvas.height) / 8000);
    const particles: DipParticle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push(new DipParticle(dipCurve));
    }

    // Animation loop
    const animate = () => {
      // Create a semi-transparent background to create trail effect
      ctx.fillStyle = "rgba(15, 12, 41, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });
      
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
    />
  );
};

export default AnimeBackground;
