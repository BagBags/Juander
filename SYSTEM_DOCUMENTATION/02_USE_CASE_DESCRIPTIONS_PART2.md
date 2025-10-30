# Intramuros Tourism System - Use Case Descriptions (Part 2)

## MAP & NAVIGATION MODULE

### Function: View 3D Map

**Actor**: Guest, Tourist

**Pre-Condition**: The user should access the map page at /TourMap

**Use Case Steps**:
1. Navigate to Tour Map page
2. System loads Mapbox GL JS library
3. System initializes 3D map centered on Intramuros
4. System loads all active site pins from database
5. System displays pins on map with custom markers
6. System enables map controls (zoom, rotate, tilt)
7. User can interact with map (pan, zoom, rotate)

**Post-Condition**: The user should be able to view interactive 3D map with all site locations.

---

### Function: View Site Pins

**Actor**: Guest, Tourist

**Pre-Condition**: The user should be on the 3D map page

**Use Case Steps**:
1. System retrieves all pins with status "active"
2. System displays pins on map at specified coordinates
3. System shows pin markers with site names
4. User can click on any pin
5. System displays site popup with basic information

**Post-Condition**: The user should be able to see all active site pins on the map.

---

### Function: View Site Details

**Actor**: Guest, Tourist

**Pre-Condition**: The user should click on a site pin on the map

**Use Case Steps**:
1. Click on site pin marker
2. System retrieves site details from database
3. System displays popup with site information
4. System shows site name, description
5. System displays site media (images/videos)
6. System shows AR availability if enabled
7. User can click "View More" for full details

**Post-Condition**: The user should be able to view complete site information including media and AR content availability.

---

### Function: Get Directions

**Actor**: Tourist

**Pre-Condition**: The tourist should be logged in and on map page

**Use Case Steps**:
1. Click on site pin
2. Click "Get Directions" button
3. System requests user's current location
4. User grants location permission
5. System calculates route from current location to site
6. System displays route on map
7. System shows distance and estimated time
8. System provides turn-by-turn directions

**Post-Condition**: The user should receive navigation directions from current location to selected site.

---

### Function: View AR Content

**Actor**: Tourist

**Pre-Condition**: The tourist should be at a site with AR enabled and have compatible device

**Use Case Steps**:
1. Navigate to site with arEnabled = true
2. Click "View in AR" button
3. System checks device AR compatibility
4. System loads AR content (glbUrl or arLink)
5. System opens AR viewer
6. User can view 3D model in augmented reality
7. User can interact with AR model (rotate, scale)

**Post-Condition**: The user should be able to view and interact with AR content at the site.

---

### Function: Filter Sites

**Actor**: Tourist

**Pre-Condition**: The tourist should be on the map page

**Use Case Steps**:
1. Click "Filter" button on map
2. System displays filter options (Active/Inactive)
3. User selects filter criteria
4. Click "Apply Filter" button
5. System filters pins based on status
6. System updates map to show only filtered pins
7. System displays count of filtered sites

**Post-Condition**: The map should display only sites matching the selected filter criteria.

---

## REVIEW SYSTEM MODULE

### Function: View Trip Archives

**Actor**: Tourist

**Pre-Condition**: The tourist should be logged in and access trip archives at /TripArchive

**Use Case Steps**:
1. Navigate to Trip Archives page
2. System retrieves all visited sites for current user
3. System populates site details and itinerary information
4. System displays visited sites with images and dates
5. System shows "Write Review" button for sites without reviews
6. System displays existing reviews with ratings and photos
7. User can scroll through all visited sites

**Post-Condition**: The user should be able to view all sites they have visited with visit dates and review status.

---

### Function: Write Review

**Actor**: Tourist

**Pre-Condition**: The tourist should have visited a site and be on trip archives page

**Use Case Steps**:
1. Click "Write Review" button on visited site
2. System opens review modal
3. User selects star rating (1-5 stars)
4. User enters review text (optional)
5. User optionally uploads photos (max 5)
6. System validates photos (type and size)
7. Click "Submit Review" button
8. System checks for profanity in review text
9. System creates review with userId, siteId, itineraryId
10. System uploads photos to server
11. System saves review to database

**Post-Condition**: The review should be submitted successfully and displayed in trip archives and site details.

---

### Function: Rate Site

**Actor**: Tourist

**Pre-Condition**: The tourist should be writing or editing a review

**Use Case Steps**:
1. View star rating interface in review modal
2. Hover over stars to preview rating
3. Click on star to select rating (1-5)
4. System highlights selected stars
5. Rating is included in review submission

**Post-Condition**: The site should be rated with selected star value.

---

### Function: Upload Review Photos

**Actor**: Tourist

**Pre-Condition**: The tourist should be writing or editing a review

**Use Case Steps**:
1. Click "Upload Photos" button in review modal
2. System opens file selector
3. User selects image files (max 5)
4. System validates file types (image formats only)
5. System creates preview thumbnails
6. User can remove photos before submission
7. Photos are uploaded with review submission

**Post-Condition**: The photos should be uploaded and attached to the review.

---

### Function: Edit Review

**Actor**: Tourist

**Pre-Condition**: The tourist should have an existing review for a site

**Use Case Steps**:
1. Navigate to Trip Archives page
2. Click "Edit Review" button on reviewed site
3. System loads existing review data into modal
4. System displays current rating and review text
5. System shows existing photos
6. User modifies rating, text, or photos
7. Click "Submit Review" button
8. System validates changes
9. System updates review in database

**Post-Condition**: The review should be updated successfully with new information.

---

### Function: Delete Review

**Actor**: Tourist

