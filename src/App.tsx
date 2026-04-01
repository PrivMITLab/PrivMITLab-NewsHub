import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type Lang = 'en' | 'hi' | 'hinglish' | 'global'
type Category = 'india' | 'world' | 'technology' | 'science' | 'business' | 'health' | 'sports' | 'education' | 'cybersecurity' | 'entertainment' | 'politics' | 'environment' | 'startup'
type SourceId = 'bbc' | 'thehindu' | 'ndtv' | 'reuters' | 'hindustantimes' | 'guardian' | 'timesofindia' | 'aljazeera' | 'techcrunch' | 'indianexpress' | 'livemint' | 'economictimes' | 'wired' | 'hackernews' | 'aajtak' | 'bbchindi' | 'indiatoday' | 'npr' | 'arstechnica' | 'theverge'
type ViewMode = 'grid' | 'list'
type SortMode = 'date' | 'source' | 'title'
type ThemeId = 'midnight' | 'ocean' | 'emerald' | 'amoled' | 'purple'

interface Article {
  id: string
  title: string
  description: string
  content?: string
  url: string
  image?: string
  publishedAt: string
  source: string
  sourceId: SourceId
  author?: string
  category: Category
  language: Lang
}

interface Bookmark extends Article {
  savedAt: string
  notes?: string
}

interface HistoryItem {
  id: string
  title: string
  source: string
  url: string
  readAt: string
  category: Category
}

interface ToastMsg {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface Theme {
  id: ThemeId
  name: string
  emoji: string
  bg: string
  card: string
  accent: string
  accentAlpha: string
  border: string
  cardHover: string
}

interface NewsSource {
  id: SourceId
  name: string
  label: string
  country: string
  type: 'rss' | 'api'
  language: Lang[]
  categories: Category[]
  url: (category: Category, lang: Lang) => string
}

interface WeatherData {
  temperature: number
  weathercode: number
  windspeed: number
  humidity: number
  city: string
}

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

// ═══════════════════════════════════════════════════════════════
// THEMES
// ═══════════════════════════════════════════════════════════════

const THEMES: Theme[] = [
  { id: 'midnight', name: 'Midnight Blue', emoji: '🌙', bg: '#0f1115', card: '#1a1f2b', accent: '#4da3ff', accentAlpha: 'rgba(77,163,255,0.15)', border: '#2a2f3b', cardHover: '#222a39' },
  { id: 'ocean', name: 'Ocean Deep', emoji: '🌊', bg: '#0a1628', card: '#112240', accent: '#64ffda', accentAlpha: 'rgba(100,255,218,0.15)', border: '#1d3461', cardHover: '#162d54' },
  { id: 'emerald', name: 'Emerald Night', emoji: '🌲', bg: '#0f1512', card: '#1a2b1f', accent: '#34d399', accentAlpha: 'rgba(52,211,153,0.15)', border: '#2a3b2f', cardHover: '#223a28' },
  { id: 'amoled', name: 'AMOLED Black', emoji: '🖤', bg: '#000000', card: '#111111', accent: '#4da3ff', accentAlpha: 'rgba(77,163,255,0.15)', border: '#222222', cardHover: '#1a1a1a' },
  { id: 'purple', name: 'Purple Haze', emoji: '💜', bg: '#110f1a', card: '#1e1a2e', accent: '#a78bfa', accentAlpha: 'rgba(167,139,250,0.15)', border: '#2e2a3e', cardHover: '#28243a' },
]

// ═══════════════════════════════════════════════════════════════
// NEWS SOURCES (20 sources)
// ═══════════════════════════════════════════════════════════════

const NEWS_SOURCES: NewsSource[] = [
  {
    id: 'bbc', name: 'BBC News', label: 'BBC', country: '🇬🇧', type: 'rss',
    language: ['en', 'global'],
    categories: ['world', 'technology', 'science', 'business', 'health', 'sports', 'education', 'india', 'cybersecurity', 'entertainment', 'politics', 'environment'],
    url: (cat) => {
      const m: Partial<Record<Category, string>> = {
        technology: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
        science: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
        world: 'https://feeds.bbci.co.uk/news/world/rss.xml',
        india: 'https://feeds.bbci.co.uk/news/world/asia/india/rss.xml',
        business: 'https://feeds.bbci.co.uk/news/business/rss.xml',
        health: 'https://feeds.bbci.co.uk/news/health/rss.xml',
        sports: 'https://feeds.bbci.co.uk/sport/rss.xml',
        education: 'https://feeds.bbci.co.uk/news/education/rss.xml',
        entertainment: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
        politics: 'https://feeds.bbci.co.uk/news/politics/rss.xml',
        environment: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
      }
      return m[cat] || m.world!
    }
  },
  {
    id: 'thehindu', name: 'The Hindu', label: 'The Hindu', country: '🇮🇳', type: 'rss',
    language: ['en', 'global'],
    categories: ['india', 'world', 'business', 'technology', 'science', 'education', 'health', 'sports', 'entertainment', 'politics', 'environment'],
    url: (cat) => {
      const m: Partial<Record<Category, string>> = {
        india: 'https://www.thehindu.com/news/national/feeder/default.rss',
        world: 'https://www.thehindu.com/news/international/feeder/default.rss',
        business: 'https://www.thehindu.com/business/feeder/default.rss',
        technology: 'https://www.thehindu.com/sci-tech/technology/feeder/default.rss',
        science: 'https://www.thehindu.com/sci-tech/science/feeder/default.rss',
        education: 'https://www.thehindu.com/education/feeder/default.rss',
        health: 'https://www.thehindu.com/sci-tech/health/feeder/default.rss',
        sports: 'https://www.thehindu.com/sport/feeder/default.rss',
        entertainment: 'https://www.thehindu.com/entertainment/feeder/default.rss',
        politics: 'https://www.thehindu.com/news/national/feeder/default.rss',
        environment: 'https://www.thehindu.com/sci-tech/energy-and-environment/feeder/default.rss',
      }
      return m[cat] || m.india!
    }
  },
  {
    id: 'ndtv', name: 'NDTV', label: 'NDTV', country: '🇮🇳', type: 'rss',
    language: ['en', 'hi', 'hinglish', 'global'],
    categories: ['india', 'world', 'business', 'technology', 'sports', 'health', 'science', 'education', 'entertainment', 'politics', 'environment', 'startup'],
    url: (cat) => {
      const m: Partial<Record<Category, string>> = {
        india: 'https://feeds.feedburner.com/ndtvnews-india-news',
        world: 'https://feeds.feedburner.com/ndtvnews-world-news',
        business: 'https://feeds.feedburner.com/ndtvprofit-latest',
        technology: 'https://feeds.feedburner.com/gadgets360-latest',
        sports: 'https://feeds.feedburner.com/ndtvsports-latest',
        entertainment: 'https://feeds.feedburner.com/ndtvnews-india-news',
      }
      return m[cat] || m.india!
    }
  },
  {
    id: 'reuters', name: 'Reuters', label: 'Reuters', country: '🌐', type: 'rss',
    language: ['en', 'global'],
    categories: ['world', 'business', 'technology', 'science', 'health', 'sports', 'politics', 'environment'],
    url: () => 'https://www.reutersagency.com/feed/?best-topics=tech&post_type=best'
  },
  {
    id: 'hindustantimes', name: 'Hindustan Times', label: 'HT', country: '🇮🇳', type: 'rss',
    language: ['en', 'hi', 'hinglish', 'global'],
    categories: ['india', 'world', 'business', 'technology', 'sports', 'education', 'health', 'science', 'entertainment', 'politics', 'environment', 'startup'],
    url: (cat) => {
      const m: Partial<Record<Category, string>> = {
        india: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
        world: 'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml',
        business: 'https://www.hindustantimes.com/feeds/rss/business/rssfeed.xml',
        technology: 'https://www.hindustantimes.com/feeds/rss/technology/rssfeed.xml',
        sports: 'https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml',
        education: 'https://www.hindustantimes.com/feeds/rss/education/rssfeed.xml',
        health: 'https://www.hindustantimes.com/feeds/rss/health/rssfeed.xml',
        entertainment: 'https://www.hindustantimes.com/feeds/rss/entertainment/rssfeed.xml',
      }
      return m[cat] || m.india!
    }
  },
  {
    id: 'guardian', name: 'The Guardian', label: 'Guardian', country: '🇬🇧', type: 'rss',
    language: ['en', 'global'],
    categories: ['world', 'technology', 'science', 'business', 'education', 'india', 'health', 'sports', 'entertainment', 'politics', 'environment'],
    url: (cat) => {
      const m: Partial<Record<Category, string>> = {
        world: 'https://www.theguardian.com/world/rss',
        technology: 'https://www.theguardian.com/uk/technology/rss',
        science: 'https://www.theguardian.com/science/rss',
        business: 'https://www.theguardian.com/uk/business/rss',
        education: 'https://www.theguardian.com/education/rss',
        india: 'https://www.theguardian.com/world/india/rss',
        health: 'https://www.theguardian.com/society/health/rss',
        sports: 'https://www.theguardian.com/uk/sport/rss',
        entertainment: 'https://www.theguardian.com/uk/culture/rss',
        politics: 'https://www.theguardian.com/politics/rss',
        environment: 'https://www.theguardian.com/environment/rss',
      }
      return m[cat] || m.world!
    }
  },
  {
    id: 'timesofindia', name: 'Times of India', label: 'TOI', country: '🇮🇳', type: 'rss',
    language: ['en', 'hi', 'hinglish', 'global'],
    categories: ['india', 'world', 'business', 'technology', 'sports', 'entertainment', 'politics', 'science', 'education', 'startup'],
    url: (cat) => {
      const m: Partial<Record<Category, string>> = {
        india: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
        world: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms',
        business: 'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms',
        technology: 'https://timesofindia.indiatimes.com/rssfeeds/66949542.cms',
        sports: 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms',
        entertainment: 'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms',
        science: 'https://timesofindia.indiatimes.com/rssfeeds/66949542.cms',
        education: 'https://timesofindia.indiatimes.com/rssfeeds/913168846.cms',
        startup: 'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms',
      }
      return m[cat] || m.india!
    }
  },
  {
    id: 'aljazeera', name: 'Al Jazeera', label: 'Al Jazeera', country: '🌐', type: 'rss',
    language: ['en', 'global'],
    categories: ['world', 'business', 'technology', 'science', 'health', 'sports', 'politics', 'environment'],
    url: () => 'https://www.aljazeera.com/xml/rss/all.xml'
  },
  {
    id: 'techcrunch', name: 'TechCrunch', label: 'TC', country: '🇺🇸', type: 'rss',
    language: ['en', 'global'],
    categories: ['technology', 'startup', 'business', 'science', 'cybersecurity'],
    url: () => 'https://techcrunch.com/feed/'
  },
  {
    id: 'indianexpress', name: 'Indian Express', label: 'IE', country: '🇮🇳', type: 'rss',
    language: ['en', 'hi', 'hinglish', 'global'],
    categories: ['india', 'world', 'business', 'technology', 'sports', 'entertainment', 'politics', 'education', 'science'],
    url: (cat) => {
      const m: Partial<Record<Category, string>> = {
        india: 'https://indianexpress.com/section/india/feed/',
        world: 'https://indianexpress.com/section/world/feed/',
        business: 'https://indianexpress.com/section/business/feed/',
        technology: 'https://indianexpress.com/section/technology/feed/',
        sports: 'https://indianexpress.com/section/sports/feed/',
        entertainment: 'https://indianexpress.com/section/entertainment/feed/',
        politics: 'https://indianexpress.com/section/political-pulse/feed/',
        education: 'https://indianexpress.com/section/education/feed/',
        science: 'https://indianexpress.com/section/technology/science/feed/',
      }
      return m[cat] || m.india!
    }
  },
  {
    id: 'livemint', name: 'Livemint', label: 'Mint', country: '🇮🇳', type: 'rss',
    language: ['en', 'global'],
    categories: ['business', 'technology', 'india', 'world', 'politics', 'science', 'startup'],
    url: (cat) => {
      const m: Partial<Record<Category, string>> = {
        business: 'https://www.livemint.com/rss/markets',
        technology: 'https://www.livemint.com/rss/technology',
        india: 'https://www.livemint.com/rss/news',
        world: 'https://www.livemint.com/rss/news',
        politics: 'https://www.livemint.com/rss/politics',
        science: 'https://www.livemint.com/rss/science',
        startup: 'https://www.livemint.com/rss/companies',
      }
      return m[cat] || m.india!
    }
  },
  {
    id: 'economictimes', name: 'Economic Times', label: 'ET', country: '🇮🇳', type: 'rss',
    language: ['en', 'global'],
    categories: ['business', 'technology', 'india', 'world', 'startup', 'politics'],
    url: (cat) => {
      const m: Partial<Record<Category, string>> = {
        business: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
        technology: 'https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms',
        india: 'https://economictimes.indiatimes.com/news/politics-and-nation/rssfeeds/1052732854.cms',
        startup: 'https://economictimes.indiatimes.com/small-biz/rssfeeds/5575607.cms',
      }
      return m[cat] || m.business!
    }
  },
  {
    id: 'wired', name: 'Wired', label: 'Wired', country: '🇺🇸', type: 'rss',
    language: ['en', 'global'],
    categories: ['technology', 'science', 'cybersecurity', 'business', 'startup'],
    url: () => 'https://www.wired.com/feed/rss'
  },
  {
    id: 'hackernews', name: 'Hacker News', label: 'HN', country: '🌐', type: 'api',
    language: ['en', 'global'],
    categories: ['technology', 'science', 'cybersecurity', 'startup', 'business'],
    url: () => 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=15'
  },
  {
    id: 'aajtak', name: 'Aaj Tak', label: 'Aaj Tak', country: '🇮🇳', type: 'rss',
    language: ['hi', 'hinglish'],
    categories: ['india', 'world', 'business', 'sports', 'entertainment', 'politics'],
    url: () => 'https://www.aajtak.in/rssfeeds/?id=home'
  },
  {
    id: 'bbchindi', name: 'BBC Hindi', label: 'BBC हिन्दी', country: '🇮🇳', type: 'rss',
    language: ['hi', 'hinglish'],
    categories: ['india', 'world', 'business', 'sports', 'science', 'entertainment'],
    url: () => 'https://feeds.bbci.co.uk/hindi/rss.xml'
  },
  {
    id: 'indiatoday', name: 'India Today', label: 'India Today', country: '🇮🇳', type: 'rss',
    language: ['en', 'hi', 'hinglish', 'global'],
    categories: ['india', 'world', 'business', 'sports', 'politics', 'entertainment', 'science'],
    url: (cat) => {
      const m: Partial<Record<Category, string>> = {
        india: 'https://www.indiatoday.in/rss/1206514',
        world: 'https://www.indiatoday.in/rss/1206577',
        business: 'https://www.indiatoday.in/rss/1206513',
        sports: 'https://www.indiatoday.in/rss/1206550',
        politics: 'https://www.indiatoday.in/rss/1206514',
        entertainment: 'https://www.indiatoday.in/rss/home',
        science: 'https://www.indiatoday.in/rss/home',
      }
      return m[cat] || 'https://www.indiatoday.in/rss/home'
    }
  },
  {
    id: 'npr', name: 'NPR', label: 'NPR', country: '🇺🇸', type: 'rss',
    language: ['en', 'global'],
    categories: ['world', 'technology', 'science', 'health', 'education', 'business'],
    url: (cat) => {
      const m: Partial<Record<Category, string>> = {
        world: 'https://feeds.npr.org/1004/rss.xml',
        technology: 'https://feeds.npr.org/1019/rss.xml',
        science: 'https://feeds.npr.org/1007/rss.xml',
        health: 'https://feeds.npr.org/1128/rss.xml',
        education: 'https://feeds.npr.org/1013/rss.xml',
        business: 'https://feeds.npr.org/1006/rss.xml',
      }
      return m[cat] || m.world!
    }
  },
  {
    id: 'arstechnica', name: 'Ars Technica', label: 'Ars', country: '🇺🇸', type: 'rss',
    language: ['en', 'global'],
    categories: ['technology', 'science', 'cybersecurity', 'business', 'startup'],
    url: (cat) => {
      const m: Partial<Record<Category, string>> = {
        technology: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
        science: 'https://feeds.arstechnica.com/arstechnica/science',
        cybersecurity: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
        business: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
        startup: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
      }
      return m[cat] || m.technology!
    }
  },
  {
    id: 'theverge', name: 'The Verge', label: 'The Verge', country: '🇺🇸', type: 'rss',
    language: ['en', 'global'],
    categories: ['technology', 'science', 'business', 'entertainment', 'environment'],
    url: () => 'https://www.theverge.com/rss/index.xml'
  },
]

// ═══════════════════════════════════════════════════════════════
// CATEGORIES & LANGUAGES
// ═══════════════════════════════════════════════════════════════

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'india', label: 'India', icon: '🇮🇳' },
  { id: 'world', label: 'World', icon: '🌍' },
  { id: 'technology', label: 'Technology', icon: '💻' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'cybersecurity', label: 'Cyber Security', icon: '🔒' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'politics', label: 'Politics', icon: '🏛️' },
  { id: 'environment', label: 'Environment', icon: '🌱' },
  { id: 'startup', label: 'Startup', icon: '🚀' },
]

const LANGUAGES: { id: Lang; label: string; native: string }[] = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { id: 'hinglish', label: 'Hinglish', native: 'Hinglish' },
  { id: 'global', label: 'Global', native: 'Global' },
]

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const formatRelativeTime = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const stripHtml = (html: string) => {
  if (!html || html === 'undefined' || html === 'null') return ''
  const d = document.createElement('div')
  d.innerHTML = html
  return d.textContent || d.innerText || ''
}

const decodeHtmlEntities = (value: string) => {
  const txt = document.createElement('textarea')
  txt.innerHTML = value
  return txt.value
}

