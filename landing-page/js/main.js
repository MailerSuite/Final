// Main JavaScript for SpamGPT Landing Page

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
            const value = target % 1 !== 0 ? current.toFixed(1) : Math.floor(current);
            stat.textContent = value;
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

// Observe elements for animation
function initPage() {
    // Animate stats when they come into view
    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) {
        observer.observe(statsSection);
    }
    
    // Smooth scroll for buttons with inline handler
    document.querySelectorAll('[onclick^="scrollToSection"]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = button.getAttribute('onclick').match(/scrollToSection\('(.+)'\)/)[1];
            scrollToSection(sectionId);
        });
    });
    
    // Initialize animations
    setTimeout(animateStats, 1000);
    
    // Mobile nav toggle
    const navToggle = document.querySelector('.nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('show');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
            mobileMenu.classList.remove('show');
            navToggle.setAttribute('aria-expanded', 'false');
        }));
    }
    
    // Demo: Terminal controls
    const runBtn = document.getElementById('terminal-run');
    if (runBtn) {
        runBtn.addEventListener('click', () => {
            const campaign = /** @type {HTMLSelectElement} */(document.getElementById('terminal-campaign')).value;
            const region = /** @type {HTMLSelectElement} */(document.getElementById('terminal-region')).value;
            const output = document.getElementById('terminal-output');
            if (!output) return;
            output.innerHTML = '';
            const lines = [
                `<div class="terminal-line"><span class="prompt">$</span><span class="command">spamgpt --send --campaign=${campaign.toLowerCase()}</span></div>`,
                `<div class="terminal-line"><span class="output">✓ AI analyzing recipient patterns...</span></div>`,
                `<div class="terminal-line"><span class="output">✓ Optimal routing selected (Server: ${region})</span></div>`,
                `<div class="terminal-line"><span class="output">✓ Campaign sent successfully!</span></div>`,
                `<div class="terminal-line"><span class="output">📊 Delivery Rate: ${Math.max(97.5, Math.min(99.9, (97 + Math.random()*3).toFixed(1)))}% | Latency: ${200 + Math.floor(Math.random()*120)}ms</span></div>`
            ];
            let i = 0;
            const addLine = () => {
                if (i < lines.length) {
                    output.insertAdjacentHTML('beforeend', lines[i]);
                    output.scrollTop = output.scrollHeight;
                    i++;
                    setTimeout(addLine, i === 1 ? 150 : 400);
                }
            };
            addLine();
        });
    }
    
    // Demo: Metrics controls
    let metricsTimer = null;
    const deliveryEl = document.getElementById('metric-delivery');
    const serversEl = document.getElementById('metric-servers');
    const emailsEl = document.getElementById('metric-emails');
    const latencyEl = document.getElementById('metric-latency');
    const autoEl = /** @type {HTMLInputElement} */(document.getElementById('metrics-autorefresh'));
    const speedEl = /** @type {HTMLInputElement} */(document.getElementById('metrics-speed'));
    const stepBtn = document.getElementById('metrics-step');
    
    function stepMetrics() {
        if (deliveryEl) {
            const base = 97.5 + Math.random() * 2.2;
            deliveryEl.textContent = `${base.toFixed(1)}%`;
        }
        if (serversEl) {
            const base = 1100 + Math.floor(Math.random() * 800);
            serversEl.textContent = base.toLocaleString();
        }
        if (emailsEl) {
            const base = 1.8 + Math.random() * 2.2;
            emailsEl.textContent = `${base.toFixed(1)}M`;
        }
        if (latencyEl) {
            const base = 180 + Math.floor(Math.random() * 140);
            latencyEl.textContent = `${base}ms`;
        }
    }
    
    function startMetrics() {
        stopMetrics();
        const speed = speedEl ? Number(speedEl.value) : 3;
        const interval = 2000 - (speed - 1) * 350; // 1..5 -> 2000..800ms
        metricsTimer = setInterval(stepMetrics, Math.max(600, interval));
    }
    
    function stopMetrics() {
        if (metricsTimer) {
            clearInterval(metricsTimer);
            metricsTimer = null;
        }
    }
    
    if (autoEl) {
        autoEl.addEventListener('change', () => {
            if (autoEl.checked) startMetrics(); else stopMetrics();
        });
    }
    if (speedEl) {
        speedEl.addEventListener('input', () => {
            if (autoEl && autoEl.checked) startMetrics();
        });
    }
    if (stepBtn) {
        stepBtn.addEventListener('click', stepMetrics);
    }
    if (autoEl && autoEl.checked) startMetrics();
}

document.addEventListener('DOMContentLoaded', initPage);

// Particle background effect
function initParticles() {
    const canvas = document.getElementById('neural-network');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 50;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
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
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(otherParticle.x, otherParticle.y);
                    ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - distance / 100)})`;
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
