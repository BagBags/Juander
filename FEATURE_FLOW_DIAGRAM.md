# Trip Archives & Reviews - Feature Flow Diagram

## 🗺️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

1. START TRIP
   │
   ├─► User navigates to: /tourist-itinerary/:itineraryId
   │
   ├─► TouristItinerariesMap.jsx loads
   │
   ├─► useEffect() runs → Check for existing trip archive
   │   │
   │   ├─► If exists: Load visitedSites[]
   │   │
   │   └─► If not: Create new trip archive
   │       └─► POST /api/trip-archives
   │           Body: { itineraryId, visitedSites: [] }
   │
   └─► Trip archive ID stored in state


2. VISIT SITES
   │
   ├─► GPS tracks user location (navigator.geolocation.watchPosition)
   │
   ├─► Proximity detection runs on every location update
   │   │
   │   └─► Calculate distance to current site (Haversine formula)
   │       │
   │       ├─► If distance < 50m:
   │       │   ├─► setIsNearby(true)
   │       │   ├─► Show preview card
   │       │   └─► Mark site as visited
   │       │       └─► PUT /api/trip-archives/:id/add-site
   │       │           Body: { siteId }
   │       │
   │       └─► If distance >= 50m:
   │           └─► setIsNearby(false)
   │
   └─► Site added to visitedSites[] in database


3. NAVIGATE TO NEXT SITE
   │
   ├─► User clicks "Go to Nearest Next Site" button
   │
   ├─► goToNextStop() function executes
   │   │
   │   ├─► Filter out visited sites
   │   │
   │   ├─► Calculate distance to all remaining sites
   │   │
   │   ├─► Find nearest site
   │   │
   │   └─► Update route
   │       └─► Mapbox Directions API call
   │           └─► Returns: route, distance, ETA, steps
   │
   └─► Map updates with new route and directions


4. VIEW TRIP ARCHIVES
   │
   ├─► User navigates to: /trip-archives
   │
   ├─► TripArchive.jsx loads
   │
   ├─► Fetch trip archives
   │   └─► GET /api/trip-archives
   │       Returns: [
   │         {
   │           itineraryId: { name, imageUrl },
   │           visitedSites: [{ siteId, visitedAt }],
   │           completedAt
   │         }
   │       ]
   │
   └─► Display completed trips with visited sites


5. SUBMIT REVIEW
   │
   ├─► User clicks "Review" button on visited site
   │
   ├─► Review modal opens
   │   │
   │   ├─► User selects star rating (1-5) ← REQUIRED
   │   │
   │   └─► User enters comment (optional)
   │
   ├─► User clicks "Submit Review"
   │
   ├─► Validation
   │   │
   │   ├─► Rating selected? → Continue
   │   │
   │   └─► No rating? → Show error
   │
   ├─► POST /api/reviews
   │   Body: {
   │     tripArchiveId,
   │     siteId,
   │     rating,
   │     comment
   │   }
   │
   ├─► Backend checks for duplicate
   │   │
   │   ├─► Already reviewed? → Return error
   │   │
   │   └─► New review? → Save to database
   │
   └─► Review appears in "Manage Reviews" section


6. GO TO NEXT SITE (FROM ARCHIVES)
   │
   ├─► User clicks "Go to Next Site →" in Trip Archives
   │
   ├─► handleGoToNextSite() executes
   │   │
   │   └─► navigate(`/tourist-itinerary/${archive.itineraryId._id}`)
   │
   └─► Returns to TouristItinerariesMap.jsx
       └─► Continues from step 2 (Visit Sites)
```

---

## 🔄 Data Flow

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       │ 1. POST /api/trip-archives
       │    { itineraryId, visitedSites: [] }
       │
       ▼
┌──────────────┐
│   Backend    │
│   Routes     │
└──────┬───────┘
       │
       │ 2. Create TripArchive document
       │
       ▼
┌──────────────┐
│   MongoDB    │
│  TripArchive │
└──────┬───────┘
       │
       │ 3. Return trip archive ID
       │
       ▼
┌──────────────┐
│   Frontend   │
│    State     │
└──────┬───────┘
       │
       │ 4. User visits site (within 50m)
       │
       │ 5. PUT /api/trip-archives/:id/add-site
       │    { siteId }
       │
       ▼
┌──────────────┐
│   Backend    │
│   Updates    │
└──────┬───────┘
       │
       │ 6. Push to visitedSites array
       │
       ▼
┌──────────────┐
│   MongoDB    │
│   Updated    │
└──────────────┘
```

---

## 🎭 Component Interaction

```
TouristItinerariesMap.jsx
    │
    ├─► Creates trip archive on mount
    │   └─► Stores currentTripArchiveId
    │
    ├─► Tracks user location
    │   └─► Updates visitedSites when nearby
    │
    ├─► Renders SiteModalFullScreen
    │   └─► Passes goToNextStop function
    │
    └─► On "Go to Next Site" click
        └─► Calculates nearest site
        └─► Updates route


TripArchive.jsx
    │
    ├─► Fetches trip archives
    │   └─► GET /api/trip-archives
    │
    ├─► Displays visited sites
    │   └─► Each site has "Review" button
    │
    ├─► Review Modal
    │   ├─► Star rating component
    │   ├─► Comment textarea
    │   └─► Submit → POST /api/reviews
    │
    ├─► Fetches reviews
    │   └─► GET /api/reviews
    │
    └─► "Go to Next Site" button
        └─► navigate(`/tourist-itinerary/${itineraryId}`)
```

