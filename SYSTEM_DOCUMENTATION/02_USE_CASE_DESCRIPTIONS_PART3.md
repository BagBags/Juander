# Intramuros Tourism System - Use Case Descriptions (Part 3)

## ADMIN - USER MANAGEMENT MODULE

### Function: View All Users

**Actor**: Administrator

**Pre-Condition**: The administrator should be logged in and access user management at /AdminManageRole

**Use Case Steps**:
1. Navigate to Admin Role Management page
2. System retrieves all users from database
3. System displays user list with details (name, email, role, status)
4. System shows user count statistics
5. System provides search and filter options
6. Administrator can view user profiles

**Post-Condition**: The administrator should be able to view complete list of all registered users.

---

### Function: Search Users

**Actor**: Administrator

**Pre-Condition**: The administrator should be on user management page

**Use Case Steps**:
1. Enter search term in search box
2. System filters users by name or email
3. System displays matching results in real-time
4. System highlights search matches
5. Administrator can clear search to view all users

**Post-Condition**: The administrator should see filtered list of users matching search criteria.

---

### Function: Change User Role

**Actor**: Administrator

**Pre-Condition**: The administrator should be on user management page

**Use Case Steps**:
1. Select user from list
2. Click "Change Role" button
3. System displays role selection dialog
4. Administrator selects new role (guest/tourist/admin)
5. Click "Confirm" button
6. System validates role change
7. System updates user role in database
8. System logs the action
9. System displays success message

**Post-Condition**: The user's role should be updated successfully and logged in system logs.

---

### Function: Delete User

**Actor**: Administrator

**Pre-Condition**: The administrator should be on user management page

**Use Case Steps**:
1. Select user from list
2. Click "Delete User" button
3. System displays confirmation dialog with warning
4. Administrator confirms deletion
5. System removes user account from database
6. System deletes user's associated data (itineraries, reviews)
7. System logs the action
8. System displays success message
9. System refreshes user list

**Post-Condition**: The user account should be permanently deleted along with associated data.

---

### Function: View User Logs

**Actor**: Administrator

**Pre-Condition**: The administrator should access system logs at /AdminLog

**Use Case Steps**:
1. Navigate to Admin Log page
2. System retrieves all system logs
3. System displays logs with timestamp, admin name, and action
4. System shows user-related activities
5. Administrator can filter logs by date or action type
6. Administrator can search specific user activities

**Post-Condition**: The administrator should be able to view all user activity logs.

---

## ADMIN - SITE MANAGEMENT MODULE

### Function: Manage Sites

**Actor**: Administrator

**Pre-Condition**: The administrator should be logged in and access tour map management at /AdminTourMap

**Use Case Steps**:
1. Navigate to Admin Tour Map page
2. System retrieves all site pins from database
3. System displays sites in list and map view
4. System shows site details (name, status, coordinates)
5. Administrator can view, edit, or delete sites
6. System provides add new site option

**Post-Condition**: The administrator should be able to view and manage all site pins.

---

### Function: Add New Site

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin tour map page

**Use Case Steps**:
1. Click "Add New Site" button
2. System opens site creation form
3. Administrator enters site name (required)
4. Administrator enters site description
5. Administrator sets latitude and longitude coordinates
6. Administrator uploads site media (images/videos)
7. Administrator optionally enables AR
8. Administrator uploads AR content (GLB file or AR link)
9. Administrator sets site status (active/inactive)
10. Click "Create Site" button
11. System validates all inputs
12. System uploads media files to server
13. System saves site to database
14. System logs the action

**Post-Condition**: The new site should be created successfully and appear on the map.

---

### Function: Upload Site Media

**Actor**: Administrator

**Pre-Condition**: The administrator should be creating or editing a site

**Use Case Steps**:
1. Click "Upload Media" button in site form
2. System opens file selector
3. Administrator selects image or video files
4. System validates file types and sizes
5. System uploads files to server
6. System generates URLs for uploaded files
7. System adds media to mediaFiles array
8. System displays media previews
9. Administrator can upload multiple files

