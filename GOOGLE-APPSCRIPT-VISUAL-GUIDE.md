# 📸 APPS SCRIPT VISUAL SETUP GUIDE

## 🎯 Complete Step-by-Step with Screenshots Description

This guide walks you through setting up Google Apps Script integration for your CRM.

---

## 📋 PART 1: Create Apps Script (5 Minutes)

### Step 1: Open Your Google Sheet
1. Go to your Google Sheet with leads data
2. Make sure first row has headers (column names)
3. Example format:
   ```
   | full_name | email | phone_number | course | country |
   ```

### Step 2: Open Apps Script Editor
1. Click **Extensions** in the top menu
2. Click **Apps Script**
3. A new tab will open with code editor

**What you'll see:**
- Code editor with default `myFunction()` code
- Top bar with "Untitled project"

### Step 3: Delete Default Code
1. Select all existing code (Ctrl+A / Cmd+A)
2. Delete it

### Step 4: Paste Apps Script Code
1. Copy this code:




2. Paste into the editor

### Step 5: Save the Script
1. Click the disk icon 💾 (or Ctrl+S / Cmd+S)
2. Name your project: **"CRM Lead Import"**
3. Click **OK**

**You'll see:**
- Project name changes from "Untitled project" to "CRM Lead Import"
- Code is now saved

---

## 🚀 PART 2: Deploy as Web App (3 Minutes)

### Step 6: Start Deployment
1. Click **Deploy** button (top right)
2. Click **New deployment**

**What you'll see:**
- Deployment dialog box opens

### Step 7: Select Deployment Type
1. Click the **gear icon** ⚙️ next to "Select type"
2. Click **Web app** from the dropdown

**What you'll see:**
- Form appears with configuration options

### Step 8: Configure Deployment
Fill in these settings:

1. **Description**: `CRM Lead Import API`
2. **Execute as**: Select **Me (your-email@gmail.com)**
3. **Who has access**: Select **Anyone**

**Important:** 
- "Execute as: Me" means the script runs with YOUR permissions
- "Anyone" means anyone with the URL can access it (no login required)

### Step 9: Deploy!
1. Click **Deploy** button
2. **Authorization Required** dialog will appear
3. Click **Authorize access**
4. Select your Google account
5. Click **Advanced** (if warning appears)
6. Click **Go to CRM Lead Import (unsafe)** - it's safe, just unverified
7. Click **Allow**

**What you'll see:**
- "Deployment successful" message
- **Web app URL** displayed

### Step 10: Copy the Web App URL
1. You'll see a URL like:
   ```
   https://script.google.com/macros/s/AKfycby...xyz123/exec
   ```
2. Click **Copy** button
3. **Save this URL** - you'll need it for your CRM!

**Important:** This is your API endpoint!

---

## 🧪 PART 3: Test Your Apps Script (2 Minutes)

### Step 11: Test in Browser
1. Open a new browser tab
2. Paste your URL
3. Add `?sheet=Sheet1` at the end:
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheet=Sheet1
   ```
4. Press Enter

**What you should see:**
```json
{
  "success": true,
  "spreadsheetName": "Your Sheet Name",
  "sheetName": "Sheet1",
  "columns": ["full_name", "email", "phone_number", "course"],
  "rowCount": 25,
  "lastUpdated": "2026-04-11T10:30:00.000Z",
  "data": [
    {
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone_number": "p:1234567890",
      "course": "MBA"
    }
    // ... more leads
  ]
}
```

✅ **If you see this JSON, your Apps Script is working!**

❌ **If you see an error:**
- Check sheet name is correct (case-sensitive)
- Make sure first row has headers
- Redeploy with "Anyone" access

---

## 💻 PART 4: Update Your CRM Code (2 Minutes)

### Step 12: Open Your CRM Project
1. Open VS Code (or your editor)
2. Navigate to your CRM project folder

### Step 13: Update App.tsx
1. Open `src/App.tsx`
2. Find line ~16 with:
   ```typescript
   const GoogleSheetsIntegration = lazy(() => import('./components/GoogleSheetsIntegration'));
   ```
3. Replace with:
   ```typescript
   const GoogleSheetsIntegration = lazy(() => import('./components/GoogleSheetsIntegrationAppScript'));
   ```
4. Save the file

### Step 14: Restart Development Server
1. Stop current server (Ctrl+C)
2. Run: `npm run dev`
3. Wait for "Local: http://localhost:5173/"

---

## 🎉 PART 5: Use in CRM (3 Minutes)

### Step 15: Open CRM in Browser
1. Go to `http://localhost:5173/`
2. Login to your CRM

