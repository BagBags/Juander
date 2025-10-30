# Intramuros Tourism System - Use Case Descriptions (Part 1)

## Table of Contents
- Part 1: Authentication & Profile Management, Itinerary Management
- Part 2: Map & Navigation, Review System, Photobooth
- Part 3: Admin Functions

---

## AUTHENTICATION MODULE

### Function: Register Account

**Actor**: Tourist (New User)

**Pre-Condition**: The user should access the Intramuros Tourism System webpage at http://localhost:5173/signup

**Use Case Steps**:
1. Enter first name
2. Enter last name
3. Enter email address
4. Enter password (minimum 6 characters)
5. Click "Register" button
6. System validates input and checks for duplicate email
7. System creates user account with role "tourist"
8. System generates 6-digit OTP
9. System sends verification email
10. User is redirected to OTP verification page

**Post-Condition**: The user account should be created successfully and verification email sent. User should be redirected to OTP verification page to activate account.

---

### Function: Login with Email

**Actor**: Tourist, Administrator

**Pre-Condition**: The user should have a registered account and access the login page at http://localhost:5173/login

**Use Case Steps**:
1. Enter registered email
2. Enter password
3. Click "Login" button
4. System validates credentials
5. System checks if email is verified
6. System generates JWT token
7. System checks user role
8. System redirects based on role (Admin → /AdminHome, Tourist → /Homepage)

**Post-Condition**: The user should be able to successfully access their dashboard if credentials are correct and email is verified. Else, user should be redirected to the login page or OTP verification.

---

### Function: Login with Google OAuth

**Actor**: Guest, Tourist

**Pre-Condition**: The user should access the login page at http://localhost:5173/login

**Use Case Steps**:
1. Click "Sign in with Google" button
2. System redirects to Google OAuth consent screen
3. User authorizes application access
4. Google returns user profile data
5. System checks if Google ID exists in database
6. If new user, system creates account with Google profile
7. System generates JWT token
8. System redirects to complete profile page if profile incomplete

**Post-Condition**: The user should be authenticated via Google OAuth and redirected to complete profile page or homepage based on profile completion status.

---

### Function: Verify Email OTP

**Actor**: Tourist

**Pre-Condition**: The user should have registered and received OTP via email

**Use Case Steps**:
1. User receives 6-digit OTP via email
2. Enter OTP code in verification screen
3. Click "Verify" button
4. System validates OTP
5. System checks OTP expiration (10 minutes)
6. System marks email as verified
7. System clears OTP from database
8. System displays success message

**Post-Condition**: The email should be verified successfully and user account activated. User should be able to login and access full features.

---

### Function: Reset Password

**Actor**: Tourist, Administrator

**Pre-Condition**: The user should access the forgot password page and have a registered email

**Use Case Steps**:
1. Click "Forgot Password" link on login page
2. Enter registered email address
3. Click "Send OTP" button
4. System generates 6-digit OTP
5. System sends OTP to email
6. User enters OTP code
7. User enters new password
8. User confirms new password
9. Click "Reset Password" button
10. System validates OTP and updates password

**Post-Condition**: The password should be reset successfully. User should be able to login with new password.

---

### Function: Complete Profile

**Actor**: Tourist

**Pre-Condition**: The user should be logged in with incomplete profile

**Use Case Steps**:
1. System detects incomplete profile after login
2. System redirects to complete profile page at /CompleteProfile
3. User enters birthday
4. User selects gender (Male/Female/Other)
5. User selects country
6. User selects preferred language
7. User optionally uploads profile picture
8. Click "Complete Profile" button
9. System validates all required fields
10. System updates user profile
11. System marks profileCompleted as true

**Post-Condition**: The profile should be completed successfully. User should be redirected to homepage and able to access all features.

---

## PROFILE MANAGEMENT MODULE

### Function: View Profile

**Actor**: Tourist, Administrator

**Pre-Condition**: The user should be logged in and access profile page at /Profile or /AdminProfile

**Use Case Steps**:
1. Click profile icon or menu
2. Navigate to profile page
3. System retrieves user data from database
4. System displays profile information (name, email, birthday, gender, country, language)
5. System displays profile picture if available

**Post-Condition**: The user should be able to view their complete profile information.

---

### Function: Edit Profile Information

**Actor**: Tourist, Administrator

**Pre-Condition**: The user should be logged in and on profile page

**Use Case Steps**:
1. Click "Edit" button on specific profile field
2. System navigates to edit page (Account/Birthday/Gender/Country/Language)
3. User modifies information
4. Click "Save" or "Update" button
5. System validates input
6. System updates user profile in database
7. System displays success message
8. System redirects back to profile page

**Post-Condition**: The profile information should be updated successfully in the database.

---

### Function: Update Profile Picture

**Actor**: Tourist, Administrator

**Pre-Condition**: The user should be logged in and on account settings page

**Use Case Steps**:
1. Navigate to Account settings
2. Click on profile picture or "Upload Photo" button
3. Select image file from device
4. System validates file type and size
5. System uploads image to server
6. System saves image URL to user profile
7. System displays updated profile picture

