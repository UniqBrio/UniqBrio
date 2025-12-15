# PWA Quick Reference

## 🚀 Quick Commands

```bash
# Build PWA (generates service worker)
npm run build

# Start production with PWA enabled
npm start

# Development (PWA disabled for easier debugging)
npm run dev
```

## ✅ What's Included

### Core Files
- ✅ `next.config.mjs` - PWA configuration with Workbox
- ✅ `public/manifest.json` - App manifest with icons & shortcuts
- ✅ `app/offline/page.tsx` - Offline fallback page
- ✅ `app/layout.tsx` - PWA meta tags
- ✅ `.gitignore` - Excludes auto-generated SW files

### Icons (Already Present)
- ✅ `web-app-manifest-192x192.png`
- ✅ `web-app-manifest-512x512.png`
- ✅ `apple-touch-icon.png`
- ✅ `favicon-96x96.png`
- ✅ `favicon.svg` & `favicon.ico`

### Features
- ✅ Service Worker with Workbox
- ✅ Offline support
- ✅ Smart caching strategies
- ✅ Install prompt (Chrome/Edge/Android)
- ✅ App shortcuts
- ✅ Standalone app mode

## 📦 Package Installed

```json
"@ducanh2912/next-pwa": "latest" (devDependency)
```

## 🧪 Testing

### Test in Chrome
1. Build: `npm run build && npm start`
2. Open DevTools → Application tab
3. Check Manifest and Service Workers
4. Click install icon in address bar

### Test Offline
1. DevTools → Network → Check "Offline"
2. Navigate pages (cached pages work)
3. Try new pages (shows offline fallback)

### PWA Score
1. DevTools → Lighthouse
2. Run PWA audit
3. Should score 100 for installability

## 🎨 Customization Points

### Change Colors
Edit `public/manifest.json`:
```json
{
  "theme_color": "#your-color",
  "background_color": "#your-color"
}
```

### Add Shortcuts
Edit `public/manifest.json` → `shortcuts[]`

### Adjust Caching
Edit `next.config.mjs` → `workboxOptions.runtimeCaching[]`

## 🌐 Deployment

### Requirements
- ✅ HTTPS (automatic on Vercel)
- ✅ Valid SSL certificate
- ✅ Build step runs successfully

### Vercel
- Automatically works
- No additional config needed
- Service worker registers on HTTPS

## 📱 Install Instructions

### Android (Chrome)
1. Visit site → Menu (⋮)
2. "Install app" or "Add to Home Screen"

### iOS (Safari)
1. Visit site → Share button
2. "Add to Home Screen"

### Desktop (Chrome/Edge)
1. Visit site
2. Click install icon in address bar
3. Or: Menu → "Install UniqBrio App"

## 🔍 Troubleshooting

### SW Not Registering?
- Build app first: `npm run build`
- Use HTTPS or localhost
- Check console for errors

### Not Installing?
- Verify manifest: DevTools → Application → Manifest
- Must be on HTTPS (except localhost)
- Clear cache: Ctrl+Shift+Delete

### Cache Issues?
- Service worker auto-updates on new builds
- Hard refresh: Ctrl+Shift+R
- Or clear cache in DevTools → Application

## 📚 Full Documentation

See [PWA_IMPLEMENTATION_GUIDE.md](./PWA_IMPLEMENTATION_GUIDE.md) for complete details.

---

**Package**: @ducanh2912/next-pwa (stable)
**Status**: ✅ Production Ready
**Next.js**: 15.5.9 compatible
