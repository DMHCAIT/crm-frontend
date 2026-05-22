# Google Sheets Integration Setup Guide

## Overview
This guide will help you connect Google Sheets to your CRM to automatically import leads.

## Prerequisites
1. A Google account
2. A Google Sheet with lead data
3. Google Cloud Platform project with Sheets API enabled

---

## Step 1: Prepare Your Google Sheet

### Sheet Structure
Your Google Sheet should be structured with:
- **First row**: Column headers (Name, Email, Phone, etc.)
- **Subsequent rows**: One lead per row

### Example Sheet Structure:
```
| Name          | Email            | Phone        | Course      | Source       | Notes           |
|---------------|------------------|--------------|-------------|--------------|-----------------|
| John Doe      | john@email.com   | 555-1234     | MBA         | Website      | Interested     |
| Jane Smith    | jane@email.com   | 555-5678     | Engineering | Referral     | Follow up      |
```

---

## Step 2: Set Up Google Cloud Platform

### 2.1 Create a Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a Project" ΓåÆ "New Project"
3. Give it a name (e.g., "CRM Integrations")
4. Click "Create"

### 2.2 Enable Google Sheets API
1. In your project, go to "APIs & Services" ΓåÆ "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

### 2.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" ΓåÆ "Credentials"
2. Click "Create Credentials" ΓåÆ "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: Your CRM name
   - User support email: your email
   - Scopes: Add `../auth/spreadsheets.readonly`
4. Click "Save and Continue"

5. Back to Create OAuth client ID:
   - Application type: **Web application**
   - Name: "CRM Google Sheets Integration"
   - Authorized redirect URIs: Add these URLs:
     ```
     http://localhost:5173/oauth/google/callback
     https://yourdomain.com/oauth/google/callback
     ```
6. Click "Create"
7. **Copy the Client ID** - you'll need this!

---

## Step 3: Configure Your CRM

### 3.1 Add Environment Variable
Add this to your `.env` file in the root of your project:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

Replace `your_client_id_here` with the Client ID you copied.

### 3.2 Restart Development Server
```bash
npm run dev
```

---

## Step 4: Connect Google Sheets in CRM

### 4.1 Navigate to Integration
1. Log in to your CRM
2. Go to **Integrations** page
3. Find **Google Sheets** integration
4. Click **"Connect"** or **"Configure"**

### 4.2 Authenticate
**Option 1: OAuth (Recommended)**
1. Click "Connect with Google"
2. A popup will open asking you to sign in
3. Grant permissions to read your spreadsheets
4. The popup will close automatically once authenticated

**Option 2: Manual Token**
1. Get an access token manually from [OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. Paste it in the "Access Token (Manual)" field

### 4.3 Enter Spreadsheet Details
1. **Spreadsheet URL**: Paste the full URL of your Google Sheet
   - Example: `https://docs.google.com/spreadsheets/d/1ABC123xyz/edit`
2. **Sheet Name**: Enter the tab name (default: "Sheet1")
3. Click **"Test Connection"**

You should see: Γ£à "Successfully connected to [Your Sheet Name]"

---

## Step 5: Map Fields

### 5.1 Go to Field Mapping Tab
1. Click the **"Field Mapping"** tab
2. You'll see all columns from your Google Sheet

### 5.2 Map Each Column
For each Google Sheet column:
- Select the corresponding CRM field from the dropdown
- Or select "-- Don't Import --" to skip that column

### Recommended Mappings:
| Google Sheet Column | CRM Field       |
|---------------------|-----------------|
| Name                | Lead  Name      |
| Email               | Email           |
| Phone               | Phone           |
| Company             | Company         |
| Course              | Course          |
| Source              | Source          |
| Status              | Status          |
| Notes               | Notes           |

### 5.3 Save Mapping
Click **"Save Field Mapping"** button

---

## Step 6: Sync Your Leads

### Option 1: Manual Sync
1. Go to **"Sync Status"** tab
2. Click **"Start Manual Sync"**
3. Wait for the sync to complete
4. Check the statistics:
   - Total Imported
   - Success Count
   - Error Count

### Option 2: Auto-Sync (Recommended)
1. In the **"Setup"** tab, enable **"Auto-Sync"** toggle
2. Select sync interval:
   - Every 1 minute (for real-time updates)
   - Every 5 minutes (recommended)
   - Every 15 minutes
   - Every 30 minutes
   - Every hour
3. Click **"Save Settings"**

Your leads will now be automatically imported!

---

## Troubleshooting

### Error: "Failed to connect to Google Sheets"
**Solutions:**
- Check that your access token is valid
- Verify the spreadsheet ID is correct
- Ensure you have "View" permission on the sheet
- Try re-authenticating with Google

### Error: "No data found in sheet"
**Solutions:**
- Make sure the sheet has at least 2 rows (headers + data)
- Check that the sheet name matches exactly (case-sensitive)
- Verify the sheet is not completely empty

### Leads Not Importing
**Solutions:**
- Check field mapping - ensure critical fields like "Name" are mapped
- Verify auto-sync is enabled and running
- Look at error count in Sync Status tab
- Check browser console for error messages

### Duplicate Leads
**Solution:**
The system checks for existing leads by email before importing. If leads don't have emails, they may be duplicated. Ensure your leads have email addresses.

---

## Security Best Practices

1. **Never share your access tokens** - they provide full access to your Google account
2. **Use OAuth** instead of manual tokens when possible
3. **Revoke access** if you suspect token compromise:
   - Go to [Google Account Permissions](https://myaccount.google.com/permissions)
   - Find your CRM app and revoke access
   - Re-authenticate
4. **Share sheets carefully** - only give CRM access to sheets you want to import

---

## Advanced Features

### Handling Updates
When a lead already exists in the CRM (matched by email), the system will:
- **Update** the existing lead with new data from Google Sheets
- Preserve data not present in the sheet
- Update the "updated_at" timestamp

### Performance Tips
For large sheets (1000+ rows):
- Use longer sync intervals (15-30 minutes)
- Consider breaking data into multiple sheets
- Monitor your Google API quota

### API Limits
Google Sheets API has these limits:
- **Read requests**: 100 per 100 seconds per user
- **Per minute quota**: 60 per minute per user

If you hit limits:
- Increase sync interval
- Contact Google to request quota increase

---

## Need Help?

**Common Issues:**
- Integration not appearing? Check that you've added the environment variable and restarted the server
- Can't authenticate? Verify your OAuth redirect URIs are correct
- Sync failing? Check the browser console for detailed error messages

**Still stuck?**
Contact your CRM administrator or check the application logs.

---

## Summary Checklist

- [ ] Google Sheet prepared with proper structure
- [ ] Google Cloud Project created
- [ ] Google Sheets API enabled
- [ ] OAuth 2.0 credentials created
- [ ] Client ID added to .env file
- [ ] Server restarted
- [ ] Connected to Google in CRM
- [ ] Spreadsheet URL entered
- [ ] Test connection successful
- [ ] Fields mapped
- [ ] First sync completed
- [ ] Auto-sync enabled (optional)

---

**Congratulations!** ≡ƒÄë Your Google Sheets is now connected to your CRM!
