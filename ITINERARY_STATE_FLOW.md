# Itinerary State Persistence Flow

## Overview
This document explains how itinerary state (visited sites, current position, pin order) is saved and restored for both Tourist and Guest users.

---

## Tourist Mode (Logged-in Users)

### 1. First Visit
- User opens itinerary
- System gets GPS location
- **Optimizes route** from user location
- Saves to database:
  - `optimizedOrder`: Array of site IDs in optimized sequence
  - `currentPinIndex`: 0
  - `visitedSites`: []
  - Database: ✅ Saved

### 2. Navigation & Progress
- User clicks "Next" → Current site marked visited → Saves to database
- User clicks "Skip" → Current site marked skipped → Saves to database
- Every action updates database with current state + optimizedOrder
- Database: ✅ Always up-to-date

### 3. Browser Refresh
- System fetches progress from database
- If `optimizedOrder` exists:
  - ✅ **Reconstructs pins in SAVED order** (no re-optimization)
  - Restores `currentPinIndex`, `visitedSites`, `skippedSites`
  - Shows Resume/Restart modal
- Pin numbers stay consistent across refreshes

### 4. Resume Button
- Uses EXISTING `optimizedOrder` from database
- Restores to saved `currentPinIndex`
- Keeps all visited/skipped states
- Rebuilds route from current location to current pin
- **No re-optimization** - maintains pin numbers

### 5. Restart Button
- Creates NEW `optimizedOrder` from current GPS location
- Resets `currentPinIndex` to 0
- **Keeps visited/skipped flags** (doesn't reset progress)
- Saves new `optimizedOrder` to database
- Pin numbers may change (re-optimized route)

---

## Guest Mode (Not Logged-in)

### Flow
Same as Tourist Mode, except:
- ❌ No database saving (localStorage only)
- ❌ No resume modal on refresh (state lost)
- ✅ Same pin numbering during session
- ✅ Same Next/Skip/Navigation controls

### On Refresh
- State is lost (no database)
- Starts fresh optimization
- No resume modal

---

## Key Files

### Frontend
- **TouristItinerariesMap.jsx**: Tourist mode with database persistence
  - `saveProgress()`: Saves state + optimizedOrder to database
  - `loadProgress()`: Loads state from database on mount/refresh
  - `handleResumeProgress()`: Uses saved optimizedOrder
  - `handleRestartProgress()`: Creates new optimizedOrder

- **GuestItineraryMap.jsx**: Guest mode without persistence
  - Same UI/UX flow
  - No database calls

### Backend
- **routes/itineraryProgressRoute.js**: 
  - POST `/:itineraryId`: Saves progress with optimizedOrder
  - GET `/:itineraryId`: Loads progress
- **models/ItineraryProgress.js**: Schema with optimizedOrder field

---

## Database Schema

```javascript
{
  userId: ObjectId,
  itineraryId: ObjectId,
  currentPinIndex: Number,           // Current pin index (0-based)
  visitedSites: [ObjectId],         // Array of visited site IDs
  skippedSites: [ObjectId],         // Array of skipped site IDs
  optimizedOrder: [ObjectId],       // Pin order (site IDs in sequence)
  lastPosition: { lat, lng },
  lastUpdated: Date
}
```

---

## Why optimizedOrder is Critical

### Without optimizedOrder:
1. User at Pin #3 (Fort Santiago)
2. Refresh browser
3. System re-optimizes from current location
4. Fort Santiago now becomes Pin #7
5. ❌ Confusing! Numbers changed

### With optimizedOrder:
1. User at Pin #3 (Fort Santiago)
2. Refresh browser
3. System reconstructs SAME order from database
4. Fort Santiago stays Pin #3
5. ✅ Consistent! Numbers preserved

---

## Testing Checklist

### Tourist Mode
- [ ] First visit saves optimizedOrder to database
- [ ] Click Next → Database updated with visited site
- [ ] Refresh → Resume modal shows
- [ ] Resume → Uses saved pin order (numbers unchanged)
- [ ] Restart → New pin order (numbers may change)
- [ ] Multiple refreshes → State always persists

### Guest Mode
- [ ] First visit shows pins
- [ ] Click Next → Visited sites marked (session only)
- [ ] Refresh → State lost, starts fresh
- [ ] No resume modal (no saved state)

### Database Verification
```javascript
// Check saved data
db.itineraryprogresses.findOne({ 
  userId: ObjectId("..."),
  itineraryId: ObjectId("...")
})

// Should have:
// - optimizedOrder: Array with 6-10 site IDs
// - visitedSites: Array with visited site IDs
// - currentPinIndex: Number (current position)
```

---

## Production Deployment

### Environment Variables
Ensure hosting platform has:
```
VITE_API_BASE_URL=https://d3des4qdhz53rp.cloudfront.net/api
```

### Local Development
Use `.env.local`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

**Note**: `.env.local` is git-ignored and won't affect production.

---

## Resume/Restart Behavior Summary

| Action | optimizedOrder | currentPinIndex | visitedSites | Pin Numbers |
|--------|----------------|-----------------|--------------|-------------|
| **Resume** | Uses saved | Restored | Preserved | Unchanged |
| **Restart** | New (re-optimize) | Reset to 0 | Preserved | May change |

Both actions keep your progress (visited sites), but Restart gives you a new route from your current location.
