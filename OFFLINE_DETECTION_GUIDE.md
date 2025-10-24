# Offline Detection & User Prompts Implementation Guide

## Overview
This system automatically detects when users try to access features requiring internet connection and provides helpful prompts, including the option to login for full features.

## Components Created

### 1. **useOnlineStatus Hook** (`hooks/useOnlineStatus.js`)
Custom hook for detecting online/offline status and handling network-dependent actions.

```javascript
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const { isOnline, tryOnlineAction } = useOnlineStatus();

// Use in component
const handleAction = async () => {
  const result = await tryOnlineAction(
    () => axios.post('/api/endpoint', data),
    'Internet connection required to save'
  );
  
  if (!result.success) {
    // Show error modal
    setError(result.error);
  }
};
```

### 2. **OnlineRequiredModal** (`components/shared/OnlineRequiredModal.jsx`)
Modal that appears when offline features are accessed. Shows:
- Offline status with WiFi icon
- Custom error message
- Available offline features list
- When online: Login prompt or continue as guest option

### 3. **OnlineActionButton** (`components/shared/OnlineActionButton.jsx`)
Wrapper component for buttons requiring internet.

```javascript
import OnlineActionButton from '../components/shared/OnlineActionButton';

<OnlineActionButton
  onClick={handleSave}
  offlineMessage="Saving requires an internet connection"
  showLoginOption={true}
  className="bg-blue-500 text-white px-4 py-2 rounded"
>
  Save Itinerary
</OnlineActionButton>
```

### 4. **API Wrapper** (`utils/apiWithOfflineHandler.js`)
Utility functions for wrapping API calls with offline detection.

## Usage Examples

### Example 1: Button That Requires Internet

```javascript
import OnlineActionButton from '../components/shared/OnlineActionButton';

function MyComponent() {
  const handleCreateItinerary = async () => {
    const response = await axios.post('/api/itineraries', data);
    alert('Itinerary created!');
  };

  return (
    <OnlineActionButton
      onClick={handleCreateItinerary}
      offlineMessage="Creating itineraries requires an internet connection"
      showLoginOption={true}
      className="bg-[#f04e37] text-white px-6 py-3 rounded-lg"
    >
      Create Itinerary
    </OnlineActionButton>
  );
}
```

### Example 2: API Call with Try-Catch

```javascript
import { apiWithOfflineHandler } from '../utils/apiWithOfflineHandler';
import { useState } from 'react';
import OnlineRequiredModal from '../components/shared/OnlineRequiredModal';

function MyComponent() {
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState('');

  const handleSubmit = async () => {
    const result = await apiWithOfflineHandler(
      () => axios.post('/api/reviews', reviewData),
      {
        requiresAuth: true,
        offlineMessage: 'Posting reviews requires an internet connection',
        onOffline: (error) => {
          setOfflineMessage(error.message);
          setShowOfflineModal(true);
        },
      }
    );

    if (result.success) {
      alert('Review posted!');
    } else if (result.offline) {
      // Already handled by onOffline callback
    } else {
      alert(result.message);
    }
  };

  return (
    <>
      <button onClick={handleSubmit}>Post Review</button>
      
      <OnlineRequiredModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        message={offlineMessage}
        showLoginOption={true}
      />
    </>
  );
}
```

### Example 3: Using the Hook Directly

```javascript
import { useOnlineStatus } from '../hooks/useOnlineStatus';

function MyComponent() {
  const { isOnline, tryOnlineAction } = useOnlineStatus();

  const handleUpload = async () => {
    const result = await tryOnlineAction(
      async () => {
        const formData = new FormData();
        formData.append('image', file);
        return await axios.post('/api/upload', formData);
      },
      'Uploading images requires an internet connection'
    );

    if (result.success) {
      console.log('Upload successful:', result.data);
    } else {
      alert(result.error);
    }
  };

  return (
    <div>
      {!isOnline && (
        <div className="bg-yellow-100 p-2 rounded">
          ⚠️ You are offline. Some features may be unavailable.
        </div>
      )}
      <button onClick={handleUpload}>Upload Image</button>
    </div>
  );
}
```

## Features That Should Use Offline Detection

### ✅ Requires Internet (Use OnlineActionButton or try-catch)

1. **Authentication**
   - Login
   - Signup
   - Logout

2. **User Actions**
   - Create itinerary
   - Edit itinerary
   - Delete itinerary
   - Post review
   - Upload images
   - Update profile

3. **Admin Actions**
   - Add/edit/delete pins
   - Manage users
   - Moderate content

### ❌ Works Offline (No detection needed)

1. **Guest Browsing**
   - View tour sites
   - Read reviews
   - View images (cached)
   - View admin itineraries
   - Navigate map (cached tiles)

## Modal Behavior

