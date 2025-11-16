# Tour Map - Actual Application Flow (From JSX Code Analysis)

## Complete Flow from JSX Code

### Step 1: Click Add Pin Button (AdminTourMapMain.jsx:1129-1138)
```jsx
<button title="Add Pin" onClick={() => setShowAddPinModal(true)}>
  <Plus className="w-5 h-5 mx-auto" />
</button>
```
- ✅ Button has `title="Add Pin"` attribute
- ✅ Contains ONLY icon, NO text
- **Selector**: `button[title="Add Pin"]`

### Step 2: Add Pin Modal Opens (AddPinModal.jsx)
```jsx
{showAddPinModal && (
  <div className="absolute top-6 right-24 w-[380px]">
    <h2>Add Pin</h2>
    {/* Two options */}
    <button onClick={() => setIsAddingPin(!isAddingPin)}>
      Tap to place
    </button>
    <button onClick={() => setShowManualAdd(true)}>
      Manual Add
    </button>
  </div>
)}
```
- Modal appears with heading `<h2>Add Pin</h2>`
- Two clickable options with `<h3>` headings

### Step 3: Click Manual Add (AddPinModal.jsx:68-72)
```jsx
<button onClick={() => setShowManualAdd(true)}>
  <h3>Manual Add</h3>
  <p>Add pin by entering coordinates manually</p>
</button>
```
- **Selector**: `//h3[contains(., 'Manual Add')]/ancestor::button`

### Step 4: Manual Add Modal Opens (ManualAddModal.jsx:14-87)
```jsx
{showManualAdd && (
  <div className="absolute top-6 left-6 w-[380px]">
    <h2>Add Pin by Coordinates</h2>
    
    {/* Latitude Input */}
    <input type="number" step="any" placeholder="Latitude" />
    
    {/* Longitude Input */}
    <input type="number" step="any" placeholder="Longitude" />
    
    {/* Add Pin Button */}
    <button onClick={() => addPinFromCoords()}>
      + Add Pin
    </button>
  </div>
)}
```

**KEY FACTS:**
- ✅ Inputs have `placeholder="Latitude"` and `placeholder="Longitude"`
- ✅ Inputs are `type="number"` with `step="any"`
- ✅ Button text is "+ Add Pin"
- ✅ Modal is `absolute top-6 left-6` (NOT fixed)

### Step 5: Click Add Pin Button in Manual Modal (ManualAddModal.jsx:75-85)
```jsx
<button onClick={() => {
  addPinFromCoords();
  setShowManualAdd(false);
  setShowAddPinModal(false);
}}>
  <FontAwesomeIcon icon={faPlus} />
  Add Pin
</button>
```

This calls `addPinFromCoords()` which:
1. Validates coordinates
2. Creates new pin object
3. Adds to pins array: `setPins((prev) => [...prev, newPin])`
4. Calls `openPinCard(pins.length)` - **OPENS PIN CARD FORM**

### Step 6: Pin Card Form Opens (AdminTourMapMain.jsx:1030-1058)
```jsx
{selectedPin !== null && pins[selectedPin] && (
  <AdminPinCard
    pin={pins[selectedPin]}
    selectedPinIndex={selectedPin}
    updatePinField={updatePinField}
    handleFormSubmit={handleFormSubmit}
    ...
  />
)}
```

**THIS IS WHERE THE FORM INPUTS ARE!**

The AdminPinCard component (AdminPinCard.jsx) renders:
- Site Name input
- Category dropdown
- Description textareas
- Media uploads
- Price inputs
- Save button

## Test Script Issues

### Problem 1: tourmap.add-pin-only.test.js
The test tries to find form inputs IMMEDIATELY after clicking "Add Pin" in ManualAddModal, but:
1. ManualAddModal only has Latitude/Longitude inputs
2. After clicking "Add Pin", ManualAddModal CLOSES
3. AdminPinCard opens with the FULL form
4. Test is looking for inputs that don't exist in ManualAddModal

### Problem 2: Missing Wait Between Modals
The test needs to:
1. Wait for ManualAddModal to close
2. Wait for AdminPinCard to open
3. THEN look for form inputs

