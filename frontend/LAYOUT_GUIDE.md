# MainLayout Component Guide

## Overview
The `MainLayout` component is a wrapper that automatically handles spacing for side buttons across all pages. This eliminates the need to manually add padding adjustments like `pr-21`, `pr-18`, or `md:pr-25` on each individual page.

## Benefits
✅ **Automatic spacing** - No manual padding adjustments needed  
✅ **Responsive** - Adapts to different screen sizes automatically  
✅ **Consistent** - Same spacing behavior across all pages  
✅ **Maintainable** - Change spacing in one place, affects all pages  
✅ **Clean code** - Less clutter in individual page components  

## Usage

### Basic Usage
```jsx
import MainLayout from "../MainLayout";

export default function YourPage() {
  return (
    <div className="min-h-screen bg-[#f04e37]">
      <MainLayout>
        {/* Your page content here */}
        <YourContent />
      </MainLayout>
    </div>
  );
}
```

### Without Side Buttons
If you need a page without side buttons:
```jsx
<MainLayout includeSideButtons={false}>
  <YourContent />
</MainLayout>
```

### With Additional Classes
```jsx
<MainLayout className="custom-class">
  <YourContent />
</MainLayout>
```

## Responsive Behavior

The MainLayout automatically applies the following padding:
- **Mobile (< 640px)**: `pr-20` (80px) - Accommodates all buttons with labels
- **Small (640px - 768px)**: `pr-24` (96px) - Larger buttons need more space
- **Medium+ (768px+)**: `pr-20` (80px) - Fewer buttons shown (Mobile-only buttons hidden)

## Updated Pages

The following pages have been updated to use MainLayout:
- ✅ `Homepage.jsx`
- ✅ `CreateItinerary.jsx`
- ✅ `CreateItinerary2.jsx`
- ✅ `TouristItinerary.jsx`
- ✅ `TripArchive.jsx`
- ✅ `EmergencyPage.jsx`

## Migration Guide

### Before (Manual Padding)
```jsx
<div className="flex flex-1 px-2 md:pr-25 pr-18">
  <SideButtons />
  <div className="flex-1">
    {/* Content */}
  </div>
</div>
```

### After (MainLayout)
```jsx
<MainLayout>
  <div className="flex flex-1 px-2">
    <div className="flex-1">
      {/* Content */}
    </div>
  </div>
</MainLayout>
```

## Component Location
`frontend/src/components/userComponents/MainLayout.jsx`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | required | The main content of your page |
| `includeSideButtons` | boolean | `true` | Whether to render side buttons |
| `className` | string | `""` | Additional CSS classes for the container |

## Notes
- The side buttons remain fixed on the right side of the screen
- The MainLayout handles z-index and positioning automatically
- No need to worry about button overlap with your content
- Works seamlessly with sticky headers and other positioned elements
