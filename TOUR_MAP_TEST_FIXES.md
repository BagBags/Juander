# Tour Map Test Fixes - Based on Actual JSX Code Review

## Findings from JSX Code Analysis

### 1. Add Pin Button (AdminTourMapMain.jsx, lines 1129-1138)
```jsx
<button
  onClick={() => setShowAddPinModal(true)}
  title="Add Pin"
  className={`p-3 w-full transition-colors hover:bg-gray-100 ...`}
  style={isAddingPin || showAddPinModal ? { backgroundColor: '#f04e37' } : {}}
>
  {isAddingPin ? <MapPinned className="w-5 h-5 mx-auto" /> : <Plus className="w-5 h-5 mx-auto" />}
</button>
```

**Key Facts:**
- ✅ Button HAS `title="Add Pin"` attribute
- ✅ Button contains ONLY an icon (lucide-react `Plus` or `MapPinned` component)
- ❌ Button has NO text content - only an icon
- ✅ Correct selector: `button[title="Add Pin"]`
- ❌ Wrong selector: `//button[contains(., 'Add Pin')]` (looks for text)

### 2. Manage Pins Modal Structure (AdminTourMapMain.jsx, lines 1215-1320)
```jsx
{showPinsPanel && (
  <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="text-white p-5 flex justify-between items-center">
        <h2 className="text-xl font-bold">Manage Pins</h2>
        ...
      </div>
      
      {/* Tabs */}
      <div className="px-5 pb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab("active")}>
            Active <span>{pins.length}</span>
          </button>
          <button onClick={() => setActiveTab("archived")}>
            Archived <span>{archivedPins.length}</span>
          </button>
        </div>
      </div>
      
      {/* Pins Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === "active" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPins.map((pin) => (
              <div key={pin._id} className="bg-white border-2 border-gray-200 rounded-xl">
                {/* Pin Card */}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArchivedPins.map((pin) => (
              <div key={pin._id} className="bg-white border-2 border-gray-200 rounded-xl">
                {/* Archived Pin Card */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

**Key Facts:**
- ✅ Modal uses `fixed inset-0` positioning (full screen overlay)
- ✅ Tabs are buttons that set `activeTab` state
- ✅ Active pins render in grid when `activeTab === "active"`
- ✅ Archived pins render in grid when `activeTab === "archived"`
- ✅ Pin cards have `border-2 border-gray-200 rounded-xl` classes
- ✅ Cards are in a `grid grid-cols-1 md:grid-cols-2 gap-4` layout
- ✅ Search/filter applied BEFORE rendering (filteredPins, filteredArchivedPins)

### 3. Manual Add Modal (ManualAddModal.jsx)
```jsx
<div className="absolute top-6 left-6 w-[380px] bg-white rounded-2xl shadow-2xl">
  {/* Header with Back and Close buttons */}
  <div className="flex justify-between items-center p-4">
    <button onClick={() => setShowManualAdd(false); setShowAddPinModal(true)}>
      ← Back
    </button>
    <h2>Add Pin by Coordinates</h2>
    <button onClick={() => setShowManualAdd(false); setShowAddPinModal(false)}>
      ✕
    </button>
  </div>
  
  {/* Form */}
  <div className="p-5 space-y-4">
    <div>
      <label>Latitude</label>
      <input type="number" step="any" placeholder="Latitude" />
    </div>
    
    <div>
      <label>Longitude</label>
      <input type="number" step="any" placeholder="Longitude" />
    </div>
    
    <button onClick={() => addPinFromCoords()}>
      + Add Pin
    </button>
  </div>
</div>
```

**Key Facts:**
- ✅ Modal is `absolute top-6 left-6` (not fixed)
- ✅ Inputs have `placeholder="Latitude"` and `placeholder="Longitude"`
- ✅ Inputs are `type="number"` with `step="any"`
- ✅ Add Pin button has text "+ Add Pin"

## Test Script Corrections

### Fix 1: Add Pin Button Selector
**WRONG:**
```javascript
const addPinBtn = await driver.findElements(By.xpath("//button[contains(., 'Add Pin')]"));
```

**CORRECT:**
```javascript
const addPinBtn = await driver.wait(
  until.elementLocated(By.css('button[title="Add Pin"]')),
  15000
);
```

### Fix 2: Manage Pins Button Selector
**WRONG:**
```javascript
const managePinsBtn = await driver.findElements(By.xpath("//button[contains(., 'Manage Pins')]"));
```

**CORRECT:**
```javascript
const managePinsBtn = await driver.wait(
  until.elementLocated(By.css('button[title="Manage Pins"]')),
  15000
);
```

### Fix 3: Tab Switching for Archived
**WRONG:**
```javascript
const archivedTab = await driver.findElements(By.xpath("//button[contains(.,'Archived')]"));
```

**CORRECT:**
```javascript
// The tab button contains both icon and text, search for "Archived" in a button within the modal
const archivedTab = await driver.wait(
  until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(., 'Archived')]")),
  10000
);
```

### Fix 4: Pin Card Search in Archived Tab
**ISSUE:** After switching to archived tab, cards might not be immediately visible

**SOLUTION:**
```javascript
// Wait for archived tab to be active
await driver.sleep(1500);

// Search for pin cards in the grid
const archivedCards = await driver.wait(
  until.elementLocated(By.xpath("//div[contains(@class,'grid')]//div[contains(@class,'border-2') and contains(@class,'rounded-xl')]")),
  10000
);
```

### Fix 5: Input Field Selectors
**CORRECT SELECTORS:**
```javascript
// Latitude input
const latInput = await driver.findElement(By.xpath("//input[@placeholder='Latitude']"));

// Longitude input
const lonInput = await driver.findElement(By.xpath("//input[@placeholder='Longitude']"));

// Site Name input (in pin card form)
const siteNameInput = await driver.findElement(By.xpath("//input[@placeholder='Site Name']"));
```

## Summary of Issues

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Add Pin button not found | XPath looks for text, button has only icon | Use CSS selector `button[title="Add Pin"]` |
| Manage Pins button not found | XPath looks for text, button has only icon | Use CSS selector `button[title="Manage Pins"]` |
| Archived tab not found | XPath not scoped to modal | Scope XPath to fixed modal container |
| Archived pins not found | Timing issue + wrong selector | Wait longer + use correct grid selector |
| Form inputs not found | Wrong placeholder text or missing wait | Use exact placeholder text from JSX |

## Implementation Notes

1. **Always use `driver.wait()` with proper timeout** for elements that appear after user interaction
2. **Use CSS selectors for title attributes** - more reliable than XPath for icon-only buttons
3. **Scope XPath searches to containers** - use `//div[contains(@class,'fixed')]//` to search within modals
4. **Wait between state changes** - React state updates take time, use `driver.sleep(1500)` after tab switches
5. **Match exact placeholder text** - check JSX for exact attribute values
