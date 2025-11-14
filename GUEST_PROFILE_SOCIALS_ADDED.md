# Guest Profile Social Media Links Added

## Changes Made

Added social media links section to the Guest Profile page to match the regular Profile page layout.

### File Modified
**File:** `frontend/src/components/userComponents/GuestProfileComponents/GuestProfile.jsx`

### Changes:

#### 1. Added Imports (Lines 3, 7)
```jsx
// Added FaTiktok to react-icons/fa imports
import { FaUser, FaBirthdayCake, FaVenusMars, FaUserCircle, FaTiktok } from "react-icons/fa";

// Added social media icons from lucide-react
import { Facebook, Instagram, Linkedin, Youtube, Twitter } from "lucide-react";
```

#### 2. Added Social Media Section (Lines 172-228)
Inserted between "Create an Account" button and footer:

```jsx
{/* Social Media Icons */}
<div className="mt-12 mb-4 flex items-center justify-center gap-4">
  <a href="https://www.facebook.com/share/17YomjzorW/?mibextid=wwXIfr" ...>
    <Facebook className="w-5 h-5" />
  </a>
  <a href="https://www.instagram.com/intramurosph?igsh=MXUwb3o0YTBkN3cycw==" ...>
    <Instagram className="w-5 h-5" />
  </a>
  <a href="https://www.tiktok.com/@intramurosph?_r=1&_t=ZS-91HcteutvZR" ...>
    <FaTiktok className="w-5 h-5" />
  </a>
  <a href="https://youtube.com/@intramurosadministration?si=NxzDejo3UOFWI6x3" ...>
    <Youtube className="w-5 h-5" />
  </a>
  <a href="https://www.linkedin.com/company/intramuros-administration/" ...>
    <Linkedin className="w-5 h-5" />
  </a>
  <a href="https://x.com/intramuros?s=21" ...>
    <Twitter className="w-5 h-5" />
  </a>
</div>
```

#### 3. Updated Footer (Line 231-233)
Changed footer text to use translation key for consistency:
```jsx
{/* Before */}
© 2025 Intramuros Administration. All rights reserved.

{/* After */}
© 2025 {t("intramurosAdmin")}. All rights reserved.
```

## Social Media Platforms Included

All 6 official Intramuros Administration social media accounts:

1. **Facebook** - https://www.facebook.com/share/17YomjzorW/?mibextid=wwXIfr
2. **Instagram** - https://www.instagram.com/intramurosph?igsh=MXUwb3o0YTBkN3cycw==
3. **TikTok** - https://www.tiktok.com/@intramurosph?_r=1&_t=ZS-91HcteutvZR
4. **YouTube** - https://youtube.com/@intramurosadministration?si=NxzDejo3UOFWI6x3
5. **LinkedIn** - https://www.linkedin.com/company/intramuros-administration/
6. **X (Twitter)** - https://x.com/intramuros?s=21

## Styling Details

### Icon Styling
- Size: `w-5 h-5` (20x20px)
- Color: `text-gray-400` (default)
- Hover: `hover:text-gray-600` (darker on hover)
- Transition: `transition-colors` (smooth color change)

### Container Styling
- Margin top: `mt-12` (48px spacing from button)
- Margin bottom: `mb-4` (16px spacing to footer)
- Layout: `flex items-center justify-center gap-4` (centered with 16px gaps)

### Accessibility
- All links have `aria-label` attributes
- `target="_blank"` for opening in new tab
- `rel="noopener noreferrer"` for security

## Consistency with Profile Page

The implementation exactly matches the social media section in:
- `frontend/src/components/userComponents/ProfileComponents/Profile.jsx` (lines 248-304)

**Matching elements:**
- ✅ Same 6 social platforms
- ✅ Same URLs
- ✅ Same icon sizes and styling
- ✅ Same hover effects
- ✅ Same spacing and layout
- ✅ Same accessibility attributes

## Visual Layout

```
┌─────────────────────────────────────┐
│                                     │
│  [Create an Account Button]         │
│                                     │
│         ↓ mt-12 (48px)              │
│                                     │
│  [FB] [IG] [TT] [YT] [LI] [X]      │ ← Social Media Icons
│                                     │
│         ↓ mb-4 (16px)               │
│                                     │
│  © 2025 Intramuros Admin...         │ ← Footer
│                                     │
└─────────────────────────────────────┘
```

## User Experience

### Before:
- ❌ No social media links in guest profile
- ❌ Inconsistent with regular profile page
- ❌ Guests couldn't easily find official social accounts

### After:
- ✅ Social media links visible to guest users
- ✅ Consistent experience across profile pages
- ✅ Easy access to official Intramuros accounts
- ✅ Professional appearance with hover effects
- ✅ Opens in new tab (doesn't disrupt user session)

## Testing Checklist

### Visual Testing:
- [ ] Icons display correctly in guest profile
- [ ] Icons are properly aligned and spaced
- [ ] Hover effect changes color smoothly
- [ ] Icons match size and style of regular profile

### Functional Testing:
- [ ] Facebook link opens correct page in new tab
- [ ] Instagram link opens correct page in new tab
- [ ] TikTok link opens correct page in new tab
- [ ] YouTube link opens correct page in new tab
- [ ] LinkedIn link opens correct page in new tab
- [ ] X (Twitter) link opens correct page in new tab

### Responsive Testing:
- [ ] Icons display properly on mobile (375px)
- [ ] Icons display properly on tablet (768px)
- [ ] Icons display properly on desktop (1920px)
- [ ] Spacing looks good on all screen sizes

### Accessibility Testing:
- [ ] Screen reader announces link labels correctly
- [ ] Links are keyboard accessible (Tab navigation)
- [ ] Links have proper focus indicators
- [ ] Links open in new tab as expected

## Related Files

**Similar Implementation:**
- `frontend/src/components/userComponents/ProfileComponents/Profile.jsx` - Regular user profile with social links

**Layout Components:**
- `frontend/src/components/userComponents/GuestProfileComponents/GuestProfileLayout.jsx` - Layout wrapper (no changes needed)

## Notes

- The social media links are identical between guest and regular profiles
- This ensures consistent branding and user experience
- Guest users can now easily connect with Intramuros Administration on social media
- The implementation is fully responsive and accessible
