# 🔗 Cunnekt WhatsApp Webhook Setup Guide

## Overview
This guide walks you through setting up the webhook callback URL in Cunnekt dashboard to receive incoming WhatsApp messages and delivery status updates.

---

## 📍 **Your Webhook URL**

```
https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=webhook
```

**Method:** POST  
**Content-Type:** application/json

---

## 🛠️ **Step 1: Configure Webhook in Cunnekt Dashboard**

### Access Cunnekt Dashboard:
1. Go to https://app2.cunnekt.com
2. Log in with your credentials
3. Navigate to **Settings** or **Webhooks** section

### Add Webhook URL:
1. Click **"Add Webhook"** or **"Configure Webhook"**
2. Enter the webhook URL:
   ```
   https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=webhook
   ```
3. Select events to receive:
   - ✅ **message.received** (incoming messages from leads)
   - ✅ **message.sent** (message sent successfully)
   - ✅ **message.delivered** (message delivered to recipient)
   - ✅ **message.read** (message read by recipient)
   - ✅ **message.failed** (message failed to send)
4. **Save** the webhook configuration

### Verify Webhook:
Most webhook providers have a "Test" button. Click it to verify:
- ✅ Your backend receives the test payload
- ✅ Returns HTTP 200 OK response

---

## 📨 **Step 2: Webhook Payload Examples**

### Incoming Message (message.received)
```json
{
  "type": "message.received",
  "data": {
    "from": "12345678900",
    "message": "I want more information about Medical Coding course",
    "messageId": "wamid.ABC123...",
    "timestamp": "2025-01-19T10:30:00Z"
  }
}
```

### Message Status Update (message.status)
```json
{
  "type": "message.status",
  "data": {
    "messageId": "msg_abc123",
    "status": "delivered",
    "phone": "12345678900",
    "timestamp": "2025-01-19T10:31:00Z"
  }
}
```

---

## 🔍 **Step 3: Test Webhook Reception**

### Test from Command Line:
```bash
curl -X POST https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "message.received",
    "data": {
      "from": "12345678900",
      "message": "Test message",
      "messageId": "test123"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true
}
```

### Test from Browser Console:
```javascript
fetch('https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'message.received',
    data: {
      from: '12345678900',
      message: 'Test from browser',
      messageId: 'browser_test_123'
    }
  })
})
.then(r => r.json())
.then(console.log);
```

---

## 🎯 **Step 4: Verify Webhook is Working**

### Check Backend Logs (Render.com):
1. Go to https://dashboard.render.com
2. Click your backend service
3. Click **"Logs"** tab
4. Look for this log when webhook is triggered:
   ```
   Cunnekt webhook received: {"type":"message.received","data":{...}}
   ```

### Check Database (Supabase):
```sql
-- View incoming messages
SELECT 
  id,
  lead_id,
  content,
  sender,
  status,
  received_at
FROM communications 
WHERE direction = 'inbound' 
  AND type = 'whatsapp'
ORDER BY received_at DESC 
LIMIT 10;
```

### Check Frontend (Responses Tab):
1. Open CRM frontend
2. Go to **Lead Segmentation** → **Advanced Marketing Hub**
3. Click **"Responses"** tab
4. Incoming messages should appear here automatically

---

## 🤖 **Auto-Response Feature**

Your webhook automatically responds to certain keywords:

| **Keyword** | **Auto Response** |
|-------------|-------------------|
| `info`, `course`, `details` | Sends course information with callback CTA |
| `callback`, `call me`, `contact` | Confirms callback request within 2 hours |
| `fee`, `price`, `cost` | Sends pricing info with callback CTA |
| `admission`, `enroll`, `join` | Sends enrollment information |

**Example Flow:**
1. Lead sends: "I need info about Medical Coding"
2. Webhook receives message → Logs to database
3. Auto-response triggers: "Thank you for your interest! 🎓 We offer courses in..."
4. Response appears in "Responses" tab in real-time

---

## 📤 **Sending Messages (Endpoints Already Set Up)**

### 1. Send Single Message
```bash
POST https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=send-message
Content-Type: application/json

{
  "phone": "12345678900",
  "message": "Hello! Thank you for your interest.",
  "leadId": "123"
}
```

### 2. Send Bulk Messages
```bash
POST https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=send-bulk
Content-Type: application/json

{
  "leads": [
    { "id": "1", "name": "John", "phone": "12345678900" },
    { "id": "2", "name": "Jane", "phone": "09876543210" }
  ],
  "message": "Hi {name}! Special offer just for you!",
  "campaignId": "campaign_123"
}
```

### 3. Test Connection
```bash
GET https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=test-connection
```

**Response:**
```json
{
  "success": true,
  "message": "Cunnekt WhatsApp API connected successfully",
  "account": {
    "id": "...",
    "name": "...",
    "status": "active"
  }
}
```

