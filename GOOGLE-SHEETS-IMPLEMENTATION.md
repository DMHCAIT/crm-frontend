# Google Sheets CRM Integration - Implementation Guide

## Γ£à What Has Been Implemented

Your CRM now has a **complete Google Sheets integration** that allows you to:
- Import leads automatically from any Google Sheet
- Map Google Sheets columns to CRM fields
- Auto-sync leads at regular intervals
- Manual sync on demand
- Track sync statistics and errors
- OAuth authentication with Google

---

## ≡ƒôü Files Added/Modified

### New Files Created:
1. **`src/components/GoogleSheetsIntegration.tsx`** - Main integration component
2. **`GOOGLE-SHEETS-SETUP.md`** - Detailed setup guide
3. **`GOOGLE-SHEETS-IMPLEMENTATION.md`** - This file

### Modified Files:
1. **`src/App.tsx`** - Added Google Sheets route
2. **`src/components/Sidebar.tsx`** - Added Google Sheets menu item
3. **`src/components/Integrations.tsx`** - Added Google Sheets to integrations list

---

## ≡ƒÜÇ How to Use

### Option 1: Navigate from Sidebar
1. Start your development server: `npm run dev`
2. Log in to your CRM
3. Click **"Google Sheets"** in the left sidebar
4. Follow the setup wizard

### Option 2: Navigate from Integrations Page
1. Go to **"Integrations"** page
2. Find **"Google Sheets"** card
3. Click **"Connect"** button
4. (Note: This will be enhanced in next version to auto-navigate)

---

## ≡ƒöº Setup Steps

### Step 1: Google Cloud Platform Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google Sheets API**
4. Create OAuth 2.0 Credentials:
   - Type: Web application
   - Authorized redirect URIs:
     - `http://localhost:5173/oauth/google/callback` (development)
     - `https://your-domain.com/oauth/google/callback` (production)
5. Copy the **Client ID**

### Step 2: Add Environment Variable

Create or update your `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

### Step 3: Restart Server

```bash
npm run dev
```

### Step 4: Configure in CRM

1. Navigate to Google Sheets integration
2. Click "Connect with Google" OR paste access token
3. Enter your Google Sheets URL
4. Enter sheet name (default: "Sheet1")
5. Test connection
6. Map fields
7. Start syncing!

---

## ≡ƒôè Google Sheets Format

Your Google Sheet should look like this:

```
| Name          | Email            | Phone        | Course      | Source    | Notes       |
|---------------|------------------|--------------|-------------|-----------|-------------|
| John Doe      | john@email.com   | 555-1234     | MBA         | Website   | Interested  |
| Jane Smith    | jane@email.com   | 555-5678     | Engineering | Referral  | Follow up   |
```

**Important:**
- First row must be headers
- Each subsequent row is one lead
- At minimum, include Name column
- Email recommended for duplicate detection

---

## ≡ƒöä Sync Options

### Auto-Sync (Recommended)
- Enable in Setup tab
- Choose interval: 1, 5, 15, 30, or 60 minutes
- Runs in background automatically
- Best for continuous lead capture

### Manual Sync
- Go to Sync Status tab
- Click "Start Manual Sync"
- Import on-demand
- Best for one-time imports

---

## ≡ƒù║∩╕Å Field Mapping

Map your Google Sheets columns to CRM fields:

| Google Sheet Column | ΓåÆ | CRM Field       |
|---------------------|---|-----------------|
| Name                | ΓåÆ | Lead Name       |
| Email               | ΓåÆ | Email           |
| Phone               | ΓåÆ | Phone           |
| Company             | ΓåÆ | Company         |
| Course              | ΓåÆ | Course          |
| Qualification       | ΓåÆ | Qualification   |
| Branch              | ΓåÆ | Branch          |
| City                | ΓåÆ | Country/City    |
| Designation         | ΓåÆ | Designation     |
| Source              | ΓåÆ | Source          |
| Status              | ΓåÆ | Status          |
| Notes               | ΓåÆ | Notes           |
| Score               | ΓåÆ | Score           |

---

## ≡ƒöÆ Security Features

1. **OAuth 2.0** - Secure authentication with Google
2. **Token Storage** - Tokens stored in localStorage (encrypted in production)
3. **Read-Only Access** - Integration only reads sheets, never writes
4. **Duplicate Detection** - Checks email before creating leads
5. **Error Handling** - Graceful handling of API failures

---

## ΓÜá∩╕Å Important Notes

### API Limits
Google Sheets API has rate limits:
- **100 requests per 100 seconds per user**
- **60 requests per minute per user**

**Recommendation:** Use sync intervals of 5+ minutes for large sheets

### Duplicate Handling
- System checks for existing leads by **email**
- If lead exists ΓåÆ **updates** existing record
- If no email ΓåÆ creates new lead (may create duplicates)

### Error Scenarios
Common errors and solutions:
1. **"Failed to connect"** ΓåÆ Check access token validity
2. **"No data found"** ΓåÆ Verify sheet has data
3. **"Invalid spreadsheet ID"** ΓåÆ Check URL is correct
4. **"Permission denied"** ΓåÆ Ensure you have view access to sheet

---

## ≡ƒÄ¿ Frontend Implementation Details

### Technology Stack
- **React + TypeScript**
- **Lucide React** (icons)
- **TailwindCSS** (styling)
- **Google Sheets API v4**
- **OAuth 2.0**

### Component Structure
```
GoogleSheetsIntegration
Γö£ΓöÇΓöÇ Setup Tab (Authentication & Configuration)
Γö£ΓöÇΓöÇ Field Mapping Tab (Column to Field mapping)
Γö£ΓöÇΓöÇ Sync Status Tab (Statistics & Manual Sync)
ΓööΓöÇΓöÇ Setup Guide Tab (Instructions)
```

### State Management
- Local state with React hooks
- localStorage for persistence
- Real-time sync status updates

### API Integration
```typescript
// Fetch spreadsheet data
GET https://sheets.googleapis.com/v4/spreadsheets/{id}

