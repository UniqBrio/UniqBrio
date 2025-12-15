# Progressive Web App (PWA) Implementation Guide

## Overview
This application has been configured as a Progressive Web App using **@ducanh2912/next-pwa**, a stable and well-maintained PWA solution for Next.js applications.

## Features Implemented

### 1. **Service Worker**
- Automatically generated service worker using Workbox
- Handles offline functionality and caching strategies
- Disabled in development mode for easier debugging
- Located at `/public/sw.js` (auto-generated, not committed to git)

### 2. **App Manifest**
- Complete PWA manifest at `/public/manifest.json`
- Includes:
  - App name and description
  - Theme colors
  - Icons in multiple sizes (192x192, 512x512, SVG)
  - App shortcuts (Dashboard, Notifications)
  - Display mode: standalone
  - Orientation: portrait-primary
  - Categories: education, business, productivity

### 3. **Caching Strategies**

#### Google Fonts
- **Strategy**: CacheFirst
- **Duration**: 1 year
- **Max Entries**: 10

#### Font Assets
- **Strategy**: StaleWhileRevalidate
- **Duration**: 1 week
- **Max Entries**: 10

#### Images
- **Strategy**: StaleWhileRevalidate
- **Duration**: 30 days
- **Max Entries**: 100
- **File Types**: jpg, jpeg, gif, png, svg, ico, webp

#### JavaScript & CSS
- **Strategy**: StaleWhileRevalidate
- **Duration**: 1 day
- **Max Entries**: 60

#### API Calls
- **Strategy**: NetworkFirst
- **Duration**: 5 minutes
- **Max Entries**: 50
- **Timeout**: 10 seconds
- Falls back to cache if network fails

#### Pages
- **Strategy**: NetworkFirst
- **Duration**: 1 day
- **Max Entries**: 50
- **Timeout**: 10 seconds
- Excludes `/api/` and `/auth/` routes

### 4. **Offline Support**
- Custom offline fallback page at `/app/offline/page.tsx`
- Shows connection status
- Provides retry functionality
- Lists available offline features
- Auto-detects when connection is restored

### 5. **Icons**
All required PWA icons are present in `/public/`:
- `web-app-manifest-192x192.png` - Android/Chrome icon
- `web-app-manifest-512x512.png` - Android/Chrome icon
- `apple-touch-icon.png` - iOS icon (180x180)
- `favicon-96x96.png` - Desktop icon
- `favicon.svg` - Scalable icon
- `favicon.ico` - Legacy fallback

### 6. **Meta Tags**
Configured in `/app/layout.tsx`:
- Application name
- Theme color
- Apple Web App capable
- Manifest link
- Viewport configuration

## Installation & Setup

The PWA is already configured. To build and test:

```bash
# Build the application (service worker is generated during build)
npm run build

# Start production server
npm start

# Or for development (PWA disabled in dev mode)
npm run dev
```

## Testing Your PWA

### Desktop (Chrome/Edge)
1. Build and run the production version: `npm run build && npm start`
2. Open Chrome DevTools (F12)
3. Go to **Application** tab
4. Check **Manifest** section to verify manifest.json
5. Check **Service Workers** section to verify sw.js is registered
6. Click the install icon in the address bar to install PWA

### Mobile (Android)
1. Deploy to HTTPS (required for PWA)
2. Visit the site on Chrome for Android
3. Tap the menu (⋮) and select "Install app" or "Add to Home Screen"
4. The app will install as a standalone application

### Mobile (iOS)
1. Deploy to HTTPS
2. Visit the site in Safari
3. Tap the Share button
4. Select "Add to Home Screen"
5. The app will be added with the icon specified in manifest

## Testing Offline Functionality

1. Open Chrome DevTools → Network tab
2. Check "Offline" to simulate no internet
3. Navigate through the app
4. Previously visited pages should load from cache
5. New pages will show the offline fallback page
6. Uncheck "Offline" and click retry to reconnect

## Lighthouse PWA Audit

