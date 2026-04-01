# 🚀 Deployment Guide – PrivMITLab NewsHub

**Quick Deploy in 5 Minutes** ⚡

Choose your platform and follow the steps below.

---

## 🟢 Option 1: Vercel (Recommended) – 2 Minutes

**Best for**: Easiest deployment, automatic builds, zero config.

### **Step 1: Push to GitHub**
```bash
git add .
git commit -m "feat: production ready"
git push origin main
```

### **Step 2: Connect to Vercel**
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Select repository `newshub`
5. Click "Deploy"

✅ **Done!** Your app is live.

**URL**: `https://newshub-[randomname].vercel.app`

### **Optional: Custom Domain**
1. In Vercel → Project → Settings
2. Go to "Domains"
3. Add your custom domain
4. Follow DNS setup steps

---

## 🟠 Option 2: Netlify – 3 Minutes

**Best for**: Easy setup, great performance, free tier generous.

### **Step 1: Build the Project**
```bash
npm run build
```

### **Step 2: Deploy to Netlify**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

Or **manually upload**:
1. Go to https://netlify.com
2. Sign up with GitHub
3. Click "New site from Git"
4. Select repository
5. Click "Deploy"

✅ **Done!** Live on Netlify.

---

## 🔵 Option 3: GitHub Pages – 4 Minutes

**Best for**: Free, no extra account needed.

### **Step 1: Update vite.config.ts** (if using subdirectory)
```javascript
export default {
  base: '/newshub/',
  // ... rest of config
}
```

If using root domain, keep `base: '/'`

### **Step 2: Build**
```bash
npm run build
```

### **Step 3: Deploy**
```bash
npm install -g gh-pages
gh-pages -d dist
```

### **Step 4: Enable GitHub Pages**
1. Go to GitHub repo → Settings
2. Scroll to "Pages" section
3. Select "Deploy from a branch"
4. Select `gh-pages` branch
5. Click Save

✅ **Live at**: `https://[username].github.io/newshub`

---

## 🟡 Option 4: Self-Host (VPS/Shared Hosting) – 5 Minutes

**Best for**: Full control, custom domain, no platform limits.

### **Prerequisites**
- Web hosting with Node.js or static file serving
- SSH access (or FTP)

### **Step 1: Build Locally**
```bash
npm run build
```

### **Step 2: Upload dist/ folder**
```bash
# Using SCP (example)
scp -r dist/* user@yourserver.com:/var/www/newshub

# Or via FTP/Control Panel
# Upload contents of dist/ to public_html/ or www/
```

### **Step 3: Configure Web Server**

**For Nginx:**
```nginx
server {
    listen 80;
    server_name newshub.yoursite.com;
    root /var/www/newshub;
    
    location / {
        try_files $uri /index.html;
    }
    
    # Cache assets
    location ~* \.(js|css|png|jpg)$ {
        expires 1y;
    }
}
```

**For Apache (.htaccess in dist/):**
```
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

### **Step 4: Enable HTTPS**
```bash
# Using Let's Encrypt + Certbot
sudo certbot certonly --webroot -w /var/www/newshub -d newshub.yoursite.com
```

✅ **Live at**: `https://newshub.yoursite.com`

---

## 🟣 Option 5: Docker (Advanced) – 5 Minutes

**Best for**: Containerized deployment, consistency across environments.

### **Step 1: Create Dockerfile** (already provided in repo)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### **Step 2: Build Image**
```bash
docker build -t newshub:latest .
```

### **Step 3: Run Container**
```bash
docker run -d -p 3000:3000 --name newshub newshub:latest
```

### **Step 4: Deploy**
- Push to Docker Hub / Private Registry
- Pull on server and run

✅ **Running at**: `http://localhost:3000`

---

## 📋 Pre-Deployment Checklist

- [ ] Code is committed to GitHub
- [ ] `npm run build` completes without errors
- [ ] No console errors when testing locally
- [ ] All files in `dist/` folder
- [ ] `dist/index.html` exists and is complete
- [ ] Service Worker registered properly
- [ ] Privacy message visible on page
- [ ] News sources work and fetch articles
- [ ] Offline caching works (after first load)
- [ ] Mobile layout looks good
- [ ] All links open with `rel="noopener"`

---

## ✅ Post-Deployment Verification

Once deployed, test these:

### **1. App Loads**
- [ ] Visit URL in browser
- [ ] Page loads in <2 seconds
- [ ] No 404 or 500 errors