// Fetch sheet values
GET https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{range}
```

---

## ≡ƒöù Backend Integration

The component integrates with your backend using:

```typescript
import { getApiClient } from '../lib/backend';

const api = getApiClient();
await api.post('/leads', leadData);  // Create lead
await api.put(`/leads/${id}`, leadData);  // Update lead
await api.get('/leads', { params: { email } });  // Check existing
```

---

## ≡ƒôê Future Enhancements

Potential improvements for next version:

1. **Webhook Support** - Real-time push from Google Sheets
2. **Bidirectional Sync** - Write CRM updates back to sheets
3. **Multiple Sheets** - Sync from multiple sheets simultaneously
4. **Advanced Filters** - Conditional imports based on criteria
5. **Bulk Operations** - Bulk update/delete operations
6. **Custom Transformations** - Data transformations during import
7. **Scheduling** - Advanced scheduling options
8. **Notifications** - Email alerts on sync completion/errors
9. **Audit Logs** - Detailed import history
10. **Sheet Templates** - Predefined sheet templates

---

## ≡ƒº¬ Testing

### Test the Integration:

1. **Create Test Sheet**
   ```
   | Name       | Email           | Phone     |
   |------------|-----------------|-----------|
   | Test Lead  | test@test.com   | 555-0000  |
   ```

2. **Share Sheet** - Make it viewable by anyone with link

3. **Connect in CRM** - Follow setup steps

4. **Test Connection** - Should show "Successfully connected"

5. **Map Fields** - Map columns to CRM fields

6. **Manual Sync** - Click "Start Manual Sync"

7. **Verify** - Check Leads Management page for imported lead

---

## ≡ƒÉ¢ Troubleshooting

### No Google Sheets Menu Item?
- Ensure server was restarted after .env changes
- Check that Sidebar.tsx was updated
- Clear browser cache and reload

### OAuth Popup Blocked?
- Allow popups for your CRM domain
- Use manual token method as alternative

### Sync Fails Silently?
- Open browser console (F12)
- Look for error messages
- Check network tab for failed API calls
- Verify backend API is running

### Leads Not Appearing?
- Check Sync Status tab for error count
- Verify field mapping is correct
- Ensure lead has at least "name" field
- Check backend logs for errors

---

## ≡ƒô₧ Support

If you encounter issues:

1. **Check Setup Guide:** `GOOGLE-SHEETS-SETUP.md`
2. **Review Browser Console:** F12 ΓåÆ Console tab
3. **Check Network Tab:** F12 ΓåÆ Network tab
4. **Verify Backend Logs:** Check your backend server logs
5. **Test API Directly:** Use Google OAuth Playground

---

## Γ£¿ Summary

**Frontend-Based Integration:** Γ£à
- All logic in frontend component
- No additional backend code needed
- Uses existing backend API endpoints
- Follows Facebook integration pattern

**Features Implemented:** Γ£à
- OAuth authentication
- Test connection
- Field mapping
- Auto-sync
- Manual sync
- Sync statistics
- Error handling
- Setup guide

**Next Steps:**
1. Get Google OAuth credentials
2. Add Client ID to .env
3. Restart server
4. Navigate to Google Sheets in CRM
5. Follow setup wizard
6. Start importing leads!

---

**Questions or need help?** Check the `GOOGLE-SHEETS-SETUP.md` for detailed setup instructions! ≡ƒÜÇ