Test your PWA score:
1. Open Chrome DevTools
2. Go to **Lighthouse** tab
3. Select "Progressive Web App" category
4. Click "Analyze page load"
5. Review the PWA checklist and scores

Target scores:
- ✅ Installable
- ✅ PWA Optimized
- ✅ Works Offline
- ✅ Fast and Reliable

## Configuration Files

### next.config.mjs
```javascript
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // ... caching strategies
});

export default withPWA(nextConfig);
```

### .gitignore
PWA auto-generated files are ignored:
```
public/sw.js
public/sw.js.map
public/workbox-*.js
public/workbox-*.js.map
```

## Deployment Considerations

### HTTPS Required
PWAs require HTTPS in production. Service workers will not register on HTTP (except localhost).

### Vercel Deployment
If deploying to Vercel:
1. HTTPS is automatically provided
2. Service worker will register automatically
3. No additional configuration needed

### Custom Domain
Ensure your domain has valid SSL certificate for PWA to work.

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome (Desktop) | ✅ Full support |
| Chrome (Android) | ✅ Full support with install prompt |
| Safari (iOS 16.4+) | ✅ Full support with install |
| Safari (Desktop) | ✅ Limited support |
| Edge | ✅ Full support |
| Firefox | ⚠️ Partial support (no install prompt) |

## Customization

### Changing Cache Duration
Edit `next.config.mjs` → `workboxOptions` → `runtimeCaching` → `expiration` values.

### Adding New Routes to Cache
Add new URL patterns to the `runtimeCaching` array in `next.config.mjs`.

### Updating App Colors
Edit `public/manifest.json`:
- `theme_color`: Browser toolbar color
- `background_color`: Splash screen background

### Adding More Shortcuts
Edit `public/manifest.json` → `shortcuts` array with new quick actions.

## Troubleshooting

### Service Worker Not Registering
1. Ensure you're on HTTPS or localhost
2. Build the app: `npm run build`
3. Check browser console for errors
4. Clear browser cache and reload

### Offline Page Not Showing
1. Verify `/app/offline/page.tsx` exists
2. Check `fallbacks.document` is set in next.config.mjs
3. Test in production mode only (dev mode has PWA disabled)

### Cache Not Updating
1. Service worker uses `skipWaiting: true` for immediate updates
2. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Clear Application cache in DevTools

### Install Prompt Not Showing
- Must meet PWA installability criteria
- Must be accessed via HTTPS
- Must have valid manifest.json
- User hasn't already installed or dismissed

## Maintenance

### Updating Service Worker
The service worker is auto-generated during build. Any changes to:
- next.config.mjs caching strategies
- Page content
- Assets

Will automatically create a new service worker on the next build.

### Version Management
The PWA version can be updated in `package.json`. Consider incrementing version on major changes to force cache updates.

## Performance Benefits

- **Faster Load Times**: Cached assets load instantly
- **Offline Access**: Continue working without internet
- **Reduced Server Load**: Static assets served from cache
- **Better Mobile Experience**: Feels like a native app
- **Background Sync**: (Can be added) Sync data when connection returns

## Security Considerations

- Service workers only work on HTTPS
- Sensitive API calls use NetworkFirst (always try network)
- Authentication routes (`/api/auth/*`) are not cached
- User sessions are handled server-side

## Next Steps

Consider adding:
1. **Push Notifications**: Engage users with timely updates
2. **Background Sync**: Queue actions when offline, sync when online
3. **App Shortcuts**: Add more quick actions to manifest
4. **Screenshots**: Add to manifest for better app store listings
5. **Periodic Background Sync**: Keep content fresh
6. **Share Target**: Allow sharing content to your app

## Resources

- [next-pwa Documentation](https://github.com/DuCanhGH/next-pwa)
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA Checklist](https://web.dev/pwa-checklist/)

## Support

For PWA-specific issues, check:
1. Browser console for service worker logs
2. Application tab in DevTools
3. Network tab for caching behavior
4. Lighthouse audit for PWA compliance

---

**Last Updated**: December 15, 2025
**PWA Version**: Stable with @ducanh2912/next-pwa
**Next.js Version**: 15.5.9