### Problem 3: Archive Test
After archiving, the archived pins list needs time to render. The test searches too quickly.

## Correct Test Flow

```javascript
// Step 1: Click Add Pin button
const addPinBtn = await driver.wait(
  until.elementLocated(By.css('button[title="Add Pin"]')),
  15000
);
await safeClick(driver, addPinBtn);

// Step 2: Wait for Add Pin Modal
await driver.wait(until.elementLocated(By.xpath("//h2[contains(., 'Add Pin')]")), 10000);

// Step 3: Click Manual Add
const manualAddBtn = await driver.wait(
  until.elementLocated(By.xpath("//h3[contains(., 'Manual Add')]/ancestor::button")),
  10000
);
await safeClick(driver, manualAddBtn);

// Step 4: Wait for Manual Add Modal
await driver.wait(until.elementLocated(By.xpath("//h2[contains(., 'Add Pin by Coordinates')]")), 10000);

// Step 5: Fill Latitude (in ManualAddModal)
const latInput = await driver.findElement(By.xpath("//input[@placeholder='Latitude']"));
await latInput.clear();
await latInput.sendKeys('120.97332772279593');

// Step 6: Fill Longitude (in ManualAddModal)
const lonInput = await driver.findElement(By.xpath("//input[@placeholder='Longitude']"));
await lonInput.clear();
await lonInput.sendKeys('14.592022520792217');

// Step 7: Click Add Pin button in ManualAddModal
const addPinInModalBtn = await driver.wait(
  until.elementLocated(By.xpath("//button[contains(., 'Add Pin')]")),
  10000
);
await safeClick(driver, addPinInModalBtn);

// Step 8: WAIT FOR PIN CARD TO OPEN (this is the key!)
await driver.wait(until.elementLocated(By.xpath("//input[@placeholder='Site Name']")), 15000);

// Step 9: NOW fill the form inputs (in AdminPinCard)
const siteNameInput = await driver.findElement(By.xpath("//input[@placeholder='Site Name']"));
await siteNameInput.clear();
await siteNameInput.sendKeys('Manila Cathedral');

// ... continue with other fields ...

// Step 10: Save
const saveBtn = await driver.wait(
  until.elementLocated(By.xpath("//button[contains(., 'Save')]")),
  10000
);
await safeClick(driver, saveBtn);
```

## Key Selectors Summary

| Element | Selector | Notes |
|---------|----------|-------|
| Add Pin Button | `button[title="Add Pin"]` | Icon-only button |
| Add Pin Modal Heading | `//h2[contains(., 'Add Pin')]` | Modal title |
| Manual Add Option | `//h3[contains(., 'Manual Add')]/ancestor::button` | Button containing h3 |
| Manual Add Modal | `//h2[contains(., 'Add Pin by Coordinates')]` | Modal title |
| Latitude Input | `//input[@placeholder='Latitude']` | In ManualAddModal |
| Longitude Input | `//input[@placeholder='Longitude']` | In ManualAddModal |
| Add Pin in Modal | `//button[contains(., 'Add Pin')]` | In ManualAddModal |
| Site Name Input | `//input[@placeholder='Site Name']` | In AdminPinCard |
| Save Button | `//button[contains(., 'Save')]` | In AdminPinCard |
| Manage Pins Button | `button[title="Manage Pins"]` | Icon-only button |
| Archived Tab | `//div[contains(@class,'fixed')]//button[contains(., 'Archived')]` | In Manage Pins modal |

## Archive Issue

After archiving, the archived pins render in a grid:
```jsx
{activeTab === "archived" ? (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {archivedPins.map((pin) => (
      <div className="bg-gray-50 border-2 border-gray-300 rounded-xl">
        ...
      </div>
    ))}
  </div>
) : ...}
```

**Selector for archived pin cards:**
```javascript
//div[contains(@class,'grid')]//div[contains(@class,'border-2') and contains(@class,'border-gray-300')]
```

**Issue:** Need to wait longer after tab switch for archived pins to render.
