# ≡ƒÜÇ Google Sheets Integration - Quick Start

## Γ£à Done - Already Implemented!
Your CRM now has Google Sheets integration ready to use!

---

## ≡ƒÄ» Answer to Your Question

### **Frontend or Backend?**
**Answer: FRONTEND** Γ£à

**Why Frontend?**
- Your existing Facebook integration is frontend-based
- Google Sheets API works great from browser
- No additional backend server needed
- Easier to maintain and debug
- Direct OAuth authentication

---

## ≡ƒô¥ Quick Setup (5 Minutes)

### 1. Get Google Credentials
```
1. Go to: https://console.cloud.google.com
2. Create project ΓåÆ Enable "Google Sheets API"
3. Create OAuth 2.0 Web Application
4. Add redirect URI: http://localhost:5173/oauth/google/callback
5. Copy Client ID
```

### 2. Add to .env File
```env
VITE_GOOGLE_CLIENT_ID=paste_your_client_id_here
```

### 3. Restart Server
```bash
npm run dev
```

### 4. Open CRM
```
1. Click "Google Sheets" in left sidebar
2. Click "Connect with Google"
3. Paste your Google Sheets URL
4. Click "Test Connection"
5. Map your fields
6. Start syncing!
```

---

## ≡ƒôè Prepare Your Google Sheet

```
Row 1 (Headers):  | Name | Email | Phone | Course | Source |
Row 2+ (Data):    | John Doe | john@example.com | 555-1234 | MBA | Website |
```

**That's it!** First row = headers, other rows = leads.

---

## ≡ƒÄ« How to Use

### Access Integration:
- **Sidebar** ΓåÆ Click "Google Sheets"
- **OR Integrations Page** ΓåÆ Find Google Sheets card

### Two Sync Methods:
1. **Auto-Sync** - Automatic every X minutes (recommended)
2. **Manual Sync** - On-demand button click

---

## ≡ƒù║∩╕Å How It Works

```
Your Google Sheet ΓåÆ Google Sheets API ΓåÆ Frontend Component ΓåÆ Your CRM Backend ΓåÆ Database
```

1. Frontend authenticates with Google OAuth
2. Reads your sheet via Google Sheets API
3. Maps columns to CRM fields
4. Sends to your existing backend API
5. Creates/updates leads in database

---

## ≡ƒôì Files Created/Modified

### New Files:
- Γ£à `src/components/GoogleSheetsIntegration.tsx` - Main component
- Γ£à `GOOGLE-SHEETS-SETUP.md` - Full setup guide
- Γ£à `GOOGLE-SHEETS-IMPLEMENTATION.md` - Technical details

### Modified Files:
- Γ£à `src/App.tsx` - Added route
- Γ£à `src/components/Sidebar.tsx` - Added menu item  
- Γ£à `src/components/Integrations.tsx` - Added to list

---

## ≡ƒöÑ Features

Γ£à OAuth 2.0 authentication
Γ£à Test connection before syncing
Γ£à Custom field mapping
Γ£à Auto-sync (1, 5, 15, 30, 60 min intervals)
Γ£à Manual sync on-demand
Γ£à Sync statistics (success/error counts)
Γ£à Duplicate detection (by email)
Γ£à Real-time status updates
Γ£à Error handling
Γ£à Setup wizard

---

## ΓÜí Quick Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## ≡ƒÄ» Example Google Sheet

Copy this template to get started:

```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit

Sheet Structure:
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé Name         Γöé Email           Γöé Phone    Γöé Course   Γöé Source   Γöé
Γö£ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöñ
Γöé John Smith   Γöé john@email.com  Γöé 555-0100 Γöé MBA      Γöé Website  Γöé
Γöé Jane Doe     Γöé jane@email.com  Γöé 555-0101 Γöé Medicine Γöé Referral Γöé
Γöé Bob Johnson  Γöé bob@email.com   Γöé 555-0102 Γöé Law      Γöé Facebook Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö┤ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö┤ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö┤ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö┤ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
```

---

## ΓÜá∩╕Å Important

### Before First Use:
1. Γ£à Add `VITE_GOOGLE_CLIENT_ID` to .env
2. Γ£à Restart development server
3. Γ£à Make sure Google Sheet is viewable
4. Γ£à First row must be headers

### Sync Frequency:
- **Small sheets (<100 rows)**: Every 1-5 minutes
- **Large sheets (1000+ rows)**: Every 15-30 minutes
- **Very large sheets**: Every hour OR manual only

### Google API Limits:
- 100 requests per 100 seconds
- 60 requests per minute

---

## ≡ƒÉ¢ Common Issues

| Issue | Solution |
|-------|----------|
| No "Google Sheets" menu? | Restart server after adding .env |
| OAuth popup blocked? | Allow popups or use manual token |
| "Failed to connect"? | Check Client ID and access token |
| "No data found"? | Verify sheet has 2+ rows |
| Leads not importing? | Check field mapping is correct |
| Duplicates created? | Ensure leads have email addresses |

---

## ≡ƒôÜ More Info

- **Full Setup Guide**: `GOOGLE-SHEETS-SETUP.md`
- **Technical Details**: `GOOGLE-SHEETS-IMPLEMENTATION.md`
- **Google API Docs**: https://developers.google.com/sheets/api

---

## ≡ƒÄë You're All Set!

**Next Steps:**
1. Get your Google Client ID
2. Add it to `.env`
3. Restart server: `npm run dev`
4. Navigate to **Google Sheets** in sidebar
5. Follow the setup wizard

**That's it!** Your leads will start flowing into your CRM automatically! ≡ƒÜÇ

---

## ≡ƒÆí Pro Tips

- **Use Auto-Sync** for continuous lead capture
- **Map all important fields** for complete data
- **Monitor Sync Status tab** to catch errors early
- **Test with small sheet first** before importing thousands
- **Keep email column** for duplicate detection
- **Share sheet as "View only"** for security

---

**Questions?** Check `GOOGLE-SHEETS-SETUP.md` for step-by-step guide with screenshots!
