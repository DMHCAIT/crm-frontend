# 🚀 Google Sheets Integration with Apps Script (NO GOOGLE CONSOLE NEEDED!)

## ✅ What This Does

Instead of using Google Console OAuth, this implementation uses **Google Apps Script** to create a simple API endpoint that:
- Reads your Google Sheet data
- Returns it as JSON
- No OAuth needed
- No Google Console setup required
- Just deploy and use!

---

## 📋 Implementation Steps

### Step 1: Create Google Apps Script

1. **Open your Google Sheet**
2. Click **Extensions** → **Apps Script**
3. Delete any existing code
4. Paste the following code:

```javascript
/**
 * CRM Lead Import - Google Apps Script
 * This script exposes your Google Sheet data as a JSON API
 * No authentication needed - perfect for CRM integration!
 */

// Main function that handles GET requests
function doGet(e) {
  try {
    const sheetName = e.parameter.sheet || 'Sheet1';
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          error: 'Sheet not found',
          sheetName: sheetName
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get all data including headers
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify({
          error: 'No data found in sheet'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // First row is headers
    const headers = data[0];
    
    // Convert rows to objects
    const leads = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const lead = {};
      
      headers.forEach((header, index) => {
        lead[header] = row[index] || '';
      });
      
      // Only add if has required data (not empty row)
      if (lead[headers[0]]) {  // Check if first column has data
        leads.push(lead);
      }
    }
    
    // Return JSON response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        spreadsheetName: spreadsheet.getName(),
        sheetName: sheetName,
        columns: headers,
        rowCount: leads.length,
        lastUpdated: new Date().toISOString(),
        data: leads
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: Function to get only new leads since last sync
function doPost(e) {
  try {
    const sheetName = e.parameter.sheet || 'Sheet1';
    const lastSyncDate = e.parameter.lastSync ? new Date(e.parameter.lastSync) : null;
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          error: 'Sheet not found'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const leads = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const lead = {};
      
      headers.forEach((header, index) => {
        lead[header] = row[index] || '';
      });
      
      // Filter by date if lastSync provided
      // Assumes you have a 'timestamp' or 'date' column
      if (lastSyncDate && lead.timestamp) {
        const leadDate = new Date(lead.timestamp);
        if (leadDate <= lastSyncDate) {
          continue; // Skip old leads
        }
      }
      
      if (lead[headers[0]]) {
        leads.push(lead);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        newLeads: leads.length,
        data: leads
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

5. **Save the script** (Click disk icon or Ctrl+S)
6. Name it: "CRM Lead Import API"

### Step 2: Deploy Apps Script as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description**: "CRM Lead Import"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone (or "Anyone with the link" for less restriction)
5. Click **Deploy**
6. **Copy the Web App URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

### Step 3: Test Your Apps Script

Open this URL in your browser (replace with your actual URL):
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheet=Sheet1
```

You should see JSON response like:
```json
{
  "success": true,
  "spreadsheetName": "Your Sheet Name",
  "sheetName": "Sheet1",
  "columns": ["full_name", "email", "phone_number", ...],
  "rowCount": 25,
  "data": [
    {
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone_number": "p:1234567890",
      ...
    }
  ]
}
```

✅ If you see this, your Apps Script is working!

---

## Step 4: Update Your CRM Frontend

Add this to your `.env` file:
```env
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

---

## 🎯 Advantages of Apps Script Approach

| Feature | Apps Script | OAuth API |
|---------|------------|-----------|
| Google Console Setup | ❌ Not needed | ✅ Required |
| OAuth Flow | ❌ Not needed | ✅ Required |
| Credentials Management | ❌ Not needed | ✅ Complex |
| Setup Time | ⚡ 5 minutes | 🐌 20+ minutes |
| Token Expiry Issues | ❌ Never | ✅ Yes |
| User Experience | ✅ Simple | ❌ Complex |

---

## 🔧 Advanced Features

### Add Rate Limiting
```javascript
function doGet(e) {
  // Check rate limit
  const cache = CacheService.getScriptCache();
  const requestCount = cache.get('requests') || 0;
  
  if (requestCount > 100) {
    return ContentService
      .createTextOutput(JSON.stringify({
        error: 'Rate limit exceeded'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  cache.put('requests', parseInt(requestCount) + 1, 3600); // 1 hour
  
  // ... rest of your code
}
```

### Add Simple API Key Authentication
```javascript
function doGet(e) {
  const API_KEY = 'your-secret-key-here'; // Store in Script Properties for security
  
  if (e.parameter.apiKey !== API_KEY) {
    return ContentService
      .createTextOutput(JSON.stringify({
        error: 'Invalid API key'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // ... rest of your code
}
```

Then call it with:
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?apiKey=your-secret-key-here&sheet=Sheet1
```

### Filter Specific Columns Only
```javascript
function doGet(e) {
  const columnsToReturn = ['full_name', 'email', 'phone_number', 'course'];
  
  // ... get data ...
  
  const filteredLeads = leads.map(lead => {
    const filtered = {};
    columnsToReturn.forEach(col => {
      if (lead[col]) filtered[col] = lead[col];
    });
    return filtered;
  });
  
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      data: filteredLeads
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 📝 Testing

### Test in Browser
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheet=Sheet1
```

### Test with curl
```bash
curl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheet=Sheet1"
```

### Test with JavaScript
```javascript
fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheet=Sheet1')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 🚨 Common Issues & Solutions

### Issue: "Authorization required"
**Solution**: Redeploy and make sure "Who has access" is set to "Anyone"

### Issue: "Script function not found"
**Solution**: Make sure function is named `doGet` (case-sensitive)

### Issue: "Empty response"
**Solution**: Check your sheet name matches exactly (case-sensitive)

### Issue: "CORS error"
**Solution**: Apps Script automatically handles CORS - no action needed

---

## 📊 Response Format

```javascript
{
  "success": true,
  "spreadsheetName": "Facebook Leads Export",
  "sheetName": "Sheet1",
  "columns": [
    "full_name",
    "email",
    "phone_number",
    "your_highest_qualification",
    "in_which_program_are_you_interested_?",
    "country",
    "form_name",
    "lead_status"
  ],
  "rowCount": 42,
  "lastUpdated": "2026-04-11T10:30:00.000Z",
  "data": [
    {
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone_number": "p:1234567890",
      "your_highest_qualification": "Bachelor's",
      "in_which_program_are_you_interested_?": "MBA",
      "country": "India",
      "form_name": "Facebook Lead Ad",
      "lead_status": "New"
    }
    // ... more leads
  ]
}
```

---

## ✅ Next Steps

1. Create the Apps Script (5 minutes)
2. Deploy as Web App (2 minutes)
3. Test the URL (1 minute)
4. Update your CRM component (see next file)

Ready to update your CRM component? See `GoogleSheetsIntegrationAppScript.tsx`!
