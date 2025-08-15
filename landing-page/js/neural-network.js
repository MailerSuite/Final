// Neural Network Background Animation

(function() {
    const canvas = document.getElementById('neural-network');
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    const nodes = [];
    const connections = [];
    const nodeCount = 50;
    const maxDistance = 150;
    
    class Node {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
            this.pulsePhase = Math.random() * Math.PI * 2;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
            
            this.pulsePhase += 0.02;
        }
        
        draw() {
            const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;
            const radius = this.radius + pulse * 2;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 212, 255, ${0.5 + pulse * 0.3})`;
            ctx.fill();
            
            // Glow effect
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius * 2, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius * 2);
            gradient.addColorStop(0, `rgba(0, 212, 255, ${0.2 + pulse * 0.1})`);
            gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        nodes.push(new Node());
    }
    
    function drawConnections() {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    const opacity = (1 - distance / maxDistance) * 0.3;
                    
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    
                    // Data packets animation
                    if (Math.random() < 0.001) {
                        connections.push({
                            from: nodes[i],
                            to: nodes[j],
                            progress: 0,
                            speed: 0.02
                        });
                    }
                }
            }
        }
    }
    
    function drawDataPackets() {
        for (let i = connections.length - 1; i >= 0; i--) {
            const conn = connections[i];
            conn.progress += conn.speed;
            
            if (conn.progress >= 1) {
                connections.splice(i, 1);
                continue;
            }
            
            const x = conn.from.x + (conn.to.x - conn.from.x) * conn.progress;
            const y = conn.from.y + (conn.to.y - conn.from.y) * conn.progress;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
            ctx.fill();
            
            // Trail effect
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
            ctx.fill();
        }
    }
    
    function animate() {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        ctx.fillRect(0, 0, width, height);
        
        // Update and draw nodes
        nodes.forEach(node => {
            node.update();
        });
        
        // Draw connections
        drawConnections();
        
        // Draw data packets
        drawDataPackets();
        
        // Draw nodes
        nodes.forEach(node => {
            node.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    // Handle resize
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
    
    // Start animation
    animate();
})();