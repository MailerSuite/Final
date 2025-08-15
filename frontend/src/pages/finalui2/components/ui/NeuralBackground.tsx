import React, { useEffect, useRef } from 'react';

interface NeuralBackgroundProps {
  className?: string;
  nodeCount?: number;
  connectionDistance?: number;
  animationSpeed?: number;
}

const NeuralBackground: React.FC<NeuralBackgroundProps> = ({
  className = '',
  nodeCount = 50,
  connectionDistance = 150,
  animationSpeed = 0.5
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    connections: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initNodes = () => {
      nodesRef.current = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * animationSpeed,
        vy: (Math.random() - 0.5) * animationSpeed,
        connections: 0
      }));
    };

    const drawNode = (node: typeof nodesRef.current[0]) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, Math.max(2, node.connections * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + node.connections * 0.1})`;
      ctx.fill();
      
      // Add subtle glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const drawConnection = (node1: typeof nodesRef.current[0], node2: typeof nodesRef.current[0], distance: number) => {
      const opacity = Math.max(0, 1 - distance / connectionDistance) * 0.2;
      ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(node1.x, node1.y);
      ctx.lineTo(node2.x, node2.y);
      ctx.stroke();
    };

    const updateNodes = () => {
      nodesRef.current.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        node.connections = 0;

        // Bounce off walls
        if (node.x <= 0 || node.x >= canvas.width) node.vx *= -1;
        if (node.y <= 0 || node.y >= canvas.height) node.vy *= -1;

        // Keep nodes in bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      updateNodes();

      // Draw connections
      for (let i = 0; i < nodesRef.current.length; i++) {
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const node1 = nodesRef.current[i];
          const node2 = nodesRef.current[j];
          const distance = Math.sqrt(
            Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2)
          );

          if (distance < connectionDistance) {
            drawConnection(node1, node2, distance);
            node1.connections++;
            node2.connections++;
          }
        }
      }

      // Draw nodes
      nodesRef.current.forEach(drawNode);

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    initNodes();
    animate();

    window.addEventListener('resize', () => {
      resizeCanvas();
      initNodes();
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [nodeCount, connectionDistance, animationSpeed]);

  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-30"
        style={{ background: 'transparent' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950/50 to-slate-900" />
    </div>
  );
};

export default NeuralBackground;