**Post-Condition**: The profile picture should be uploaded and displayed successfully.

---

### Function: Change Password

**Actor**: Tourist, Administrator

**Pre-Condition**: The user should be logged in and on account settings page

**Use Case Steps**:
1. Navigate to Account settings
2. Click "Change Password" button
3. Enter current password
4. Enter new password (minimum 6 characters)
5. Confirm new password
6. Click "Update Password" button
7. System validates current password
8. System validates new password strength
9. System updates password in database
10. System displays success message

**Post-Condition**: The password should be changed successfully. User can login with new password.

---

### Function: Change Language

**Actor**: Guest, Tourist, Administrator

**Pre-Condition**: The user should access the system

**Use Case Steps**:
1. Click language selector (typically in profile or settings)
2. Select preferred language (English/Filipino)
3. System updates language preference
4. System saves preference to localStorage
5. System updates UI text to selected language
6. If logged in, system saves preference to user profile

**Post-Condition**: The system interface should display in the selected language.

---

## ITINERARY MANAGEMENT MODULE

### Function: Browse Itineraries

**Actor**: Guest, Tourist

**Pre-Condition**: The user should access the homepage or itinerary page

**Use Case Steps**:
1. Navigate to homepage or itinerary section
2. System retrieves all active itineraries
3. System displays admin-created itineraries
4. If tourist logged in, system also displays user's custom itineraries
5. System shows itinerary image, name, description, and site count
6. User can scroll through available itineraries

**Post-Condition**: The user should be able to view all available itineraries.

---

### Function: View Itinerary Details

**Actor**: Guest, Tourist

**Pre-Condition**: The user should be on itinerary list page

**Use Case Steps**:
1. Click on specific itinerary card
2. System retrieves itinerary details with populated sites
3. System displays itinerary name, description, and image
4. System displays list of sites in itinerary
5. System shows site names, descriptions, and images
6. System displays "Start Tour" button if tourist logged in

**Post-Condition**: The user should be able to view complete itinerary details including all sites.

---

### Function: Create Custom Itinerary

**Actor**: Tourist

**Pre-Condition**: The tourist should be logged in and access create itinerary page at /CreateItinerary

**Use Case Steps**:
1. Click "Create Itinerary" button
2. Navigate to create itinerary page
3. Enter itinerary name
4. Enter itinerary description
5. Click "Upload Image" button
6. Select and upload itinerary cover image
7. System uploads image and returns URL
8. Select sites from available pins list
9. Reorder sites if needed
10. Click "Create Itinerary" button
11. System validates input (name required, at least 1 site)
12. System creates itinerary with createdBy as current user
13. System saves itinerary to database

**Post-Condition**: The custom itinerary should be created successfully and appear in user's itinerary list.

---

### Function: Edit Itinerary

**Actor**: Tourist

**Pre-Condition**: The tourist should be logged in and own the itinerary

**Use Case Steps**:
1. Navigate to user's itineraries
2. Click "Edit" button on specific itinerary
3. System loads itinerary data into edit form
4. User modifies name, description, image, or sites
5. Click "Update Itinerary" button
6. System validates changes
7. System updates itinerary in database
8. System displays success message

**Post-Condition**: The itinerary should be updated successfully with new information.

---

### Function: Delete Itinerary

**Actor**: Tourist

**Pre-Condition**: The tourist should be logged in and own the itinerary

**Use Case Steps**:
1. Navigate to user's itineraries
2. Click "Delete" button on specific itinerary
3. System displays confirmation dialog
4. User confirms deletion
5. System removes itinerary from database
6. System displays success message
7. System refreshes itinerary list

**Post-Condition**: The itinerary should be permanently deleted from the database.

---

### Function: Start Tour

**Actor**: Tourist

**Pre-Condition**: The tourist should be logged in and viewing itinerary details

**Use Case Steps**:
1. Click "Start Tour" button on itinerary details page
2. System navigates to itinerary map at /TouristItineraryMap/:itineraryId
3. System loads 3D map with itinerary sites
4. System displays first site as current destination
5. System shows navigation controls
6. System enables "Mark as Visited" functionality

**Post-Condition**: The tour should start and user should be on map view with first site highlighted.

---

### Function: Navigate to Next Site

**Actor**: Tourist

**Pre-Condition**: The tourist should be on active tour with current site marked as visited

**Use Case Steps**:
1. User marks current site as visited
2. System saves visited site to database
3. System automatically moves to next site in itinerary
4. System updates map to highlight next site
5. System displays next site information
6. If last site, system displays tour completion message

**Post-Condition**: The system should navigate to next site in sequence or complete tour if last site.

---

### Function: Mark Site as Visited

**Actor**: Tourist

**Pre-Condition**: The tourist should be on active tour at a site location

**Use Case Steps**:
1. User arrives at site location
2. Click "Mark as Visited" button
3. System validates user location (optional)
4. System creates visited site record with userId, itineraryId, siteId
5. System saves to database with timestamp
6. System displays success message
7. System enables "Write Review" option
8. System navigates to next site

**Post-Condition**: The site should be marked as visited and saved to trip archives. User should be able to write review.

