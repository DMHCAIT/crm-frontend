# 🎯 Quick Reference Card - Cunnekt WhatsApp Integration

```
╔════════════════════════════════════════════════════════════════════════════╗
║                   CUNNEKT WHATSAPP - QUICK REFERENCE                        ║
╚════════════════════════════════════════════════════════════════════════════╝
```

## 📍 Your Webhook URL (Copy This!)
```
https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=webhook
```
**Configure this in Cunnekt Dashboard → Settings → Webhooks**

---

## 🔗 All Endpoints

| Action | URL |
|--------|-----|
| Webhook | `?action=webhook` |
| Send Message | `?action=send-message` |
| Send Bulk | `?action=send-bulk` |
| Get Campaigns | `?action=get-campaigns` |
| Get Responses | `?action=get-responses` |
| Save Campaign | `?action=save-campaign` |
| Get Status | `?action=get-status` |
| Test Connection | `?action=test-connection` |

**Base URL:** `https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp`

---

## 🧪 Quick Test Commands

### Test Connection (Should work immediately)
```bash
curl https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=test-connection
```

### Test Webhook (Simulates incoming message)
```bash
curl -X POST https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"message.received","data":{"from":"1234567890","message":"test"}}'
```

### Test Send Message
```bash
curl -X POST https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=send-message \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890","message":"Test","leadId":"123"}'
```

---

## 📊 Check Logs

### Render Logs (Backend)
```
https://dashboard.render.com → Your service → Logs

Look for:
🔵 Starting API call
📱 Phone number
💬 Message content
📤 Sending to Cunnekt
✅ Success
❌ Error
```

### Browser Console (Frontend)
```
Press F12 → Console tab

Look for:
- API requests to /api/cunnekt-whatsapp
- Response data
- Error messages
```

### Supabase Database
```sql
-- View recent messages
SELECT * FROM communications 
WHERE type = 'whatsapp' 
ORDER BY sent_at DESC LIMIT 10;

-- View campaigns
SELECT * FROM whatsapp_campaigns 
ORDER BY created_at DESC LIMIT 10;
```

---

## ✅ 3-Step Setup

### 1️⃣ Run SQL in Supabase (5 minutes)
```
1. Open: https://app.supabase.com
2. Click: SQL Editor
3. Paste: create-campaigns-table.sql contents
4. Click: Run
5. Verify: Tables created
```

### 2️⃣ Configure Webhook in Cunnekt (2 minutes)
```
1. Open: https://app2.cunnekt.com
2. Go to: Settings → Webhooks
3. Add URL: https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=webhook
4. Enable: message.received, message.status
5. Test & Save
```

### 3️⃣ Test in CRM (1 minute)
```
1. Open CRM → Lead Segmentation
2. Click: Advanced Marketing Hub
3. Create: Test campaign
4. Check: Responses tab
5. Verify: Campaign persists after refresh
```

---

## 🐛 Troubleshooting Flowchart

```
Problem: Endpoints returning 404
   ├─► Check: Render deployment status
   ├─► Wait: 2-3 minutes for deployment
   └─► Verify: Commit 9418c7d deployed

Problem: Webhook not receiving
   ├─► Check: Cunnekt webhook configuration
   ├─► Test: Manual curl command
   ├─► Verify: Render logs show "webhook received"
   └─► Check: Webhook URL is correct

Problem: Database errors
   ├─► Check: Tables exist in Supabase
   ├─► Run: create-campaigns-table.sql
   └─► Verify: RLS policies configured

Problem: Messages not sending
   ├─► Check: Render logs for 🔵📱💬📤✅❌
   ├─► Look for: ❌ error messages
   ├─► Verify: CUNNEKT_API_KEY in environment
   └─► Test: ?action=test-connection
```

---

## 🎯 Auto-Response Keywords

| Keyword | Auto Response |
|---------|---------------|
| `info`, `course`, `details` | Course information + CTA |
| `callback`, `call me` | Callback confirmation |
| `fee`, `price`, `cost` | Pricing info + CTA |
| `admission`, `enroll` | Enrollment info |