### 4. Get Message Status
```bash
GET https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=get-status&messageId=abc123
```

---

## 🔐 **Security Notes**

### Webhook Security:
- Consider adding webhook signature verification
- Validate incoming payloads
- Rate limit webhook endpoint if needed

### API Key Security:
- API key is stored in environment variable: `CUNNEKT_API_KEY`
- Never expose API key in frontend code
- Rotate API key periodically

---

## 🐛 **Troubleshooting**

### Webhook not receiving messages?

**Check 1: Verify webhook URL is correct**
```bash
# Should return webhook configuration
curl -X GET https://app2.cunnekt.com/v1/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Check 2: Test webhook manually**
```bash
curl -X POST https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"message.received","data":{"from":"12345678900","message":"test"}}'
```

**Check 3: Verify backend is running**
```bash
curl https://crm-backend-vvpn.onrender.com/api/health
```

**Check 4: Check Render logs**
- Go to Render dashboard → Your service → Logs
- Look for "Cunnekt webhook received" messages

### Messages not appearing in frontend?

**Check 1: Verify database has records**
```sql
SELECT * FROM communications 
WHERE direction = 'inbound' 
ORDER BY received_at DESC LIMIT 5;
```

**Check 2: Check frontend is fetching responses**
- Open browser console
- Go to Responses tab
- Look for API call: `/api/cunnekt-whatsapp?action=get-responses`

**Check 3: Verify user has permissions**
- Check RLS policies in Supabase
- User must be authenticated to view responses

### Auto-responses not working?

**Check 1: Verify keyword matching**
- Keywords are case-insensitive
- Must contain the keyword (not exact match)
- Example: "I need info" matches "info" keyword

**Check 2: Check auto-response logs**
```bash
# In Render logs, look for:
Auto-response sent to 12345678900
```

**Check 3: Verify Cunnekt API key**
```bash
curl https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=test-connection
```

---

## 📊 **Monitoring Webhook Activity**

### Real-time Dashboard Query
```sql
-- Webhook activity in last 24 hours
SELECT 
  DATE_TRUNC('hour', received_at) as hour,
  COUNT(*) as message_count,
  COUNT(DISTINCT sender) as unique_senders
FROM communications
WHERE direction = 'inbound'
  AND received_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', received_at)
ORDER BY hour DESC;
```

### Response Rate
```sql
-- Auto-response rate
SELECT 
  COUNT(*) FILTER (WHERE is_auto_response = true) as auto_responses,
  COUNT(*) FILTER (WHERE is_auto_response = false OR is_auto_response IS NULL) as manual_responses,
  ROUND(
    COUNT(*) FILTER (WHERE is_auto_response = true)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as auto_response_percentage
FROM communications
WHERE direction = 'outbound'
  AND type = 'whatsapp'
  AND sent_at > NOW() - INTERVAL '7 days';
```

---

## ✅ **Setup Checklist**

- [ ] Webhook URL added to Cunnekt dashboard
- [ ] Test webhook payload sent successfully
- [ ] Backend logs show "Cunnekt webhook received"
- [ ] Database receives incoming messages
- [ ] Frontend Responses tab shows messages
- [ ] Auto-responses triggered for keywords
- [ ] Test single message sending works
- [ ] Test bulk message sending works
- [ ] Test connection endpoint returns success
- [ ] Monitor logs for any errors

---

## 🔗 **Quick Reference**

| **Purpose** | **URL** | **Method** |
|-------------|---------|------------|
| Webhook Callback | `/api/cunnekt-whatsapp?action=webhook` | POST |
| Send Single Message | `/api/cunnekt-whatsapp?action=send-message` | POST |
| Send Bulk Messages | `/api/cunnekt-whatsapp?action=send-bulk` | POST |
| Test Connection | `/api/cunnekt-whatsapp?action=test-connection` | GET |
| Get Message Status | `/api/cunnekt-whatsapp?action=get-status` | GET |
| Get Campaigns | `/api/cunnekt-whatsapp?action=get-campaigns` | GET |
| Get Responses | `/api/cunnekt-whatsapp?action=get-responses` | GET |
| Save Campaign | `/api/cunnekt-whatsapp?action=save-campaign` | POST |

---

## 📞 **Support**

If you encounter issues:

1. **Check backend logs**: Render.com → Your service → Logs
2. **Check database**: Supabase → SQL Editor → Run test queries
3. **Test webhook**: Use curl commands above
4. **Verify API key**: Check environment variables in Render
5. **Contact Cunnekt support**: For API-specific issues

---

**Created**: January 2025  
**Status**: ✅ All endpoints ready, webhook URL needs to be configured in Cunnekt dashboard  
**Backend Commit**: 9418c7d  
**Frontend Commit**: c28842f
