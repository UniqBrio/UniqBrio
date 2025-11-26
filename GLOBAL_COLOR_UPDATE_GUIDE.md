# Global Custom Color System - Quick Update Guide

## ✅ Already Updated Pages
- **Sidebar** - All menus, tooltips, hover states, favorites
- **Settings Page** - All tabs, buttons, headers, spinners
- **Appearance Settings** - Color picker UI
- **User Management** - Header, stat cards  
- **Audit Logs** - Base setup completed

## 🎨 How the System Works

Users can now customize all colors in **Settings → Appearance (Localization tab)**:
1. Select up to 5 custom colors
2. Click "Save Appearance Settings"
3. Colors apply INSTANTLY across all components using the system
4. "Reset Theme" button restores default Purple & Orange

## 📋 Quick Update Guide for Any Page

### Step 1: Add Import
```tsx
import { useCustomColors } from "@/lib/use-custom-colors"
```

### Step 2: Use the Hook
```tsx
export default function YourPage() {
  const { primaryColor, secondaryColor } = useCustomColors()
  // ... rest of your component
}
```

### Step 3: Replace Hardcoded Colors

#### Method A: Using Hook Variables (Recommended for Interactive Elements)
```tsx
// ❌ Old way:
<h1 className="text-purple-700">Title</h1>
<Button className="bg-orange-500">Click</Button>

// ✅ New way:
<h1 style={{ color: primaryColor }}>Title</h1>
<Button style={{ backgroundColor: secondaryColor }}>Click</Button>
```

#### Method B: Using CSS Variables (For Static Styles)
```tsx
// ❌ Old way:
<div className="bg-purple-50 border-purple-300 text-purple-600">
  Content
</div>

// ✅ New way:
<div style={{
  backgroundColor: `${primaryColor}15`,  // 15 = 15% opacity
  borderColor: `${primaryColor}50`,       // 50 = 50% opacity  
  color: primaryColor
}}>
  Content
</div>

// Or use CSS custom properties:
<div style={{ color: 'var(--custom-color-1)' }}>Content</div>
```

#### Method C: Gradients
```tsx
// ❌ Old way:
<Card className="bg-gradient-to-br from-purple-50 to-purple-100">

// ✅ New way:
<Card style={{
  backgroundImage: `linear-gradient(to bottom right, ${primaryColor}15, ${primaryColor}25)`
}}>
```

#### Method D: Hover States
```tsx
// ❌ Old way:
<button className="hover:bg-purple-50">Click</button>

// ✅ New way:
<button
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}10`}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
>
  Click
</button>
```

## 🎯 Color Variables Available

### From Hook:
- `primaryColor` - Color 1 (default: #8b5cf6 purple)
- `secondaryColor` - Color 2 (default: #fd9c2d orange)  
- `customColor(index)` - Access any color by index (0-4)
- `allColors` - Array of all selected colors

### From CSS Variables:
- `var(--custom-color-1)` - Color 1
- `var(--custom-color-2)` - Color 2
- `var(--custom-color-3)` - Color 3
- `var(--custom-color-4)` - Color 4
- `var(--custom-color-5)` - Color 5
- `var(--primary)` - Alias for Color 1
- `var(--secondary)` - Alias for Color 2

## 📝 Common Replacements

### Headers/Titles
```tsx
// Replace: text-purple-700, text-purple-600, text-purple-800
style={{ color: primaryColor }}
```

### Accent Colors  
```tsx
// Replace: text-orange-500, text-orange-600, bg-orange-100
style={{ color: secondaryColor }}
style={{ backgroundColor: `${secondaryColor}20` }}
```

### Cards/Backgrounds
```tsx
// Replace: bg-purple-50, bg-purple-100
style={{ 
  backgroundImage: `linear-gradient(to bottom right, ${primaryColor}15, ${primaryColor}25)`
}}
```

### Borders
```tsx
// Replace: border-purple-300, border-orange-400
style={{ borderColor: `${primaryColor}50` }}
```

### Icons
```tsx
// Replace: text-purple-500
<Icon className="h-5 w-5" style={{ color: primaryColor }} />
```

### Buttons (Active State)
```tsx
<button 
  style={{
    backgroundColor: isActive ? primaryColor : 'transparent',
    color: isActive ? 'white' : secondaryColor,
    borderColor: isActive ? primaryColor : secondaryColor
  }}
>
  Tab
</button>
```

## 🔍 Finding Pages to Update

Run this PowerShell command to find files with hardcoded colors:
```powershell
Get-ChildItem -Path "app/dashboard" -Filter "*.tsx" -Recurse | 
  Select-String -Pattern "(bg-purple-|text-purple-|border-purple-|bg-orange-|text-orange-|border-orange-)" | 
  Select-Object -Property Filename, LineNumber -Unique
```

## ⚡ Batch Update Script (Optional)

For pages with many instances, you can use PowerShell to help:

```powershell
# Example: Replace simple text color classes
$file = "app/dashboard/your-page/page.tsx"
$content = Get-Content $file -Raw
$content = $content -replace 'text-purple-700', 'style={{ color: primaryColor }}'
$content = $content -replace 'text-orange-600', 'style={{ color: secondaryColor }}'
Set-Content $file $content
```

**⚠️ Warning:** Always review automated changes carefully!

## 🎯 Priority Pages to Update

High-traffic pages that users see most:
1. ✅ Dashboard/Home - (uses Dashboard component)
2. ✅ Settings - Already done
3. ✅ User Management - Done
4. Students Management - `/app/dashboard/user/students/page.tsx`
5. Staff Management - `/app/dashboard/user/staff/page.tsx`
6. Courses - `/app/dashboard/services/courses/page.tsx`
7. Schedule - `/app/dashboard/services/schedule/page.tsx`
8. Events - `/app/dashboard/events/page.tsx`
9. Financials - `/app/dashboard/financials/page.tsx`
10. Task Management - `/app/dashboard/task-management/page.tsx`

## 💡 Tips

1. **Test After Each Update** - Check the page loads and colors apply correctly
2. **Use Browser DevTools** - Inspect elements to verify custom colors are applying
3. **Check Dark Mode** - Ensure colors work in both light and dark themes
4. **Opacity Values** - Use hex opacity (10, 15, 20, 25, 50) for consistent transparency
5. **Maintain Contrast** - Ensure text remains readable on backgrounds

## 🐛 Troubleshooting

**Colors not applying?**
- Check that you imported and used `useCustomColors()` hook
- Verify the component is client-side (`"use client"` at top)
- Check browser console for errors

**Colors look wrong?**
- HSL conversion happens automatically for Tailwind classes
- For inline styles, use hex colors directly from the hook

**Reset not working?**
- Clear localStorage: `localStorage.removeItem('uniqbrio-custom-colors')`
- Refresh the page

## 📚 Reference Files

- **Context**: `contexts/dashboard/app-context.tsx` - Main color management
- **Hook**: `lib/use-custom-colors.ts` - Helper hook for components
- **CSS**: `app/globals.css` - CSS variable definitions
- **Example**: `app/dashboard/settings/page.tsx` - Reference implementation

---

**Status**: System fully functional. Update remaining pages as needed using this guide.