**Pre-Condition**: The tourist should have an existing review for a site

**Use Case Steps**:
1. Navigate to Trip Archives page
2. Click "Delete Review" button on reviewed site
3. System displays confirmation dialog
4. User confirms deletion
5. System removes review from database
6. System deletes associated photos from server
7. System displays success message
8. System updates trip archives view

**Post-Condition**: The review should be permanently deleted from the database.

---

## PHOTOBOOTH MODULE

### Function: Access Photobooth

**Actor**: Guest, Tourist

**Pre-Condition**: The user should access the photobooth page at /Photobooth

**Use Case Steps**:
1. Navigate to Photobooth page
2. System requests camera permission
3. User grants camera access
4. System initializes camera feed
5. System loads available filters from database
6. System displays camera preview
7. System shows filter selection panel

**Post-Condition**: The user should be able to access camera and see live preview.

---

### Function: Capture Photo

**Actor**: Guest, Tourist

**Pre-Condition**: The user should be on photobooth page with camera active

**Use Case Steps**:
1. User positions camera
2. User optionally selects filter or border
3. Click "Capture" button
4. System captures current camera frame
5. System applies selected filter/border
6. System displays captured photo preview
7. System shows download and share options

**Post-Condition**: The photo should be captured and ready for download or sharing.

---

### Function: Apply Filter

**Actor**: Guest, Tourist

**Pre-Condition**: The user should be on photobooth page with camera active

**Use Case Steps**:
1. Click "Filters" tab
2. System displays available filters by category
3. User scrolls through filter options
4. Click on desired filter
5. System applies filter to live camera feed
6. User can see real-time filter effect
7. User can switch filters or remove filter

**Post-Condition**: The selected filter should be applied to camera feed and captured photos.

---

### Function: Apply Border

**Actor**: Guest, Tourist

**Pre-Condition**: The user should be on photobooth page with camera active

**Use Case Steps**:
1. Click "Borders" tab
2. System displays available border assets
3. User scrolls through border options
4. Click on desired border
5. System overlays border on camera feed
6. User can see border in real-time
7. User can switch borders or remove border

**Post-Condition**: The selected border should be applied to camera feed and captured photos.

---

### Function: Download Photo

**Actor**: Guest, Tourist

**Pre-Condition**: The user should have captured a photo

**Use Case Steps**:
1. View captured photo preview
2. Click "Download" button
3. System generates image file with applied effects
4. System triggers browser download
5. Image is saved to device downloads folder
6. System displays success message

**Post-Condition**: The photo should be downloaded to user's device with all applied effects.

---

### Function: Share Photo

**Actor**: Guest, Tourist

**Pre-Condition**: The user should have captured a photo and device supports Web Share API

**Use Case Steps**:
1. View captured photo preview
2. Click "Share" button
3. System checks Web Share API availability
4. System opens native share dialog
5. User selects sharing method (social media, messaging, etc.)
6. User completes sharing through selected app

**Post-Condition**: The photo should be shared through user's selected platform.

---

## AI CHATBOT MODULE

### Function: Ask Question

**Actor**: Guest, Tourist

**Pre-Condition**: The user should access the chatbot page at /Chatbot

**Use Case Steps**:
1. Navigate to Chatbot page
2. System displays chat interface
3. System shows welcome message
4. User types question in input field
5. Click "Send" button or press Enter
6. System sends question to backend
7. System searches bot entries database
8. System matches question with keywords/tags
9. System retrieves relevant response
10. System displays response in chat

**Post-Condition**: The user should receive relevant answer to their question.

---

### Function: Get Tourist Information

**Actor**: Guest, Tourist

**Pre-Condition**: The user should be on chatbot page

**Use Case Steps**:
1. User asks about tourist information (sites, history, tips)
2. System processes natural language query
3. System searches bot entries with matching tags
4. System retrieves information in user's language
5. System displays formatted response
6. System provides related suggestions

**Post-Condition**: The user should receive comprehensive tourist information.

---

### Function: Get Directions Help

**Actor**: Guest, Tourist

**Pre-Condition**: The user should be on chatbot page

**Use Case Steps**:
1. User asks for directions or location help
2. System identifies direction-related keywords
3. System retrieves relevant navigation information
4. System provides directions or suggests using map
5. System can provide link to map page

**Post-Condition**: The user should receive directions or guidance to find locations.

---

### Function: Switch Language

**Actor**: Guest, Tourist

**Pre-Condition**: The user should be on chatbot page

**Use Case Steps**:
1. Click language toggle button
2. Select preferred language (English/Filipino)
3. System updates chat interface language
4. System retrieves bot responses in selected language
5. System saves language preference
6. All subsequent responses in selected language

**Post-Condition**: The chatbot should communicate in user's preferred language.

---

## EMERGENCY SERVICES MODULE

### Function: View Emergency Contacts

**Actor**: Guest, Tourist

**Pre-Condition**: The user should access the emergency page at /Emergency

**Use Case Steps**:
1. Navigate to Emergency page
2. System retrieves all emergency contacts from database
3. System displays contacts ordered by position
4. System shows contact name, icon, and channels
5. System displays multiple contact channels per contact
6. User can scroll through all emergency contacts

**Post-Condition**: The user should be able to view all emergency contact information.

---

### Function: Call Emergency Number

**Actor**: Guest, Tourist

**Pre-Condition**: The user should be on emergency page

**Use Case Steps**:
1. View emergency contact list
2. Click on phone number link
3. System initiates phone call (on mobile devices)
4. Device's phone app opens with number pre-filled
5. User can proceed with call

**Post-Condition**: The user should be able to quickly call emergency services.