**Note:** Keywords are case-insensitive and partial match

---

## 📱 Message Flow

```
SENDING:
You → Frontend → Backend → Cunnekt → WhatsApp → Lead

RECEIVING:
Lead → WhatsApp → Cunnekt → Backend (webhook) → Database → Frontend
```

---

## 🔐 Environment Variables

**In Render.com Dashboard:**
```
CUNNEKT_API_KEY = 4d776c1d10d186e225f1985095d201eb9cc41ad4
CUNNEKT_BASE_URL = https://app2.cunnekt.com/v1
SUPABASE_URL = [your-supabase-url]
SUPABASE_KEY = [your-supabase-key]
```

---

## 📈 Success Indicators

**✅ Everything is working when:**

1. Test script shows all ✅
2. Render logs show emoji logs (🔵📱💬📤✅)
3. Cunnekt test webhook succeeds
4. Database has new communications rows
5. Frontend "Responses" tab shows messages
6. Campaigns persist after page refresh
7. Auto-responses sent for keywords
8. Leads receive WhatsApp messages

---

## 🚀 Deployment Info

| Service | Status | URL |
|---------|--------|-----|
| **Backend** | ✅ Deployed | https://crm-backend-vvpn.onrender.com |
| **Frontend** | ✅ Deployed | Check Vercel dashboard |
| **Database** | ⚠️ Run SQL | https://app.supabase.com |
| **Webhook** | ⚠️ Configure | https://app2.cunnekt.com |

**Commits:**
- Backend: `9418c7d`
- Frontend: `c28842f`

---

## 📚 Documentation Files

```
WEBHOOK_SETUP_GUIDE.md ............... Webhook configuration
DATABASE_SETUP_INSTRUCTIONS.md ....... SQL setup guide
INTEGRATION_FLOW_DIAGRAM.md ......... Visual diagrams
CAMPAIGN_PERSISTENCE_FIX.md ......... Technical details
DEPLOYMENT_STATUS.md ................. Deployment checklist
COMPLETE_SETUP_SUMMARY.md ........... This summary
create-campaigns-table.sql ........... Database schema
test-cunnekt-endpoints.sh ............ Testing script
```

---

## 🆘 Emergency Debugging

**If nothing works:**

1. **Check Render is running**
   ```bash
   curl https://crm-backend-vvpn.onrender.com/api/health
   ```

2. **View Render logs**
   - https://dashboard.render.com
   - Click service → Logs
   - Look for errors

3. **Check Supabase**
   ```sql
   SELECT COUNT(*) FROM whatsapp_campaigns;
   SELECT COUNT(*) FROM communications;
   ```

4. **Verify environment variables**
   - Render → Environment tab
   - Check CUNNEKT_API_KEY exists

5. **Test webhook manually**
   ```bash
   bash test-cunnekt-endpoints.sh
   ```

---

## 📞 Support Resources

| Resource | Location |
|----------|----------|
| Backend Logs | https://dashboard.render.com |
| Frontend Logs | Browser Console (F12) |
| Database | https://app.supabase.com |
| Cunnekt Dashboard | https://app2.cunnekt.com |
| Test Script | `bash test-cunnekt-endpoints.sh` |

---

## ⚡ Quick Commands

```bash
# Test all endpoints
cd /Users/rubeenakhan/Downloads/CRM && bash test-cunnekt-endpoints.sh

# Check backend logs
# Go to: https://dashboard.render.com → Service → Logs

# Check database
# Go to: https://app.supabase.com → SQL Editor
# Run: SELECT * FROM communications ORDER BY sent_at DESC LIMIT 10;

# Test webhook
curl -X POST https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"message.received","data":{"from":"1234567890","message":"test"}}'
```

---

**Print this page for quick reference!**

**Last Updated:** January 2025  
**Status:** ✅ Code deployed, ⏳ Configuration pending  
**Backend:** 9418c7d | **Frontend:** c28842f
