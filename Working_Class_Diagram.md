# Working Juander Class Diagram (Mermaid)

```mermaid
classDiagram
    class User {
        -ObjectId id
        -String firstName
        -String lastName
        -String email
        -String role
        -Boolean isVerified
        +register()
        +login()
        +updateProfile()
    }

    class Itinerary {
        -ObjectId id
        -String name
        -String description
        -Number duration
        -Boolean isArchived
        +createItinerary()
        +updateItinerary()
        +addSite()
    }

    class Pin {
        -ObjectId id
        -String siteName
        -String siteDescription
        -Number latitude
        -Number longitude
        -String mediaUrl
        -Boolean arEnabled
        +createPin()
        +updatePin()
        +uploadMedia()
    }

    class Review {
        -ObjectId id
        -Number rating
        -String reviewText
        -Date createdAt
        +createReview()
        +updateReview()
    }

    class Category {
        -ObjectId id
        -String name
        +createCategory()
    }

    class VisitedSite {
        -ObjectId id
        -Date visitedAt
        +markAsVisited()
    }

    class ItineraryProgress {
        -ObjectId id
        -Number currentPinIndex
        +updateProgress()
    }

    class EmergencyContact {
        -ObjectId id
        -String name
        +createContact()
    }

    class PhotoboothFilter {
        -ObjectId id
        -String name
        -String image
        +createFilter()
    }

    class Log {
        -ObjectId id
        -String adminName
        -String action
        +createLog()
    }

    class BotEntry {
        -ObjectId id
        -String info_en
        -String info_fil
        +createEntry()
    }

    class Tag {
        -ObjectId id
        -String name
        +createTag()
    }

    class PendingUser {
        -ObjectId id
        -String firstName
        -String email
        +createPendingUser()
    }

    class Mask {
        -ObjectId id
        -Object geometry
        +createMask()
    }

    User ||--o{ Itinerary
    User ||--o{ Review
    User ||--o{ VisitedSite
    User ||--o{ ItineraryProgress
    
    Itinerary }o--o{ Pin
    Itinerary ||--o{ Review
    Itinerary ||--o{ VisitedSite
    Itinerary ||--o{ ItineraryProgress
    
    Pin ||--o{ Review
    Pin ||--o{ VisitedSite
    Pin }o--|| Category
    
    BotEntry }o--o{ Tag
```