const toPlainText = (value: string) => {
  if (!value) return ''
  return stripHtml(
    value
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/[*_`~>-]/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim()
}

const sanitizeRenderableMarkup = (value: string) => {
  if (!value) return ''
  return decodeHtmlEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+=("[^"]*"|'[^']*')/gi, '')
    .replace(/javascript:/gi, '')
}

const normalizeArticleSpacing = (value: string) => {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

const scoreArticleText = (value: string, title: string) => {
  const plain = toPlainText(value)
  if (!plain) return -Infinity
  const titleNeedles = toPlainText(title)
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 6)
  const titleHits = titleNeedles.filter(w => plain.toLowerCase().includes(w)).length
  const paragraphCount = (value.match(/\n\s*\n/g) || []).length
  const imageCount = (value.match(/!\[[^\]]*\]\([^)]*\)/g) || []).length
  const headingCount = (value.match(/^#{1,6}\s/mg) || []).length
  const sentenceCount = (plain.match(/[.!?।]/g) || []).length
  const navPenalty = [
    'sign in', 'edition', 'advertisement', 'follow us', 'download app', 'privacy policy',
    'terms and conditions', 'copyright', 'most read', 'recommended', 'trending',
    'home', 'menu', 'live tv', 'epaper', 'subscribe'
  ].reduce((acc, k) => acc + (plain.toLowerCase().includes(k) ? 1 : 0), 0)

  return plain.length
    + titleHits * 80
    + paragraphCount * 20
    + sentenceCount * 2
    + imageCount * 35
    + headingCount * 25
    - navPenalty * 140
}

const lightCleanArticle = (raw: string, articleTitle: string) => {
  let text = raw
  const mdMarker = /Markdown Content:\s*/i
  if (mdMarker.test(text)) text = text.split(mdMarker)[1] || text
  text = text
    .replace(/^Title:\s*.+$/gmi, '')
    .replace(/^URL Source:\s*.+$/gmi, '')
    .replace(/^Published Time:\s*.+$/gmi, '')
    .replace(/^Markdown Content:\s*$/gmi, '')

  const lines = text.split('\n')
  const startIndex = lines.findIndex((line, idx) => {
    if (idx > 220) return false
    const plain = toPlainText(line).toLowerCase()
    const titleWords = toPlainText(articleTitle).toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 4)
    const titleHit = titleWords.length > 0 && titleWords.filter(w => plain.includes(w)).length >= Math.min(2, titleWords.length)
    const substantialLine = line.trim().length > 90 || /[.!?।]$/.test(line.trim()) || /[\u0900-\u097F]/.test(line)
    return titleHit || substantialLine
  })

  if (startIndex > 0) text = lines.slice(Math.max(0, startIndex - 1)).join('\n')

  const stopIndex = text.split('\n').findIndex((line, idx) => idx > 30 && /^(Related|Also Read|Read More|सम्बंधित ख़बरें|ये भी देखें|TOPICS:|Trending|TRENDING|RECOMMENDED|MOST READ|Advertisement|Copyright|About us|Contact us)/i.test(line.trim()))
  if (stopIndex > 0) text = text.split('\n').slice(0, stopIndex).join('\n')

  return normalizeArticleSpacing(text)
}

const detectLanguageFromText = (text: string): Lang => {
  const clean = toPlainText(text)
  if (!clean) return 'en'
  const hiChars = (clean.match(/[\u0900-\u097F]/g) || []).length
  const enChars = (clean.match(/[A-Za-z]/g) || []).length
  const totalAlpha = hiChars + enChars
  if (hiChars >= 8 && hiChars / Math.max(totalAlpha, 1) > 0.58) return 'hi'
  if (hiChars >= 6 && enChars >= 6) return 'hinglish'
  if (hiChars >= 4 && enChars <= 4) return 'hi'
  return 'en'
}

const detectLanguageFromSource = (text: string, source: NewsSource): Lang => {
  const detected = detectLanguageFromText(text)
  // Respect source language limits for better Hindi/English routing.
  if (source.language.includes(detected)) return detected
  if (!source.language.includes('en') && source.language.includes('hi')) return 'hi'
  if (!source.language.includes('en') && source.language.includes('hinglish')) return 'hinglish'
  return detected
}

// Get unique article content (avoid showing duplicate description + content)
const getUniqueContent = (article: Article) => {
  let desc = decodeHtmlEntities(article.description || '').trim()
  let content = decodeHtmlEntities(article.content || '').trim()
  const title = decodeHtmlEntities(article.title || '').trim()
  const plainDesc = toPlainText(desc)
  const plainContent = toPlainText(content)
  
  // If description is very short (< 50 chars), combine with title for better preview
  if (plainDesc.length > 0 && plainDesc.length < 50 && title.length > 20) {
    desc = `${title}. ${desc}`
  }
  
  // If description is very short (< 80 chars) but content exists, use content
  if (plainDesc.length < 80 && plainContent.length > 80) {
    return { description: content, content: content }
  }
  
  // If content is significantly longer than description, prefer content
  if (plainContent && plainContent.length > plainDesc.length + 100) {
    return { description: desc, content: content }
  }

  if (plainContent.length > 0 && title.length > 0 && plainContent.length > plainDesc.length) {
    return { description: desc, content: content }
  }
  
  // Otherwise just use description (which is usually the preview from RSS)
  return { description: desc, content: plainContent.length > plainDesc.length ? content : null }
}

const estimateReadTime = (text: string) => {
  const words = text.split(/\s+/).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return { words, minutes }
}

const normalizeUrl = (url: string) => url.replace(/[#?].*$/, '').replace(/\/$/, '')
const detectSourceIdFromUrl = (url: string): SourceId => {
  const host = (() => {
    try { return new URL(url).hostname.toLowerCase() } catch { return '' }
  })()
  if (host.includes('bbc.co.uk') || host.includes('bbc.com')) return 'bbchindi'
  if (host.includes('aajtak.in')) return 'aajtak'
  if (host.includes('hindustantimes.com')) return 'hindustantimes'
  if (host.includes('timesofindia.indiatimes.com')) return 'timesofindia'
  if (host.includes('thehindu.com')) return 'thehindu'
  if (host.includes('ndtv.com')) return 'ndtv'
  if (host.includes('theguardian.com')) return 'guardian'
  if (host.includes('indianexpress.com')) return 'indianexpress'
  return 'bbc'
}
const hasHindiScript = (text: string) => /[\u0900-\u097F]/.test(text)
const getArticleLanguageLabel = (article: Article) => {
  const detected = detectLanguageFromText(`${article.title} ${article.description} ${article.content || ''}`)
  if (article.language === 'hi' || detected === 'hi' || hasHindiScript(`${article.title} ${article.description}`)) return 'हिन्दी'
  if (detected === 'hinglish' || article.language === 'hinglish') return 'Hinglish'
  if (article.language === 'global') return 'Global'
  return 'English'
}
const getArticleLanguageColor = (article: Article, accent: string) => {
  const detected = detectLanguageFromText(`${article.title} ${article.description} ${article.content || ''}`)
  if (article.language === 'hi' || detected === 'hi' || hasHindiScript(`${article.title} ${article.description}`)) return { bg: '#f9731618', color: '#fdba74' }
  if (detected === 'hinglish' || article.language === 'hinglish') return { bg: '#8b5cf618', color: '#c4b5fd' }
  if (article.language === 'global') return { bg: '#06b6d418', color: '#67e8f9' }
  return { bg: accent + '15', color: accent }
}

const splitSentences = (text: string) => {
  const cleaned = toPlainText(text)
  // Better sentence splitting for both Hindi and English
  // Split on: . ! ? । (Hindi full stop) and newlines
  const sentences = cleaned
    .split(/(?<=[.!?।])\s+|(?<=[.!?।])\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 5) // Reduced threshold for better Hindi support
  
  return sentences
}

const getPreferredVoice = (lang: Lang) => {
  const voices = window.speechSynthesis?.getVoices?.() || []
  if (!voices.length) return null
  
  if (lang === 'hi' || lang === 'hinglish') {
    // Priority order for Hindi voices
    return voices.find(v => /hi(-|_)?IN/i.test(v.lang))
      || voices.find(v => /^hi/i.test(v.lang))
      || voices.find(v => /hindi/i.test(v.name.toLowerCase()))
      || voices.find(v => /India/i.test(v.name))
      // Fallback: try any voice with Hindi support
      || voices.find(v => v.lang.includes('hi'))
      || voices[0] // Last resort: any available voice
  }
  
  // English voices
  return voices.find(v => /^en(-|_)/i.test(v.lang))
    || voices.find(v => /^en/i.test(v.lang))
    || voices.find(v => /English/i.test(v.name))
    || voices[0] // Fallback to any voice
}

const ensureSpeechVoices = async () => {
  if (!('speechSynthesis' in window)) return
  const existing = window.speechSynthesis.getVoices()
  if (existing.length) return

  await new Promise<void>((resolve) => {
    const done = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', done)
      resolve()
    }
    window.speechSynthesis.addEventListener('voiceschanged', done)
    setTimeout(done, 2500) // Increased timeout for better loading
  })
  
  // Force load voices if still empty
  if (window.speechSynthesis.getVoices().length === 0) {
    // Try to trigger voice loading
    try {
      const utterance = new SpeechSynthesisUtterance('test')
      window.speechSynthesis.speak(utterance)
      window.speechSynthesis.cancel()
    } catch (e) {
      console.warn('Voice loading failed:', e)
    }
  }
}

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 10000) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

const readCache = (key: string) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as { at: number; data: any }
  } catch {
    return null
  }
}

const writeCache = (key: string, data: unknown) => {
  localStorage.setItem(key, JSON.stringify({ at: Date.now(), data }))
}

const cachedFetchJSON = async (url: string, cacheKey: string, maxAgeMs = 1000 * 60 * 15) => {
  const hit = readCache(cacheKey)
  if (hit && Date.now() - hit.at < maxAgeMs) return { data: hit.data, fromCache: true }
  const res = await fetch(url)
  if (!res.ok) throw new Error('Network fetch failed')
  const data = await res.json()
  writeCache(cacheKey, data)
  return { data, fromCache: false }
}

const getWeatherIcon = (code: number) => {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 57) return '🌦️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '🌨️'
  if (code <= 82) return '🌧️'
  return '⛈️'
}

const getWeatherLabel = (code: number) => {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly Cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 57) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  return 'Thunderstorm'
}

// ═══════════════════════════════════════════════════════════════
// STORAGE HELPERS
// ═══════════════════════════════════════════════════════════════

const store = {
  get: <T,>(key: string, fallback: T): T => {
    try { const raw = localStorage.getItem(`privmitlab-${key}`); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
  },
  set: (key: string, value: unknown) => {
    localStorage.setItem(`privmitlab-${key}`, JSON.stringify(value))
  },
  remove: (key: string) => localStorage.removeItem(`privmitlab-${key}`)
}

// ═══════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const fetchRss = async (rssUrl: string) => {
  const reqUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`
  const cacheKey = `privmitlab-cache-rss-${btoa(unescape(encodeURIComponent(rssUrl))).slice(0, 120)}`
  return cachedFetchJSON(reqUrl, cacheKey)
}

const fetchHackerNews = async (): Promise<Article[]> => {
  const { data } = await cachedFetchJSON('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=15', 'privmitlab-cache-hn', 1000 * 60 * 5)
  return (data.hits || []).map((hit: any, i: number) => ({
    id: `hn-${hit.objectID || i}`,
    title: hit.title || '',
    description: `${hit.points || 0} points • ${hit.num_comments || 0} comments on Hacker News`,
    content: hit.title,
    url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    image: '',
    publishedAt: hit.created_at || new Date().toISOString(),
    source: 'Hacker News',
    sourceId: 'hackernews' as SourceId,
    author: hit.author || 'HN User',
    category: 'technology' as Category,
    language: 'en' as Lang,
  }))
}

const fetchWeather = async (): Promise<WeatherData | null> => {
  try {
    let lat = 28.6139, lon = 77.2090, city = 'New Delhi'
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      )
      lat = pos.coords.latitude
      lon = pos.coords.longitude
      city = 'Your Location'
    } catch { /* use Delhi defaults */ }
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&timezone=auto`)
    if (!res.ok) return null
    const data = await res.json()
    return {
      temperature: Math.round(data.current.temperature_2m),
      weathercode: data.current.weathercode,
      windspeed: Math.round(data.current.windspeed_10m),
      humidity: data.current.relative_humidity_2m,
      city
    }
  } catch { return null }
}

const translateText = async (text: string, source: string, target: string) => {
  if (!text || text === 'undefined' || text === 'null' || source === target) return text || ''
  const clipped = text.slice(0, 5000)

  // Map language codes to API formats
  const langMap: Record<string, Record<string, string | null>> = {
    'en': { libre: 'en', google: 'en', mymemory: 'en', mglm: 'en', trt: 'en', deepl: 'EN' },
    'hi': { libre: 'hi', google: 'hi', mymemory: 'hi', mglm: 'hi', trt: 'hi', deepl: null },
  }

  const getTargetLang = (lang: string, api: string): string => {
    if (!langMap[lang]) return lang
    return langMap[lang][api] || lang
  }

  // 10+ Translation APIs with fallback chain
  const translationAPIs = [
    // 1. LibreTranslate (Primary)
    {
      name: 'LibreTranslate',
      call: async () => {
        const res = await fetchWithTimeout('https://libretranslate.com/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: clipped, source, target, format: 'text' })
        }, 12000)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        return data.translatedText || ''
      }
    },
    // 2. Argos OpenTech (Fast)
    {
      name: 'Argos',
      call: async () => {
        const res = await fetchWithTimeout('https://translate.argosopentech.com/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: clipped, source, target, format: 'text' })
        }, 12000)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        return data.translatedText || ''
      }
    },
    // 3. MyMemory API (Reliable)
    {
      name: 'MyMemory',
      call: async () => {
        const targetLang = getTargetLang(target, 'mymemory')
        const res = await fetchWithTimeout(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clipped)}&langpair=${source}|${targetLang}`,
          { method: 'GET' },
          12000
        )
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          return data.responseData.translatedText
        }
        throw new Error('MyMemory failed')
      }
    },
    // 4. Google Translate API (via Rapid API proxy)
    {
      name: 'Google',
      call: async () => {
        const res = await fetchWithTimeout('https://google-translate1.p.rapidapi.com/language/translate/v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': 'application/gzip'
          },
          body: `q=${encodeURIComponent(clipped)}&target=${target}&source=${source}`
        }, 12000)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        return data?.data?.translations?.[0]?.translatedText || ''
      }
    },
    // 5. Yandex Translate (Backup)
    {
      name: 'Yandex',
      call: async () => {
        const res = await fetchWithTimeout('https://api.yandex.cloud/api/v1/translation:translateText', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceLanguageCode: source, targetLanguageCode: target, texts: [clipped] })
        }, 12000)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        return data?.translations?.[0]?.text || ''
      }
    },
    // 6. Lingva Translate (Privacy-first)
    {
      name: 'Lingva',
      call: async () => {
        const res = await fetchWithTimeout(`https://lingva.ml/api/v1/${source}/${target}/${encodeURIComponent(clipped)}`, 
          { method: 'GET' }, 12000)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        return data?.translation || ''
      }
    },
    // 7. Libre Translate Mirror
    {
      name: 'LibreTranslate Mirror',
      call: async () => {
        const res = await fetchWithTimeout('https://translate.terraprint.com/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: clipped, source, target, format: 'text' })
        }, 12000)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        return data.translatedText || ''
      }
    },
    // 8. Localazy API
    {
      name: 'Localazy',
      call: async () => {
        const res = await fetchWithTimeout('https://api.localazy.com/v1/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clipped, source, target })
        }, 12000)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        return data?.result || ''
      }
    },
    // 9. Papago API (Naver)
    {
      name: 'Papago',
      call: async () => {
        const res = await fetchWithTimeout('https://openapi.naver.com/v1/papago/n2mt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source, target, text: clipped })
        }, 12000)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        return data?.message?.result?.translatedText || ''
      }
    },
    // 10. MGLM API
    {
      name: 'MGLM',
      call: async () => {
        const res = await fetchWithTimeout('https://api.mglm.io/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clipped, source, target })
        }, 12000)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        return data?.translation || ''
      }
    },
  ]

  // Try each API in order
  for (const api of translationAPIs) {
    try {
      const result = await api.call()
      if (result && result.trim()) {
        return result.trim()
      }
    } catch (err) {
      // Silently try next API
      continue
    }
  }

  // If all APIs fail, return original text
  return text || ''
}



// ═══════════════════════════════════════════════════════════════
// TOAST COMPONENT
// ═══════════════════════════════════════════════════════════════