**Post-Condition**: The media files should be uploaded and associated with the site.

---

### Function: Set AR Content

**Actor**: Administrator

**Pre-Condition**: The administrator should be creating or editing a site

**Use Case Steps**:
1. Check "Enable AR" checkbox
2. System displays AR content upload options
3. Administrator uploads GLB 3D model file
4. OR Administrator enters AR link URL
5. Administrator optionally uploads facade image
6. System validates AR content
7. System uploads files to server
8. System saves AR URLs to site record

**Post-Condition**: The AR content should be configured for the site.

---

### Function: Edit Site

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin tour map page

**Use Case Steps**:
1. Select site from list or map
2. Click "Edit" button
3. System loads site data into edit form
4. Administrator modifies site information
5. Administrator can update media, coordinates, or AR content
6. Click "Update Site" button
7. System validates changes
8. System updates site in database
9. System logs the action
10. System displays success message

**Post-Condition**: The site should be updated successfully with new information.

---

### Function: Delete Site

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin tour map page

**Use Case Steps**:
1. Select site from list
2. Click "Delete" button
3. System displays confirmation dialog
4. System warns about impact on itineraries
5. Administrator confirms deletion
6. System removes site from database
7. System deletes associated media files
8. System removes site from all itineraries
9. System logs the action

**Post-Condition**: The site should be permanently deleted from the system.

---

### Function: Set Site Status

**Actor**: Administrator

**Pre-Condition**: The administrator should be editing a site

**Use Case Steps**:
1. View site edit form
2. Select site status (active/inactive)
3. If inactive, select reason from dropdown
4. Enter additional details about inactive status
5. Click "Update" button
6. System updates site status
7. System hides inactive sites from public view
8. System logs the status change

**Post-Condition**: The site status should be updated and reflected in public map view.

---

## ADMIN - ITINERARY MANAGEMENT MODULE

### Function: Create Admin Itinerary

**Actor**: Administrator

**Pre-Condition**: The administrator should be logged in and access itinerary management at /AdminItinerary

**Use Case Steps**:
1. Navigate to Admin Itinerary page
2. Click "Create Itinerary" button
3. System opens itinerary creation form
4. Administrator enters itinerary name
5. Administrator enters description
6. Administrator uploads cover image
7. Administrator selects sites from available pins
8. Administrator orders sites in sequence
9. Click "Create" button
10. System validates input
11. System creates itinerary with isAdminCreated = true
12. System saves to database
13. System logs the action

**Post-Condition**: The admin itinerary should be created and visible to all users.

---

### Function: Edit Admin Itinerary

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin itinerary page

**Use Case Steps**:
1. Select itinerary from list
2. Click "Edit" button
3. System loads itinerary data
4. Administrator modifies name, description, image, or sites
5. Administrator can reorder sites
6. Click "Update" button
7. System validates changes
8. System updates itinerary in database
9. System logs the action

**Post-Condition**: The admin itinerary should be updated successfully.

---

### Function: Delete Admin Itinerary

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin itinerary page

**Use Case Steps**:
1. Select itinerary from list
2. Click "Delete" button
3. System displays confirmation dialog
4. Administrator confirms deletion
5. System removes itinerary from database
6. System deletes associated image
7. System logs the action
8. System refreshes itinerary list

**Post-Condition**: The admin itinerary should be permanently deleted.

---

### Function: Archive Admin Itinerary

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin itinerary page

**Use Case Steps**:
1. Select active itinerary from list
2. Click "Archive" button
3. System displays confirmation dialog
4. Administrator confirms archiving
5. System sets isArchived = true
6. System updates itinerary in database
7. System removes from public view
8. System logs the action

**Post-Condition**: The itinerary should be archived and hidden from users but retained in database.

---

### Function: Restore Itinerary

**Actor**: Administrator

**Pre-Condition**: The administrator should be viewing archived itineraries

