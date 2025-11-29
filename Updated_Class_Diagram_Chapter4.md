# Updated Class Diagram for Juander Tourism Management System - Chapter 4

## MongoDB Collections (NoSQL Database Schema)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ firstName: String                                                                       │
│ lastName: String                                                                        │
│ profilePicture: String (S3 URL)                                                        │
│ email: String (unique, required)                                                       │
│ password: String (required for local auth)                                             │
│ role: String (enum: "guest", "tourist", "admin")                                       │
│ isVerified: Boolean                                                                     │
│ otp: String                                                                             │
│ otpExpires: Date                                                                        │
│ birthday: Date                                                                          │
│ gender: String (enum: "Male", "Female", "Other")                                       │
│ country: String                                                                         │
│ language: String                                                                        │
│ authProvider: String (enum: "local", "google")                                         │
│ googleId: String (unique, sparse)                                                      │
│ profileCompleted: Boolean                                                               │
│ hideFortSantiagoModal: Boolean                                                          │
│ hasCompletedTour: Boolean                                                               │
│ tourCompletedAt: Date                                                                   │
│ createdAt: Date                                                                         │
│ updatedAt: Date                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + register()                                                                            │
│ + login()                                                                               │
│ + verifyOTP()                                                                           │
│ + updateProfile()                                                                       │
│ + googleAuth()                                                                          │
│ + resetPassword()                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 1:N (createdBy)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  ITINERARY                                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ name: String (required)                                                                 │
│ description: String                                                                     │
│ imageUrl: String (S3 URL)                                                               │
│ duration: Number (hours)                                                                │
│ sites: [ObjectId] (ref: "Pin")                                                          │
│ createdBy: ObjectId (ref: "User", required)                                             │
│ isAdminCreated: Boolean                                                                 │
│ isArchived: Boolean                                                                     │
│ createdAt: Date                                                                         │
│ updatedAt: Date                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + createItinerary()                                                                     │
│ + updateItinerary()                                                                     │
│ + deleteItinerary()                                                                     │
│ + archiveItinerary()                                                                    │
│ + addSite()                                                                             │
│ + removeSite()                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ N:M (sites)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    PIN                                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ siteName: String (required)                                                             │
│ siteDescription: String (English)                                                       │
│ siteDescriptionTagalog: String                                                          │
│ latitude: Number (required)                                                             │
│ longitude: Number (required)                                                            │
│ mediaUrl: String (S3 URL)                                                               │
│ mediaType: String (enum: "image", "video")                                              │
│ mediaFiles: [{url: String, type: String}]                                              │
│ arEnabled: Boolean                                                                      │
│ arLink: String                                                                          │
│ glbUrl: String (S3 URL for 3D models)                                                   │
│ facadeUrl: String (S3 URL)                                                              │
│ feeType: String (enum: "none", "fort_santiago", "custom_fee")                           │
│ feeAmount: Number                                                                       │
│ feeAmountDiscounted: Number                                                             │
│ category: ObjectId (ref: "Category")                                                    │
│ status: String (enum: "active", "inactive")                                             │
│ inactiveReason: String (enum: various reasons)                                          │
│ inactiveReasonDetails: String                                                           │
│ isArchived: Boolean                                                                     │
│ createdAt: Date                                                                         │
│ updatedAt: Date                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + createPin()                                                                           │
│ + updatePin()                                                                           │
│ + deletePin()                                                                           │
│ + archivePin()                                                                          │
│ + uploadMedia()                                                                         │
│ + uploadGLB()                                                                           │
│ + uploadFacade()                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ N:1 (category)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  CATEGORY                                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ name: String (required, unique)                                                         │
│ createdAt: Date                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + createCategory()                                                                      │
│ + updateCategory()                                                                      │
│ + deleteCategory()                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   REVIEW                                                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ userId: ObjectId (ref: "User", required)                                                │
│ itineraryId: ObjectId (ref: "Itinerary", required)                                      │
│ siteId: ObjectId (ref: "Pin", required)                                                 │
│ rating: Number (1-5, required)                                                          │
│ reviewText: String                                                                      │
│ photos: [String] (S3 URLs)                                                              │
│ createdAt: Date                                                                         │
│ updatedAt: Date                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + createReview()                                                                        │
│ + updateReview()                                                                        │
│ + deleteReview()                                                                        │
│ + uploadPhotos()                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                VISITED_SITE                                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ userId: ObjectId (ref: "User", required)                                                │
│ itineraryId: ObjectId (ref: "Itinerary", required)                                      │
│ siteId: ObjectId (ref: "Pin", required)                                                 │
│ visitedAt: Date                                                                         │
│ createdAt: Date                                                                         │
│ updatedAt: Date                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + markAsVisited()                                                                       │
│ + unmarkVisited()                                                                       │
│ + getVisitedSites()                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                             ITINERARY_PROGRESS                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ userId: ObjectId (ref: "User", required)                                                │
│ itineraryId: ObjectId (ref: "Itinerary", required)                                      │
│ currentPinIndex: Number                                                                 │
│ visitedSites: [ObjectId] (ref: "Site")                                                  │
│ skippedSites: [ObjectId] (ref: "Site")                                                  │
│ optimizedOrder: [ObjectId] (ref: "Site")                                                │
│ lastPosition: {latitude: Number, longitude: Number}                                     │
│ lastUpdated: Date                                                                       │
│ createdAt: Date                                                                         │
│ updatedAt: Date                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + updateProgress()                                                                      │
│ + optimizeRoute()                                                                       │
│ + skipSite()                                                                            │
│ + resetProgress()                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                            EMERGENCY_CONTACT                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ name: String (required)                                                                 │
│ contactChannels: [{label: String, number: String}]                                     │
│ position: Number                                                                        │
│ icon: String (S3 URL)                                                                   │
│ isArchived: Boolean                                                                     │
│ createdAt: Date                                                                         │
│ updatedAt: Date                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + createContact()                                                                       │
│ + updateContact()                                                                       │
│ + deleteContact()                                                                       │
│ + archiveContact()                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           PHOTOBOOTH_FILTER                                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ name: String (required)                                                                 │
│ image: String (S3 URL, required)                                                        │
│ category: String (enum: "general", "head", "eyes", "frame", "border")                   │
│ position: Number                                                                        │
│ isArchived: Boolean                                                                     │
│ createdAt: Date                                                                         │
│ updatedAt: Date                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + createFilter()                                                                        │
│ + updateFilter()                                                                        │
│ + deleteFilter()                                                                        │
│ + archiveFilter()                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    LOG                                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ adminName: String (required)                                                            │
│ action: String (required)                                                               │
│ role: String (enum: "admin", "tourist")                                                 │
│ targetType: String (enum: "review", "itinerary", "pin", "user", "photobooth", "other") │
│ targetId: ObjectId                                                                      │
│ details: {                                                                              │
│   userName: String,                                                                     │
│   userEmail: String,                                                                    │
│   siteName: String,                                                                     │
│   itineraryName: String,                                                                │
│   rating: Number,                                                                       │
│   reviewText: String,                                                                   │
│   photos: [String],                                                                     │
│   previousData: Mixed                                                                   │
│ }                                                                                       │
│ createdAt: Date                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + createLog()                                                                           │
│ + getLogsByAdmin()                                                                      │
│ + getLogsByTarget()                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 BOT_ENTRY                                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ info_en: String (required)                                                              │
│ info_fil: String                                                                        │
│ tags: [ObjectId] (ref: "Tag")                                                           │
│ keywords: [String]                                                                      │
│ isArchived: Boolean                                                                     │
│ createdAt: Date                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + createEntry()                                                                         │
│ + updateEntry()                                                                         │
│ + deleteEntry()                                                                         │
│ + searchEntries()                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ N:M (tags)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    TAG                                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ name: String (required, unique)                                                         │
│ createdAt: Date                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + createTag()                                                                           │
│ + updateTag()                                                                           │
│ + deleteTag()                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               PENDING_USER                                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ firstName: String                                                                       │
│ lastName: String                                                                        │
│ email: String                                                                           │
│ password: String (hashed)                                                               │
│ otp: String                                                                             │
│ otpExpires: Date (TTL index)                                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + createPendingUser()                                                                   │
│ + verifyAndPromote()                                                                    │
│ + cleanupExpired()                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   MASK                                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ geometry: {                                                                             │
│   type: String (enum: "Polygon"),                                                       │
│   coordinates: [[[Number]]] (GeoJSON format)                                           │
│ }                                                                                       │
│ createdAt: Date                                                                         │
│ updatedAt: Date                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + createMask()                                                                          │
│ + updateMask()                                                                          │
│ + deleteMask()                                                                          │
│ + checkBounds()                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  FILTER                                                 │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                                                           │
│ label: String (required)                                                                │
│ img_path: String (required)                                                             │
│ category: String (required)                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ + createFilter()                                                                        │
│ + updateFilter()                                                                        │
│ + deleteFilter()                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Key Relationships Summary:

1. **User → Itinerary**: One-to-Many (createdBy)
2. **User → Review**: One-to-Many (userId)
3. **User → VisitedSite**: One-to-Many (userId)
4. **User → ItineraryProgress**: One-to-Many (userId)
5. **Itinerary → Pin**: Many-to-Many (sites array)
6. **Itinerary → Review**: One-to-Many (itineraryId)
7. **Itinerary → VisitedSite**: One-to-Many (itineraryId)
8. **Itinerary → ItineraryProgress**: One-to-Many (itineraryId)
9. **Pin → Review**: One-to-Many (siteId)
10. **Pin → VisitedSite**: One-to-Many (siteId)
11. **Pin → Category**: Many-to-One (category)
12. **BotEntry → Tag**: Many-to-Many (tags array)

## Key Features Added Since Chapter 3:

- **AWS S3 Integration**: All file uploads (images, videos, 3D models) stored in S3
- **Enhanced Authentication**: Google OAuth, OTP verification, pending user system
- **Advanced Itinerary Management**: Progress tracking, site optimization, visited sites
- **Comprehensive Review System**: Multi-photo reviews, ratings, feedback
- **Photobooth System**: Filter management with categorization
- **Emergency Contacts**: Structured contact information with channels
- **Audit Logging**: Complete admin action tracking
- **Chatbot Integration**: Knowledge base with tags and multilingual support
- **Geographic Features**: Mask polygons for boundary checking
- **Fee Management**: Multiple fee types including discounted rates
- **Status Management**: Archive/active states across all entities
