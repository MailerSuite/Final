// Main JavaScript for SpamGPT Landing Page

// Redirect to login page
function redirectToLogin() {
    // Redirect to frontend auth login page
    window.location.href = 'http://localhost:4000/auth/login';
}

// Redirect to signup page
function redirectToSignup() {
    // Redirect to frontend auth signup page
    window.location.href = 'http://localhost:4000/auth/signup';
}

// Smooth scrolling for navigation links
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// Animate stats numbers
function animateStats() {
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const target = parseFloat(stat.getAttribute('data-count'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            // Preserve decimals for percentages
            stat.textContent = Number.isInteger(target) ? Math.floor(current) : current.toFixed(1);
        }, 16);
    });
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, observerOptions);

// Rotate typewriter phrases
function initTypewriterRotation() {
    const el = document.querySelector('.typewriter');
    if (!el) return;
    try {
        const phrases = JSON.parse(el.getAttribute('data-phrases') || '[]');
        if (!Array.isArray(phrases) || phrases.length === 0) return;
        let index = 0;
        setInterval(() => {
            index = (index + 1) % phrases.length;
            el.textContent = phrases[index];
            el.style.animation = 'none';
            // Trigger reflow to restart CSS animation
            void el.offsetHeight;
            el.style.animation = '';
        }, 3500);
    } catch (e) {
        console.warn('Typewriter phrases invalid');
    }
}

// Demo iframe loader
function initDemoEmbed() {
    const iframe = document.getElementById('demo-iframe');
    const switches = document.querySelectorAll('.demo-switch');
    if (!iframe || switches.length === 0) return;
    
    // Local dev targets
    const localBase = 'http://localhost:4000';
    const routes = {
        animation: '/animation-demo',
        optimizer: '/landing/spamgpt/demo/optimizer',
        analytics: '/landing/spamgpt/demo/analytics'
    };

    function setActive(btn) {
        switches.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    async function tryLoad(url) {
        // Attempt fetch to detect availability without violating sandbox
        try {
            const res = await fetch(url, { method: 'GET', mode: 'no-cors' });
            // no-cors won't error on 200, assume available
            iframe.src = url;
        } catch (e) {
            // Fallback to placeholder page message
            iframe.srcdoc = `
                <style>
                    body{margin:0;display:grid;place-items:center;background:#020617;color:#cbd5e1;font-family:Inter,system-ui,sans-serif}
                    .card{padding:24px;border:1px solid #334155;border-radius:12px;background:#0b1220;max-width:560px;text-align:center}
                    b{color:#fff}
                    code{background:#0f172a;padding:2px 6px;border-radius:4px;color:#22d3ee}
                    .btn{display:inline-block;margin-top:12px;padding:8px 12px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none}
                </style>
                <div class='card'>
                    <div style='font-size:18px;margin-bottom:8px'>Interactive demo not reachable</div>
                    <div style='font-size:14px;opacity:.85'>Start the frontend locally and refresh to see the real app embedded here.</div>
                    <div style='margin-top:10px'>Run <code>npm run dev</code> in <code>/workspace/frontend</code> and open <code>${localBase}</code></div>
                    <a class='btn' target='_blank' href='${localBase}'>Open App</a>
                </div>`;
        }
    }

    switches.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-demo');
            if (!key) return;
            setActive(btn);
            tryLoad(`${localBase}${routes[key] || ''}`);
        });
    });

    // Initialize default view
    const active = document.querySelector('.demo-switch.active');
    if (active) {
        const key = active.getAttribute('data-demo');
        if (key) tryLoad(`${localBase}${routes[key]}`);
    }
}

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    // Animate stats when they come into view
    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) {
        observer.observe(statsSection);
    }
    
    // Add click event listeners
    document.querySelectorAll('[onclick^="scrollToSection"]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = button.getAttribute('onclick').match(/scrollToSection\('(.+)'\)/)[1];
            scrollToSection(sectionId);
        });
    });
    
    // Initialize animations
    setTimeout(animateStats, 800);
    initTypewriterRotation();
    initDemoEmbed();
});

// Particle background effect
function initParticles() {
    const canvas = document.getElementById('neural-network');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 70;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.6;
            this.vy = (Math.random() - 0.5) * 0.6;
            this.size = Math.random() * 2 + 1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
            ctx.fill();
        }
    }
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Draw connections
        particles.forEach((particle, i) => {
            particles.slice(i + 1).forEach(otherParticle => {
                const distance = Math.sqrt(
                    Math.pow(particle.x - otherParticle.x, 2) +
                    Math.pow(particle.y - otherParticle.y, 2)
                );
                
                if (distance < 110) {
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(otherParticle.x, otherParticle.y);
                    ctx.strokeStyle = `rgba(99, 102, 241, ${0.12 * (1 - distance / 110)})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

// Initialize particles when page loads
window.addEventListener('load', initParticles);

// Handle window resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('neural-network');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});
