# Photobooth Filter Archive System

## 🎯 Overview
Implemented a comprehensive archive system for photobooth filters that prevents accidental permanent deletion. Filters are now archived first, and can be restored or permanently deleted from the archive.

## ✅ Implementation Complete

### **Backend Changes**

#### 1. **Model Update** (`photoboothFilterModel.js`)
- ✅ Added `isArchived` field (Boolean, default: false)
- ✅ Added `border` to category enum
- ✅ Tracks filter status (active vs archived)

```javascript
isArchived: {
  type: Boolean,
  default: false, // false = active, true = archived
}
```

#### 2. **Controller Updates** (`photoboothFilterController.js`)
- ✅ **getFilters()** - Now returns only active filters (`isArchived: false`)
- ✅ **getArchivedFilters()** - New endpoint to fetch archived filters
- ✅ **archiveFilter()** - Soft delete (sets `isArchived: true`)
- ✅ **restoreFilter()** - Restore from archive (sets `isArchived: false`)
- ✅ **deleteFilter()** - Permanent delete (removes from database + deletes file)

#### 3. **Routes Update** (`photoboothFilterRoute.js`)
```javascript
GET    /api/photobooth/filters          // Active filters only
GET    /api/photobooth/filters/archived // Archived filters (admin only)
PUT    /api/photobooth/filters/:id/archive  // Archive a filter
PUT    /api/photobooth/filters/:id/restore  // Restore a filter
DELETE /api/photobooth/filters/:id     // Permanent delete
```

### **Frontend Changes**

#### 1. **Admin Panel UI** (`adminPhotoboothMain.jsx`)

**New Features:**
- ✅ **Tab System** - Switch between "Active Filters" and "Archived" tabs
- ✅ **Archive Button** - Replaces immediate delete on active filters
- ✅ **Restore Button** - Bring archived filters back to active
- ✅ **Permanent Delete** - Only available in archived tab with warning
- ✅ **Visual Distinction** - Archived filters shown with reduced opacity
- ✅ **Counter Badges** - Shows count of active and archived filters

**Button Actions:**

| Tab | Button 1 | Button 2 |
|-----|----------|----------|
| **Active Filters** | Edit (Yellow) | Archive (Orange) |
| **Archived** | Restore (Green) | Delete (Red) |

## 🎨 User Experience Flow

### **Archiving a Filter**
```
1. Admin clicks "Archive" button on active filter
2. Confirmation dialog: "Are you sure you want to archive this filter?"
3. Filter moves to "Archived" tab
4. Filter no longer visible to users in photobooth
5. Log entry: "Archived photobooth filter: [name]"
```

### **Restoring a Filter**
```
1. Admin switches to "Archived" tab
2. Admin clicks "Restore" button
3. Confirmation dialog: "Are you sure you want to restore this filter?"
4. Filter moves back to "Active Filters" tab
5. Filter becomes visible to users again
6. Log entry: "Restored photobooth filter: [name]"
```

### **Permanent Delete**
```
1. Admin switches to "Archived" tab
2. Admin clicks "Delete" button (red)
3. ⚠️ Warning dialog: "PERMANENT DELETE: This action cannot be undone! Are you sure?"
4. Filter permanently removed from database
5. Physical image file deleted from server
6. Log entry: "Permanently deleted photobooth filter: [name]"
```

## 📊 Database Schema

### **PhotoboothFilter Model**
```javascript
{
  name: String,           // Filter name
  image: String,          // URL or path to image
  category: String,       // general, head, eyes, frame, border
  position: Number,       // For ordering
  isArchived: Boolean,    // Archive status
  createdAt: Date,        // Auto-generated
  updatedAt: Date         // Auto-generated
}
```

## 🔐 Security & Permissions

- ✅ All archive/restore/delete operations require admin authentication
- ✅ `verifyAdmin` middleware protects all modification endpoints
- ✅ Regular users can only fetch active filters (no auth required)
- ✅ Archived filters endpoint requires admin token

## 🎯 Benefits

### **1. Safety**
- Prevents accidental permanent deletion
- Two-step process for permanent removal
- Archived filters can be recovered

