// SpamGPT Landing Page - Main JavaScript

// Initialize AOS (Animate On Scroll)
document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });
});

// Smooth scrolling
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Particles.js configuration
particlesJS('particles-js', {
    particles: {
        number: {
            value: 80,
            density: {
                enable: true,
                value_area: 800
            }
        },
        color: {
            value: '#00d4ff'
        },
        shape: {
            type: 'circle'
        },
        opacity: {
            value: 0.5,
            random: false
        },
        size: {
            value: 3,
            random: true
        },
        line_linked: {
            enable: true,
            distance: 150,
            color: '#00d4ff',
            opacity: 0.2,
            width: 1
        },
        move: {
            enable: true,
            speed: 2,
            direction: 'none',
            random: false,
            straight: false,
            out_mode: 'out',
            bounce: false
        }
    },
    interactivity: {
        detect_on: 'canvas',
        events: {
            onhover: {
                enable: true,
                mode: 'grab'
            },
            onclick: {
                enable: true,
                mode: 'push'
            },
            resize: true
        },
        modes: {
            grab: {
                distance: 140,
                line_linked: {
                    opacity: 1
                }
            },
            push: {
                particles_nb: 4
            }
        }
    },
    retina_detect: true
});

// Counter animation
function animateCounter(element, target) {
    const duration = 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = current.toFixed(1);
    }, 16);
}

// Animate counters when in view
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target;
            const target = parseFloat(counter.getAttribute('data-count'));
            animateCounter(counter, target);
            counterObserver.unobserve(counter);
        }
    });
}, observerOptions);

document.querySelectorAll('.stat-number').forEach(counter => {
    counterObserver.observe(counter);
});

// Terminal typing effect
class Terminal {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.lines = [];
        this.currentLine = 0;
    }
    
    addLine(text, className = 'terminal-output') {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = `<span class="${className}">${text}</span>`;
        this.element.appendChild(line);
        this.element.scrollTop = this.element.scrollHeight;
    }
    
    typeCommand(command, callback) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = '<span class="prompt">$</span> <span class="terminal-output"></span>';
        this.element.appendChild(line);
        
        const output = line.querySelector('.terminal-output');
        let i = 0;
        
        const typeChar = () => {
            if (i < command.length) {
                output.textContent += command[i];
                i++;
                setTimeout(typeChar, 50);
            } else if (callback) {
                setTimeout(callback, 500);
            }
        };
        
        typeChar();
    }
}

// Initialize terminal demos
const smtpTerminal = new Terminal('smtp-terminal');
const blacklistTerminal = new Terminal('blacklist-terminal');

// SMTP Terminal Demo
setTimeout(() => {
    smtpTerminal.addLine('');
    smtpTerminal.addLine('Checking SMTP pool status...', 'terminal-info');
    setTimeout(() => {
        smtpTerminal.addLine('');
        smtpTerminal.addLine('╔════════════════════════════════════════════════╗', 'terminal-success');
        smtpTerminal.addLine('║         SMTP POOL STATUS REPORT                ║', 'terminal-success');
        smtpTerminal.addLine('╚════════════════════════════════════════════════╝', 'terminal-success');
        smtpTerminal.addLine('');
        smtpTerminal.addLine('Total Servers: 1,786', 'terminal-output');
        smtpTerminal.addLine('Active: 1,543 (86.4%)', 'terminal-success');
        smtpTerminal.addLine('Warming: 142 (7.9%)', 'terminal-warning');
        smtpTerminal.addLine('Blacklisted: 67 (3.8%)', 'terminal-error');
        smtpTerminal.addLine('Maintenance: 34 (1.9%)', 'terminal-info');
        smtpTerminal.addLine('');
        smtpTerminal.addLine('Average Response Time: 142ms', 'terminal-output');
        smtpTerminal.addLine('Throughput: 2.4M emails/hour', 'terminal-success');
        smtpTerminal.addLine('');
        smtpTerminal.addLine('AI Recommendation: Rotate 12 servers in US-EAST', 'terminal-info');
    }, 1000);
}, 2000);