**Use Case Steps**:
1. Navigate to archived itineraries view
2. Select archived itinerary
3. Click "Restore" button
4. System displays confirmation dialog
5. Administrator confirms restoration
6. System sets isArchived = false
7. System updates itinerary in database
8. System makes itinerary public again
9. System logs the action

**Post-Condition**: The itinerary should be restored and visible to users again.

---

### Function: View Archived Itineraries

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin itinerary page

**Use Case Steps**:
1. Click "View Archived" button
2. System retrieves itineraries where isArchived = true
3. System displays archived itineraries list
4. System shows archive date and details
5. Administrator can restore or permanently delete

**Post-Condition**: The administrator should be able to view all archived itineraries.

---

## ADMIN - PHOTOBOOTH MANAGEMENT MODULE

### Function: Manage Filters

**Actor**: Administrator

**Pre-Condition**: The administrator should be logged in and access photobooth management at /AdminPhotobooth

**Use Case Steps**:
1. Navigate to Admin Photobooth page
2. System retrieves all photobooth filters
3. System displays filters by category
4. System shows filter thumbnails and details
5. Administrator can add, edit, archive, or reorder filters

**Post-Condition**: The administrator should be able to view and manage all photobooth filters.

---

### Function: Upload Filter Asset

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin photobooth page

**Use Case Steps**:
1. Click "Add Filter" button
2. System opens filter creation form
3. Administrator enters filter name
4. Administrator selects category (general/head/eyes/frame/border)
5. Administrator uploads filter image (PNG with transparency)
6. System validates image format
7. System uploads image to server
8. Administrator sets position for ordering
9. Click "Create Filter" button
10. System saves filter to database
11. System logs the action

**Post-Condition**: The new filter should be created and available in photobooth.

---

### Function: Categorize Filter

**Actor**: Administrator

**Pre-Condition**: The administrator should be creating or editing a filter

**Use Case Steps**:
1. View filter form
2. Select category from dropdown
3. Choose from: general, head, eyes, frame, border
4. System assigns category to filter
5. System groups filter with same category in photobooth

**Post-Condition**: The filter should be categorized and displayed in appropriate section.

---

### Function: Archive Filter

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin photobooth page

**Use Case Steps**:
1. Select filter from list
2. Click "Archive" button
3. System displays confirmation dialog
4. Administrator confirms archiving
5. System sets isArchived = true
6. System removes filter from public photobooth
7. System logs the action

**Post-Condition**: The filter should be archived and hidden from users.

---

### Function: Reorder Filters

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin photobooth page

**Use Case Steps**:
1. View filters in category
2. Click and drag filter to new position
3. System updates position values
4. System saves new order to database
5. System reflects new order in photobooth
6. System logs the action

**Post-Condition**: The filters should be reordered as specified by administrator.

---

## ADMIN - CHATBOT MANAGEMENT MODULE

### Function: Manage Bot Entries

**Actor**: Administrator

**Pre-Condition**: The administrator should be logged in and access chatbot management at /AdminManageChatbot

**Use Case Steps**:
1. Navigate to Admin Chatbot page
2. System retrieves all bot entries
3. System displays entries with info, tags, and keywords
4. Administrator can add, edit, or delete entries
5. System shows entry count and statistics

**Post-Condition**: The administrator should be able to view and manage all chatbot knowledge entries.

---

### Function: Add Knowledge Entry

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin chatbot page

**Use Case Steps**:
1. Click "Add Entry" button
2. System opens entry creation form
3. Administrator enters information in English (required)
4. Administrator enters Filipino translation (optional)
5. Administrator selects relevant tags
6. Administrator enters keywords for matching
7. Click "Create Entry" button
8. System validates input
9. System saves entry to database
10. System logs the action

**Post-Condition**: The new knowledge entry should be created and available for chatbot responses.

---

### Function: Edit Bot Response

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin chatbot page

**Use Case Steps**:
1. Select entry from list
2. Click "Edit" button
3. System loads entry data into form
4. Administrator modifies information, tags, or keywords
5. Click "Update" button
6. System validates changes
7. System updates entry in database
8. System logs the action