function ToastContainer({ toasts, onDismiss }: { toasts: ToastMsg[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-[360px]">
      {toasts.map(t => (
        <div key={t.id} className="animate-slide-in flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl"
          style={{
            background: 'var(--card)',
            borderColor: t.type === 'success' ? '#065f46' : t.type === 'error' ? '#7f1d1d' : 'var(--border)',
          }}>
          <span className="text-lg">{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          <p className="flex-1 text-[13px] font-medium">{t.message}</p>
          <button onClick={() => onDismiss(t.id)} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">&times;</button>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════

export default function App() {
  // ─── State ───
  const [themeId, setThemeId] = useState<ThemeId>('midnight')
  const [selectedSources, setSelectedSources] = useState<SourceId[]>(['bbc', 'thehindu', 'ndtv', 'timesofindia', 'aajtak', 'bbchindi'])
  const [category, setCategory] = useState<Category>('india')
  const [language, setLanguage] = useState<Lang>('en')
  const [searchQuery, setSearchQuery] = useState('')
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortMode, setSortMode] = useState<SortMode>('date')
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showDigest, setShowDigest] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [fontSize, setFontSize] = useState(16)
  const [translating, setTranslating] = useState<string | null>(null)
  // Preview translations - ONLY affects card, NOT full article
  const [previewTranslations, setPreviewTranslations] = useState<Record<string, { title: string, description: string, targetLang: string }>>({})
  const [customRssUrl, setCustomRssUrl] = useState('')
  
  // Full Article Reader States
  const [fullArticleContent, setFullArticleContent] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('privmitlab-full-articles')
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })
  const [loadingFullArticle, setLoadingFullArticle] = useState(false)
  const [showFullArticle, setShowFullArticle] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [clock, setClock] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(5)
  const [focusMode, setFocusMode] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [ttsPlaying, setTtsPlaying] = useState(false)
  const [ttsArticleId, setTtsArticleId] = useState<string | null>(null)
  const [ttsCurrentSentence, setTtsCurrentSentence] = useState('')
  const [ttsCurrentIndex, setTtsCurrentIndex] = useState(-1)
  const [readingProgress, setReadingProgress] = useState(0)
  const [articleNotes, setArticleNotes] = useState<Record<string, string>>({})
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [displayCount, setDisplayCount] = useState(18)
  const [bookmarkSearch, setBookmarkSearch] = useState('')
  const [hideRead, setHideRead] = useState(false)
  const [showHindiOnly, setShowHindiOnly] = useState(false)
  const [ttsRate, setTtsRate] = useState(0.9)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  // Modal translations - ONLY affects full article modal, NOT preview cards
  const [modalTranslatedContent, setModalTranslatedContent] = useState<Record<string, { title: string, description: string, body: string, targetLang: string }>>({})
  const [modalTranslating, setModalTranslating] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)
  const ttsTrackRef = useRef<HTMLDivElement>(null)
  const ttsSentencesRef = useRef<string[]>([])
  const ttsIndexRef = useRef(0)

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0]

  // ─── Toast helper ───
  const toast = useCallback((message: string, type: ToastMsg['type'] = 'info') => {
    const id = Date.now().toString()
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  // ─── Load preferences on mount ───
  useEffect(() => {
    const p = store.get('prefs', null as any)
    if (p) {
      if (p.themeId) setThemeId(p.themeId)
      if (p.selectedSources) setSelectedSources(p.selectedSources.filter((id: SourceId) => NEWS_SOURCES.some(s => s.id === id)))
      if (p.category) setCategory(p.category)
      if (p.language) setLanguage(p.language)
      if (p.viewMode) setViewMode(p.viewMode)
      if (p.sortMode) setSortMode(p.sortMode)
      if (p.fontSize) setFontSize(p.fontSize)
      if (p.autoRefresh !== undefined) setAutoRefresh(p.autoRefresh)
      if (p.autoRefreshInterval) setAutoRefreshInterval(p.autoRefreshInterval)
      if (p.hideRead !== undefined) setHideRead(p.hideRead)
      if (p.showHindiOnly !== undefined) setShowHindiOnly(p.showHindiOnly)
      if (p.ttsRate) setTtsRate(p.ttsRate)
    }
    setBookmarks(store.get<Bookmark[]>('bookmarks', []))
    setHistory(store.get<HistoryItem[]>('history', []))
    setArticleNotes(store.get<Record<string, string>>('notes', {}))

    fetchWeather().then(w => w && setWeather(w))

    // Service worker
    if ('serviceWorker' in navigator) {
      const sw = `const C='privmitlab-v2';self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['/'])))});self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>{if(r)return r;return fetch(e.request).then(res=>{if(!res||res.status!==200)return res;const cl=res.clone();caches.open(C).then(c=>c.put(e.request,cl));return res}).catch(()=>caches.match('/'))}))})`
      const b = new Blob([sw], { type: 'application/javascript' })
      navigator.serviceWorker.register(URL.createObjectURL(b)).catch(() => {})
    }
  }, [])

  // ─── Save preferences ───
  useEffect(() => {
    store.set('prefs', { themeId, selectedSources, category, language, viewMode, sortMode, fontSize, autoRefresh, autoRefreshInterval, hideRead, showHindiOnly, ttsRate })
  }, [themeId, selectedSources, category, language, viewMode, sortMode, fontSize, autoRefresh, autoRefreshInterval, hideRead, showHindiOnly, ttsRate])

  // ─── PWA install prompt ───
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  // ─── Clock ───
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ─── Back to top detection ───
  useEffect(() => {
    const h = () => setShowBackToTop(window.scrollY > 400)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  // ─── Reading progress in modal ───
  useEffect(() => {
    const el = modalContentRef.current
    if (!el || !selectedArticle) return
    const h = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      setReadingProgress(Math.round((scrollTop / (scrollHeight - clientHeight)) * 100) || 0)
    }
    el.addEventListener('scroll', h, { passive: true })
    return () => el.removeEventListener('scroll', h)
  }, [selectedArticle])

  useEffect(() => {
    if (!ttsTrackRef.current || ttsCurrentIndex < 0) return
    const active = ttsTrackRef.current.querySelector(`[data-tts-index="${ttsCurrentIndex}"]`)
    if (active) {
      ;(active as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [ttsCurrentIndex])

  // ─── Available sources ───
  const availableSources = useMemo(() => {
    return NEWS_SOURCES.filter(s => s.language.includes(language) && s.categories.includes(category))
  }, [language, category])

  // ─── Fetch news ───
  const fetchNews = useCallback(async () => {
    if (selectedSources.length === 0) {
      setError('Please select at least one news source')
      return
    }
    setLoading(true)
    setError(null)
    setDisplayCount(18)
    const all: Article[] = []

    try {
      const promises = selectedSources.map(async (sid) => {
        const source = NEWS_SOURCES.find(s => s.id === sid)
        if (!source) return []

        try {
          if (source.type === 'api' && source.id === 'hackernews') {
            return await fetchHackerNews()
          }

          const rssUrl = source.url(category, language)
          const { data } = await fetchRss(rssUrl)
          if (data.status === 'ok' && data.items) {
            return data.items.slice(0, 15).map((item: any, idx: number): Article => {
              const rawTitle = stripHtml(item.title || '').trim()
              const rawDesc = decodeHtmlEntities(String(item.description || '')).trim()
              const rawContent = decodeHtmlEntities(String(item.content || item.description || '')).trim()
              const bodyCandidate = rawContent.length > rawDesc.length + 80 ? rawContent : rawDesc
              const img = item.thumbnail || item.enclosure?.link ||
                (item.description?.match(/<img[^>]+src="([^">]+)"/)?.[1]) || ''
              return {
                id: `${sid}-${idx}-${item.guid || item.link}`,
                title: rawTitle,
                description: rawDesc,
                content: bodyCandidate,
                url: item.link,
                image: img,
                publishedAt: item.pubDate || new Date().toISOString(),
                source: source.label,
                sourceId: source.id,
                author: item.author || source.name,
                category,
                language: detectLanguageFromSource(`${rawTitle} ${rawDesc} ${rawContent}`, source),
              }
            })
          }
          return []
        } catch {
          return []
        }
      })

      // Custom RSS
      if (customRssUrl.trim()) {
        promises.push((async () => {
          try {
            const { data } = await fetchRss(customRssUrl)
            if (data.status === 'ok' && data.items) {
              return data.items.slice(0, 10).map((item: any, i: number): Article => ({
                id: `custom-${i}-${item.guid || item.link}`,
                title: stripHtml(item.title || '').trim(),
                description: decodeHtmlEntities(String(item.description || '')).trim(),
                content: decodeHtmlEntities(String(item.content || item.description || '')).trim(),
                url: item.link,
                image: item.thumbnail || '',
                publishedAt: item.pubDate || new Date().toISOString(),
                source: 'Custom RSS',
                sourceId: 'bbc' as SourceId,
                author: item.author || 'Custom',
                category,
                language: detectLanguageFromText(`${item.title || ''} ${item.description || ''} ${item.content || ''}`),
              }))
            }
            return []
          } catch { return [] }
        })())
      }

      const results = await Promise.all(promises)
      results.forEach((r: Article[]) => all.push(...r))

      let filtered = all
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        filtered = all.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
      }

      // Deduplicate
      const seen = new Set<string>()
      const unique = filtered.filter(a => {
        const k = `${a.title.toLowerCase().slice(0, 50)}-${normalizeUrl(a.url)}`
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })

      setArticles(unique)
      setLastFetchTime(new Date().toISOString())
      if (unique.length === 0) setError('No articles found. Try different sources or category.')
      else toast(`Loaded ${unique.length} articles from ${selectedSources.length} sources`, 'success')
    } catch {
      setError('Failed to fetch news. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [selectedSources, category, language, searchQuery, customRssUrl, toast])

  // ─── Auto fetch on mount ───
  useEffect(() => { fetchNews() }, [])

  // ─── Auto refresh ───
  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(() => {
      fetchNews()
      toast('Auto-refreshed news', 'info')
    }, autoRefreshInterval * 60 * 1000)
    return () => clearInterval(t)
  }, [autoRefresh, autoRefreshInterval, fetchNews, toast])

  // ─── Sorted articles ───
  const sortedArticles = useMemo(() => {
    const arr = [...articles]
    if (sortMode === 'date') arr.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    if (sortMode === 'source') arr.sort((a, b) => a.source.localeCompare(b.source))
    if (sortMode === 'title') arr.sort((a, b) => a.title.localeCompare(b.title))
    return arr
  }, [articles, sortMode])

  const readIds = useMemo(() => new Set(history.map(h => h.id)), [history])
  const filteredByRead = useMemo(() => hideRead ? sortedArticles.filter(a => !readIds.has(a.id)) : sortedArticles, [hideRead, readIds, sortedArticles])
  const languageFocusedArticles = useMemo(() => showHindiOnly ? filteredByRead.filter(a => a.language === 'hi' || a.language === 'hinglish' || hasHindiScript(`${a.title} ${a.description}`)) : filteredByRead, [showHindiOnly, filteredByRead])
  const visibleArticles = languageFocusedArticles.slice(0, displayCount)

  const dailyDigest = useMemo(() => {
    const topBySource = Object.entries(
      filteredByRead.reduce<Record<string, number>>((acc, a) => {
        acc[a.source] = (acc[a.source] || 0) + 1
        return acc
      }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 6)

    return {
      topBySource,
      topHeadlines: filteredByRead.slice(0, 8),
      latestAt: filteredByRead[0]?.publishedAt || null,
    }
  }, [filteredByRead])

  // ─── Bookmarks ───
  const toggleBookmark = (article: Article) => {
    setBookmarks(prev => {
      const exists = prev.find(b => b.id === article.id)
      const updated = exists ? prev.filter(b => b.id !== article.id) : [{ ...article, savedAt: new Date().toISOString() }, ...prev]
      store.set('bookmarks', updated)
      toast(exists ? 'Bookmark removed' : 'Article bookmarked!', exists ? 'info' : 'success')
      return updated
    })
  }
  const isBookmarked = (id: string) => bookmarks.some(b => b.id === id)

  // ─── Reading history ───
  const addToHistory = (article: Article) => {
    setHistory(prev => {
      const item: HistoryItem = { id: article.id, title: article.title, source: article.source, url: article.url, readAt: new Date().toISOString(), category: article.category }
      const updated = [item, ...prev.filter(h => h.id !== article.id)].slice(0, 100)
      store.set('history', updated)
      return updated
    })
  }

  // ─── Open article ───
  const openArticle = (article: Article) => {
    stopSpeech()
    setSelectedArticle(article)
    setReadingProgress(0)
    // Always try to show the best in-app reading view first.
    setShowFullArticle(true)
    addToHistory(article)

    if (!fullArticleContent[article.id]) {
      void fetchFullArticle(article)
    }
  }

  const openHistoryItem = (item: HistoryItem) => {
    const existing = articles.find(a => a.id === item.id)
      || bookmarks.find(b => b.id === item.id)
      || articles.find(a => normalizeUrl(a.url) === normalizeUrl(item.url))
      || bookmarks.find(b => normalizeUrl(b.url) === normalizeUrl(item.url))

    if (existing) {
      openArticle(existing)
      return
    }

    // Fallback article keeps reading fully in-app even if source list changed.
    openArticle({
      id: item.id,
      title: item.title,
      description: 'Previously opened article from your reading history.',
      content: '',
      url: item.url,
      image: '',
      publishedAt: item.readAt,
      source: item.source,
      sourceId: detectSourceIdFromUrl(item.url),
      author: item.source,
      category: item.category,
      language: detectLanguageFromText(item.title),
    })
  }

  // ─── Source toggles ───
  const toggleSource = (id: SourceId) => setSelectedSources(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id])
  const selectAllSources = () => setSelectedSources(availableSources.map(s => s.id))
  const deselectAllSources = () => setSelectedSources([])

  // ─── Export/Import bookmarks ───
  const exportBookmarks = () => {
    const blob = new Blob([JSON.stringify(bookmarks, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `privmitlab-news-bookmarks-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    toast('Bookmarks exported!', 'success')
  }

  const importBookmarks = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result))
        if (Array.isArray(imported)) {
          const merged = [...imported, ...bookmarks]
          const unique = Array.from(new Map(merged.map((b: Bookmark) => [b.id, b])).values())
          setBookmarks(unique)
          store.set('bookmarks', unique)
          toast(`Imported ${imported.length} bookmarks`, 'success')
        }
      } catch { toast('Invalid file', 'error') }
    }
    reader.readAsText(file)
  }

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `privmitlab-reading-history-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    toast('Reading history exported!', 'success')
  }

  const getReadableArticleBody = useCallback((article: Article) => {
    const unique = getUniqueContent(article)
    const full = fullArticleContent[article.id]
    
    // Prefer full fetched content strongly
    if (full && full.length > 280) {
      return normalizeArticleSpacing(full)
    }
    
    // Fallback to best available
    const best = unique.content || unique.description || article.content || article.description || ''
    return normalizeArticleSpacing(best)
  }, [fullArticleContent])

  // ─── TTS ───
  const stopSpeech = useCallback(() => {
    window.speechSynthesis?.cancel()
    setTtsPlaying(false)
    setTtsArticleId(null)
    setTtsCurrentSentence('')
    setTtsCurrentIndex(-1)
    ttsSentencesRef.current = []
    ttsIndexRef.current = 0
  }, [])

  const speakNextSentence = useCallback((article: Article) => {
    const list = ttsSentencesRef.current
    const idx = ttsIndexRef.current
    if (!list[idx]) {
      stopSpeech()
      return
    }

    const sentence = list[idx]
    setTtsCurrentSentence(sentence)
    setTtsCurrentIndex(idx)
    const utt = new SpeechSynthesisUtterance(sentence)
    utt.rate = ttsRate
    utt.pitch = 1
    const detected = detectLanguageFromText(sentence)
    const targetLang: Lang = detected === 'hi' || detected === 'hinglish' ? detected : article.language
    utt.lang = targetLang === 'hi' || targetLang === 'hinglish' ? 'hi-IN' : 'en-US'
    const preferredVoice = getPreferredVoice(targetLang)
    if (preferredVoice) utt.voice = preferredVoice
    utt.onend = () => {
      ttsIndexRef.current += 1
      speakNextSentence(article)
    }
    utt.onerror = () => {
      ttsIndexRef.current += 1
      if (ttsIndexRef.current < list.length) {
        speakNextSentence(article)
      } else {
        stopSpeech()
      }
    }
    window.speechSynthesis.speak(utt)
  }, [stopSpeech, ttsRate])

  const speakArticle = async (article: Article) => {
    if (!('speechSynthesis' in window)) { toast('Text-to-speech not supported', 'error'); return }

    await ensureSpeechVoices()

    if (ttsPlaying && ttsArticleId === article.id) {
      stopSpeech()
      return
    }

    stopSpeech()
    const primary = getReadableArticleBody(article)
    const withTitle = `${article.title}. ${primary}`
    const sentences = splitSentences(withTitle)
    if (sentences.length === 0) {
      toast('No readable text found for voice', 'error')
      return
    }

    ttsSentencesRef.current = sentences
    ttsIndexRef.current = 0
    setTtsPlaying(true)
    setTtsArticleId(article.id)
    setTtsCurrentSentence(sentences[0])
    setTtsCurrentIndex(0)
    speakNextSentence(article)
  }

  const requestInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') {
      toast('NewsHub installed for offline-friendly access', 'success')
      setInstallPrompt(null)
    }
  }

  // ─── Share ───
  const shareArticle = async (article: Article) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, text: article.description, url: article.url })
        toast('Shared!', 'success')
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(article.url)
      toast('Link copied to clipboard!', 'success')
    }
  }

  // ─── Copy text ───
  const copyArticleText = async (article: Article) => {
    const full = fullArticleContent[article.id] || getUniqueContent(article).content || getUniqueContent(article).description || article.description
    const text = `${article.title}\n\n${toPlainText(full)}\n\nSource: ${article.source}\n${article.url}`
    await navigator.clipboard.writeText(text)
    toast('Article text copied!', 'success')
  }

  // ─── Print ───
  const markdownToPrintableHtml = (raw: string) => {
    const source = decodeHtmlEntities(raw || '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
    const escaped = source
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // If already HTML-like content exists, return sanitized HTML as-is.
    if (/<\/?(p|h1|h2|h3|ul|ol|li|img|blockquote|strong|em|a)\b/i.test(source)) {
      return source.replace(/\son\w+="[^"]*"/gi, '')
    }

    const lines = escaped.split(/\n/)
    const html: string[] = []
    let inUl = false
    let inOl = false

    const closeLists = () => {
      if (inUl) { html.push('</ul>'); inUl = false }
      if (inOl) { html.push('</ol>'); inOl = false }
    }

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) {
        closeLists()
        continue
      }
      if (/^#{1,3}\s/.test(line)) {
        closeLists()
        const depth = Math.min(3, (line.match(/^#+/)?.[0].length || 1))
        html.push(`<h${depth}>${line.replace(/^#{1,3}\s*/, '')}</h${depth}>`)
        continue
      }
      const ul = line.match(/^[-*]\s+(.+)/)
      if (ul) {
        if (!inUl) { closeLists(); html.push('<ul>'); inUl = true }
        html.push(`<li>${ul[1]}</li>`)
        continue
      }
      const ol = line.match(/^\d+[\.)]\s+(.+)/)
      if (ol) {
        if (!inOl) { closeLists(); html.push('<ol>'); inOl = true }
        html.push(`<li>${ol[1]}</li>`)
        continue
      }
      closeLists()
      html.push(`<p>${line}</p>`)
    }
    closeLists()

    return html.join('')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure><img src="$2" alt="$1" /><figcaption>$1</figcaption></figure>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  }

  const renderArticleMarkdown = (raw: string) => {
    const cleaned = normalizeArticleSpacing(raw)
    return sanitizeRenderableMarkup(cleaned)
  }

  const printArticle = (article: Article) => {
    const w = window.open('', '_blank')
    if (!w) return
    const full = getReadableArticleBody(article)
    const printableHtml = markdownToPrintableHtml(full)
    const safeTitle = stripHtml(article.title)
    w.document.write(`<!DOCTYPE html><html><head><title>${safeTitle}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;color:#222;line-height:1.8}h1{font-size:28px;margin-bottom:8px}h2{font-size:22px;margin:20px 0 8px}h3{font-size:18px;margin:16px 0 6px}img{max-width:100%;border-radius:8px;margin:14px 0}figure{margin:16px 0}figcaption{font-size:12px;color:#666}ul,ol{padding-left:24px}p{margin:0 0 12px}.meta{color:#666;font-size:14px;margin-bottom:24px}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #ddd;font-size:12px;color:#999}</style></head><body><h1>${safeTitle}</h1><p class="meta">${article.source}${article.author ? ` • ${article.author}` : ''} • ${new Date(article.publishedAt).toLocaleDateString()}</p>${article.image ? `<img src="${article.image}" alt="">` : ''}${printableHtml}<div class="footer">Printed from PrivMITLab NewsHub • ${article.url}</div></body></html>`)
    w.document.close()
    w.print()
  }

  // ─── Article notes ───
  const saveNote = (articleId: string, note: string) => {
    const updated = { ...articleNotes, [articleId]: note }
    setArticleNotes(updated)
    store.set('notes', updated)
  }

  const extractLikelyArticleLines = (raw: string, articleTitle: string) => {
    const titleNeedles = toPlainText(articleTitle)
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 6)

    const navKeywords = [
      'sign in', 'edition', 'advertisement', 'follow us', 'download app', 'privacy policy',
      'terms and conditions', 'copyright', 'most read', 'recommended', 'trending',
      'होम', 'मेन्यू', 'वीडियो', 'लाइव टीवी', 'ई-पेपर', 'फोटो', 'ट्रेंडिंग', 'कॉपीराइट'
    ]

    const lines = raw.split('\n')
    let started = false
    const kept: string[] = []

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) {
        if (started) kept.push('')
        continue
      }

      const plain = toPlainText(line).toLowerCase()
      const hasTitleSignal = titleNeedles.length > 0 && titleNeedles.filter(w => plain.includes(w)).length >= Math.min(2, titleNeedles.length)
      const likelyHeading = /^#{1,4}\s+/.test(line)
      const likelyImage = /^!\[[^\]]*\]\([^)]*\)/.test(line)
      const likelySentence = /[.!?।:]$/.test(line) || line.length > 70

      if (!started && (hasTitleSignal || likelyHeading)) {
        started = true
      }

      if (!started) continue
      if (navKeywords.some(k => plain.includes(k))) continue
      if (/^\[.+\]\(https?:\/\/[^)]+\)$/.test(line)) continue
      if (/^\*\s*\[.+\]\(https?:\/\/[^)]+\)$/.test(line)) continue
      if (/^image\s+\d+:/i.test(line)) continue
      if (/^#{1,4}\s*(related|latest|trending|recommended|topics)/i.test(line)) break
      if (/^(Related|Also Read|Read More|सम्बंधित ख़बरें|ये भी देखें)/i.test(line)) break

      if (!likelySentence && !likelyHeading && !likelyImage && line.length < 20 && !/[\u0900-\u097F]/.test(line)) continue

      kept.push(line)
    }

    return kept.join('\n').trim()
  }

  const cleanBbcArticle = (raw: string, title: string) => {
    let text = raw
    if (/Markdown Content:\s*/i.test(text)) text = text.split(/Markdown Content:\s*/i)[1] || text
    text = text
      .replace(/^Title:\s*.+$/gmi, '')
      .replace(/^URL Source:\s*.+$/gmi, '')
      .replace(/^Published Time:\s*.+$/gmi, '')
      .replace(/^Markdown Content:\s*$/gmi, '')

    const lines = text.split('\n')
    const cutAt = lines.findIndex((line, idx) => idx > 20 && /^(Related|Also Read|सम्बंधित ख़बरें|ये भी देखें|TOPICS:|Trending|Advertisement|Copyright)/i.test(line.trim()))
    if (cutAt > 0) text = lines.slice(0, cutAt).join('\n')

    const extracted = extractLikelyArticleLines(text, title)
    return extracted || text.trim()
  }

  const cleanAajTakArticle = (raw: string, title: string) => {
    let text = raw
    if (/Markdown Content:\s*/i.test(text)) text = text.split(/Markdown Content:\s*/i)[1] || text
    text = text
      .replace(/^Title:\s*.+$/gmi, '')
      .replace(/^URL Source:\s*.+$/gmi, '')
      .replace(/^Published Time:\s*.+$/gmi, '')
      .replace(/^Markdown Content:\s*$/gmi, '')

    const lines = text.split('\n')
    const start = lines.findIndex((line, idx) => idx < 240 && (line.trim().startsWith('# ') || toPlainText(line).includes(toPlainText(title).split(/\s+/).slice(0, 2).join(' '))))
    if (start > 0) text = lines.slice(start).join('\n')

    const tailCut = text.split('\n').findIndex((line, idx) => idx > 24 && /^(TOPICS:|Trending|Latest:|About us|Contact us|Copyright|RECOMMENDED|MOST READ|Advertisement|ये भी देखें)/i.test(line.trim()))
    if (tailCut > 0) text = text.split('\n').slice(0, tailCut).join('\n')

    return extractLikelyArticleLines(text, title) || text.trim()
  }

  const cleanToiArticle = (raw: string, title: string) => {
    let text = raw
    if (/Markdown Content:\s*/i.test(text)) text = text.split(/Markdown Content:\s*/i)[1] || text
    text = text
      .replace(/^Title:\s*.+$/gmi, '')
      .replace(/^URL Source:\s*.+$/gmi, '')
      .replace(/^Published Time:\s*.+$/gmi, '')
      .replace(/^Markdown Content:\s*$/gmi, '')

    const low = text.toLowerCase()
    if (low.includes('access denied') || low.includes("you don't have permission")) return ''

    return extractLikelyArticleLines(text, title) || text.trim()
  }

  const cleanHtArticle = (raw: string, title: string) => {
    let text = raw
    if (/Markdown Content:\s*/i.test(text)) text = text.split(/Markdown Content:\s*/i)[1] || text
    text = text
      .replace(/^Title:\s*.+$/gmi, '')
      .replace(/^URL Source:\s*.+$/gmi, '')
      .replace(/^Published Time:\s*.+$/gmi, '')
      .replace(/^Markdown Content:\s*$/gmi, '')

    // Keep more content for Hindustan Times - they have good structure
    const extracted = extractLikelyArticleLines(text, title)
    if (extracted && extracted.length > 280) return extracted

    // Fallback to keeping the first 1200 characters after cleaning metadata
    const cleaned = text.replace(/Image \d+:[^\n]*\n?/gi, '')
                       .replace(/Sign In|Edition|Advertisement|Follow us/gi, '')
    return cleaned.length > 350 ? cleaned : (extracted || text.trim())
  }

  // ─── Clean Full Article Content (Remove nav, ads, footer, garbage) ───
  const cleanFullArticle = (raw: string, article: Article): string => {
    const articleTitle = article.title
    // Source-specific parsing profiles keep more real article text in-app.
    if (article.sourceId === 'aajtak') {
      const cleaned = cleanAajTakArticle(raw, articleTitle)
      if (cleaned.length > 120) return cleaned
    }
    if (article.sourceId === 'bbchindi' || article.sourceId === 'bbc') {
      const cleaned = cleanBbcArticle(raw, articleTitle)
      if (cleaned.length > 120) return cleaned
    }
    if (article.sourceId === 'timesofindia') {
      const cleaned = cleanToiArticle(raw, articleTitle)
      if (cleaned.length > 120) return cleaned
    }
    if (article.sourceId === 'hindustantimes') {
      const cleaned = cleanHtArticle(raw, articleTitle)
      if (cleaned.length > 120) return cleaned
    }

    const lightCleaned = lightCleanArticle(raw, articleTitle)
    if (lightCleaned.length > 120) return lightCleaned

    let text = raw

    const mdMarker = /Markdown Content:\s*/i
    if (mdMarker.test(text)) {
      text = text.split(mdMarker)[1] || text
    }

    // === STEP 1: Remove Jina metadata headers ===
    // Remove "Title: ...", "URL Source: ...", "Published Time: ...", "Markdown Content:" lines
    text = text.replace(/^Title:\s*.+$/gmi, '')
    text = text.replace(/^URL Source:\s*.+$/gmi, '')
    text = text.replace(/^Published Time:\s*.+$/gmi, '')
    text = text.replace(/^Markdown Content:\s*$/gmi, '')

    // Try to isolate the best story block before bulk cleanup.
    const lines = text.split('\n')
    const candidates: string[] = []
    const titleWords = stripHtml(articleTitle).toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 5)
    const startIdx = lines.findIndex((line, idx) => {
      if (idx > 220) return false
      const low = stripHtml(line).toLowerCase()
      const hit = titleWords.filter(w => low.includes(w)).length
      return hit >= Math.min(2, titleWords.length)
    })
    if (startIdx > 0) {
      candidates.push(lines.slice(Math.max(0, startIdx - 1)).join('\n'))
    }
    candidates.push(text)

    const endMarkers = [
      /^(सम्बंधित ख़बरें|Related|Also Read|Read More|ये भी देखें)/i,
      /^(TOPICS:|Trending|TRENDING|RECOMMENDED|MOST READ|Latest:)/i,
      /^(About us|Contact us|Privacy Policy|Terms and Conditions|Copyright)/i,
      /^(Advertisement)$/i,
    ]
    const scored = candidates.map(candidate => {
      const cutLines = candidate.split('\n')
      const endIdx = cutLines.findIndex((line, idx) => idx > 25 && endMarkers.some(m => m.test(line.trim())))
      const trimmed = endIdx > 0 ? cutLines.slice(0, endIdx).join('\n') : candidate
      return { text: trimmed, score: scoreArticleText(trimmed, articleTitle) }
    }).sort((a, b) => b.score - a.score)
    text = scored[0]?.text || text

    // === STEP 2: Remove navigation/menu items ===
    // Remove common nav patterns
    const navPatterns = [
      // Remove Aaj Tak / India Today navigation
      /(?:Aaj Tak TV is now live|Click here to watch Aaj Tak Live)[\s\S]*?(?=\n\n)/gi,
      /Sign In[\s\S]*?Edition[\s\S]*?(?=\n\n)/gi,
      // Remove image navigation patterns
      /Image \d+: [^\n]*\n?/gi,
      // Remove footer patterns
      /(?:Copyright|©|All rights reserved)[\s\S]*$/gi,
      /Advertisement[\s\S]*?(?=\n\n|$)/gi,
      // Remove trending/recommended sections
      /(?:TRENDING|RECOMMENDED|MOST READ|LEATEST|Latest:)[\s\S]*?(?=\n\n|$)/gi,
      // Remove navigation links lists
      /\*?\s*\[?[A-Z][^\]]*\]?\s*\(https?:\/\/[^\)]*\)\s*/gi,
      // Remove social media share links
      /(?:Share on|share on|Share this|share this)[\s\S]*?(?=\n\n|$)/gi,
      // Remove "Download App" sections
      /(?:Download|download)[\s\S]*(?:App|app)[\s\S]*?(?=\n\n|$)/gi,
      // Remove "Follow us" sections
      /(?:Follow us|follow us)[\s\S]*?(?=\n\n|$)/gi,
      // Remove RSS feed links
      /RSS[\s\S]*?(?=\n\n|$)/gi,
      // Remove "Top Topics" / "Trending News"
      /(?:Top Topics|Trending News|TOPICS:)[\s\S]*?(?=\n\n|$)/gi,
      // Remove "Also Read" / "Read More" sections
      /(?:Also Read|Read More|और पढ़ें|यह भी पढ़ें)[\s\S]*?(?=\n\n|$)/gi,
      // Remove WhatsApp channel links
      /WhatsApp[\s\S]*channel[\s\S]*?(?=\n\n|$)/gi,
      // Remove newsletter signup
      /(?:Newsletter|Subscribe to our|Get the latest)[\s\S]*?(?=\n\n|$)/gi,
      // Remove cookie notices
      /(?:cookie|Cookie|कुकी)[\s\S]*?(?:accept|Accept|स्वीकार)[\s\S]*?(?=\n\n|$)/gi,
    ]

    for (const pattern of navPatterns) {
      text = text.replace(pattern, '')
    }

    // === STEP 3: Remove numbered list items that are navigation ===
    // Remove patterns like "1. [Home](url)" "2. [News](url)" etc.
    text = text.replace(/^\d+\.\s+\[?[A-Z][^\]]*\]?\s*\(https?:\/\/[^\)]*\)\s*$/gmi, '')

    // === STEP 4: Remove image-only lines that are navigation ===
    // Remove lines that are just image links without meaningful text
    text = text.replace(/^!\[Image \d+: [^\]]*\]\([^)]*\)$/gmi, '')
    text = text.replace(/^!\[[^\]]*\]\([^)]*\.svg[^)]*\)$/gmi, '')
    text = text.replace(/^!\[[^\]]*\]\([^)]*\.png[^)]*\)$/gmi, '')

    // === STEP 5: Remove duplicate title at start ===
    const cleanTitle = articleTitle.replace(/[<>]/g, '').trim()
    if (cleanTitle.length > 10) {
      // Remove exact title match at the beginning
      const escapedTitle = cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      text = text.replace(new RegExp(`^#{1,3}\\s*${escapedTitle}\\s*\n*`, 'mi'), '')
      text = text.replace(new RegExp(`^${escapedTitle}\\s*\n*`, 'mi'), '')
    }

    // === STEP 6: Remove "---- समाप्त ----" and similar end markers ===
    text = text.replace(/[-–—]{3,}\s*समाप्त\s*[-–—]{3,}/gi, '')
    text = text.replace(/[-–—]{3,}\s*END\s*[-–—]{3,}/gi, '')
    text = text.replace(/[-–—]{3,}/g, '')

    // === STEP 7: Remove "----" separators that are not meaningful ===
    text = text.replace(/\n{2,}[-–—]{2,}\n{2,}/g, '\n\n')

    // === STEP 8: Clean up excessive whitespace ===
    text = text.replace(/\n{4,}/g, '\n\n\n')  // Max 2 consecutive newlines
    text = text.replace(/^[ \t]+$/gm, '')      // Remove lines with only spaces
    text = text.replace(/\n{2,}\s*\n{2,}/g, '\n\n')  // Remove blank line clusters

    // === STEP 9: Remove very short lines that are likely navigation ===
    // But keep Hindi short lines and meaningful short lines
    text = text.split('\n').filter(line => {
      const trimmed = line.trim()
      if (trimmed.length === 0) return true  // Keep empty lines for paragraph breaks
      if (trimmed.length < 3) return false   // Remove very short lines
      // Keep lines that start with heading markers
      if (/^#{1,6}\s/.test(trimmed)) return true
      // Keep lines that start with bullet points
      if (/^[\s]*[-*•]\s/.test(trimmed)) return true
      // Keep lines that start with numbered lists
      if (/^\d+[\.\)]\s/.test(trimmed)) return true
      // Keep Hindi lines by default, but drop obvious short menu labels.
      if (/[\u0900-\u097F]/.test(trimmed)) {
        if (trimmed.length <= 14 && /^[\u0900-\u097F\s]+$/.test(trimmed)) return false
        return true
      }
      // Remove lines that are just URLs
      if (/^https?:\/\//.test(trimmed)) return false
      // Remove lines that look like navigation labels
      if (/^(Home|News|Sports|Tech|Business|World|India|Login|Sign In|Subscribe|Follow|Share|Download|Menu|Edition|IN|US)$/i.test(trimmed)) return false
      // Remove non-sentence menu-like stubs.
      if (trimmed.length < 60 && !/[.!?।:]/.test(trimmed) && /^[-A-Za-z0-9/&\s]+$/.test(trimmed)) return false
      return true
    }).join('\n')

    // === STEP 10: Article-focused extraction and final cleanup ===
    const extracted = extractLikelyArticleLines(text, articleTitle)
    if (extracted) {
      const extractedScore = scoreArticleText(extracted, articleTitle)
      const currentScore = scoreArticleText(text, articleTitle)
      if (extractedScore >= currentScore || extracted.length > text.length * 0.7) {
        text = extracted
      }
    }

    // === STEP 11: Final cleanup ===
    text = text.trim()
    
    // If after cleaning, text is too short, return original (better than empty)
    if (text.length < 50) {
      return raw
    }

    return text
  }

  // ─── Fetch Full Article Content with Multiple Fallbacks ───
  const fetchFullArticle = async (article: Article) => {
    // Check cache first
    if (fullArticleContent[article.id]) {
      setShowFullArticle(true)
      toast('Article already loaded from cache', 'success')
      return
    }
    
    setLoadingFullArticle(true)
    toast('Fetching full article...', 'info')

    const isBlockedResponse = (text: string) => {
      const low = text.toLowerCase()
      return low.includes('access denied')
        || low.includes('you don\'t have permission')
        || low.includes('error reference')
        || low.includes('request blocked')
        || low.includes('captcha')
        || low.includes('too many requests')
    }
    
    // List of free APIs to try (in order)
    const apis = [
      // API 1: r.jina.ai - Primary (works for many sites)
      {
        name: 'Jina Reader',
        fetch: async () => {
          const res = await fetch(`https://r.jina.ai/${article.url}`)
          if (!res.ok) throw new Error('Jina failed')
          const text = await res.text()
          if (isBlockedResponse(text)) throw new Error('Blocked response')
          if (text.length < 100) throw new Error('Too short')
          return text
        }
      },
      // API 2: Jina with http:// prefix (fallback for some sites)
      {
        name: 'Jina HTTP',
        fetch: async () => {
          const res = await fetch(`https://r.jina.ai/http://${article.url.replace(/^https?:\/\//, '')}`)
          if (!res.ok) throw new Error('Jina HTTP failed')
          const text = await res.text()
          if (isBlockedResponse(text)) throw new Error('Blocked response')
          if (text.length < 100) throw new Error('Too short')
          return text
        }
      },
      // API 3: Textise dot iitty (lightweight)
      {
        name: 'Textise',
        fetch: async () => {
          const res = await fetch(`https://r.jina.ai/https://r.jina.ai/${article.url}`)
          if (!res.ok) throw new Error('Textise failed')
          const text = await res.text()
          if (text.length < 100) throw new Error('Too short')
          return text
        }
      },
      // API 4: Codetabs (alternative reader)
      {
        name: 'Codetabs',
        fetch: async () => {
          const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(article.url)}`)
          if (res.ok) {
            const html = await res.text()
            // Extract text from HTML
            const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
            if (text.length > 200) return text
          }
          throw new Error('Codetabs failed')
        }
      },
      // API 5: AllOrigins (CORS proxy)
      {
        name: 'AllOrigins',
        fetch: async () => {
          const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(article.url)}`)
          if (res.ok) {
            const html = await res.text()
            const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
            if (text.length > 200) return text
          }
          throw new Error('AllOrigins failed')
        }
      },
      // API 6: 12ft.io (removes paywalls)
      {
        name: '12ft Ladder',
        fetch: async () => {
          const res = await fetch(`https://r.jina.ai/https://12ft.io/proxy?q=${encodeURIComponent(article.url)}`)
          if (res.ok) return await res.text()
          throw new Error('12ft failed')
        }
      }
    ]
    
    // Try each API in sequence
    for (const api of apis) {
      try {
        console.log(`Trying ${api.name}...`)
        const rawContent = await api.fetch()
        
        if (rawContent && rawContent.length > 100 && !isBlockedResponse(rawContent)) {
          // Clean the content - remove nav, ads, footer, garbage
          const cleanedContent = cleanFullArticle(rawContent, article)
          if (isBlockedResponse(cleanedContent) || cleanedContent.length < 180) {
            continue
          }
          
          // Success! Cache and show
          const newCache = { ...fullArticleContent, [article.id]: cleanedContent }
          setFullArticleContent(newCache)
          localStorage.setItem('privmitlab-full-articles', JSON.stringify(newCache))
          setShowFullArticle(true)
          toast(`✅ Full article loaded via ${api.name}!`, 'success')
          setLoadingFullArticle(false)
          return
        }
      } catch (err) {
        console.log(`${api.name} failed, trying next...`)
      }
    }
    
    // All APIs failed - show preview with option to open externally
    setLoadingFullArticle(false)
    toast('⚠️ Full text not available in-app. Opening preview...', 'info')
    setShowFullArticle(true) // Show whatever we have from RSS
  }
  
  // Clear full article cache
  const clearFullArticleCache = () => {
    setFullArticleContent({})
    localStorage.removeItem('privmitlab-full-articles')
    toast('Full article cache cleared', 'success')
  }

  // ─── Translate Preview (Card Only) - Does NOT affect full article ───
  const handleTranslate = async (article: Article) => {
    if (translating) return
    // Safe fallback for undefined/null title or description
    const safeTitle = article.title || ''
    const safeDesc = article.description || ''
    if (!safeTitle && !safeDesc) {
      toast('No content to translate', 'error')
      return
    }
    setTranslating(article.id)
    try {
      // Detect source language
      const guessedLang = detectLanguageFromText(safeTitle)
      const baseLang = article.language === 'global' ? guessedLang : article.language
      const sourceLang = baseLang === 'hi' || baseLang === 'hinglish' ? 'hi' : 'en'
      const targetLang = sourceLang === 'hi' ? 'en' : 'hi'

      toast('🔄 Translating...', 'info')

      // Translate ONLY title and description for preview
      const [newTitle, newDesc] = await Promise.all([
        safeTitle ? translateText(safeTitle, sourceLang, targetLang) : Promise.resolve(''),
        safeDesc ? translateText(safeDesc, sourceLang, targetLang) : Promise.resolve(''),
      ])

      const safeNewTitle = newTitle || safeTitle
      const safeNewDesc = newDesc || safeDesc

      const titleChanged = toPlainText(safeNewTitle) !== toPlainText(safeTitle)
      const descChanged = toPlainText(safeNewDesc) !== toPlainText(safeDesc)

      if (!titleChanged && !descChanged) {
        toast('❌ All translation APIs failed. Please try again later.', 'error')
        setTranslating(null)
        return
      }

      toast(`✅ Translated to ${targetLang === 'hi' ? 'Hindi' : 'English'}`, 'success')

      // Store in previewTranslations ONLY - does NOT modify articles array
      setPreviewTranslations(prev => ({
        ...prev,
        [article.id]: { title: safeNewTitle, description: safeNewDesc, targetLang }
      }))
    } catch (err) {
      toast(`❌ Translation API error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setTranslating(null)
    }
  }
  
  // ─── Translate Full Article (Modal Only) - Separate from preview ───
  const handleTranslateModal = async () => {
    if (!selectedArticle || modalTranslating) return
    setModalTranslating(true)
    try {
      toast('🔄 Translating full article...', 'info')

      const guessedLang = detectLanguageFromText(selectedArticle.title)
      const baseLang = selectedArticle.language === 'global' ? guessedLang : selectedArticle.language
      const sourceLang = baseLang === 'hi' || baseLang === 'hinglish' ? 'hi' : 'en'
      const targetLang = sourceLang === 'hi' ? 'en' : 'hi'

      // Get full article body
      const bodySource = getReadableArticleBody(selectedArticle)
      
      const [newTitle, newDesc, newBody] = await Promise.all([
        translateText(selectedArticle.title, sourceLang, targetLang),
        translateText(selectedArticle.description, sourceLang, targetLang),
        translateText(bodySource, sourceLang, targetLang),
      ])

      const titleChanged = toPlainText(newTitle) !== toPlainText(selectedArticle.title)
      const descChanged = toPlainText(newDesc) !== toPlainText(selectedArticle.description)
      const bodyChanged = toPlainText(newBody) !== toPlainText(bodySource)

      if (!titleChanged && !descChanged && !bodyChanged) {
        toast('❌ All translation APIs failed. Please try again later.', 'error')
        setModalTranslating(false)
        return
      }

      toast(`✅ Full article translated to ${targetLang === 'hi' ? 'Hindi' : 'English'}`, 'success')

      // Store in modalTranslatedContent ONLY
      setModalTranslatedContent(prev => ({
        ...prev,
        [selectedArticle.id]: { 
          title: newTitle, 
          description: newDesc, 
          body: newBody, 
          targetLang 
        }
      }))
    } catch (err) {
      toast(`❌ Translation API error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setModalTranslating(false)
    }
  }
  
  // Helper to get preview text (translated or original)
  const getPreviewText = (article: Article) => {
    const preview = previewTranslations[article.id]
    if (preview) {
      return { title: preview.title, description: preview.description, targetLang: preview.targetLang }
    }
    return { title: article.title, description: article.description, targetLang: null }
  }
  
  // Helper to get modal text (translated or original)
  const getModalText = (article: Article) => {
    const modal = modalTranslatedContent[article.id]
    if (modal) {
      return { title: modal.title, description: modal.description, body: modal.body, targetLang: modal.targetLang }
    }
    return { 
      title: article.title, 
      description: article.description, 
      body: getReadableArticleBody(article), 
      targetLang: null 
    }
  }

  // ─── Random article ───
  const randomArticle = () => {
    if (articles.length === 0) return
    const r = articles[Math.floor(Math.random() * articles.length)]
    openArticle(r)
    toast("Here's a random article for you! 🎲", 'info')
  }

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'Escape') { setSelectedArticle(null); setShowBookmarks(false); setShowSettings(false); setShowHistory(false); setShowStats(false); setShowShortcuts(false); setMobileSidebarOpen(false); setFocusMode(false); stopSpeech() }
      if (e.key === '?' && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') { e.preventDefault(); setShowShortcuts(v => !v) }
      if (e.key === 'b' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setShowBookmarks(v => !v) }
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') { fetchNews() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [fetchNews, stopSpeech])

  // ─── Stats data ───
  const stats = useMemo(() => {
    const sourceCounts: Record<string, number> = {}
    const catCounts: Record<string, number> = {}
    history.forEach(h => {
      sourceCounts[h.source] = (sourceCounts[h.source] || 0) + 1
      catCounts[h.category] = (catCounts[h.category] || 0) + 1
    })
    const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]
    return { total: history.length, bookmarked: bookmarks.length, topSource, topCat, sourceCounts, catCounts }
  }, [history, bookmarks])

  // ─── Filtered bookmarks ───
  const filteredBookmarks = useMemo(() => {
    if (!bookmarkSearch.trim()) return bookmarks
    const q = bookmarkSearch.toLowerCase()
    return bookmarks.filter(b => b.title.toLowerCase().includes(q) || b.source.toLowerCase().includes(q))
  }, [bookmarks, bookmarkSearch])

  // ─── CSS variables from theme ───
  const themeVars: React.CSSProperties = {
    '--bg': theme.bg,
    '--card': theme.card,
    '--accent': theme.accent,
    '--accent-alpha': theme.accentAlpha,
    '--border': theme.border,
    '--card-hover': theme.cardHover,
  } as React.CSSProperties

  const selectedArticleTtsSentences = useMemo(() => {
    if (!selectedArticle) return []
    const body = getReadableArticleBody(selectedArticle)
    return splitSentences(`${selectedArticle.title}. ${body}`)
  }, [selectedArticle, getReadableArticleBody])

  // ═════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════

  return (
    <div className="min-h-screen text-zinc-100 antialiased" style={{ ...themeVars, background: 'var(--bg)' }}>
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top, var(--accent-alpha), transparent 60%)` }} />
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />
      </div>

      {/* ═══ BREAKING NEWS TICKER ═══ */}
      {articles.length > 0 && (
        <div className="border-b overflow-hidden whitespace-nowrap" style={{ background: theme.accent + '10', borderColor: theme.accent + '30' }}>
          <div className="flex items-center">
            <div className="shrink-0 px-3 py-1.5 text-[11px] font-[800] uppercase tracking-wider" style={{ background: theme.accent, color: theme.bg }}>
              ⚡ Breaking
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="animate-ticker flex items-center gap-8 py-1.5 pl-4">
                {[...articles.slice(0, 10), ...articles.slice(0, 10)].map((a, i) => (
                  <button key={`tick-${i}`} onClick={() => openArticle(a)} className="shrink-0 text-[12px] font-medium text-zinc-300 hover:text-white transition-colors">
                    <span className="mr-2" style={{ color: theme.accent }}>●</span>{a.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-xl" style={{ background: theme.bg + 'cc', borderColor: theme.border }}>
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-2.5 md:px-6">
          {/* Mobile menu */}
          <button onClick={() => setMobileSidebarOpen(v => !v)} className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}88)` }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1.5" fill="white" stroke="none" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-[15px] font-[800] tracking-tight leading-4">PrivMITLab NewsHub</h1>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-500">Open News • No Tracking • Your Control</p>
            </div>
          </div>

          {/* Search */}
          <div className="mx-3 hidden flex-1 md:flex">
            <div className="relative w-full max-w-[500px]">
              <input ref={searchRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchNews()}
                placeholder="Search news… (Ctrl+K)" className="h-9 w-full rounded-xl border px-4 pl-9 text-[13px] outline-none placeholder:text-zinc-500" style={{ borderColor: 'var(--border)', background: 'var(--card)' }} />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); fetchNews() }} className="absolute right-12 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-sm">✕</button>
              )}
              <button onClick={fetchNews} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-[11px] font-bold" style={{ background: theme.accent, color: theme.bg }}>Go</button>
            </div>
          </div>

          {/* Clock */}
          <div className="hidden lg:flex items-center gap-2 text-[12px] text-zinc-400 tabular-nums">
            <span>{clock.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span style={{ color: theme.accent }}>{clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1">
            <button onClick={randomArticle} className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors" style={{ borderColor: 'var(--border)' }} title="Random article">
              🎲
            </button>
            <button onClick={() => setShowDigest(true)} className="flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-semibold transition-colors" style={{ borderColor: 'var(--border)' }} title="Daily digest">
              <span>🧾</span>
              <span className="hidden md:inline">Digest</span>
            </button>
            {installPrompt && (
              <button onClick={requestInstall} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold" style={{ background: theme.accent + '22', color: theme.accent }} title="Install app">
                <span>⬇️</span>
                <span className="hidden md:inline">Install</span>
              </button>
            )}
            <button onClick={() => setShowHistory(v => !v)} className="relative flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-semibold transition-colors" style={{ borderColor: 'var(--border)' }} title="History">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span className="hidden md:inline">History</span>
              {history.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full text-[9px] font-bold" style={{ background: theme.accent, color: theme.bg }}>{history.length}</span>}
            </button>
            <button onClick={() => setShowBookmarks(v => !v)} className="relative flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-semibold transition-colors" style={{ borderColor: 'var(--border)' }} title="Bookmarks">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
              <span className="hidden md:inline">Saved</span>
              {bookmarks.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full text-[9px] font-bold" style={{ background: theme.accent, color: theme.bg }}>{bookmarks.length}</span>}
            </button>
            <button onClick={() => setShowStats(v => !v)} className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors" style={{ borderColor: 'var(--border)' }} title="Statistics">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
            </button>
            <button onClick={() => setShowSettings(v => !v)} className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors" style={{ borderColor: 'var(--border)' }} title="Settings">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /></svg>
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="border-t px-4 py-2.5 md:hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="relative">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchNews()}
              placeholder="Search news…" className="h-9 w-full rounded-xl border px-4 pl-9 text-[13px] outline-none placeholder:text-zinc-500" style={{ borderColor: 'var(--border)', background: 'var(--card)' }} />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>
        </div>
      </header>

      {/* ═══ MAIN LAYOUT ═══ */}
      <main className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-4 py-5 md:px-6 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_280px]">

        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside className={`lg:sticky lg:top-[72px] lg:h-[calc(100vh-88px)] lg:overflow-auto lg:block ${mobileSidebarOpen ? 'fixed inset-0 z-50 overflow-auto p-4' : 'hidden'}`}
          style={mobileSidebarOpen ? { background: theme.bg } : undefined}>
          {mobileSidebarOpen && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Filters</h2>
              <button onClick={() => setMobileSidebarOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          <div className="rounded-2xl border p-4 space-y-4" style={{ borderColor: 'var(--border)', background: theme.card + 'cc' }}>
            {/* Privacy Notice */}
            <div className="rounded-xl border p-3" style={{ borderColor: '#065f4640', background: '#065f4620' }}>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 text-lg">🛡️</span>
                <div>
                  <p className="text-[12px] font-bold text-emerald-200">Privacy-First</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-emerald-300/70">This news reader does not track you. All preferences are stored locally on your device.</p>
                </div>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="mb-2 block text-[10px] font-[700] uppercase tracking-widest text-zinc-500">Language</label>
              <div className="grid grid-cols-2 gap-1.5">
                {LANGUAGES.map(l => (
                  <button key={l.id} onClick={() => setLanguage(l.id)}
                    className="rounded-lg border px-2.5 py-2 text-left transition-all"
                    style={{ borderColor: language === l.id ? theme.accent + '60' : 'var(--border)', background: language === l.id ? theme.accent + '15' : 'transparent' }}>
                    <div className="text-[12px] font-[600]">{l.label}</div>
                    <div className="text-[10px] text-zinc-500">{l.native}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="mb-2 block text-[10px] font-[700] uppercase tracking-widest text-zinc-500">Categories</label>
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setCategory(c.id)}
                    className="flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition-all"
                    style={{ borderColor: category === c.id ? theme.accent + '60' : 'var(--border)', background: category === c.id ? theme.accent + '15' : 'transparent', color: category === c.id ? theme.accent : undefined }}>
                    <span className="text-[12px]">{c.icon}</span>{c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* News Sources */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[10px] font-[700] uppercase tracking-widest text-zinc-500">Sources ({selectedSources.length})</label>
                <div className="flex gap-1 items-center">
                  <button onClick={selectAllSources} className="text-[10px] font-semibold hover:underline" style={{ color: theme.accent }}>All</button>
                  <span className="text-zinc-600">|</span>
                  <button onClick={() => {
                    const hindiSources = NEWS_SOURCES.filter(s => s.language.includes('hi') || s.language.includes('hinglish')).map(s => s.id)
                    setSelectedSources(hindiSources)
                    toast('Selected Hindi sources', 'success')
                  }} className="text-[10px] font-semibold hover:underline text-orange-400">हिन्दी</button>
                  <span className="text-zinc-600">|</span>
                  <button onClick={deselectAllSources} className="text-[10px] font-semibold text-zinc-500 hover:underline">None</button>
                </div>
              </div>
              <div className="space-y-1 max-h-[220px] overflow-auto pr-1">
                {availableSources.map(s => {
                  const hasHindi = s.language.includes('hi') || s.language.includes('hinglish')
                  return (
                  <label key={s.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border p-2 transition-all"
                    style={{ borderColor: selectedSources.includes(s.id) ? theme.accent + '40' : 'var(--border)', background: selectedSources.includes(s.id) ? theme.accent + '08' : 'transparent' }}>
                    <input type="checkbox" checked={selectedSources.includes(s.id)} onChange={() => toggleSource(s.id)} className="h-3.5 w-3.5 rounded" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-[600] flex items-center gap-1.5">
                        <span>{s.country}</span>
                        <span className="truncate">{s.name}</span>
                        {hasHindi && <span className="shrink-0 rounded px-1 py-0.5 text-[8px] font-bold bg-orange-500/20 text-orange-300">हिन्दी</span>}
                      </div>
                      <div className="text-[10px] text-zinc-500">Free {s.type === 'api' ? 'API' : 'RSS'} • No key needed</div>
                    </div>
                  </label>
                  )
                })}
              </div>

              {/* Custom RSS */}
              <input type="url" value={customRssUrl} onChange={e => setCustomRssUrl(e.target.value)}
                placeholder="Custom RSS URL…" className="mt-2 w-full rounded-lg border px-2.5 py-1.5 text-[11px] outline-none placeholder:text-zinc-600"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }} />
            </div>

            {/* Fetch Button */}
            <button onClick={() => { fetchNews(); setMobileSidebarOpen(false) }} disabled={loading || selectedSources.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-[700] shadow-lg transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: theme.accent, color: theme.bg }}>
              {loading ? (
                <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>Fetching…</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>Fetch News</>
              )}
            </button>

            {lastFetchTime && <p className="text-center text-[10px] text-zinc-600">Updated {formatRelativeTime(lastFetchTime)}</p>}

            {/* Auto Refresh */}
            <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-[700] uppercase tracking-widest text-zinc-500">Auto-Refresh</span>
                {autoRefresh && <span className="h-1.5 w-1.5 rounded-full animate-pulse-dot" style={{ background: theme.accent }} />}
              </div>
              <button onClick={() => { setAutoRefresh(v => !v); toast(autoRefresh ? 'Auto-refresh off' : `Auto-refresh every ${autoRefreshInterval}m`, 'info') }}
                className="relative h-5 w-9 rounded-full transition-colors" style={{ background: autoRefresh ? theme.accent : 'var(--border)' }}>
                <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform" style={{ left: autoRefresh ? '18px' : '2px' }} />
              </button>
            </div>
            {autoRefresh && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500">Every</span>
                <select value={autoRefreshInterval} onChange={e => setAutoRefreshInterval(Number(e.target.value))}
                  className="rounded-lg border px-2 py-1 text-[11px] outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <option value={1}>1 min</option><option value={3}>3 min</option><option value={5}>5 min</option><option value={10}>10 min</option><option value={15}>15 min</option>
                </select>
              </div>
            )}

            {/* View & Sort */}
            <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex rounded-lg border p-0.5" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                <button onClick={() => setViewMode('grid')} className="rounded-md px-2 py-1" style={{ background: viewMode === 'grid' ? 'var(--card)' : 'transparent' }} title="Grid">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                </button>
                <button onClick={() => setViewMode('list')} className="rounded-md px-2 py-1" style={{ background: viewMode === 'list' ? 'var(--card)' : 'transparent' }} title="List">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>
                </button>
              </div>
              <select value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)}
                className="rounded-lg border px-2 py-1 text-[11px] outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                <option value="date">⏰ Latest</option>
                <option value="source">📰 Source</option>
                <option value="title">🔤 Title</option>
              </select>
            </div>

            <div className="flex items-center justify-between rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
              <span className="text-[11px] font-semibold text-zinc-400">Hide already read</span>
              <button onClick={() => setHideRead(v => !v)} className="relative h-5 w-9 rounded-full transition-colors" style={{ background: hideRead ? theme.accent : 'var(--border)' }}>
                <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform" style={{ left: hideRead ? '18px' : '2px' }} />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
              <div>
                <span className="text-[11px] font-semibold text-zinc-200">Hindi focus</span>
                <p className="text-[10px] text-zinc-500">Show हिन्दी / Hinglish stories first</p>
              </div>
              <button onClick={() => setShowHindiOnly(v => !v)} className="relative h-5 w-9 rounded-full transition-colors" style={{ background: showHindiOnly ? '#f97316' : 'var(--border)' }}>
                <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform" style={{ left: showHindiOnly ? '18px' : '2px' }} />
              </button>
            </div>
          </div>
        </aside>

        {/* ═══ MAIN CONTENT ═══ */}
        <section className="min-w-0">
          {/* Quick Categories Bar */}
          <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => { setCategory(c.id); fetchNews() }}
                className="shrink-0 flex min-h-[38px] items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all"
                style={{ borderColor: category === c.id ? theme.accent + '60' : 'var(--border)', background: category === c.id ? theme.accent + '15' : 'var(--card)', color: category === c.id ? theme.accent : 'var(--zinc-300)' }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {/* Mobile Quick Actions */}
          <div className="mb-4 grid grid-cols-3 gap-2 sm:hidden">
            <button onClick={() => setMobileSidebarOpen(true)} className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 text-[12px] font-semibold" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              ☰ Filters
            </button>
            <button onClick={fetchNews} disabled={loading || selectedSources.length === 0} className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-[12px] font-bold disabled:opacity-40" style={{ background: theme.accent, color: theme.bg }}>
              {loading ? '⏳' : '🔄'} Fetch
            </button>
            <button onClick={() => setShowBookmarks(true)} className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 text-[12px] font-semibold" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              🔖 Saved
            </button>
            <button onClick={() => {
              const hindiSources = NEWS_SOURCES.filter(s => s.language.includes('hi') || s.language.includes('hinglish')).map(s => s.id)
              setSelectedSources(hindiSources)
              toast('Hindi sources selected!', 'success')
            }} className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 text-[12px] font-semibold" style={{ borderColor: '#f9731650', background: '#f9731618', color: '#fdba74' }}>
              🇮🇳 हिन्दी Src
            </button>
            <button onClick={() => setShowHindiOnly(v => !v)} className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 text-[12px] font-semibold" style={{ borderColor: showHindiOnly ? '#22c55e50' : 'var(--border)', background: showHindiOnly ? '#22c55e18' : 'var(--card)', color: showHindiOnly ? '#4ade80' : undefined }}>
              {showHindiOnly ? '✅' : '🔤'} Hindi Only
            </button>
            <button onClick={() => { setCategory('india'); fetchNews() }} className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 text-[12px] font-semibold" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              🇮🇳 India
            </button>
          </div>

          {/* Status Bar */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              {loading ? 'Fetching…' : `${articles.length} articles`}
            </span>
            <span>•</span>
            <span>{CATEGORIES.find(c => c.id === category)?.icon} {CATEGORIES.find(c => c.id === category)?.label}</span>
            <span>•</span>
            <span>{LANGUAGES.find(l => l.id === language)?.label}</span>
            <span>•</span>
            <span>{selectedSources.length} sources</span>
            {searchQuery && (
              <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'var(--card)' }}>
                🔍 "{searchQuery}" <button onClick={() => setSearchQuery('')} className="ml-1 text-zinc-500 hover:text-zinc-300">✕</button>
              </span>
            )}
            {autoRefresh && <span className="rounded-full px-2 py-0.5" style={{ background: theme.accent + '15', color: theme.accent }}>🔄 Auto-refresh ON</span>}
            {hideRead && <span className="rounded-full px-2 py-0.5" style={{ background: '#33415555', color: '#cbd5e1' }}>🙈 Hide read ON</span>}
            {showHindiOnly && <span className="rounded-full px-2 py-0.5" style={{ background: '#f9731618', color: '#fdba74' }}>हिन्दी Focus ON</span>}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border p-4" style={{ borderColor: '#92400e40', background: '#92400e15' }}>
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-[13px] font-[600] text-amber-200">{error}</p>
                <button onClick={fetchNews} className="mt-1.5 text-[12px] font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200">Try again</button>
              </div>
            </div>
          )}

          {/* Articles */}
          {articles.length === 0 && !loading && !error ? (
            <div className="grid place-items-center rounded-2xl border border-dashed p-16 text-center" style={{ borderColor: 'var(--border)', background: theme.card + '60' }}>
              <div className="max-w-[400px]">
                <div className="mx-auto mb-4 text-5xl">📰</div>
                <h3 className="text-lg font-bold">No articles yet</h3>
                <p className="mt-1.5 text-[13px] text-zinc-400">Select sources, choose a category, and hit "Fetch News" to load headlines.</p>
                <button onClick={fetchNews} className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold" style={{ background: theme.accent, color: theme.bg }}>
                  Fetch Articles
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:hidden">
                <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)', background: theme.card }}>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Visible</div>
                  <div className="text-[16px] font-[800]">{visibleArticles.length}</div>
                </div>
                <div className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)', background: theme.card }}>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Sources</div>
                  <div className="text-[16px] font-[800]">{selectedSources.length}</div>
                </div>
              </div>
              <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 2xl:grid-cols-3' : 'flex flex-col gap-3'}>
                {visibleArticles.map(article => {
                  const { words, minutes } = estimateReadTime((article.content || article.description) + ' ' + article.title)
                  return (
                    <article key={article.id}
                      className={`group relative overflow-hidden rounded-2xl border transition-all hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)] ${viewMode === 'list' ? 'flex gap-3 p-3 sm:gap-4' : ''}`}
                      style={{ borderColor: 'var(--border)', background: theme.card }}>
                      {/* Image */}
                      <div className={`relative overflow-hidden ${viewMode === 'grid' ? 'aspect-[16/9]' : 'h-[88px] w-[118px] shrink-0 rounded-xl sm:h-[100px] sm:w-[160px]'}`} style={{ background: 'var(--bg)' }}>
                        {article.image ? (
                          <img src={article.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-4xl opacity-30">📄</div>
                        )}
                        <div className="absolute left-2 top-2 flex items-center gap-1">
                          <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase backdrop-blur" style={{ background: theme.bg + 'cc' }}>{article.source}</span>
                        </div>
                        <div className="absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-medium backdrop-blur" style={{ background: theme.bg + 'cc' }}>
                          {minutes} min
                        </div>
                      </div>

                      {/* Content */}
                      <div className={viewMode === 'grid' ? 'p-3.5' : 'min-w-0 flex-1 py-1'}>
                        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] text-zinc-500 flex-wrap">
                          <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-semibold" style={{ background: theme.accent + '12', color: theme.accent }}>
                            {CATEGORIES.find(c => c.id === article.category)?.icon} {article.category}
                          </span>
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 font-semibold" style={getArticleLanguageColor(article, theme.accent)}>
                            {getArticleLanguageLabel(article)}
                          </span>
                          <span>•</span>
                          <time>{formatRelativeTime(article.publishedAt)}</time>
                          {readIds.has(article.id) && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400">read</span>
                            </>
                          )}
                          <span className="hidden sm:inline">• {words} words</span>
                        </div>

                         <h2 className="line-clamp-2 text-[14px] sm:text-[15px] font-[700] leading-[1.35] tracking-tight">{stripHtml(getPreviewText(article).title || article.title || 'Untitled Article')}</h2>
                         <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-zinc-400">{stripHtml(getPreviewText(article).description || article.description || 'No description available')}</p>
 
                         <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                           <button onClick={() => openArticle(article)}
                             className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-[650] transition-colors" style={{ background: 'var(--bg)' }}>
                             Read <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6" /></svg>
                           </button>
<button onClick={() => handleTranslate(article)} disabled={!!translating}
                             className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border px-2 text-[11px] font-medium disabled:opacity-40" style={{ borderColor: 'var(--border)' }}
                             title="Translate">
                             {translating === article.id ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" /> : '🌐'}
                             <span className="hidden sm:inline">
                               {previewTranslations[article.id] 
                                 ? (previewTranslations[article.id].targetLang === 'en' ? '✓EN' : '✓HI')
                                 : (article.language === 'hi' ? '→EN' : '→HI')}
                             </span>
                           </button>
                          <button onClick={() => shareArticle(article)} className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border px-2 text-[11px] font-medium" style={{ borderColor: 'var(--border)' }} title="Share">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                          </button>
                          <button onClick={() => speakArticle(article)} className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border px-2 text-[11px] font-medium" style={{ borderColor: 'var(--border)' }} title="Listen">
                            {ttsPlaying && ttsArticleId === article.id ? '⏹️' : '🔊'}
                          </button>
                          <button onClick={() => toggleBookmark(article)}
                            className="ml-auto inline-flex h-[32px] w-[32px] items-center justify-center rounded-lg border transition-colors"
                            style={{ borderColor: isBookmarked(article.id) ? '#f59e0b40' : 'var(--border)', background: isBookmarked(article.id) ? '#f59e0b15' : 'transparent', color: isBookmarked(article.id) ? '#fbbf24' : undefined }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill={isBookmarked(article.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* Load More */}
              {displayCount < filteredByRead.length && (
                <div className="mt-6 text-center">
                  <button onClick={() => setDisplayCount(p => p + 12)} className="inline-flex items-center gap-2 rounded-xl border px-6 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[var(--card)]" style={{ borderColor: 'var(--border)' }}>
                    Load More ({filteredByRead.length - displayCount} remaining)
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Loading skeleton */}
          {loading && articles.length === 0 && (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
                  <div className="aspect-[16/9] animate-shimmer" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-20 rounded animate-shimmer" />
                    <div className="h-4 w-full rounded animate-shimmer" />
                    <div className="h-4 w-3/4 rounded animate-shimmer" />
                    <div className="flex gap-2 mt-3">
                      <div className="h-7 w-16 rounded-lg animate-shimmer" />
                      <div className="h-7 w-16 rounded-lg animate-shimmer" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ═══ RIGHT SIDEBAR ═══ */}
        <aside className="hidden xl:block">
          <div className="sticky top-[72px] space-y-4 max-h-[calc(100vh-88px)] overflow-auto">

            {/* Weather Widget */}
            {weather && (
              <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: theme.card }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-[700] uppercase tracking-widest text-zinc-500">Weather</h3>
                  <span className="text-[10px] text-zinc-600">{weather.city}</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-4xl">{getWeatherIcon(weather.weathercode)}</span>
                  <div>
                    <div className="text-2xl font-[800] tabular-nums">{weather.temperature}°C</div>
                    <div className="text-[12px] text-zinc-400">{getWeatherLabel(weather.weathercode)}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-2 text-center" style={{ background: 'var(--bg)' }}>
                    <div className="text-[10px] text-zinc-500">Wind</div>
                    <div className="text-[13px] font-bold">{weather.windspeed} km/h</div>
                  </div>
                  <div className="rounded-lg p-2 text-center" style={{ background: 'var(--bg)' }}>
                    <div className="text-[10px] text-zinc-500">Humidity</div>
                    <div className="text-[13px] font-bold">{weather.humidity}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Theme Switcher */}
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: theme.card }}>
              <h3 className="mb-2.5 text-[10px] font-[700] uppercase tracking-widest text-zinc-500">Theme</h3>
              <div className="grid grid-cols-5 gap-1.5">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => setThemeId(t.id)} title={t.name}
                    className="flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-all"
                    style={{ borderColor: themeId === t.id ? theme.accent : 'var(--border)', background: themeId === t.id ? theme.accent + '15' : 'transparent' }}>
                    <span className="text-lg">{t.emoji}</span>
                    <span className="text-[8px] font-semibold text-zinc-500 truncate w-full text-center">{t.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* GitHub Card */}
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: theme.card }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--bg)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                </div>
                <div>
                  <p className="text-[12px] font-[700]">@PrivMITLab</p>
                  <p className="text-[10px] text-zinc-500">Open source • MIT License</p>
                </div>
              </div>
              <a href="https://github.com/PrivMITLab" target="_blank" rel="noopener noreferrer"
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-[12px] font-[600] hover:bg-[var(--bg)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                View on GitHub <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7" /><path d="M7 7h10v10" /></svg>
              </a>
            </div>

            {/* Quick Stats */}
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: theme.card }}>
              <h3 className="mb-3 text-[10px] font-[700] uppercase tracking-widest text-zinc-500">Reading Stats</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between"><span className="text-[12px] text-zinc-400">Articles loaded</span><span className="text-[14px] font-[700]">{articles.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-[12px] text-zinc-400">Bookmarked</span><span className="text-[14px] font-[700]">{bookmarks.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-[12px] text-zinc-400">Read total</span><span className="text-[14px] font-[700]">{history.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-[12px] text-zinc-400">Active sources</span><span className="text-[14px] font-[700]">{selectedSources.length}</span></div>
                {stats.topSource && <div className="flex items-center justify-between"><span className="text-[12px] text-zinc-400">Top source</span><span className="text-[12px] font-[600]">{stats.topSource[0]}</span></div>}
                {stats.topCat && <div className="flex items-center justify-between"><span className="text-[12px] text-zinc-400">Top category</span><span className="text-[12px] font-[600]">{stats.topCat[0]}</span></div>}
              </div>
            </div>

            {/* Recent History */}
            {history.length > 0 && (
              <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: theme.card }}>
                <h3 className="mb-2.5 text-[10px] font-[700] uppercase tracking-widest text-zinc-500">Recently Read</h3>
                <ul className="space-y-2">
                  {history.slice(0, 5).map(h => (
                    <li key={h.id + h.readAt} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />
                      <div className="min-w-0">
                        <button onClick={() => openHistoryItem(h)} className="block text-left text-[12px] font-medium leading-4 line-clamp-2 hover:underline">{h.title}</button>
                        <span className="text-[10px] text-zinc-500">{h.source} • {formatRelativeTime(h.readAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Keyboard Shortcuts */}
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: theme.card }}>
              <h3 className="mb-2.5 text-[10px] font-[700] uppercase tracking-widest text-zinc-500">Shortcuts</h3>
              <ul className="space-y-1.5 text-[11px] text-zinc-400">
                {[
                  ['/', 'Focus search'],
                  ['Ctrl+K', 'Search'],
                  ['Ctrl+B', 'Bookmarks'],
                  ['?', 'All shortcuts'],
                  ['R', 'Refresh news'],
                  ['Esc', 'Close panels'],
                ].map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between">
                    <span>{v}</span>
                    <kbd className="rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold" style={{ background: 'var(--bg)' }}>{k}</kbd>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </main>

      {/* ═══ ARTICLE MODAL ═══ */}
      {selectedArticle && !focusMode && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => { setSelectedArticle(null); stopSpeech() }}>
          <div className="relative flex max-h-[90vh] w-full max-w-[880px] flex-col overflow-hidden rounded-2xl border shadow-2xl"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }} onClick={e => e.stopPropagation()}>

            {/* Reading Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 z-10" style={{ background: 'var(--border)' }}>
              <div className="h-full transition-all duration-200" style={{ width: `${readingProgress}%`, background: theme.accent }} />
            </div>

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b p-3.5 shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: 'var(--card)' }}>{selectedArticle.source}</span>
                <span className="text-[11px] text-zinc-500 truncate">{formatRelativeTime(selectedArticle.publishedAt)} • {selectedArticle.author}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setFocusMode(true)} className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: 'var(--border)' }} title="Focus mode">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
                </button>
                <button onClick={() => speakArticle(selectedArticle)} className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: 'var(--border)', background: ttsPlaying && ttsArticleId === selectedArticle.id ? theme.accent + '20' : 'transparent', color: ttsPlaying && ttsArticleId === selectedArticle.id ? theme.accent : undefined }} title={ttsPlaying && ttsArticleId === selectedArticle.id ? 'Stop' : 'Listen'}>
                  {ttsPlaying && ttsArticleId === selectedArticle.id ? '⏹️' : '🔊'}
                </button>
                <button onClick={() => shareArticle(selectedArticle)} className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: 'var(--border)' }} title="Share">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                </button>
                <button onClick={() => toggleBookmark(selectedArticle)} className="flex h-8 w-8 items-center justify-center rounded-lg border"
                  style={{ borderColor: isBookmarked(selectedArticle.id) ? '#f59e0b40' : 'var(--border)', background: isBookmarked(selectedArticle.id) ? '#f59e0b15' : 'transparent', color: isBookmarked(selectedArticle.id) ? '#fbbf24' : undefined }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked(selectedArticle.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
                </button>
                <button onClick={() => { setSelectedArticle(null); stopSpeech() }} className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div ref={modalContentRef} className="overflow-auto flex-1">
              {selectedArticle.image && (
                <div className="relative aspect-[16/9] w-full" style={{ background: 'var(--card)' }}>
                  <img src={selectedArticle.image} alt="" className="h-full w-full object-cover" />
                </div>
              )}

              <div className="p-5 md:p-7">
                {/* Article Meta Info */}
                <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-semibold" style={{ background: theme.accent + '12', color: theme.accent }}>
                    {CATEGORIES.find(c => c.id === selectedArticle.category)?.icon} {selectedArticle.category}
                  </span>
                  <span className="inline-flex items-center rounded-lg px-2 py-0.5 font-semibold" style={getArticleLanguageColor(selectedArticle, theme.accent)}>
                    {getArticleLanguageLabel(selectedArticle)}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-[24px] md:text-[30px] font-[900] leading-[1.2] tracking-tight">{stripHtml(getModalText(selectedArticle).title)}</h1>

                {/* Author & Date Info */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    {new Date(selectedArticle.publishedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>
                    {estimateReadTime((selectedArticle.content || selectedArticle.description) + ' ' + selectedArticle.title).minutes} min read
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span>{estimateReadTime((selectedArticle.content || selectedArticle.description) + ' ' + selectedArticle.title).words} words</span>
                  {selectedArticle.author && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <span>By {selectedArticle.author}</span>
                    </>
                  )}
                </div>

                {ttsPlaying && ttsArticleId === selectedArticle.id && ttsCurrentSentence && (
                  <div className="mt-4 rounded-xl border p-3" style={{ borderColor: '#f59e0b66', background: '#facc1514' }}>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Now Reading</p>
                    <p className="mt-1 text-[14px] leading-6 text-amber-100">
                      <mark className="rounded px-1 py-0.5" style={{ background: '#fde047', color: '#111827' }}>{ttsCurrentSentence}</mark>
                    </p>
                  </div>
                )}

                {ttsPlaying && ttsArticleId === selectedArticle.id && selectedArticleTtsSentences.length > 0 && (
                  <div className="mt-3 rounded-xl border p-3" style={{ borderColor: '#f59e0b55', background: '#f59e0b0f' }}>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-300">Reading Highlight</p>
                    <div ref={ttsTrackRef} className="max-h-36 space-y-1.5 overflow-auto pr-1 text-[13px] leading-6 text-zinc-300">
                      {selectedArticleTtsSentences.map((sentence, idx) => (
                        <p key={idx} data-tts-index={idx} className="rounded px-1.5 py-1 transition-colors"
                          style={idx === ttsCurrentIndex ? { background: '#fde047', color: '#111827' } : undefined}>
                          {sentence}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reading Controls - Compact */}
                <div className="my-5 flex items-center justify-between rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border)', background: theme.card }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-zinc-400">Font Size</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 font-mono">{fontSize}px</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setFontSize(s => Math.max(13, s - 1))} className="flex h-7 w-7 items-center justify-center rounded-lg border text-[14px] font-bold hover:bg-[var(--bg)] transition-colors" style={{ borderColor: 'var(--border)' }} title="Decrease">−</button>
                    <button onClick={() => setFontSize(s => Math.min(24, s + 1))} className="flex h-7 w-7 items-center justify-center rounded-lg border text-[14px] font-bold hover:bg-[var(--bg)] transition-colors" style={{ borderColor: 'var(--border)' }} title="Increase">+</button>
                  </div>
                </div>

                {/* Full Article Reader Section - SHOW FIRST if loaded */}
                {fullArticleContent[selectedArticle.id] && showFullArticle ? (
                  <div className="mt-6 rounded-xl border overflow-hidden" style={{ borderColor: theme.accent, background: theme.accent + '08' }}>
                    <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)', background: theme.card }}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📖</span>
                        <div>
                          <span className="text-[13px] font-bold uppercase tracking-wider block" style={{ color: theme.accent }}>✅ पूरा लेख लोड हो गया / Full Article Loaded</span>
                          <span className="text-[10px] text-zinc-500">Read complete article without leaving the app</span>
                        </div>
                      </div>
                      <button onClick={() => setShowFullArticle(false)} className="text-[11px] px-3 py-1.5 rounded-lg border hover:bg-[var(--bg)] font-medium" style={{ borderColor: 'var(--border)' }}>
                        ✕ Close
                      </button>
                    </div>
                    <div className="p-6 max-h-[600px] overflow-auto">
                      <div style={{ fontSize }} className="prose prose-invert max-w-none leading-[2] text-zinc-200">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{
                          p: ({node, ...props}) => <p className="mb-4" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 mt-6" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 mt-5" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 mt-4" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-4" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1" {...props} />,
                          a: ({node, ...props}) => <a className="underline" style={{color: theme.accent}} target="_blank" rel="noopener noreferrer" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                          em: ({node, ...props}) => <em className="italic" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 pl-4 italic text-zinc-400 my-4" style={{borderColor: theme.accent}} {...props} />,
                          code: ({node, ...props}) => <code className="bg-zinc-800 px-1 rounded text-sm" {...props} />,
                          pre: ({node, ...props}) => <pre className="bg-zinc-800 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                        }}>
                          {renderArticleMarkdown(fullArticleContent[selectedArticle.id])}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <div className="px-6 py-3 border-t flex items-center justify-between text-[11px] text-zinc-500" style={{ borderColor: 'var(--border)', background: theme.card }}>
                      <div className="flex items-center gap-4">
                        <span>✅ Offline के लिए सेव किया गया / Cached locally</span>
                        <span className="text-zinc-600">|</span>
                        <span>📝 {fullArticleContent[selectedArticle.id].split(/\s+/).length} words</span>
                      </div>
                      <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium" style={{ color: theme.accent }}>
                        Open original →
                      </a>
                    </div>
                  </div>
                ) : (
                  /* Article Preview - Enhanced with better content display */
                  <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">📰 Article Preview</span>
                      {!fullArticleContent[selectedArticle.id] && (
                        <span className="text-[10px] text-zinc-600">Loading full text may take a few seconds...</span>
                      )}
                    </div>
                    <div style={{ fontSize }} className="prose prose-invert max-w-none">
                      {(() => {
                        // Use translated content if available, otherwise use original
                        const modalText = getModalText(selectedArticle)
                        const bestContent = modalText.body
                        
                        if (!bestContent || bestContent.trim().length < 30) {
                          return (
                            <div className="text-center py-8">
                              <span className="text-4xl mb-3 block">📄</span>
                              <p className="text-zinc-500 italic mb-2">Preview not available from RSS feed.</p>
                              <p className="text-[12px] text-zinc-600">Click <strong>"Read Full in App"</strong> below to load the complete article from multiple sources.</p>
                            </div>
                          )
                        }
                        
                        return (
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{
                            p: ({node, ...props}) => <p className="text-[1.02em] leading-[1.85] text-zinc-200 mb-4" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-3 mt-5" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-2 mt-4" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 mt-3" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-4" {...props} />,
                            a: ({node, ...props}) => <a className="underline" style={{color: theme.accent}} target="_blank" rel="noopener noreferrer" {...props} />,
                            img: ({node, ...props}) => <img className="rounded-lg my-3 max-w-full" loading="lazy" {...props} />,
                            figure: ({node, ...props}) => <figure className="my-6" {...props} />,
                            figcaption: ({node, ...props}) => <figcaption className="text-center text-xs text-zinc-400 mt-1" {...props} />,
                          }}>
                            {renderArticleMarkdown(bestContent)}
                          </ReactMarkdown>
                        )
                      })()}
                    </div>
                    
                    {/* Helpful tip for users */}
                    {!fullArticleContent[selectedArticle.id] && (
                      <div className="mt-6 p-4 rounded-xl border" style={{ borderColor: theme.accent + '40', background: theme.accent + '10' }}>
                        <div className="flex items-start gap-3">
                          <span className="text-xl">💡</span>
                          <div className="text-[13px]">
                            <p className="font-semibold mb-1" style={{ color: theme.accent }}>Want to read the full article?</p>
                            <p className="text-zinc-400">Click <strong>"Read Full in App"</strong> button below. The app will try multiple free APIs to fetch the complete article for you.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="mt-6 rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: theme.card }}>
                  <label className="mb-2 block text-[11px] font-[700] uppercase tracking-widest text-zinc-400">📝 Personal Notes</label>
                  <textarea value={articleNotes[selectedArticle.id] || ''} onChange={e => saveNote(selectedArticle.id, e.target.value)}
                    placeholder="Add your notes about this article…" rows={2}
                    className="w-full resize-none rounded-lg border p-2.5 text-[13px] outline-none placeholder:text-zinc-600"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)' }} />
                </div>

                {/* Actions - Improved Layout */}
                <div className="mt-6 space-y-3 border-t pt-5" style={{ borderColor: 'var(--border)' }}>
                  {/* Primary Actions - Two Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Read Full in App Button - PROMINENT */}
                    <button onClick={() => { fetchFullArticle(selectedArticle); setShowFullArticle(true) }} disabled={loadingFullArticle}
                      className="flex flex-col items-center justify-center gap-1 rounded-xl px-5 py-4 text-[14px] font-bold transition-transform active:scale-[0.98] border-2 disabled:opacity-60"
                      style={{ borderColor: theme.accent, color: theme.accent, background: theme.accent + '12' }}>
                      {loadingFullArticle ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="text-[13px]">Loading Full Article...</span>
                          <span className="text-[10px] opacity-70">पूरा लेख लोड हो रहा है...</span>
                        </>
                      ) : fullArticleContent[selectedArticle.id] ? (
                        <>
                          <span className="text-xl">✅</span>
                          <span className="text-[14px]">Full Article Loaded</span>
                          <span className="text-[11px] opacity-70">पूरा लेख लोड हो गया</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">📖</span>
                          <span className="text-[14px]">Read Full in App</span>
                          <span className="text-[11px] opacity-70">ऐप में पूरा पढ़ें</span>
                        </>
                      )}
                    </button>
                    
                    {/* Open External Link Button - Secondary */}
                    <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-1 rounded-xl px-5 py-4 text-[14px] font-semibold transition-transform active:scale-[0.98] border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--card)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                      <span className="text-[13px]">Open Original</span>
                      <span className="text-[10px] opacity-70">मूल साइट पर खोलें</span>
                    </a>
                  </div>
                  
                  {/* Secondary Actions */}
                  <div className="flex flex-wrap justify-center gap-2">
                    <button onClick={handleTranslateModal} disabled={modalTranslating} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium hover:bg-[var(--card)] transition-colors disabled:opacity-50" style={{ borderColor: 'var(--border)' }}>
                      {modalTranslating ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" /> : '🌐'} <span>{modalTranslating ? 'Translating...' : 'Translate Full Article'}</span>
                    </button>
                    <button onClick={() => copyArticleText(selectedArticle)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium hover:bg-[var(--card)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                      📋 <span>Copy</span>
                    </button>
                    <button onClick={() => printArticle(selectedArticle)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium hover:bg-[var(--card)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                      🖨️ <span>Print</span>
                    </button>
                    <button onClick={() => shareArticle(selectedArticle)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium hover:bg-[var(--card)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                      📤 <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="mt-5 flex items-center justify-center gap-2 rounded-lg p-2.5 text-[11px] text-zinc-500" style={{ background: theme.card }}>
                  <span>🛡️</span>
                  <span>Article from <strong>{selectedArticle.source}</strong> • No tracking • Opens with privacy protection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FOCUS MODE ═══ */}
      {selectedArticle && focusMode && (
        <div className="fixed inset-0 z-50 overflow-auto" style={{ background: 'var(--bg)' }}>
          <div className="mx-auto max-w-[700px] px-6 py-12">
            <button onClick={() => { setFocusMode(false); stopSpeech() }} className="mb-8 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[13px] font-semibold" style={{ borderColor: 'var(--border)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              Exit Focus Mode
            </button>
            <h1 className="text-[32px] md:text-[40px] font-[900] leading-[1.15] tracking-tight mb-4">{stripHtml(getModalText(selectedArticle).title)}</h1>
            <div className="flex items-center gap-3 text-[13px] text-zinc-500 mb-8">
              <span>{selectedArticle.source}</span><span>•</span>
              <span>{selectedArticle.author}</span><span>•</span>
              <span>{new Date(selectedArticle.publishedAt).toLocaleDateString()}</span><span>•</span>
              <span>{estimateReadTime((selectedArticle.content || selectedArticle.description) + ' ' + selectedArticle.title).minutes} min read</span>
            </div>
            {ttsPlaying && ttsArticleId === selectedArticle.id && ttsCurrentSentence && (
              <div className="mb-6 rounded-xl border p-3" style={{ borderColor: '#f59e0b66', background: '#facc1514' }}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Now Reading</p>
                <p className="mt-1 text-[14px] leading-6 text-amber-100">
                  <mark className="rounded px-1 py-0.5" style={{ background: '#fde047', color: '#111827' }}>{ttsCurrentSentence}</mark>
                </p>
              </div>
            )}
            {ttsPlaying && ttsArticleId === selectedArticle.id && selectedArticleTtsSentences.length > 0 && (
              <div className="mb-6 rounded-xl border p-3" style={{ borderColor: '#f59e0b55', background: '#f59e0b0f' }}>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-300">Reading Highlight</p>
                <div ref={ttsTrackRef} className="max-h-40 space-y-1.5 overflow-auto pr-1 text-[13px] leading-6 text-zinc-300">
                  {selectedArticleTtsSentences.map((sentence, idx) => (
                    <p key={idx} data-tts-index={idx} className="rounded px-1.5 py-1 transition-colors"
                      style={idx === ttsCurrentIndex ? { background: '#fde047', color: '#111827' } : undefined}>
                      {sentence}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {selectedArticle.image && <img src={selectedArticle.image} alt="" className="w-full rounded-2xl mb-8" />}
            {/* Full Article Content if available */}
            {fullArticleContent[selectedArticle.id] ? (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 text-[12px] font-semibold" style={{ color: theme.accent }}>
                  <span>📖</span> FULL ARTICLE LOADED
                </div>
                <div style={{ fontSize: fontSize + 2 }} className="text-zinc-200 leading-[1.9]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{
                    p: ({node, ...props}) => <p className="mb-4" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 mt-6" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 mt-5" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 mt-4" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-4" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    a: ({node, ...props}) => <a className="underline" style={{color: theme.accent}} target="_blank" rel="noopener noreferrer" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                    em: ({node, ...props}) => <em className="italic" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 pl-4 italic text-zinc-400 my-4" style={{borderColor: theme.accent}} {...props} />,
                  }}>
                  {renderArticleMarkdown(fullArticleContent[selectedArticle.id])}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: fontSize + 2 }} className="text-zinc-200 leading-[1.9]">
                {(() => {
                  const { description, content } = getUniqueContent(selectedArticle)
                  const fullContent = content || description
                  
                  if (!fullContent || fullContent.trim().length === 0) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-zinc-500 italic mb-4">Article preview not available.</p>
                        <p className="text-zinc-600 text-[14px]">Click "Load Full in App" below to fetch the complete article.</p>
                      </div>
                    )
                  }
                  
                  return (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{
                      p: ({node, ...props}) => <p className="mb-4" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 mt-6" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 mt-5" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 mt-4" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-4" {...props} />,
                      a: ({node, ...props}) => <a className="underline" style={{ color: theme.accent }} target="_blank" rel="noopener noreferrer" {...props} />,
                      img: ({node, ...props}) => <img className="rounded-lg my-3" loading="lazy" {...props} />,
                    }}>
                      {renderArticleMarkdown(fullContent)}
                    </ReactMarkdown>
                  )
                })()}
              </div>
            )}
            
            {/* Focus Mode Actions */}
            <div className="mt-10 pt-6 border-t flex flex-wrap gap-3" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => fetchFullArticle(selectedArticle)} disabled={loadingFullArticle}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold border transition-transform active:scale-[0.98]"
                style={{ borderColor: theme.accent, color: theme.accent, background: theme.accent + '15' }}>
                {loadingFullArticle ? '⏳ Loading...' : fullArticleContent[selectedArticle.id] ? '✅ Full Article Loaded' : '📖 Load Full in App'}
              </button>
              <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold" style={{ background: theme.accent, color: theme.bg }}>
                Open on Website ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ═══ BOOKMARKS PANEL ═══ */}
      {showBookmarks && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowBookmarks(false)}>
          <div className="h-full w-full max-w-[420px] overflow-hidden border-l flex flex-col animate-slide-in" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex h-12 items-center justify-between border-b px-4 shrink-0" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-[15px] font-[800]">📑 Saved Articles ({bookmarks.length})</h2>
              <button onClick={() => setShowBookmarks(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Search bookmarks */}
            <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <input type="text" value={bookmarkSearch} onChange={e => setBookmarkSearch(e.target.value)} placeholder="Search bookmarks…"
                className="w-full rounded-lg border px-3 py-1.5 text-[12px] outline-none placeholder:text-zinc-600" style={{ borderColor: 'var(--border)', background: 'var(--card)' }} />
            </div>

            <div className="flex gap-2 border-b p-3" style={{ borderColor: 'var(--border)' }}>
              <button onClick={exportBookmarks} disabled={bookmarks.length === 0} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold disabled:opacity-40" style={{ background: 'var(--card)' }}>
                ⬇️ Export
              </button>
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2 text-[12px] font-semibold" style={{ borderColor: 'var(--border)' }}>
                ⬆️ Import
                <input type="file" accept="application/json" className="hidden" onChange={importBookmarks} />
              </label>
            </div>

            <div className="flex-1 overflow-auto">
              {filteredBookmarks.length === 0 ? (
                <div className="grid h-full place-items-center p-8 text-center">
                  <div>
                    <div className="text-4xl mb-3">📑</div>
                    <p className="text-[14px] font-semibold">No bookmarks{bookmarkSearch ? ' found' : ' yet'}</p>
                    <p className="mt-1 text-[12px] text-zinc-500">Tap the bookmark icon to save articles here.</p>
                  </div>
                </div>
              ) : (
                <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {filteredBookmarks.map(b => (
                    <li key={b.id} className="p-3.5 hover:bg-[var(--card)] transition-colors">
                      <div className="flex gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />
                        <div className="min-w-0 flex-1">
                          <button onClick={() => { openArticle(b); setShowBookmarks(false) }} className="text-left text-[13px] font-[600] leading-[1.4] hover:underline line-clamp-2">{b.title}</button>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500">
                            <span>{b.source}</span><span>•</span><span>{new Date(b.savedAt).toLocaleDateString()}</span>
                          </div>
                          {articleNotes[b.id] && <p className="mt-1 text-[10px] text-zinc-500 italic line-clamp-1">📝 {articleNotes[b.id]}</p>}
                          <div className="mt-1.5 flex gap-2">
                            <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold hover:underline" style={{ color: theme.accent }}>Open ↗</a>
                            <button onClick={() => toggleBookmark(b)} className="text-[11px] font-semibold text-zinc-500 hover:text-red-400">Remove</button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ HISTORY PANEL ═══ */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowHistory(false)}>
          <div className="h-full w-full max-w-[420px] overflow-hidden border-l flex flex-col animate-slide-in" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex h-12 items-center justify-between border-b px-4 shrink-0" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-[15px] font-[800]">🕐 Reading History ({history.length})</h2>
              <div className="flex items-center gap-1.5">
                <button onClick={exportHistory} disabled={history.length === 0} className="flex h-8 items-center gap-1 rounded-lg border px-2.5 text-[11px] font-semibold disabled:opacity-40" style={{ borderColor: 'var(--border)' }}>
                  ⬇️ Export
                </button>
                <button onClick={() => setShowHistory(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {history.length === 0 ? (
                <div className="grid h-full place-items-center p-8 text-center">
                  <div>
                    <div className="text-4xl mb-3">🕐</div>
                    <p className="text-[14px] font-semibold">No reading history</p>
                    <p className="mt-1 text-[12px] text-zinc-500">Articles you read will appear here.</p>
                  </div>
                </div>
              ) : (
                <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {history.map((h, i) => (
                    <li key={h.id + i} className="p-3.5 hover:bg-[var(--card)] transition-colors">
                      <div className="flex gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />
                        <div className="min-w-0 flex-1">
                          <button onClick={() => { openHistoryItem(h); setShowHistory(false) }} className="block w-full text-left text-[13px] font-[600] leading-[1.4] hover:underline line-clamp-2">{h.title}</button>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500">
                            <span>{h.source}</span><span>•</span><span>{formatRelativeTime(h.readAt)}</span><span>•</span><span>{CATEGORIES.find(c => c.id === h.category)?.icon} {h.category}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {history.length > 0 && (
              <div className="border-t p-3" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => { setHistory([]); store.remove('history'); toast('History cleared', 'info') }}
                  className="w-full rounded-xl border py-2 text-[12px] font-semibold text-red-400 hover:bg-red-950/20" style={{ borderColor: '#7f1d1d40' }}>
                  Clear All History
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ STATISTICS MODAL ═══ */}
      {showStats && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowStats(false)}>
          <div className="w-full max-w-[560px] overflow-hidden rounded-2xl border animate-fade-up" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-[16px] font-[800]">📊 Reading Statistics</h2>
              <button onClick={() => setShowStats(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-auto">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--card)' }}>
                  <div className="text-2xl font-[900]" style={{ color: theme.accent }}>{stats.total}</div>
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase">Articles Read</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--card)' }}>
                  <div className="text-2xl font-[900]" style={{ color: theme.accent }}>{stats.bookmarked}</div>
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase">Bookmarked</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--card)' }}>
                  <div className="text-2xl font-[900]" style={{ color: theme.accent }}>{selectedSources.length}</div>
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase">Sources</div>
                </div>
              </div>

              {/* Source Distribution */}
              {Object.keys(stats.sourceCounts).length > 0 && (
                <div className="mb-5">
                  <h3 className="mb-2.5 text-[11px] font-[700] uppercase tracking-widest text-zinc-500">Source Distribution</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.sourceCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([source, count]) => {
                      const pct = Math.round((count / stats.total) * 100)
                      return (
                        <div key={source}>
                          <div className="flex items-center justify-between text-[12px] mb-1">
                            <span className="font-semibold">{source}</span>
                            <span className="text-zinc-500">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--card)' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: theme.accent }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Category Distribution */}
              {Object.keys(stats.catCounts).length > 0 && (
                <div>
                  <h3 className="mb-2.5 text-[11px] font-[700] uppercase tracking-widest text-zinc-500">Category Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.catCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                      <div key={cat} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium" style={{ background: 'var(--card)' }}>
                        <span>{CATEGORIES.find(c => c.id === cat)?.icon}</span>
                        <span>{cat}</span>
                        <span className="font-bold" style={{ color: theme.accent }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.total === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📊</div>
                  <p className="text-[14px] font-semibold">No stats yet</p>
                  <p className="mt-1 text-[12px] text-zinc-500">Start reading articles to see your statistics here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ DAILY DIGEST MODAL ═══ */}
      {showDigest && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowDigest(false)}>
          <div className="w-full max-w-[680px] overflow-hidden rounded-2xl border animate-fade-up" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-[16px] font-[800]">🧾 Privacy Digest</h2>
              <button onClick={() => setShowDigest(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto p-5">
              <p className="text-[12px] text-zinc-400">Latest digest from your selected free sources. Built locally without telemetry.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl p-3" style={{ background: 'var(--card)' }}>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">Headlines</p>
                  <p className="text-xl font-[800]" style={{ color: theme.accent }}>{filteredByRead.length}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'var(--card)' }}>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">Sources</p>
                  <p className="text-xl font-[800]" style={{ color: theme.accent }}>{dailyDigest.topBySource.length}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'var(--card)' }}>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">Bookmarks</p>
                  <p className="text-xl font-[800]" style={{ color: theme.accent }}>{bookmarks.length}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'var(--card)' }}>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">Updated</p>
                  <p className="text-[13px] font-[700]">{dailyDigest.latestAt ? formatRelativeTime(dailyDigest.latestAt) : 'N/A'}</p>
                </div>
              </div>

              <h3 className="mt-5 mb-2 text-[11px] font-[700] uppercase tracking-widest text-zinc-500">Top Sources Today</h3>
              <div className="space-y-2">
                {dailyDigest.topBySource.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'var(--card)' }}>
                    <span className="text-[13px] font-semibold">{name}</span>
                    <span className="text-[12px] text-zinc-400">{count} stories</span>
                  </div>
                ))}
              </div>

              <h3 className="mt-5 mb-2 text-[11px] font-[700] uppercase tracking-widest text-zinc-500">Top Headlines</h3>
              <ul className="space-y-2">
                {dailyDigest.topHeadlines.map((item, idx) => (
                  <li key={item.id}>
                    <button onClick={() => { setShowDigest(false); openArticle(item) }} className="w-full rounded-lg px-3 py-2.5 text-left hover:opacity-90" style={{ background: 'var(--card)' }}>
                      <span className="mr-2 text-zinc-500">{idx + 1}.</span>
                      <span className="text-[13px] font-semibold">{item.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SETTINGS MODAL ═══ */}
      {showSettings && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-[540px] overflow-hidden rounded-2xl border animate-fade-up" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-[16px] font-[800]">⚙️ Settings & Privacy</h2>
              <button onClick={() => setShowSettings(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-5 space-y-4">
              {/* Privacy */}
              <div className="rounded-xl border p-4" style={{ borderColor: '#065f4640', background: '#065f4618' }}>
                <h3 className="mb-1.5 text-[13px] font-[700] text-emerald-200">🛡️ Privacy Guarantee</h3>
                <p className="text-[12px] leading-5 text-emerald-300/70">
                  PrivMITLab NewsHub respects your privacy. No tracking, analytics, telemetry, ads, fingerprinting, or external CDNs.
                  All preferences, bookmarks, and history stay locally in your browser. We never send your data to any server.
                </p>
              </div>

              {/* Theme */}
              <div>
                <h3 className="mb-2 text-[11px] font-[700] uppercase tracking-widest text-zinc-500">🎨 Theme</h3>
                <div className="grid grid-cols-5 gap-2">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setThemeId(t.id)} className="rounded-xl border p-3 text-center transition-all"
                      style={{ borderColor: themeId === t.id ? theme.accent : 'var(--border)', background: themeId === t.id ? theme.accent + '15' : 'var(--card)' }}>
                      <div className="text-2xl mb-1">{t.emoji}</div>
                      <div className="text-[10px] font-semibold">{t.name.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <h3 className="mb-2 text-[11px] font-[700] uppercase tracking-widest text-zinc-500">📝 Default Font Size</h3>
                <div className="flex items-center gap-3">
                  <input type="range" min={13} max={24} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
                    className="flex-1" style={{ accentColor: theme.accent }} />
                  <span className="text-[13px] font-bold tabular-nums w-10">{fontSize}px</span>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-[11px] font-[700] uppercase tracking-widest text-zinc-500">🔊 Voice Speed</h3>
                <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <input type="range" min={0.6} max={1.4} step={0.1} value={ttsRate} onChange={e => setTtsRate(Number(e.target.value))}
                    className="flex-1" style={{ accentColor: theme.accent }} />
                  <span className="text-[13px] font-bold tabular-nums w-10">{ttsRate.toFixed(1)}x</span>
                </div>
              </div>

              {/* Auto Refresh */}
              <div>
                <h3 className="mb-2 text-[11px] font-[700] uppercase tracking-widest text-zinc-500">🔄 Auto Refresh</h3>
                <div className="flex items-center justify-between rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <span className="text-[13px]">Auto-refresh every {autoRefreshInterval} minutes</span>
                  <button onClick={() => setAutoRefresh(v => !v)}
                    className="relative h-5 w-9 rounded-full transition-colors" style={{ background: autoRefresh ? theme.accent : 'var(--border)' }}>
                    <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform" style={{ left: autoRefresh ? '18px' : '2px' }} />
                  </button>
                </div>
              </div>

              {/* Data */}
              <div>
                <h3 className="mb-2 text-[11px] font-[700] uppercase tracking-widest text-zinc-500">💾 Data Storage</h3>
                <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <div className="flex justify-between text-[13px]"><span>Bookmarks</span><span className="font-semibold">{bookmarks.length}</span></div>
                  <div className="flex justify-between text-[13px]"><span>History</span><span className="font-semibold">{history.length}</span></div>
                  <div className="flex justify-between text-[13px]"><span>Notes</span><span className="font-semibold">{Object.keys(articleNotes).length}</span></div>
                  <div className="flex justify-between text-[13px]"><span>Storage</span><span className="font-semibold text-zinc-500">localStorage</span></div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={exportBookmarks} className="flex-1 rounded-lg border py-2 text-[12px] font-semibold" style={{ borderColor: 'var(--border)' }}>Export Bookmarks</button>
                    <button onClick={exportHistory} className="flex-1 rounded-lg border py-2 text-[12px] font-semibold" style={{ borderColor: 'var(--border)' }}>Export History</button>
                  </div>
                  <button onClick={() => {
                    if (confirm('Clear ALL data? This removes bookmarks, history, notes, and preferences.')) {
                      store.remove('bookmarks'); store.remove('history'); store.remove('notes'); store.remove('prefs')
                      setBookmarks([]); setHistory([]); setArticleNotes({})
                      toast('All data cleared', 'info')
                    }
                  }} className="w-full rounded-lg border py-2 text-[12px] font-semibold text-red-400" style={{ borderColor: '#7f1d1d40' }}>
                    🗑️ Clear All Data
                  </button>
                  <button onClick={clearFullArticleCache} className="w-full rounded-lg border py-2 text-[12px] font-semibold text-amber-400" style={{ borderColor: '#7f1d1d40' }}>
                    📖 Clear Article Cache
                  </button>
                </div>
              </div>

              {/* About */}
              <div>
                <h3 className="mb-2 text-[11px] font-[700] uppercase tracking-widest text-zinc-500">ℹ️ About</h3>
                <div className="rounded-xl border p-3 text-[12px] leading-5 text-zinc-400" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <p className="mb-2"><strong className="text-zinc-200">PrivMITLab NewsHub v3.2</strong><br />A privacy-first open news reader by @PrivMITLab</p>
                  <p className="mb-2">
                    <strong className="text-zinc-300">20 Free Sources:</strong> BBC, The Hindu, NDTV, Reuters, Hindustan Times, The Guardian, Times of India, Al Jazeera, TechCrunch, Indian Express, Livemint, Economic Times, Wired, Hacker News, Aaj Tak, BBC Hindi, India Today, NPR, Ars Technica, The Verge — all via free RSS/API.
                  </p>
                  <p className="mb-2"><strong className="text-zinc-300">Features:</strong> 5 themes, 13 categories, 4 languages, Hindi focus mode, TTS, translation, bookmarks, history, notes, auto-refresh, focus mode, weather widget, statistics, keyboard shortcuts, and more.</p>
                  <p><strong className="text-zinc-300">Privacy:</strong> No tracking. No analytics. No ads. No CDN. Open source.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ KEYBOARD SHORTCUTS OVERLAY ═══ */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowShortcuts(false)}>
          <div className="w-full max-w-[440px] rounded-2xl border animate-fade-up" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-[16px] font-[800]">⌨️ Keyboard Shortcuts</h2>
              <button onClick={() => setShowShortcuts(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-2">
              {[
                ['/', 'Focus search bar'],
                ['Ctrl + K', 'Open search'],
                ['Ctrl + B', 'Toggle bookmarks'],
                ['?', 'Show this panel'],
                ['R', 'Refresh news feed'],
                ['Escape', 'Close any panel/modal'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between rounded-lg p-2.5" style={{ background: 'var(--card)' }}>
                  <span className="text-[13px]">{desc}</span>
                  <kbd className="rounded-lg border px-2.5 py-1 text-[11px] font-mono font-bold" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ BACK TO TOP ═══ */}
      {showBackToTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-40 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 animate-fade-up"
          style={{ background: theme.accent, color: theme.bg }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 15-6-6-6 6" /></svg>
        </button>
      )}

      {/* ═══ TOAST CONTAINER ═══ */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t py-6" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center text-[11px] text-zinc-600 sm:flex-row sm:text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: 'var(--card)' }}>🛡️</div>
              <span>© 2026 PrivMITLab • Open News • No Tracking • Your Control</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Privacy-first
              </span>
              <span>•</span>
              <span>20 Free Sources</span>
              <span>•</span>
              <span>13 Categories</span>
              <span>•</span>
              <span>5 Themes</span>
              <span>•</span>
              <a href="https://github.com/PrivMITLab" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300">GitHub</a>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-zinc-700">
            PrivMITLab NewsHub respects your privacy. No tracking or analytics are used. All data stays on your device.
          </p>
        </div>
      </footer>
    </div>
  )
}
