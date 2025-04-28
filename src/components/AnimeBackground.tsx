
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

    // Create stars
    class Star {
      x: number;
      y: number;
      size: number;
      color: string;
      speed: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1 + 0.5;
        
        // Create different color stars for anime effect
        const colors = ["#ffffff", "#E0FFFF", "#FFD700", "#D8BFD8"];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        this.speed = Math.random() * 0.2 + 0.1;
      }

      update() {
        this.y += this.speed;
        
        // Reset position when star goes out of canvas
        if (this.y > canvas.height) {
          this.y = 0;
          this.x = Math.random() * canvas.width;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create array of stars
    const starCount = Math.floor((canvas.width * canvas.height) / 10000); // Adjust for density
    const stars: Star[] = [];
    
    for (let i = 0; i < starCount; i++) {
      stars.push(new Star());
    }

    // Animation loop
    const animate = () => {
      // Create a semi-transparent background to create trail effect
      ctx.fillStyle = "rgba(15, 12, 41, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw stars
      stars.forEach(star => {
        star.update();
        star.draw();
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