### When Offline:
```
┌─────────────────────────────────┐
│  🚫 No Internet Connection      │
│  Please check your connection   │
├─────────────────────────────────┤
│                                 │
│  ⚠️ This feature requires an    │
│     internet connection         │
│                                 │
│  Available Offline:             │
│  ✓ Browse tour sites            │
│  ✓ View cached images           │
│  ✓ Read reviews                 │
│  ✓ View admin itineraries       │
│                                 │
│  [Continue Browsing Offline]    │
│                                 │
└─────────────────────────────────┘
```

### When Online (Auto-detects):
```
┌─────────────────────────────────┐
│  ✓ Connection Restored!         │
│  You are back online            │
├─────────────────────────────────┤
│                                 │
│  ✓ Internet connection detected!│
│                                 │
│  Would you like to login to     │
│  access all features?           │
│                                 │
│  [Login]  [Continue as Guest]   │
│                                 │
│  Logged in users can:           │
│  • Create personal itineraries  │
│  • Save favorite sites          │
│  • Post reviews                 │
│  • Access trip history          │
│                                 │
└─────────────────────────────────┘
```

## Implementation Checklist

### For Each Feature Requiring Internet:

- [ ] Wrap button with `OnlineActionButton` OR
- [ ] Add try-catch with `apiWithOfflineHandler` OR
- [ ] Use `useOnlineStatus` hook with `tryOnlineAction`

### For API Calls:

```javascript
// ❌ Before (no offline handling)
const handleSave = async () => {
  try {
    await axios.post('/api/itineraries', data);
    alert('Saved!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

// ✅ After (with offline handling)
const handleSave = async () => {
  const result = await apiWithOfflineHandler(
    () => axios.post('/api/itineraries', data),
    {
      offlineMessage: 'Saving requires internet connection',
      onOffline: (error) => {
        setShowOfflineModal(true);
        setOfflineMessage(error.message);
      },
    }
  );

  if (result.success) {
    alert('Saved!');
  }
};
```

## Testing

### Test Offline Detection:
1. Open app in browser
2. Open DevTools (F12)
3. Go to Network tab
4. Select "Offline" from dropdown
5. Try to use features requiring internet
6. Should see offline modal

### Test Online Detection:
1. While offline modal is open
2. Go back online (uncheck "Offline")
3. Modal should auto-update to show "Connection Restored"
4. Should offer login option

### Test Login Prompt:
1. Go online
2. Try to use authenticated feature
3. Should see login prompt
4. Click "Login" → redirects to login page
5. Click "Continue as Guest" → closes modal

## Best Practices

1. **Always provide context**: Tell users WHY they need internet
2. **Show alternatives**: List what they CAN do offline
3. **Auto-detect restoration**: Modal updates when connection returns
4. **Offer login**: When online, suggest logging in for more features
5. **Graceful degradation**: App should work offline for guest features

## Error Messages Examples

### Good Messages:
- ✅ "Creating itineraries requires an internet connection"
- ✅ "Posting reviews needs WiFi or mobile data"
- ✅ "Uploading images requires internet access"

### Bad Messages:
- ❌ "Network error"
- ❌ "Failed"
- ❌ "Error 500"

## Integration with Existing Code

### Guest Itinerary (Already works offline - no changes needed)
```javascript
// No offline detection needed - content is cached
function GuestItinerary() {
  // Browsing works offline
  return <div>Browse sites...</div>;
}
```

### Create Itinerary (Needs offline detection)
```javascript
import OnlineActionButton from '../components/shared/OnlineActionButton';

function CreateItinerary() {
  return (
    <OnlineActionButton
      onClick={handleSave}
      offlineMessage="Creating itineraries requires an internet connection"
      className="bg-[#f04e37] text-white px-6 py-3 rounded-lg"
    >
      Save Itinerary
    </OnlineActionButton>
  );
}
```

### Login Page (Needs offline detection)
```javascript
import { apiWithOfflineHandler } from '../utils/apiWithOfflineHandler';

function LoginPage() {
  const handleLogin = async () => {
    const result = await apiWithOfflineHandler(
      () => axios.post('/api/auth/login', credentials),
      {
        offlineMessage: 'Login requires an internet connection',
        onOffline: () => setShowOfflineModal(true),
      }
    );

    if (result.success) {
      navigate('/homepage');
    }
  };

  return (
    <>
      <button onClick={handleLogin}>Login</button>
      <OnlineRequiredModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        message="Login requires an internet connection"
        showLoginOption={false}
      />
    </>
  );
}
```

## Summary

✅ **Created**: Offline detection system with user-friendly modals
✅ **Auto-detects**: Connection status changes
✅ **Offers login**: When online, suggests logging in
✅ **Guest mode**: Continues to work offline
✅ **Try-catch**: All network calls wrapped with error handling
✅ **User-friendly**: Clear messages about what's available offline

This system ensures users always know when they need internet and what they can do without it!
