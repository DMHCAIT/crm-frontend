# 🚀 Google Apps Script - Quick Reference

## 📋 Apps Script Code (Copy-Paste Ready)

### Basic Version (Recommended)
```javascript
function doGet(e) {
  try {
    const sheetName = e.parameter.sheet || 'Sheet1';
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'No data found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const leads = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const lead = {};
      headers.forEach((header, index) => {
        lead[header] = row[index] || '';
      });
      if (lead[headers[0]]) leads.push(lead);
    }
    
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
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Version with API Key Authentication
```javascript
function doGet(e) {
  // Simple API Key check
  const API_KEY = 'your-secret-key-123'; // Change this!
  
  if (e.parameter.apiKey !== API_KEY) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Invalid API key' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // ... rest of the code same as above
}
```

### Version with Date Filtering
```javascript
function doGet(e) {
  try {
    const sheetName = e.parameter.sheet || 'Sheet1';
    const sinceDate = e.parameter.since ? new Date(e.parameter.since) : null;
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find timestamp column index
    const timestampIndex = headers.findIndex(h => 
      h.toLowerCase().includes('timestamp') || 
      h.toLowerCase().includes('date')
    );
    
    const leads = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Filter by date if timestamp column exists
      if (sinceDate && timestampIndex >= 0) {
        const rowDate = new Date(row[timestampIndex]);
        if (rowDate <= sinceDate) continue;
      }
      
      const lead = {};
      headers.forEach((header, index) => {
        lead[header] = row[index] || '';
      });
      if (lead[headers[0]]) leads.push(lead);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        spreadsheetName: spreadsheet.getName(),
        sheetName: sheetName,
        columns: headers,
        rowCount: leads.length,
        filtered: sinceDate !== null,
        data: leads
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 🔧 Deployment Steps

### 1. Create Script
1. Open Google Sheet
2. Extensions → Apps Script
3. Paste code above
4. Save (Ctrl+S)

### 2. Deploy
1. Click **Deploy** → **New deployment**
2. Click gear icon ⚙️
3. Select **Web app**
4. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**
6. **Copy URL**

### 3. Update Deployment (After Code Changes)
1. Click **Deploy** → **Manage deployments**
2. Click ✏️ edit icon
3. Change version to **New version**
4. Click **Deploy**

---

## 🌐 Usage Examples

### Basic Call
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheet=Sheet1
```

### With API Key
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheet=Sheet1&apiKey=your-secret-key-123
```

### With Date Filter
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheet=Sheet1&since=2026-04-01
```

### JavaScript Fetch
```javascript
fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheet=Sheet1')
  .then(response => response.json())
  .then(data => {
    console.log('Found leads:', data.rowCount);
    console.log('Columns:', data.columns);
    data.data.forEach(lead => {
      console.log('Lead:', lead);
    });
  })
  .catch(error => console.error('Error:', error));
```

### cURL Test
```bash
curl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?sheet=Sheet1"
```

---

## 📊 Response Format

```json
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
  ]
}
```

---

## 🚨 Troubleshooting

### "Authorization required" Error
**Fix:** Redeploy with "Who has access" set to **Anyone**

### "Script function not found"
**Fix:** Function must be named `doGet` (case-sensitive)

### Empty/No Response
**Fix:** 
- Check sheet name matches exactly
- Verify first row has headers
- Check browser console for errors

### CORS Issues
**Fix:** Apps Script handles CORS automatically - no fix needed!

### Rate Limiting
Apps Script limits:
- **20 requests/second per user**
- **100,000 requests/day**

---

## 🔒 Security Best Practices

### 1. Use API Key (Optional but Recommended)
```javascript
const API_KEY = PropertiesService.getScriptProperties().getProperty('API_KEY');
if (e.parameter.apiKey !== API_KEY) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: 'Unauthorized' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Store key in: File → Project properties → Script properties

### 2. Limit Returned Columns
```javascript
// Only return specific columns
const allowedColumns = ['full_name', 'email', 'phone_number'];
const lead = {};
headers.forEach((header, index) => {
  if (allowedColumns.includes(header)) {
    lead[header] = row[index] || '';
  }
});
```

### 3. Add Rate Limiting
```javascript
const cache = CacheService.getScriptCache();
const key = 'requests_' + e.parameter.apiKey;
const count = parseInt(cache.get(key) || '0');

if (count > 100) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: 'Rate limit exceeded' }))
    .setMimeType(ContentService.MimeType.JSON);
}

cache.put(key, (count + 1).toString(), 3600); // 1 hour
```

---

## 📁 File Structure in Your CRM

```
crm-frontend-main/
├── src/
│   └── components/
│       ├── GoogleSheetsIntegration.tsx           (OLD - OAuth method)
│       └── GoogleSheetsIntegrationAppScript.tsx  (NEW - Apps Script)
│
├── GOOGLE-APPSCRIPT-IMPLEMENTATION.md  (Full guide)
├── GOOGLE-APPSCRIPT-QUICK-REFERENCE.md (This file)
└── GOOGLE-SHEETS-SETUP.md             (OAuth guide - old)
```

---

## ✅ Quick Checklist

- [ ] Open Google Sheet
- [ ] Extensions → Apps Script
- [ ] Paste code
- [ ] Save script
- [ ] Deploy as Web App
- [ ] Set "Anyone" access
- [ ] Copy URL
- [ ] Test URL in browser
- [ ] Add URL to CRM
- [ ] Test connection
- [ ] Map fields
- [ ] Sync leads!

---

## 🎯 Advantages Over OAuth Method

| Feature | Apps Script | OAuth API |
|---------|------------|-----------|
| Google Console Setup | ❌ Not needed | ✅ Required |
| OAuth Flow | ❌ Not needed | ✅ Required |
| Token Expiry | ❌ Never | ✅ Yes (60 min) |
| Credentials | ❌ Not needed | ✅ Client ID required |
| Setup Time | ⚡ 5 minutes | 🐌 20+ minutes |
| User Friction | ✅ None | ❌ Login required |
| Maintenance | ✅ Zero | ❌ Token refresh |

---

## 💡 Pro Tips

1. **Test in Browser First** - Always test the URL directly before using in CRM
2. **Use Sheet Name Parameter** - Support multiple sheets: `?sheet=Leads2026`
3. **Add Timestamp Column** - Helps track when leads were added
4. **Version Your Deployments** - Easy to rollback if needed
5. **Monitor Execution Logs** - Apps Script → Executions shows all requests
6. **Cache Response** - Add caching to reduce API calls
7. **Use Script Properties** - Store API keys securely

---

## 📞 Support

If you need help:
1. Check the full guide: `GOOGLE-APPSCRIPT-IMPLEMENTATION.md`
2. Test your URL directly in browser
3. Check Apps Script execution logs
4. Verify sheet name and column names match exactly

---

**Ready to go! 🚀**
