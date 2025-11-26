# Custom Color Theme System

## Overview
The application now supports dynamic custom colors that can be configured by users through the Appearance Settings. These colors are applied globally across all pages and components.

## Default Colors
- **Primary (Color 1)**: Purple `#8b5cf6`
- **Secondary (Color 2)**: Orange `#fd9c2d`

## How It Works

### 1. User Configuration
Users can configure up to 5 custom colors in **Settings > Appearance**:
- Select colors using color picker
- Reorder colors with up/down buttons
- Add/remove colors (minimum 1, maximum 5)
- Reset to default purple and orange theme

### 2. Global Application
When users save their color preferences:
- Colors are saved to localStorage
- CSS variables are updated dynamically
- Changes are applied immediately across all pages
- No page refresh required

## Usage in Components

### Method 1: Using CSS Variables (Recommended)
```tsx
// In any component
<div className="bg-[var(--custom-color-1)] text-white">
  This uses the first custom color
</div>

<button style={{ backgroundColor: 'var(--custom-color-2)' }}>
  This uses the second custom color
</button>
```

### Method 2: Using Tailwind Classes
```tsx
// Tailwind classes for custom colors
<div className="bg-custom-1 text-custom-2">
  Custom colored content
</div>

// Available classes: custom-1, custom-2, custom-3, custom-4, custom-5
```

### Method 3: Using the Hook
```tsx
import { useCustomColors } from "@/lib/use-custom-colors"

function MyComponent() {
  const { primaryColor, secondaryColor, customColor, allColors } = useCustomColors()
  
  return (
    <div style={{ backgroundColor: primaryColor }}>
      <h1 style={{ color: secondaryColor }}>Hello</h1>
      <p style={{ color: customColor(2) }}>Third color</p>
    </div>
  )
}
```

### Method 4: Using Helper Functions
```tsx
import { getCustomColorVar, getCustomColorStyle } from "@/lib/use-custom-colors"

function MyComponent() {
  return (
    <div style={getCustomColorStyle(1, 'backgroundColor')}>
      Content with custom background
    </div>
  )
}
```

## CSS Variables Available

The following CSS variables are automatically updated when users change colors:

- `--primary` (HSL format) - Linked to Color 1
- `--secondary` (HSL format) - Linked to Color 2
- `--custom-color-1` (HEX format) - Color 1
- `--custom-color-2` (HEX format) - Color 2
- `--custom-color-3` (HEX format) - Color 3
- `--custom-color-4` (HEX format) - Color 4
- `--custom-color-5` (HEX format) - Color 5
- `--custom-color-1-hsl` through `--custom-color-5-hsl` (HSL format)

## Examples

### Button with Custom Color
```tsx
<Button className="bg-custom-1 hover:bg-custom-2">
  Click Me
</Button>
```

### Card with Custom Border
```tsx
<Card style={{ borderColor: 'var(--custom-color-1)' }}>
  <CardContent>Custom themed card</CardContent>
</Card>
```

### Badge with Custom Colors
```tsx
<Badge style={{ 
  backgroundColor: 'var(--custom-color-1)', 
  color: 'white' 
}}>
  Custom Badge
</Badge>
```

### Dynamic Gradient
```tsx
function GradientBox() {
  const { primaryColor, secondaryColor } = useCustomColors()
  
  return (
    <div style={{
      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
    }}>
      Gradient with custom colors
    </div>
  )
}
```

## Reset to Default
Users can reset colors to the default purple and orange theme by:
1. Going to Settings > Appearance
2. Clicking the "Reset Theme" button
3. Clicking "Save Appearance Settings"

## Technical Details

### Context API
The color system is managed through `AppContext`:
- `customColors`: Array of current custom colors
- `setCustomColors()`: Update colors
- `applyCustomColors()`: Apply colors to CSS variables
- `resetToDefaultColors()`: Reset to default purple/orange

### Persistence
- Colors are saved to `localStorage` with key `uniqbrio-custom-colors`
- Automatically loaded on app initialization
- Survives page refreshes and browser restarts

### Color Conversion
The system automatically converts HEX colors to HSL format for Tailwind compatibility.

## Best Practices

1. **Use CSS Variables for Dynamic Content**: Prefer `var(--custom-color-1)` over hardcoded colors
2. **Test with Different Colors**: Ensure your UI works with various color combinations
3. **Consider Contrast**: Use appropriate text colors (white/black) based on background
4. **Use Semantic Names**: First color is typically primary, second is secondary
5. **Provide Fallbacks**: Always have a default color in case custom colors aren't loaded

## Migration Guide

To update existing components to use custom colors:

**Before:**
```tsx
<div className="bg-purple-600 text-orange-500">
  Content
</div>
```

**After:**
```tsx
<div className="bg-custom-1 text-custom-2">
  Content
</div>
```

Or with inline styles:
```tsx
<div style={{ 
  backgroundColor: 'var(--custom-color-1)',
  color: 'var(--custom-color-2)'
}}>
  Content
</div>
```
