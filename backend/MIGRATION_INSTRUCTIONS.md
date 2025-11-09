# Migration Instructions for feeAmountDiscounted Field

## What Changed
Added a new field `feeAmountDiscounted` to the Pin model to store discounted entrance fees for Students, PWD, and Senior Citizens.

## CRITICAL: Steps to Apply (IN ORDER)

### 1. **STOP the Backend Server**
```bash
# Press Ctrl+C in your backend terminal to stop the server
```

### 2. **Restart Backend Server**
The schema changes MUST be loaded by restarting:
```bash
# In the backend directory:
npm start
# OR
node server.js
```

### 3. **Run Migration Script (REQUIRED for existing pins)**
This adds the `feeAmountDiscounted` field to all existing pins in the database:

```bash
# In a NEW terminal, navigate to backend folder:
cd backend
node scripts/addDiscountedFeeField.js
```

**Expected Output:**
```
✅ Connected to MongoDB
✅ Migration complete!
   - Pins updated: X
   - Pins matched: X
✅ Database connection closed
```

### 4. **Clear Browser Cache**
```bash
# In your browser:
# Press Ctrl+Shift+Delete
# Clear cached images and files
# OR just hard refresh: Ctrl+F5
```

### 5. **Test the Update**
1. Log out and log back in as admin
2. Go to Admin Tour Map
3. Select a pin with entrance fee
4. Update entrance fee information:
   - Regular Price: e.g., 75
   - Discounted Price: e.g., 60 (or leave blank for null)
5. Click Save/Update
6. Should save successfully without errors

## What the Migration Does
- Adds `feeAmountDiscounted: null` to all existing pins that don't have this field
- Does not modify pins that already have the field
- Safe to run multiple times
- Required for updating existing pins

## Troubleshooting

### Still getting 401 Unauthorized?
- Clear browser cache and cookies
- Log out and log back in as admin
- Check that your token is valid in localStorage

### Update still failing?
- Check backend console for detailed error messages
- Ensure MongoDB is running
- Verify the pin ID exists in the database

### Field not showing in database?
- Restart the backend server
- Run the migration script
- Check MongoDB directly to verify the field exists
