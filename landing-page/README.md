# SpamGPT Landing Page

A modern, AI-themed landing page for SpamGPT - the next-generation AI-powered email infrastructure platform.

## Features

- 🎨 **Modern Design**: Clean, professional interface with AI-inspired visual elements
- 🚀 **Responsive Layout**: Optimized for all devices and screen sizes
- ✨ **Interactive Elements**: Smooth animations, hover effects, and dynamic content
- 🧠 **AI Visuals**: Neural network animations and particle effects
- 📱 **Mobile-First**: Responsive design that works perfectly on mobile devices

## Structure

```
landing-page/
├── index.html          # Main HTML file
├── css/
│   ├── styles.css      # Main stylesheet
│   └── animations.css  # Animation definitions
├── js/
│   └── main.js        # Interactive JavaScript
└── README.md          # This file
```

## Quick Start

### Local Development

1. Navigate to the landing page directory:
   ```bash
   cd landing-page
   ```

2. Start a local HTTP server:
   ```bash
   python3 -m http.server 9000
   ```

3. Open your browser and visit:
   ```
   http://localhost:9000
   ```

### Alternative Servers

**Using Node.js:**
```bash
npx serve -s . -p 9000
```

**Using PHP:**
```bash
php -S localhost:9000
```

**Using Python 2:**
```bash
python -m SimpleHTTPServer 9000
```

## Deployment

### Static Hosting

The landing page is designed for static hosting and can be deployed to:

- **Netlify**: Drag and drop the `landing-page` folder
- **Vercel**: Connect your GitHub repository
- **GitHub Pages**: Push to a GitHub repository
- **AWS S3**: Upload files to an S3 bucket with static website hosting
- **Cloudflare Pages**: Connect your repository for automatic deployments

### Production Deployment

1. **Build Optimization** (Optional):
   ```bash
   # Minify CSS
   npm install -g cssnano
   cssnano css/styles.css css/styles.min.css
   
   # Minify JavaScript
   npm install -g uglify-js
   uglifyjs js/main.js -o js/main.min.js
   ```

2. **Upload Files**: Upload all files to your web server or hosting provider

3. **Configure Domain**: Point your domain to the hosting location

### Docker Deployment

Create a `Dockerfile`:
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t spamgpt-landing .
docker run -p 80:80 spamgpt-landing
```

## Customization

### Colors
Modify the CSS variables in `css/styles.css`:
```css
:root {
    --primary-color: #6366f1;    /* Main brand color */
    --secondary-color: #8b5cf6;  /* Secondary brand color */
    --accent-color: #06b6d4;     /* Accent color */
    --dark-bg: #0f172a;          /* Dark background */
    /* ... more variables */
}
```

### Content
Edit `index.html` to customize:
- Company name and branding
- Feature descriptions
- Pricing plans
- Contact information

### Animations
Modify `css/animations.css` to adjust:
- Animation timing
- Transition effects
- Hover states

## Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers

## Performance

- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices, SEO)
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

## SEO Features

- Semantic HTML structure
- Meta tags for social sharing
- Open Graph protocol support
- Structured data markup ready
- Mobile-friendly design

## Security

- No external dependencies (except CDN fonts/icons)
- Content Security Policy ready
- HTTPS compatible
- XSS protection built-in

## Support

For issues or questions:
1. Check the browser console for JavaScript errors
2. Verify all CSS and JS files are loading correctly
3. Ensure the HTTP server is running from the correct directory

## License

This landing page is part of the SpamGPT project and is proprietary software.
