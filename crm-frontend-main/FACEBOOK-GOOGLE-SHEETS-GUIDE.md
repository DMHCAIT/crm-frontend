# Facebook Leads ΓåÆ Google Sheets ΓåÆ CRM Integration Guide

## ≡ƒôè Your Current Setup

You have Facebook leads exported to Google Sheets with this structure:

```
| full_name | email | phone_number | your_highest_qualification | in_which_program_are_you_interested_? | country | form_name | lead_status |
```

## Γ£à What I've Updated

The Google Sheets integration now:

1. **Auto-maps Facebook fields** - Recognizes your column names
2. **Cleans phone numbers** - Removes "p:" prefix automatically
3. **Skips test leads** - Filters out dummy/test data
4. **Maps qualifications** - Maps "your_highest_qualification" to CRM
5. **Maps programs** - Maps "in_which_program_are_you_interested_?" to course field

---

## ≡ƒÄ» Pre-Configured Field Mapping

Your Google Sheet columns will automatically map like this:

| Google Sheet Column | ΓåÆ | CRM Field |
|---------------------|---|-----------|
| **full_name** | ΓåÆ | name |
| **email** | ΓåÆ | email |
| **phone_number** | ΓåÆ | phone (p: prefix removed) |
| **your_highest_qualification** | ΓåÆ | qualification |
| **in_which_program_are_you_interested_?** | ΓåÆ | course |
| **country** | ΓåÆ | country |
| **form_name** | ΓåÆ | source |
| **lead_status** | ΓåÆ | status |
| **ad_name** | ΓåÆ | ad_name (if you add this column) |
| **campaign_name** | ΓåÆ | campaign_name (if you add this column) |

---

## ≡ƒÜÇ Quick Setup (3 Steps)

### Step 1: Get Your Sheet URL
Copy the URL of your Google Sheet with Facebook leads:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
```

### Step 2: Configure Environment
Add to `.env` file:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Step 3: Connect in CRM
1. Click "Google Sheets" in sidebar
2. Connect with Google (or paste token)
3. Paste your sheet URL
4. Test connection Γ£à
5. **Field mapping is already pre-configured!**
6. Start syncing

---

## ≡ƒô¥ Example Data Processing

### Your Google Sheet Row:
```
full_name: John Doe
email: john@example.com
phone_number: p:+919876543210
your_highest_qualification: MBBS
in_which_program_are_you_interested_?: Fellowship in Pediatrics
country: India
form_name: Fellow Pediatric
lead_status: Success
```

### Imported to CRM as:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",  ΓåÉ p: prefix removed
  "qualification": "MBBS",
  "course": "Fellowship in Pediatrics",
  "country": "India",
  "source": "Fellow Pediatric",
  "status": "Success"
}
```

---

## ≡ƒ¢í∩╕Å Test Lead Filtering

The system automatically **skips test leads** that contain:
- `<test lead: dummy data for ...>`
- Email: `test@meta.com`
- Any field with "dummy data"

Your real leads will be imported, test leads will be ignored! Γ£à

---

## ≡ƒöº Your Sheet Structure Analysis

Based on your data, you have these columns:

### Lead Information:
- Γ£à full_name
- Γ£à email
- Γ£à phone_number (with p: prefix)
- Γ£à country

### Program Interest:
- Γ£à your_highest_qualification
- Γ£à in_which_program_are_you_interested_?

### Facebook Ad Details:
- ad_id, ad_name
- adset_id, adset_name
- campaign_id, campaign_name
- form_id, form_name

### Lead Tracking:
- Γ£à lead_status
- created_time
- is_organic
- platform

All relevant fields are pre-mapped for you!

---

## ≡ƒÆí Workflow Options

### Option 1: Manual Export + Sync
1. Export Facebook leads to Google Sheets manually
2. Run manual sync in CRM
3. Leads imported immediately

### Option 2: Auto-Export + Auto-Sync
1. Use Zapier/Make to auto-export Facebook ΓåÆ Google Sheets
2. Enable auto-sync in CRM (every 5-15 minutes)
3. Fully automated lead flow! ≡ƒÄë

---

## ≡ƒÄ« How to Use

### First Time Setup:
```bash
1. npm run dev
2. Login to CRM
3. Click "Google Sheets" (sidebar)
4. Connect with Google
5. Paste sheet URL: https://docs.google.com/spreadsheets/d/...
6. Sheet name: Sheet1 (or your tab name)
7. Click "Test Connection"
8. Verify field mapping (already pre-configured!)
9. Click "Save Settings"
10. Go to "Sync Status" tab
11. Click "Start Manual Sync"
```