// Blacklist Terminal Demo
setTimeout(() => {
    blacklistTerminal.addLine('');
    blacklistTerminal.addLine('Running comprehensive blacklist check...', 'terminal-info');
    setTimeout(() => {
        blacklistTerminal.addLine('');
        blacklistTerminal.addLine('Checking 89 blacklist databases...', 'terminal-output');
        blacklistTerminal.addLine('');
        blacklistTerminal.addLine('[✓] Spamhaus - Clean', 'terminal-success');
        blacklistTerminal.addLine('[✓] SpamCop - Clean', 'terminal-success');
        blacklistTerminal.addLine('[✓] Barracuda - Clean', 'terminal-success');
        blacklistTerminal.addLine('[✓] SURBL - Clean', 'terminal-success');
        blacklistTerminal.addLine('[✓] URIBL - Clean', 'terminal-success');
        blacklistTerminal.addLine('[!] CBL - Listed (will auto-delist)', 'terminal-warning');
        blacklistTerminal.addLine('[✓] SpamRATS - Clean', 'terminal-success');
        blacklistTerminal.addLine('[✓] DNSBL - Clean', 'terminal-success');
        blacklistTerminal.addLine('');
        blacklistTerminal.addLine('Status: 88/89 Clean (98.9%)', 'terminal-success');
        blacklistTerminal.addLine('Reputation Score: 94/100', 'terminal-info');
        blacklistTerminal.addLine('');
        blacklistTerminal.addLine('AI Action: Auto-rotating affected server', 'terminal-info');
    }, 1500);
}, 3000);

// SMTP Pool Live Demo
const smtpList = document.getElementById('smtp-list');
const smtpServers = [
    { hostname: 'smtp-001.us-east.pool', ip: '192.168.1.101', location: 'New York, US', status: 'active', speed: '850/hr', ping: '23ms' },
    { hostname: 'smtp-042.eu-west.pool', ip: '10.0.42.5', location: 'London, UK', status: 'active', speed: '920/hr', ping: '45ms' },
    { hostname: 'smtp-156.asia-pac.pool', ip: '172.16.156.200', location: 'Tokyo, JP', status: 'warming', speed: '650/hr', ping: '120ms' },
    { hostname: 'smtp-203.us-west.pool', ip: '10.0.203.17', location: 'San Francisco, US', status: 'active', speed: '880/hr', ping: '15ms' },
    { hostname: 'smtp-087.eu-central.pool', ip: '192.168.87.9', location: 'Frankfurt, DE', status: 'blacklisted', speed: '0/hr', ping: '38ms' },
    { hostname: 'smtp-445.sa-east.pool', ip: '10.0.445.22', location: 'São Paulo, BR', status: 'active', speed: '750/hr', ping: '95ms' }
];

// Populate SMTP list
smtpServers.forEach((server, index) => {
    setTimeout(() => {
        const item = document.createElement('div');
        item.className = 'smtp-item';
        item.innerHTML = `
            <span class="smtp-status ${server.status}"></span>
            <div class="smtp-info">
                <div>${server.hostname}</div>
                <div style="font-size: 0.75rem; color: var(--muted)">${server.ip}</div>
            </div>
            <span class="smtp-location">
                <i class="fas fa-globe"></i> ${server.location}
            </span>
            <div class="smtp-stats">
                <span><i class="fas fa-bolt"></i> ${server.speed}</span>
                <span><i class="fas fa-signal"></i> ${server.ping}</span>
            </div>
            <div class="smtp-actions">
                <button class="smtp-action-btn">Test</button>
                <button class="smtp-action-btn">Rotate</button>
            </div>
        `;
        smtpList.appendChild(item);
    }, index * 200);
});