### **2. Core Features Work**
- [ ] Select sources
- [ ] Click "Fetch News"
- [ ] Articles appear
- [ ] Click article → modal opens
- [ ] Click "Read Full Article" → opens in new tab

### **3. Offline Support**
- [ ] Load app once
- [ ] Go offline (DevTools → Network → Offline)
- [ ] Refresh page
- [ ] Cached articles still visible
- [ ] Previously viewed articles still work

### **4. Mobile Responsiveness**
- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Layout adapts properly
- [ ] Buttons are clickable
- [ ] No layout shift

### **5. Privacy**
- [ ] Privacy message visible
- [ ] DevTools → Network → No Google/Facebook scripts
- [ ] No analytics requests
- [ ] Only RSS/LibreTranslate/Open-Meteo requests visible

### **6. Performance**
- [ ] Lighthouse score > 90
- [ ] Page loads in <2 seconds
- [ ] Smooth scrolling
- [ ] No lag when clicking buttons

---

## 🐛 Troubleshooting Deployment

### **Problem: Blank page / 404**

**Solution**:
- Check that `dist/index.html` exists
- Verify all assets are in `dist/` folder
- Check web server routing (should serve `index.html` for all routes)
- Clear browser cache and hard refresh (Ctrl+Shift+R)

### **Problem: Service Worker not registering**

**Solution**:
- App must be served over HTTPS (or localhost)
- Check DevTools → Application → Service Worker
- Try clearing storage and reloading
- Check browser console for errors

### **Problem: News not fetching**

**Solution**:
- Check browser console → Network tab
- Verify RSS feeds are accessible
- Check CORS (rss2json.com should allow cross-origin)
- Try different sources
- Check internet connection

### **Problem: Images not showing**

**Solution**:
- This is normal for some RSS feeds (they block direct access)
- Click "Read Full Article" to see images on source site
- Not a bug, it's expected behavior

### **Problem: Translation not working**

**Solution**:
- LibreTranslate API might be overloaded
- Try again in a moment
- Check browser console for errors
- Verify internet connection

### **Problem: Mobile layout broken**

**Solution**:
- Clear browser cache
- Check viewport meta tag in HTML
- Test in Chrome DevTools mobile mode
- Try different mobile device in DevTools

---

## 🔒 Security Headers (Optional but Recommended)

### **For Vercel**
Create `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "no-referrer"
        }
      ]
    }
  ]
}
```

### **For Netlify**
Create `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "no-referrer"
```

---

## 📈 Analytics (Optional)

**Note**: This app is privacy-first and does NOT include analytics by default.

If you want basic deployment analytics:
- ✅ Vercel Analytics (built-in, privacy-respecting)
- ✅ Plausible Analytics (privacy-first)
- ❌ Google Analytics (tracking, not recommended)
- ❌ Facebook Pixel (tracking, not recommended)

---

## 🚀 Going Live Checklist

### **Before Launch**
- [ ] Choose hosting platform
- [ ] Configure custom domain (if desired)
- [ ] Enable HTTPS
- [ ] Test all features
- [ ] Verify offline support
- [ ] Check mobile responsiveness
- [ ] Test on multiple browsers

### **Launch**
- [ ] Deploy code
- [ ] Test live deployment
- [ ] Share URL with friends/family
- [ ] Post on GitHub
- [ ] Announce on social media

### **After Launch**
- [ ] Monitor for issues
- [ ] Gather feedback
- [ ] Fix bugs
- [ ] Plan improvements
- [ ] Celebrate! 🎉

---

## 📞 Deployment Support

### **Common Issues**

| Issue | Solution |
|-------|----------|
| Blank page | Check `dist/index.html`, clear cache |
| News not loading | Verify RSS feeds, check console |
| Service Worker fails | Ensure HTTPS or localhost |
| Mobile layout broken | Clear cache, check viewport meta |
| Images missing | Normal for some RSS feeds, click "Read Full" |
| Translation slow | Libretranslate API latency, retry |

### **Getting Help**
- 📖 Check README.md
- 🎯 See FEATURES.md
- 🐛 Report issues on GitHub
- 💭 Join discussions

---

## 🎉 You're Done!

Your **PrivMITLab NewsHub** is now **live and privacy-respecting**. 

Share the URL and enjoy serving users privacy-first news. 🌍

---

**Recommended**: Vercel (easiest) or GitHub Pages (free, no extra account).

**Deploy now**: https://vercel.com or https://pages.github.com

---

**Made with ❤️ for privacy.**

🚀 **Happy deploying!**