### Step 16: Navigate to Google Sheets Integration
1. Click **"Google Sheets"** in left sidebar
2. Or go to **Integrations** → **Google Sheets**

### Step 17: Configure Connection
1. **Apps Script Web App URL**: Paste your URL from Step 10
2. **Sheet Name**: Enter your sheet name (e.g., "Sheet1")
3. **API Key**: Leave empty (unless you added one)
4. Click **Test Connection**

**What you'll see:**
- Green success message
- Spreadsheet name displayed
- Number of columns found
- Total rows count

### Step 18: Review Field Mapping
1. Click **"Field Mapping"** tab
2. Review auto-mapped fields
3. Adjust mappings if needed:
   - `full_name` → `name`
   - `email` → `email`
   - `phone_number` → `phone`
   - etc.
4. Click **Save Field Mapping**

### Step 19: Sync Leads!
1. Click **"Sync Status"** tab
2. Click **"Start Manual Sync"** button

**What you'll see:**
- "Syncing..." message with spinner
- Progress updates
- Success message: "✅ Successfully imported X leads!"
- Statistics showing:
  - Total Imported
  - Successful
  - Errors

### Step 20: Enable Auto-Sync (Optional)
1. In **Setup** tab, toggle **Auto-Sync Enabled**
2. Set interval (e.g., 5 minutes)
3. Click **Save Settings**

**What happens:**
- CRM will automatically sync leads every X minutes
- No manual action needed!

---

## 📊 VERIFICATION

### Check Your Leads
1. Go to **Leads Management** in CRM
2. You should see newly imported leads
3. Verify data mapped correctly:
   - Names
   - Emails
   - Phone numbers
   - Other fields

### Monitor Sync Stats
1. Go to **Google Sheets** → **Sync Status** tab
2. View:
   - Last sync time
   - Success count
   - Error count
   - Total imported

---

## 🔧 TROUBLESHOOTING VISUAL GUIDE

### Problem: "Authorization required" error

**Fix:**
1. Go back to Apps Script
2. Click **Deploy** → **Manage deployments**
3. Click ✏️ edit icon
4. Change "Who has access" to **Anyone**
5. Click **Deploy**

### Problem: "Sheet not found"

**Fix:**
1. Check sheet name exactly matches
   - Go to your Google Sheet
   - Look at bottom tabs
   - Copy exact name (case-sensitive)
2. Update in CRM

### Problem: Empty data / no leads

**Fix:**
1. Open your Google Sheet
2. Check:
   - First row has headers ✅
   - Second row onwards has data ✅
   - No empty rows at top ✅
3. Re-test Apps Script URL in browser

### Problem: Some fields not importing

**Fix:**
1. Go to CRM → **Field Mapping** tab
2. Check each column is mapped
3. Unmapped columns won't import
4. Save mapping again

---

## 📸 KEY SCREENSHOTS TO LOOK FOR

### Apps Script Editor
```
┌─────────────────────────────────────────────┐
│ CRM Lead Import             ▼ Run Debug... │
│ ─────────────────────────────────────────── │
│ function doGet(e) {                          │
│   try {                                      │
│     const sheetName = e.parameter.sheet...  │
│     ...                                      │
│   }                                          │
│ }                                            │
│                                              │
│ [💾 Save] [▶ Run] [🚀 Deploy]              │
└─────────────────────────────────────────────┘
```