// Chart animations
function createMiniChart(canvasId, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    
    const points = [];
    for (let i = 0; i < 20; i++) {
        points.push(Math.random() * height * 0.8 + height * 0.1);
    }
    
    function draw() {
        ctx.clearRect(0, 0, width, height);
        
        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.moveTo(0, points[0]);
        
        for (let i = 1; i < points.length; i++) {
            const xPos = (width / (points.length - 1)) * i;
            ctx.lineTo(xPos, points[i]);
        }
        
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(0, points[0]);
        
        for (let i = 1; i < points.length; i++) {
            const xPos = (width / (points.length - 1)) * i;
            ctx.lineTo(xPos, points[i]);
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Animate
        points.shift();
        points.push(Math.random() * height * 0.8 + height * 0.1);
        
        requestAnimationFrame(draw);
    }
    
    draw();
}

// Initialize charts
createMiniChart('delivery-chart', '#00d4ff');
createMiniChart('servers-chart', '#10b981');

// Email flow animation
let flowSpeed = 245;
let flowSuccess = 99.8;

setInterval(() => {
    // Update flow metrics with slight variations
    flowSpeed = Math.max(200, Math.min(300, flowSpeed + (Math.random() - 0.5) * 20));
    flowSuccess = Math.max(99.0, Math.min(100, flowSuccess + (Math.random() - 0.5) * 0.5));
    
    document.getElementById('flow-speed').textContent = Math.round(flowSpeed) + 'ms';
    document.getElementById('flow-success').textContent = flowSuccess.toFixed(1) + '%';
    
    // Update delivery rate
    const deliveryRate = parseFloat(document.getElementById('delivery-rate').textContent);
    const newRate = Math.max(97, Math.min(100, deliveryRate + (Math.random() - 0.5) * 0.3));
    document.getElementById('delivery-rate').textContent = newRate.toFixed(1) + '%';
    
    // Update active servers
    const activeServers = parseInt(document.getElementById('active-servers').textContent.replace(',', ''));
    const newServers = Math.max(1200, Math.min(1500, activeServers + Math.round((Math.random() - 0.5) * 50)));
    document.getElementById('active-servers').textContent = newServers.toLocaleString();
}, 2000);

// Bitcoin payment modal
let paymentModal = null;
let paymentTimer = null;
let btcPrice = 33500; // Mock BTC price

function showPaymentModal(plan, price) {
    paymentModal = document.getElementById('payment-modal');
    paymentModal.style.display = 'block';
    
    // Update plan details
    document.getElementById('selected-plan').textContent = plan.charAt(0).toUpperCase() + plan.slice(1) + ' Plan';
    document.getElementById('plan-price').textContent = '$' + price + '/month';
    document.getElementById('usd-amount').textContent = '$' + price;
    
    // Calculate BTC amount
    const btcAmount = (price / btcPrice).toFixed(6);
    document.getElementById('btc-amount').textContent = btcAmount;
    
    // Generate QR code
    const qrContainer = document.getElementById('qr-code');
    qrContainer.innerHTML = ''; // Clear previous QR code
    new QRCode(qrContainer, {
        text: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // Start payment timer
    startPaymentTimer();
}

function closePaymentModal() {
    if (paymentModal) {
        paymentModal.style.display = 'none';
        clearInterval(paymentTimer);
    }
}

function startPaymentTimer() {
    let timeLeft = 15 * 60; // 15 minutes in seconds
    
    paymentTimer = setInterval(() => {
        timeLeft--;
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        document.getElementById('timer').textContent = 
            minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
        
        if (timeLeft <= 0) {
            clearInterval(paymentTimer);
            closePaymentModal();
        }
    }, 1000);
}

function copyAddress() {
    const addressInput = document.getElementById('btc-address');
    addressInput.select();
    document.execCommand('copy');
    
    // Show feedback
    const copyBtn = document.querySelector('.copy-btn');
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
    copyBtn.style.background = 'var(--accent)';
    
    setTimeout(() => {
        copyBtn.innerHTML = originalHTML;
        copyBtn.style.background = '';
    }, 2000);
}

// Close modal on outside click
window.onclick = function(event) {
    if (event.target === paymentModal) {
        closePaymentModal();
    }
}

// Navigation scroll effect
let lastScroll = 0;
const nav = document.querySelector('.nav');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        nav.style.background = 'rgba(10, 10, 10, 0.95)';
        nav.style.backdropFilter = 'blur(20px)';
    } else {
        nav.style.background = 'rgba(10, 10, 10, 0.8)';
    }
    
    lastScroll = currentScroll;
});

// Add hover effects to flow nodes
document.querySelectorAll('.flow-node').forEach(node => {
    node.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
        this.style.borderColor = 'var(--primary)';
    });
    
    node.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.borderColor = '';
    });
});

// Initialize reveal animations
const revealElements = document.querySelectorAll('.reveal-fade-up, .reveal-fade-left, .reveal-fade-right');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

revealElements.forEach(el => {
    revealObserver.observe(el);
});