### **2. Organization**
- Clean separation between active and archived filters
- Easy to manage seasonal or temporary filters
- Archive old filters without losing them

### **3. Audit Trail**
- All actions logged (archive, restore, delete)
- Track who archived/restored/deleted filters
- Maintain history of filter management

### **4. User Experience**
- Users only see active filters in photobooth
- No confusion from inactive/old filters
- Admins can quickly restore popular filters

## 📝 API Examples

### **Archive a Filter**
```http
PUT /api/photobooth/filters/:id/archive
Authorization: Bearer <admin_token>

Response:
{
  "message": "Filter archived successfully",
  "filter": { ... }
}
```

### **Restore a Filter**
```http
PUT /api/photobooth/filters/:id/restore
Authorization: Bearer <admin_token>

Response:
{
  "message": "Filter restored successfully",
  "filter": { ... }
}
```

### **Get Archived Filters**
```http
GET /api/photobooth/filters/archived
Authorization: Bearer <admin_token>

Response:
[
  {
    "_id": "...",
    "name": "Old Filter",
    "isArchived": true,
    "updatedAt": "2025-10-22T..."
  }
]
```

### **Permanent Delete**
```http
DELETE /api/photobooth/filters/:id
Authorization: Bearer <admin_token>

Response:
{
  "message": "Filter permanently deleted successfully"
}
```

## 🎨 UI Components

### **Tab Buttons**
```jsx
<button className={activeTab === "active" ? "bg-red-500 text-white" : "bg-gray-100"}>
  Active Filters ({filters.length})
</button>
<button className={activeTab === "archived" ? "bg-red-500 text-white" : "bg-gray-100"}>
  Archived ({archivedFilters.length})
</button>
```

### **Archive Button (Active Tab)**
```jsx
<button className="bg-orange-500 hover:bg-orange-600">
  <Archive size={16} /> Archive
</button>
```

### **Restore Button (Archived Tab)**
```jsx
<button className="bg-green-500 hover:bg-green-600">
  <RotateCcw size={16} /> Restore
</button>
```

### **Permanent Delete Button (Archived Tab)**
```jsx
<button className="bg-red-600 hover:bg-red-700">
  <Trash2 size={16} /> Delete
</button>
```

## 🔄 Migration Notes

### **For Existing Filters**
All existing filters in the database will automatically have `isArchived: false` (default value), so they will appear as active filters.

### **No Data Loss**
- Archived filters remain in the database
- Image files are preserved until permanent delete
- All metadata retained during archive/restore

## 🧪 Testing Checklist

- [ ] Archive an active filter
- [ ] Verify filter disappears from user photobooth
- [ ] Verify filter appears in archived tab
- [ ] Restore an archived filter
- [ ] Verify filter reappears in user photobooth
- [ ] Verify filter moves back to active tab
- [ ] Permanently delete an archived filter
- [ ] Verify filter removed from database
- [ ] Verify image file deleted from server
- [ ] Check all log entries are created
- [ ] Test with border category filters
- [ ] Verify admin authentication required

## 📈 Future Enhancements

### **Phase 2**
- [ ] Bulk archive/restore operations
- [ ] Auto-archive filters after X days of inactivity
- [ ] Archive reason/notes field
- [ ] Archive expiration (auto-delete after 30 days)

### **Phase 3**
- [ ] Archive analytics (most archived filters)
- [ ] Restore history tracking
- [ ] Archive search and filtering
- [ ] Export archived filters

## 🎓 Key Takeaways

1. **Archive First** - Never immediate delete, always archive
2. **Two-Step Delete** - Archive → Permanent Delete
3. **Clear Visual Distinction** - Archived items shown differently
4. **Confirmation Dialogs** - All destructive actions require confirmation
5. **Audit Logging** - All actions tracked for accountability

---

**Implementation Date**: October 22, 2025  
**Status**: ✅ Complete - Ready for Testing  
**Files Modified**: 3 Backend, 1 Frontend  
**New Endpoints**: 3 (archived, archive, restore)
