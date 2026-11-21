# SYS by Tarasaka • Autonomous Business Operating System Landing Page

Landing page, SEO, and Answer Engine Optimization (AEO) hub designed for **SYS by Tarasaka**, developed by **Tarasaka Digital Solutions**.

---

## 🌟 Key Architecture & Highlights

1. **Crawler & AEO Optimized (Zero JS Lock-in)**:
   - Full semantic HTML5 structure with no empty React/SPA mount states.
   - Crawlers (Googlebot, Bingbot, Applebot) and AI Answer Engines (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) index the entire text, headings, and pricing directly on the first fetch.

2. **JSON-LD Schema Hierarchy**:
   - `Organization`: Tarasaka Digital Solutions
   - `SoftwareApplication`: SYS by Tarasaka
   - `FAQPage`: 7 core questions with 40–60 word direct answers
   - `BreadcrumbList`: Structured site navigation

3. **Complete Platform Showcase**:
   - **Module 1**: AI Website & Storefront Studio
   - **Module 2**: High-Velocity Omnichannel CRM
   - **Module 3**: Mediamation Multi-Channel Social Hub
   - **Module 4**: STRATIQ AI Business Intelligence Advisory

4. **Interactive Features**:
   - Live Product Dashboard Mockup with tab switcher
   - Interactive ROI & Hours Saved Calculator
   - Dark & Light mode switcher with `localStorage` persistence
   - Live automated tasks ticker counter
   - Interactive Book a Demo modal dialog

5. **Search Engine Essentials**:
   - `robots.txt`: Optimized permissions for AI search engines & web spiders
   - `sitemap.xml`: Complete search engine indexing map

---

## 🚀 How to Run & Preview

### Local Preview:
```bash
cd landing-page
npx serve . -p 3000
```
Then open `http://localhost:3000` in your browser.

### Production Deployment Options:
- **Cloudflare Pages / Vercel / Netlify**: Simply link to the `landing-page` directory with output directory `.`.
- **Custom Domain (`sys.tarasaka.com` or `tarasaka.com`)**: Place as root static content or proxy route `/` to `landing-page/index.html` while pointing `/login` and app routes to the React application.