---

## 📊 State Management

### TouristItinerariesMap.jsx State
```javascript
{
  pins: [],                    // All sites in itinerary
  userLocation: {},            // Current GPS coordinates
  visitedSites: [],            // Array of visited site IDs
  currentTripArchiveId: null,  // ID of active trip archive
  selectedPin: null,           // Currently selected site
  currentPinIndex: 0,          // Index of current target site
  route: null,                 // Mapbox route geometry
  distance: null,              // Distance to current site (meters)
  eta: null,                   // Estimated time of arrival (seconds)
  steps: [],                   // Turn-by-turn directions
  isNearby: false              // Within 50m of current site
}
```

### TripArchive.jsx State
```javascript
{
  archives: [],                // All trip archives for user
  reviews: [],                 // All reviews for user
  loading: true,               // Loading state
  selectedTrip: null,          // Trip selected for review
  selectedSite: null,          // Site selected for review
  showReviewModal: false,      // Review modal visibility
  reviewRating: 0,             // Selected star rating (1-5)
  reviewComment: "",           // Review comment text
  hoverRating: 0               // Star hover state
}
```

---

## 🔐 Authentication Flow

```
User Login
    │
    ├─► Token stored in localStorage
    │
    └─► Token sent with every API request
        │
        └─► Authorization: Bearer <token>

Backend Middleware (verifyToken)
    │
    ├─► Extracts token from header
    │
    ├─► Verifies JWT signature
    │
    ├─► Decodes user ID
    │
    └─► Attaches req.user to request
        │
        └─► Routes use req.user._id for queries
```

---

## 🎯 Key Functions

### Proximity Detection
```javascript
// Runs on every GPS update
useEffect(() => {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    pin.latitude,
    pin.longitude
  );
  
  if (distance < 50) {
    markSiteAsVisited(pin._id);
    setIsNearby(true);
    setSelectedPin(pin);
  }
}, [userLocation, currentPinIndex]);
```

### Go to Next Site
```javascript
const goToNextStop = () => {
  // Filter unvisited sites
  const remaining = pins.filter((_, i) => i !== currentPinIndex);
  
  // Find nearest
  const nearest = remaining.reduce((closest, pin) => {
    const dist = calculateDistance(userLocation, pin);
    return dist < closest.dist ? { pin, dist } : closest;
  }, { pin: null, dist: Infinity });
  
  // Update route
  buildRoute(userLocation, nearest.pin);
};
```

### Submit Review
```javascript
const handleSubmitReview = async () => {
  if (!reviewRating) {
    alert("Please select a star rating");
    return;
  }
  
  await axios.post("/api/reviews", {
    tripArchiveId: selectedTrip._id,
    siteId: selectedSite.siteId._id,
    rating: reviewRating,
    comment: reviewComment
  }, config);
  
  fetchReviews(); // Refresh reviews list
};
```

---

## 📱 UI Components

```
Trip Archives Page
├─► Trip Archives Section
│   ├─► Archive Card (for each trip)
│   │   ├─► Trip image
│   │   ├─► Trip name
│   │   ├─► Completion date
│   │   ├─► Visited sites list
│   │   │   └─► Review button (per site)
│   │   └─► "Go to Next Site" button
│   │
│   └─► Empty state (no trips yet)
│
├─► Manage Reviews Section
│   ├─► Review Card (for each review)
│   │   ├─► Site image
│   │   ├─► Site name
│   │   ├─► Trip name & date
│   │   ├─► Star rating display
│   │   └─► Comment text
│   │
│   └─► Empty state (no reviews yet)
│
└─► Review Modal (when "Review" clicked)
    ├─► Site name header
    ├─► Interactive star rating
    ├─► Comment textarea
    └─► Submit/Cancel buttons
```

---

## 🧪 Testing Scenarios

### Scenario 1: New Trip
```
1. Navigate to /tourist-itinerary/123
2. Check: Trip archive created
3. Check: currentTripArchiveId set
4. Check: visitedSites = []
```

### Scenario 2: Visit Site
```
1. User location: 14.5935, 120.9734 (Fort Santiago)
2. Check: Distance < 50m
3. Check: isNearby = true
4. Check: Site marked as visited
5. Check: API call to add-site
```

### Scenario 3: Navigate
```
1. Click "Go to Next Site"
2. Check: Nearest site calculated
3. Check: Route updated
4. Check: Directions panel shows new route
```

### Scenario 4: Review
```
1. Go to /trip-archives
2. Click "Review" on visited site
3. Select 5 stars
4. Enter comment
5. Submit
6. Check: Review appears in list
7. Try to review again
8. Check: Error (duplicate prevention)
```

---

This diagram shows the complete flow of the Trip Archives and Reviews features!