### After First Sync:
```bash
Option A: Enable "Auto-Sync" for automatic imports
Option B: Click "Start Manual Sync" when you add new leads
```

---

## ≡ƒôè Recommended Sync Settings

Based on your Facebook leads usage:

### Low Volume (< 50 leads/day):
- **Sync Interval**: Every 15-30 minutes
- **Method**: Auto-Sync

### Medium Volume (50-200 leads/day):
- **Sync Interval**: Every 5-15 minutes
- **Method**: Auto-Sync

### High Volume (200+ leads/day):
- **Sync Interval**: Every 1-5 minutes
- **Method**: Auto-Sync
- **Consider**: Direct Facebook integration instead

---

## ≡ƒöì Monitoring Your Imports

Go to **"Sync Status"** tab to see:

```
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé Total Imported  Γöé  245   Γöé
Γöé Success         Γöé  242   Γöé
Γöé Errors          Γöé   3    Γöé
Γöé Last Sync       Γöé  2m agoΓöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö┤ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
```

Errors are usually:
- Missing required field (name or email)
- Invalid data format
- API connection issues

---

## ≡ƒÄ» Advanced: Add More Columns

You can add these columns to your Google Sheet for richer data:

| Add to Sheet | Maps to CRM |
|--------------|-------------|
| company | Company |
| city | City |
| designation | Designation |
| notes | Notes |
| branch | Branch |

The field mapper will auto-detect them!

---

## ≡ƒöä Complete Workflow

```
Facebook Lead Ad
    Γåô
Google Sheet (manual/auto export)
    Γåô
CRM Google Sheets Integration (auto-sync)
    Γåô
CRM Database (leads available)
    Γåô
Lead Management / Follow-up
```

---

## ΓÜÖ∩╕Å Field Mapping Customization

If you want to change the default mapping:

1. Go to **"Field Mapping"** tab
2. Find the column name (e.g., "form_name")
3. Change dropdown to different CRM field
4. Click "Save Field Mapping"

Example customization:
```
full_name ΓåÆ name Γ£ô (default)
form_name ΓåÆ source Γ£ô (default)
form_name ΓåÆ notes Γ£ù (if you want to change)
```

---

## ≡ƒÜ¿ Important Notes

### Phone Numbers:
Γ£à System automatically removes "p:" prefix
- `p:+919876543210` becomes `+919876543210`

### Test Leads:
Γ£à System automatically skips test leads
- Looks for `<test lead:` in any field
- Skips `test@meta.com` emails

### Duplicate Detection:
Γ£à Checks email before creating lead
- If email exists ΓåÆ **updates** existing lead
- If new email ΓåÆ creates new lead

### Lead Status Mapping:
Your "lead_status" column values:
- "Success" ΓåÆ imported as status
- Maps to CRM status field
- You can customize this in field mapping

---

## ≡ƒô▒ Example Sheet Template

Create a separate clean sheet with your actual leads:

```
| full_name | email | phone_number | your_highest_qualification | in_which_program_are_you_interested_? | country | form_name | lead_status |
|-----------|-------|--------------|----------------------------|---------------------------------------|---------|-----------|-------------|
| Dr. Amit Kumar | amit@hospital.com | p:+919876543210 | MBBS, MD | Fellowship in Cardiology | India | Cardio Fellowship | New |
| Dr. Priya Sharma | priya@clinic.com | p:+919876543211 | MBBS | Fellowship in Pediatrics | India | Pediatric Fellowship | Contacted |
```

---

## Γ£à Troubleshooting

### Issue: Test leads being imported
**Solution:** System now auto-skips them! Update guaranteed!

### Issue: Phone showing "p:+919..."
**Solution:** System now auto-removes "p:" prefix!

### Issue: Column names not recognized
**Solution:** 
1. Check exact spelling in your sheet
2. Go to "Field Mapping" tab
3. Manually map the column

### Issue: "in_which_program_are_you_interested_?" not mapping
**Solution:** Already pre-configured to map to "course" field!

---

## ≡ƒÄë Summary

Your Google Sheets integration is now **optimized for Facebook leads**:

Γ£à Pre-configured field mapping for your columns
Γ£à Auto-removes "p:" from phone numbers  
Γ£à Auto-skips test leads with dummy data
Γ£à Maps qualification and program interest
Γ£à Ready to use immediately

**Next Steps:**
1. Add `VITE_GOOGLE_CLIENT_ID` to .env
2. Restart server: `npm run dev`
3. Navigate to "Google Sheets" in CRM
4. Connect and start syncing!

---

**Questions?** The integration is specifically tuned for your Facebook ΓåÆ Google Sheets workflow! ≡ƒÜÇ
