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
            const isPercent = stat.textContent.includes('%');
            const isMillions = stat.textContent.includes('M');
            if (isMillions) {
                stat.textContent = Math.floor(current);
            } else {
                stat.textContent = Math.floor(current);
            }
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

    // Mobile menu toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
        // Close menu on link click (mobile)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('open'));
        });
    }

    // SMTP Terminal interactive controls
    const sendBtn = document.getElementById('sendTestButton');
    const campaignInput = document.getElementById('campaignNameInput');
    const regionSelect = document.getElementById('regionSelect');
    const terminalOutput = document.getElementById('terminalOutput');

    if (sendBtn && campaignInput && regionSelect && terminalOutput) {
        sendBtn.addEventListener('click', () => {
            const campaign = (campaignInput.value || 'welcome').trim();
            const region = regionSelect.value;
            const now = new Date().toLocaleTimeString();

            const lines = [
                { type: 'command', text: `$ spamgpt --send --campaign=${campaign} --region=${region}` },
                { type: 'output', text: '✓ AI analyzing recipient patterns...' },
                { type: 'output', text: `✓ Optimal routing selected (Server: ${region}-0${Math.floor(Math.random()*3)+1})` },
                { type: 'output', text: '✓ Campaign sent successfully!' },
                { type: 'output', text: `📊 Delivery Rate: ${(98 + Math.random() * 2).toFixed(1)}% | Latency: ${200 + Math.floor(Math.random()*120)}ms | ${now}` }
            ];

            lines.forEach((line, idx) => {
                setTimeout(() => {
                    const row = document.createElement('div');
                    row.className = 'terminal-line';
                    if (line.type === 'command') {
                        const prompt = document.createElement('span');
                        prompt.className = 'prompt';
                        prompt.textContent = '$';
                        const cmd = document.createElement('span');
                        cmd.className = 'command';
                        cmd.textContent = line.text.replace('$ ', '');
                        row.appendChild(prompt);
                        row.appendChild(cmd);
                    } else {
                        const out = document.createElement('span');
                        out.className = 'output';
                        out.textContent = line.text;
                        row.appendChild(out);
                    }
                    terminalOutput.appendChild(row);
                    terminalOutput.scrollTop = terminalOutput.scrollHeight;
                }, 400 * idx);
            });
        });
    }

    // Real-time metrics simulation
    const deliveryRateValue = document.getElementById('deliveryRateValue');
    const activeServersValue = document.getElementById('activeServersValue');
    const emailsSentValue = document.getElementById('emailsSentValue');
    const avgResponseTimeValue = document.getElementById('avgResponseTimeValue');
    const sendRateRange = document.getElementById('sendRateRange');
    const autoMetricsToggle = document.getElementById('autoMetricsToggle');

    let metricsTimer = null;
    function updateMetricsTick() {
        const intensity = sendRateRange ? Number(sendRateRange.value) / 100 : 0.5;
        const baseDelivery = 98.2 + Math.random() * 1.6 - intensity * 0.7;
        const baseServers = 1100 + Math.floor(Math.random() * 300 + intensity * 300);
        const baseEmails = 2.0 + Math.random() * 1.0 + intensity * 1.5; // in M
        const baseLatency = 180 + Math.floor(Math.random() * 150) + Math.floor((1 - intensity) * 100);

        if (deliveryRateValue) deliveryRateValue.textContent = `${baseDelivery.toFixed(1)}%`;
        if (activeServersValue) activeServersValue.textContent = baseServers.toLocaleString();
        if (emailsSentValue) emailsSentValue.textContent = `${baseEmails.toFixed(1)}M`;
        if (avgResponseTimeValue) avgResponseTimeValue.textContent = `${baseLatency}ms`;
    }

    function startMetrics() {
        if (metricsTimer) clearInterval(metricsTimer);
        metricsTimer = setInterval(updateMetricsTick, 1200);
    }
    function stopMetrics() {
        if (metricsTimer) clearInterval(metricsTimer);
        metricsTimer = null;
    }

    if (autoMetricsToggle) {
        autoMetricsToggle.addEventListener('change', () => {
            if (autoMetricsToggle.checked) startMetrics(); else stopMetrics();
        });
    }
    if (sendRateRange) {
        sendRateRange.addEventListener('input', () => {
            updateMetricsTick();
        });
    }

    // Initialize metrics
    if (deliveryRateValue && activeServersValue && emailsSentValue && avgResponseTimeValue) {
        updateMetricsTick();
        if (!autoMetricsToggle || autoMetricsToggle.checked) startMetrics();
    }

    // Initialize animations
    setTimeout(animateStats, 1000);
});

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
