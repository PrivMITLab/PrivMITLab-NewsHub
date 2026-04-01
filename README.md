# 🌍 PrivMITLab NewsHub - Privacy-First News Reader

<div align="center">

![Version](https://img.shields.io/badge/version-3.2-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38B2AC)
![Privacy](https://img.shields.io/badge/Privacy-100%25-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

**A minimalist, privacy-first news reader for Hindi, English, and global news**

[🌐 Live Demo](#) • [📖 Documentation](#) • [🔒 Privacy Policy](#) • [💬 Issues](#)

</div>

---

## 🇮🇳 🇬🇧 हिंदी English

**PrivMITLab NewsHub** is a completely free, privacy-first news reader that works without ads, tracking, or external CDN dependencies.

### 🌟 Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **100% Privacy** | No tracking, no analytics, no ads - ever |
| 🌐 **Multi-Language** | Hindi, English, Hinglish support |
| 📰 **20+ News Sources** | BBC Hindi, Aaj Tak, NDTV, The Hindu, and more |
| 📖 **Full Article Reader** | Read complete articles inside the app |
| 📑 **Bookmarks** | Save articles locally for later |
| 🌙 **5 Dark Themes** | AMOLED, Midnight, Ocean, Emerald, Purple |
| 🔊 **Text-to-Speech** | Listen to articles in Hindi/English |
| 🌐 **Translation** | Built-in Hindi ↔ English translation |
| 📴 **Offline Support** | Read cached articles without internet |
| 📱 **PWA Ready** | Install on mobile/desktop |

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/PrivMITLab/privmitlab-newshub.git
cd privmitlab-newshub

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

---

## 📱 Supported Devices

| Device | Support |
|--------|---------|
| 📱 Mobile | ✅ Full support |
| 📱 Tablet | ✅ Full support |
| 💻 Desktop | ✅ Full support |
| 📴 Offline | ✅ With Service Worker |

---

## 📰 Supported News Sources (20+)

### 🇮🇳 Indian Sources (Hindi/English)

| Source | Language | Type |
|--------|----------|------|
| BBC Hindi | हिंदी | RSS |
| Aaj Tak | हिंदी | RSS |
| NDTV | हिंदी/English | RSS |
| The Hindu | English | RSS |
| Times of India | English | RSS |
| Indian Express | English | RSS |
| Hindustan Times | English | RSS |
| India Today | हिंदी/English | RSS |
| Economic Times | English | RSS |
| Livemint | English | RSS |

### 🌍 Global Sources

| Source | Country | Type |
|--------|---------|------|
| BBC News | UK | RSS |
| Reuters | Global | RSS |
| Al Jazeera | Middle East | RSS |
| The Guardian | UK | RSS |
| TechCrunch | USA | RSS |
| Wired | USA | RSS |
| Hacker News | USA | API |
| NPR | USA | RSS |
| Ars Technica | USA | RSS |
| The Verge | USA | RSS |

---

## 🎨 Color Themes

1. 🌙 **Midnight Blue** - Default dark theme
2. 🌊 **Ocean Deep** - Blue gradient
3. 🌲 **Emerald Night** - Green accents  
4. 🖤 **AMOLED Black** - Pure black for battery saving
5. 💜 **Purple Haze** - Purple accent theme

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Close modal/focus mode |
| `Space` | Scroll down in focus mode |
| `T` | Toggle text-to-speech |
| `D` | Toggle dark/light (if supported) |
| `B` | Quick bookmark |
| `/` | Focus search |

---

## 🔧 Configuration

### Adding Custom RSS Sources

Edit `src/App.tsx` and add to `SOURCES` array:

```typescript
{
  id: 'your-source' as SourceId,
  name: 'Your Source Name',
  label: 'Your Source',
  country: 'IN',
  type: 'rss',
  language: ['hi', 'en'],
  categories: ['india', 'world'],
  url: (category, lang) => `https://yoursite.com/rss/${category}.xml`
}
```

---

## 📂 Project Structure

```
privmitlab-newshub/
├── index.html          # Entry point
├── src/
│   ├── App.tsx        # Main React component
│   ├── main.tsx       # React entry
│   ├── index.css     # Tailwind styles
│   └── vite-env.d.ts # TypeScript definitions
├── public/
│   └── favicon.ico   # App favicon
├── package.json      # Dependencies
├── vite.config.ts    # Vite configuration
├── tailwind.config.js# Tailwind config
├── tsconfig.json     # TypeScript config
└── README.md        # This file
```

---

## 🔒 Privacy Policy

**PrivMITLab NewsHub** is committed to your privacy:

- ❌ No tracking scripts
- ❌ No analytics
- ❌ No ads
- ❌ No external CDNs
- ❌ No fingerprinting
- ✅ All data stored locally in your browser
- ✅ All preferences stay on your device

> *"This news reader does not track you. All preferences are stored locally on your device."*

---

## 🌐 Deployment

### Vercel (Recommended)

```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### GitHub Pages

```bash
npm run build
gh-pages -d dist
```

---

## 📝 API Usage

### RSS Feeds

Uses free RSS-to-JSON converters:
- `https://api.rss2json.com/v1/api.json?rss_url=...`
- `https://api.allorigins.win/raw?url=...`

### Full Article Reader

Uses free extraction APIs:
- `https://r.jina.ai/url/...` (Primary)
- `https://r.jina.ai/http://...`
- Fallback to source RSS content

### Translation

Uses LibreTranslate (free, self-hostable):
- `https://libretranslate.com/translate`

---

## 🐛 Troubleshooting

### Issue: "Access Denied" on some articles
**Solution:** Some sites block external access. Use "Open Original" link.

### Issue: Articles not loading
**Solution:** Check your internet connection. Clear browser cache.

### Issue: Offline mode not working
**Solution:** Visit the app once while online. Service worker caches automatically.

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [BBC News](https://www.bbc.com) - News content
- [Aaj Tak](https://www.aajtak.in) - Hindi news
- [r.jina.ai](https://r.jina.ai) - Article extraction
- [LibreTranslate](https://libretranslate.com) - Translation API
- [Tailwind CSS](https://tailwindcss.com) - Styling

---

## 📞 Contact

- **GitHub**: [@PrivMITLab](https://github.com/PrivMITLab)
- **Website**: https://privmitlab.github.io
- **Email**: contact@privmitlab.github.io

---

<div align="center">

**Made with ❤️ for privacy lovers**

🌍 *Let's build the privacy-first internet together!*

</div>