### Deployment Dialog
```
┌──────────────────────────────────────────┐
│ New deployment                           │
│ ──────────────────────────────────────── │
│ ⚙️ Select type: Web app ▼               │
│                                          │
│ Description: CRM Lead Import API         │
│ Execute as: Me (you@gmail.com) ▼        │
│ Who has access: Anyone ▼                 │
│                                          │
│ [Cancel]                  [Deploy] ✓    │
└──────────────────────────────────────────┘
```

### Success Screen
```
┌──────────────────────────────────────────┐
│ ✓ Deployment successful                  │
│ ──────────────────────────────────────── │
│ Web app                                   │
│ URL: https://script.google.com/macros/   │
│      s/AKfycby...xyz123/exec    [Copy]  │
│                                          │
│ [Done]                                   │
└──────────────────────────────────────────┘
```

### CRM Connection Success
```
┌──────────────────────────────────────────┐
│ ✅ Connected to "Facebook Leads Export"  │
│ ──────────────────────────────────────── │
│ Spreadsheet: Facebook Leads Export       │
│ Sheet: Sheet1                            │
│ Columns Found: 8                         │
│ Total Rows: 42                           │
│ Last Updated: 4/11/2026, 10:30:00 AM    │
└──────────────────────────────────────────┘
```

---

## ⏱️ TIME BREAKDOWN

- **Part 1** (Apps Script): 5 minutes
- **Part 2** (Deploy): 3 minutes
- **Part 3** (Test): 2 minutes
- **Part 4** (Update Code): 2 minutes
- **Part 5** (Configure CRM): 3 minutes

**Total:** ~15 minutes from start to finish!

---

## ✅ COMPLETION CHECKLIST

- [ ] Google Sheet has headers in first row
- [ ] Apps Script created and saved
- [ ] Apps Script deployed as Web App
- [ ] Web App URL copied
- [ ] URL tested in browser (shows JSON)
- [ ] App.tsx updated with new component
- [ ] Dev server restarted
- [ ] CRM opened in browser
- [ ] Apps Script URL pasted in CRM
- [ ] Connection tested successfully
- [ ] Field mapping reviewed
- [ ] First sync completed
- [ ] Leads visible in CRM
- [ ] Auto-sync enabled (optional)

---

## 🎓 TIPS FOR SUCCESS

1. **Test in Browser First** - Always verify your Apps Script URL returns JSON before using in CRM
2. **Match Sheet Names Exactly** - "Sheet1" ≠ "sheet1" ≠ "Sheet 1"
3. **Keep Headers Simple** - Avoid special characters in column names
4. **Check First Row** - Must be headers, not data
5. **Monitor Sync Stats** - Watch for errors and fix field mapping
6. **Use Auto-Sync** - Set it and forget it!
7. **Bookmark Your URL** - Save the Apps Script URL securely

---

## 🚀 YOU'RE DONE!

Congratulations! Your CRM is now connected to Google Sheets via Apps Script.

**What you can do now:**
- ✅ Automatic lead import from Google Sheets
- ✅ No Google Console setup needed
- ✅ No OAuth authentication required
- ✅ Set and forget with auto-sync
- ✅ Real-time sync on demand

**Next Steps:**
- Add more sheets with different data
- Enable auto-sync for hands-free operation
- Monitor sync statistics
- Export leads back to Google Sheets

---

**Need help?** Check these docs:
- `GOOGLE-APPSCRIPT-IMPLEMENTATION.md` - Full technical guide
- `GOOGLE-APPSCRIPT-QUICK-REFERENCE.md` - Code snippets
- `GOOGLE-APPSCRIPT-MIGRATION.md` - Switching from OAuth

**Happy syncing! 🎉**
