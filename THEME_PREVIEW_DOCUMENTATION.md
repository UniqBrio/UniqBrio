# Theme Preview Feature Documentation

## Overview
The Theme Preview feature allows users to see how UniqBrio looks with different color schemes and display modes (light/dark) directly on the landing page. This interactive component helps prospects visualize the platform's customization options before signing up.

## Components Created

### 1. `theme-preview.tsx`
**Location:** `components/landing/theme-preview.tsx`

A fully interactive theme preview section that includes:
- Real-time color theme switching (6 themes)
- Dark/light mode toggle
- Live preview of UI components
- Responsive design for mobile and desktop

#### Features:
- **6 Color Themes:**
  - Default (Purple): `hsl(272 97% 62%)`
  - Purple: `hsl(262.1 83.3% 57.8%)`
  - Blue: `hsl(221.2 83.2% 53.3%)`
  - Green: `hsl(142.1 76.2% 36.3%)`
  - Orange: `hsl(24.6 95% 53.1%)`
  - Red: `hsl(0 84.2% 60.2%)`

- **Display Modes:**
  - Light mode
  - Dark mode
  - Quick toggle switch

- **Preview Components:**
  - Buttons (primary, secondary, outline, ghost)
  - Dashboard cards with statistics
  - Progress bars
  - Badges
  - All styled with the selected theme

## Integration

### Landing Page
The theme preview has been integrated into `LandingPageContent.tsx` between the "How It Works" and "Pricing" sections.

```tsx
import ThemePreview from 'components/landing/theme-preview'

// In the component:
<ThemePreview />
```

### Global Styles
Theme-specific CSS variables have been added to `app/globals.css`:

```css
[data-theme="purple"] {
  --primary: 262.1 83.3% 57.8%;
  --primary-foreground: 0 0% 100%;
}
// ... other themes
```

## Shadcn UI Components Used

The following shadcn components are utilized:
- `Button` - Interactive buttons
- `Card` - Layout containers
- `Select` - Theme dropdown selector
- `Tabs` - Mode switching interface
- `Switch` - Quick dark mode toggle
- `Badge` - Visual tags and labels
- `Label` - Form labels

## How It Works

1. **Theme Selection:**
   - Users select a color theme from the dropdown
   - The `data-theme` attribute is set on the document root
   - CSS variables update accordingly

2. **Mode Switching:**
   - Users toggle between light and dark modes
   - The `dark` class is added/removed from the document root
   - All components automatically adapt

3. **Live Preview:**
   - A sample dashboard UI updates in real-time
   - Shows how actual application components will look
   - Demonstrates the theme across different UI elements

## Implementation Details

### State Management
```tsx
const [selectedTheme, setSelectedTheme] = useState('default')
const [mode, setMode] = useState<'light' | 'dark'>('light')
const [mounted, setMounted] = useState(false)
```

### Effect Hook
```tsx
useEffect(() => {
  if (!mounted) return

  const root = document.documentElement
  root.setAttribute('data-theme', selectedTheme)
  
  if (mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}, [selectedTheme, mode, mounted])
```

### Hydration Safety
The component uses a `mounted` state to prevent hydration mismatches between server and client rendering.

## User Experience

### Desktop View
- Two-column layout
- Theme controls on the left
- Live preview on the right
- Full component showcase

### Mobile View
- Stacked layout
- Controls appear first
- Preview below
- Fully responsive

## Customization

### Adding New Themes
1. Add theme to the `colorThemes` array:
```tsx
{ name: 'Your Theme', value: 'your-theme', primary: 'hsl(...)' }
```

2. Add CSS variables in `globals.css`:
```css
[data-theme="your-theme"] {
  --primary: hsl(...);
  --primary-foreground: hsl(...);
}
```

### Modifying Preview Components
Edit the preview section in `theme-preview.tsx`:
```tsx
<CardContent className="space-y-4">
  {/* Add your preview components here */}
</CardContent>
```

## Performance Considerations

- **Client-side Only:** Uses `'use client'` directive
- **Lazy Rendering:** Returns `null` until mounted
- **Minimal Re-renders:** Effects optimized with dependency arrays
- **No External Requests:** All themes defined locally

## Accessibility

- All interactive elements are keyboard accessible
- Proper ARIA labels on form controls
- High contrast ratios maintained in all themes
- Screen reader friendly component structure

## Testing Recommendations

1. **Visual Testing:**
   - Test all 6 color themes
   - Verify dark/light mode transitions
   - Check mobile responsiveness

2. **Interaction Testing:**
   - Theme dropdown functionality
   - Mode tabs switching
   - Quick toggle switch

3. **Browser Testing:**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

Potential improvements:
- [ ] Save theme preference to localStorage
- [ ] Animation transitions between themes
- [ ] More preview components (forms, tables, charts)
- [ ] Custom theme builder
- [ ] Export theme configuration
- [ ] Preview full pages (not just components)

## Maintenance

- **Dependencies:** Requires shadcn/ui components
- **Styling:** Relies on Tailwind CSS and CSS variables
- **Framework:** Next.js 14+ with App Router

## Support

For issues or questions:
- Check shadcn/ui documentation: https://ui.shadcn.com
- Review Tailwind CSS variables: https://tailwindcss.com/docs/customizing-colors
- Next.js theming guide: https://nextjs.org/docs