**Post-Condition**: The bot entry should be updated with new information.

---

### Function: Manage Tags

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin chatbot page

**Use Case Steps**:
1. Click "Manage Tags" button
2. System displays all available tags
3. Administrator can add new tags
4. Administrator can edit tag names
5. Administrator can delete unused tags
6. System updates tag references in bot entries

**Post-Condition**: The tag system should be updated for better chatbot categorization.

---

### Function: Delete Bot Entry

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin chatbot page

**Use Case Steps**:
1. Select entry from list
2. Click "Delete" button
3. System displays confirmation dialog
4. Administrator confirms deletion
5. System removes entry from database
6. System logs the action
7. System refreshes entry list

**Post-Condition**: The bot entry should be permanently deleted.

---

## ADMIN - EMERGENCY MANAGEMENT MODULE

### Function: Manage Emergency Contacts

**Actor**: Administrator

**Pre-Condition**: The administrator should be logged in and access emergency management at /AdminManageEmergency

**Use Case Steps**:
1. Navigate to Admin Emergency page
2. System retrieves all emergency contacts
3. System displays contacts with channels and icons
4. Administrator can add, edit, delete, or reorder contacts

**Post-Condition**: The administrator should be able to manage all emergency contact information.

---

### Function: Add Emergency Contact

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin emergency page

**Use Case Steps**:
1. Click "Add Contact" button
2. System opens contact creation form
3. Administrator enters contact name
4. Administrator uploads icon image
5. Administrator adds contact channels (label and number)
6. Administrator can add multiple channels
7. Administrator sets position for ordering
8. Click "Create Contact" button
9. System validates input
10. System uploads icon to server
11. System saves contact to database
12. System logs the action

**Post-Condition**: The new emergency contact should be created and displayed on emergency page.

---

### Function: Edit Emergency Contact

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin emergency page

**Use Case Steps**:
1. Select contact from list
2. Click "Edit" button
3. System loads contact data
4. Administrator modifies name, icon, or channels
5. Administrator can add or remove channels
6. Click "Update" button
7. System validates changes
8. System updates contact in database
9. System logs the action

**Post-Condition**: The emergency contact should be updated successfully.

---

### Function: Delete Emergency Contact

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin emergency page

**Use Case Steps**:
1. Select contact from list
2. Click "Delete" button
3. System displays confirmation dialog
4. Administrator confirms deletion
5. System removes contact from database
6. System deletes associated icon
7. System logs the action

**Post-Condition**: The emergency contact should be permanently deleted.

---

### Function: Reorder Contacts

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin emergency page

**Use Case Steps**:
1. View emergency contacts list
2. Click and drag contact to new position
3. System updates position values
4. System saves new order to database
5. System reflects new order on public emergency page
6. System logs the action

**Post-Condition**: The emergency contacts should be reordered as specified.

---

## ADMIN - SYSTEM LOGS MODULE

### Function: View System Logs

**Actor**: Administrator

**Pre-Condition**: The administrator should be logged in and access logs at /AdminLog

**Use Case Steps**:
1. Navigate to Admin Log page
2. System retrieves all log entries
3. System displays logs with timestamp, admin name, and action
4. System shows logs in reverse chronological order
5. Administrator can scroll through all logs

**Post-Condition**: The administrator should be able to view complete system activity logs.

---

### Function: Filter Logs

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin log page

**Use Case Steps**:
1. Click "Filter" button
2. System displays filter options (date range, action type, admin)
3. Administrator selects filter criteria
4. Click "Apply Filter" button
5. System filters logs based on criteria
6. System displays filtered results
7. Administrator can clear filters

**Post-Condition**: The administrator should see logs matching the selected filter criteria.

---

### Function: View Admin Activity

**Actor**: Administrator

**Pre-Condition**: The administrator should be on admin log page

**Use Case Steps**:
1. View system logs
2. System displays admin name for each action
3. System shows action type and details
4. Administrator can search specific admin activities
5. System highlights admin-specific actions

**Post-Condition**: The administrator should be able to track specific admin activities.

