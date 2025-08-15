// Additional Animations for SpamGPT Landing Page

// Matrix rain effect for background
function createMatrixRain() {
    const container = document.createElement('div');
    container.className = 'matrix-rain';
    document.body.appendChild(container);
    
    const columns = Math.floor(window.innerWidth / 20);
    
    for (let i = 0; i < columns; i++) {
        const column = document.createElement('div');
        column.className = 'matrix-column';
        column.style.left = i * 20 + 'px';
        column.style.animationDuration = (Math.random() * 5 + 5) + 's';
        column.style.animationDelay = Math.random() * 5 + 's';
        
        // Add random characters
        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        let text = '';
        for (let j = 0; j < 30; j++) {
            text += chars[Math.floor(Math.random() * chars.length)] + '\n';
        }
        column.textContent = text;
        
        container.appendChild(column);
    }
}

// Typing effect for hero title
function initTypewriter() {
    const typewriterElements = document.querySelectorAll('.typewriter');
    
    typewriterElements.forEach(element => {
        const text = element.textContent;
        element.textContent = '';
        element.style.opacity = '1';
        
        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
                // Add cursor at the end
                const cursor = document.createElement('span');
                cursor.className = 'terminal-cursor';
                element.appendChild(cursor);
            }
        }, 100);
    });
}

// Glitch effect on hover
function addGlitchEffect() {
    const glitchElements = document.querySelectorAll('.hero-title span');
    
    glitchElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.classList.add('glitch');
            this.setAttribute('data-text', this.textContent);
        });
        
        element.addEventListener('mouseleave', function() {
            this.classList.remove('glitch');
        });
    });
}

// Parallax scrolling effect
function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(element => {
            const speed = element.getAttribute('data-parallax') || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// Magnetic button effect
function addMagneticButtons() {
    const magneticButtons = document.querySelectorAll('.btn-primary, .btn-secondary, .pricing-btn');
    
    magneticButtons.forEach(button => {
        button.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            this.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translate(0, 0)';
        });
    });
}

// Tilt effect on cards
function addTiltEffect() {
    const tiltElements = document.querySelectorAll('.feature-card, .pricing-card, .demo-card');
    
    tiltElements.forEach(element => {
        element.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const percentX = (x - centerX) / centerX;
            const percentY = (y - centerY) / centerY;
            
            const rotateX = percentY * 10;
            const rotateY = percentX * 10;
            
            this.style.transform = `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
}

// Smooth reveal on scroll
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.feature-card, .demo-card, .pricing-card');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });
    
    revealElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease';
        revealObserver.observe(element);
    });
}

// Initialize all animations
document.addEventListener('DOMContentLoaded', function() {
    // Uncomment to enable matrix rain (can be performance intensive)
    // createMatrixRain();
    
    setTimeout(initTypewriter, 500);
    addGlitchEffect();
    initParallax();
    addMagneticButtons();
    addTiltEffect();
    initScrollReveal();
    
    // Add loading animation removal
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 1000);
});