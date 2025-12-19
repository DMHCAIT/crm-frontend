# 🔄 Cunnekt WhatsApp Integration - Complete Flow Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CUNNEKT WHATSAPP INTEGRATION                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│                  │          │                  │          │                  │
│   CRM FRONTEND   │◄────────►│   CRM BACKEND    │◄────────►│  CUNNEKT API     │
│   (React App)    │          │  (Node.js API)   │          │ (WhatsApp API)   │
│                  │          │                  │          │                  │
└──────────────────┘          └──────────────────┘          └──────────────────┘
         │                             │                             │
         │                             │                             │
         ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│                  │          │                  │          │                  │
│  Lead Management │          │    Supabase DB   │          │  Lead's Phone    │
│  Campaign UI     │          │   PostgreSQL     │          │  (WhatsApp)      │
│  Response View   │          │                  │          │                  │
│                  │          │                  │          │                  │
└──────────────────┘          └──────────────────┘          └──────────────────┘
```

---

## 📤 Outbound Flow: Sending Messages to Leads

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SENDING WHATSAPP MESSAGES                             │
└─────────────────────────────────────────────────────────────────────────────┘

1. User Action (Frontend)
   │
   ├─► User creates campaign in "Advanced Marketing Hub"
   ├─► Selects leads with filters (country, course, etc.)
   ├─► Chooses/creates message template
   ├─► Clicks "Publish Campaign"
   │
   ▼

2. Campaign Processing (Frontend → Backend)
   │
   ├─► POST /api/cunnekt-whatsapp?action=save-campaign
   │   └─► Saves campaign to whatsapp_campaigns table
   │
   ├─► POST /api/cunnekt-whatsapp?action=send-bulk
   │   ├─► Receives: { leads: [...], message: "...", campaignId: "..." }
   │   └─► Logs: 🔵 Starting bulk send to X leads
   │
   ▼

3. Message Batching (Backend)
   │
   ├─► Splits leads into batches of 10
   ├─► For each lead:
   │   ├─► Clean phone number: +1 234-567-8900 → 12345678900
   │   ├─► Personalize message: {name} → John
   │   ├─► Logs: 📱 Cleaned phone: 12345678900
   │   └─► Logs: 💬 Message: Hi John! We noticed...
   │
   ▼

4. Send to Cunnekt API
   │
   ├─► POST https://app2.cunnekt.com/v1/messages
   │   ├─► Headers: Authorization: Bearer {API_KEY}
   │   ├─► Body: { phone: "12345678900", message: "...", type: "text" }
   │   ├─► Logs: 📤 [1/100] Sending to 12345678900
   │   └─► Timeout: 10 seconds
   │
   ▼

5. Response Handling
   │
   ├─► Success (200 OK):
   │   ├─► Logs: ✅ [1/100] Sent: {messageId: "abc123", status: "sent"}
   │   ├─► Save to communications table:
   │   │   └─► { lead_id, type: 'whatsapp', direction: 'outbound',
   │   │        content, recipient, status: 'sent', message_id, campaign_id }
   │   └─► Update campaign statistics: total_sent++
   │
   └─► Error (4xx/5xx):
       ├─► Logs: ❌ [1/100] Failed: {error: "Invalid phone number"}
       ├─► Save to communications table with status: 'failed'
       └─► Update campaign statistics: total_failed++
   │
   ▼

6. Final Report (Backend → Frontend)
   │
   └─► Returns: {
         success: 85,
         failed: 15,
         details: [...],
         campaignId: "..."
       }
```

---

## 📥 Inbound Flow: Receiving Messages from Leads

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      RECEIVING WHATSAPP MESSAGES                             │
└─────────────────────────────────────────────────────────────────────────────┘

1. Lead Sends WhatsApp Message
   │
   ├─► Lead replies to campaign message
   ├─► Or initiates conversation
   └─► Example: "I need more information about Medical Coding"
   │
   ▼

2. Cunnekt Receives Message
   │
   ├─► WhatsApp → Cunnekt Platform
   ├─► Cunnekt processes message
   └─► Triggers webhook to your backend
   │
   ▼

3. Webhook Delivery (Cunnekt → Your Backend)
   │
   ├─► POST https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp?action=webhook
   │
   ├─► Payload:
   │   {
   │     "type": "message.received",
   │     "data": {
   │       "from": "12345678900",
   │       "message": "I need more information about Medical Coding",
   │       "messageId": "wamid.ABC123...",
   │       "timestamp": "2025-01-19T10:30:00Z"
   │     }
   │   }
   │
   └─► Logs: Cunnekt webhook received: {...}
   │
   ▼

4. Process Incoming Message (Backend)
   │
   ├─► Find lead in database:
   │   └─► Query: leads WHERE phone = '12345678900'
   │
   ├─► Save message to communications table:
   │   └─► { lead_id, type: 'whatsapp', direction: 'inbound',
   │        content, sender, status: 'received', message_id, received_at }
   │
   ▼

5. Auto-Response Detection
   │
   ├─► Check message for keywords:
   │   ├─► "info" / "course" / "details" → Send course info
   │   ├─► "callback" / "call me" → Confirm callback request
   │   ├─► "fee" / "price" → Send pricing info
   │   └─► "admission" / "enroll" → Send enrollment info
   │
   ├─► If keyword matched:
   │   ├─► Generate auto-response message
   │   ├─► POST to Cunnekt API (send message)
   │   └─► Save auto-response to communications table
   │        └─► { is_auto_response: true }
   │
   ▼

6. Real-time Updates (Backend → Frontend)
   │
   ├─► Frontend polls: GET /api/cunnekt-whatsapp?action=get-responses
   │   └─► Returns latest inbound messages
   │
   ├─► User opens "Responses" tab
   │   └─► Displays all incoming messages with:
   │       ├─► Lead ID
   │       ├─► Message content
   │       ├─► Phone number
   │       ├─► Timestamp
   │       ├─► Campaign ID (if linked)
   │       └─► Status badge (received/delivered/read)
   │
   └─► Badge shows unread count: 🔴 5
```

---

## 🔄 Status Update Flow: Message Delivery Tracking

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MESSAGE STATUS UPDATES                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Message Lifecycle:
   sent → delivered → read

1. Message Sent
   │
   ├─► Initial status: "sent"
   └─► Saved in communications table
   │
   ▼

2. Cunnekt Tracks Delivery
   │
   ├─► WhatsApp confirms delivery to recipient's phone
   ├─► Cunnekt receives delivery confirmation
   └─► Triggers webhook: "message.status"
   │
   ▼

3. Webhook: Status Update
   │
   ├─► POST /api/cunnekt-whatsapp?action=webhook
   │
   ├─► Payload:
   │   {
   │     "type": "message.status",
   │     "data": {
   │       "messageId": "msg_abc123",
   │       "status": "delivered",
   │       "phone": "12345678900",
   │       "timestamp": "2025-01-19T10:31:00Z"
   │     }
   │   }
   │
   ▼

4. Update Database
   │
   ├─► Find message by message_id
   ├─► Update status: 'sent' → 'delivered'
   ├─► Update campaign stats: total_delivered++
   └─► Log timestamp: delivered_at
   │
   ▼

5. Lead Reads Message
   │
   ├─► WhatsApp sends "read receipt"
   ├─► Cunnekt webhook: { status: "read" }
   ├─► Update status: 'delivered' → 'read'
   └─► Update campaign stats: total_read++
```

---

## 🗃️ Database Tables

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                                   │
└────────────────────────────────────────────────────────────────────────────┘

1. whatsapp_campaigns
   ├─► id (PK)
   ├─► name
   ├─► template
   ├─► segment_filters (JSON)
   ├─► lead_count
   ├─► status (draft/sending/sent/failed/paused)
   ├─► created_by (FK → users)
   ├─► created_at, updated_at, sent_at, completed_at
   └─► Statistics:
       ├─► total_sent
       ├─► total_delivered
       ├─► total_failed
       ├─► total_read
       └─► total_replied

2. whatsapp_templates
   ├─► id (PK)
   ├─► name
   ├─► content
   ├─► variables (JSON array: ["name", "course"])
   ├─► category (marketing/followup/enrollment/reminder/general)
   ├─► is_active
   ├─► created_by (FK → users)
   └─► usage_count

3. communications
   ├─► id (PK)
   ├─► lead_id (FK → leads)
   ├─► campaign_id (FK → whatsapp_campaigns) [NEW]
   ├─► type ('whatsapp')
   ├─► direction ('inbound' or 'outbound')
   ├─► content (message text)
   ├─► sender / recipient (phone number)
   ├─► status ('sent'/'delivered'/'read'/'failed'/'received')
   ├─► message_id (Cunnekt message ID)
   ├─► is_auto_response (boolean)
   └─► sent_at / received_at

4. leads
   ├─► id (PK)
   ├─► name
   ├─► phone
   ├─► country
   ├─► course
   ├─► qualification
   └─► ... (other fields)
```

---

## 🔌 API Endpoints Summary

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         AVAILABLE ENDPOINTS                                 │
└────────────────────────────────────────────────────────────────────────────┘

Base URL: https://crm-backend-vvpn.onrender.com/api/cunnekt-whatsapp

1. 📤 SEND SINGLE MESSAGE
   POST ?action=send-message
   Body: { phone, message, leadId }
   Returns: { success, messageId }

2. 📤 SEND BULK MESSAGES
   POST ?action=send-bulk
   Body: { leads: [...], message, campaignId }
   Returns: { success, failed, details }

3. 📥 WEBHOOK (Receive Messages)
   POST ?action=webhook
   Body: { type, data: { from, message, messageId } }
   Returns: { success }

4. 📊 GET CAMPAIGNS
   GET ?action=get-campaigns
   Query: ?userId=123&status=sent
   Returns: { campaigns: [...] }

5. 💬 GET RESPONSES
   GET ?action=get-responses
   Query: ?leadId=123&campaignId=456&limit=50
   Returns: { responses: [...] }

6. 💾 SAVE CAMPAIGN
   POST ?action=save-campaign
   Body: { name, template, segmentFilters, leadCount, userId }
   Returns: { success, campaign }

7. 🔍 GET MESSAGE STATUS
   GET ?action=get-status&messageId=abc123
   Returns: { success, status }

8. ✅ TEST CONNECTION
   GET ?action=test-connection
   Returns: { success, message, account }
```

---

## 🎯 Complete User Journey Example

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    EXAMPLE: MEDICAL CODING CAMPAIGN                         │
└────────────────────────────────────────────────────────────────────────────┘

Step 1: Marketing Manager Creates Campaign
   ↓
   User: Opens "Lead Segmentation" → "Advanced Marketing Hub"
   User: Filters leads (Country: US, Course: Medical Coding)
   User: Selects 150 leads
   User: Creates template: "Hi {name}! 🎓 Interested in Medical Coding?"
   User: Clicks "Publish Campaign"
   ↓

Step 2: Backend Processes Campaign
   ↓
   Backend: Saves campaign to database (status: 'sending')
   Backend: Batches 150 leads into 15 groups of 10
   Backend: Sends to Cunnekt API (10 concurrent requests)
   Backend: Logs: 📤 [1/150], [2/150], [3/150]...
   Backend: Updates campaign (status: 'sent', total_sent: 145, total_failed: 5)
   ↓

Step 3: Lead Receives Message (WhatsApp)
   ↓
   Lead Phone: Receives "Hi John! 🎓 Interested in Medical Coding?"
   Lead Phone: Opens message (Cunnekt webhook → status: "read")
   Backend: Updates communications table (status: 'read')
   Backend: Updates campaign (total_read: 23)
   ↓

Step 4: Lead Responds
   ↓
   Lead: Replies "Yes, I need more info about fees"
   Cunnekt: Receives message → Triggers webhook
   Backend: Saves to communications (direction: 'inbound')
   Backend: Detects keyword "info" + "fees"
   Backend: Auto-responds with pricing information
   Backend: Saves auto-response (is_auto_response: true)
   ↓

Step 5: Marketing Manager Views Responses
   ↓
   User: Opens "Responses" tab
   User: Sees John's reply in real-time
   User: Sees auto-response was sent
   User: Badge shows: 🔴 23 new responses
   User: Can filter by campaign, date, or lead
   ↓

Step 6: Follow-up
   ↓
   User: Clicks on John's response
   User: Assigns to sales team
   User: Schedules callback
   User: Sends manual follow-up message
```

---

## 🚀 Deployment Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         HOSTING INFRASTRUCTURE                              │
└────────────────────────────────────────────────────────────────────────────┘

Frontend (Vercel)
   │
   ├─► React App (TypeScript)
   ├─► TanStack React Query for API calls
   ├─► Auto-deploy on git push to master
   └─► URL: https://[your-vercel-domain].vercel.app

Backend (Render.com)
   │
   ├─► Node.js Express Server
   ├─► Serverless Functions
   ├─► Auto-deploy on git push to master
   ├─► Environment Variables:
   │   ├─► CUNNEKT_API_KEY
   │   ├─► CUNNEKT_BASE_URL
   │   ├─► SUPABASE_URL
   │   └─► SUPABASE_KEY
   └─► URL: https://crm-backend-vvpn.onrender.com

Database (Supabase)
   │
   ├─► PostgreSQL 15
   ├─► Row Level Security (RLS)
   ├─► Real-time subscriptions
   └─► Tables: leads, communications, whatsapp_campaigns, whatsapp_templates

External API (Cunnekt)
   │
   ├─► WhatsApp Business API
   ├─► Base URL: https://app2.cunnekt.com/v1
   ├─► Authentication: Bearer Token
   └─► Webhooks: Configured to point to your backend
```

---

## ✅ Setup Checklist

```
Prerequisites:
□ Backend deployed on Render.com
□ Frontend deployed on Vercel
□ Supabase database created
□ Cunnekt API account and key

Database Setup:
□ Run create-campaigns-table.sql in Supabase
□ Verify whatsapp_campaigns table exists
□ Verify whatsapp_templates table exists
□ Verify communications.campaign_id column exists
□ Check default templates are inserted

Backend Configuration:
□ Set CUNNEKT_API_KEY in Render environment variables
□ Set CUNNEKT_BASE_URL = https://app2.cunnekt.com/v1
□ Verify backend is running (test health endpoint)
□ Test all endpoints using test-cunnekt-endpoints.sh

Cunnekt Dashboard:
□ Add webhook URL: [backend]/api/cunnekt-whatsapp?action=webhook
□ Enable events: message.received, message.status
□ Test webhook with test payload
□ Verify webhook logs in Render

Frontend Testing:
□ Create test campaign
□ Verify campaign persists after refresh
□ Check Responses tab shows incoming messages
□ Verify auto-responses trigger correctly
□ Check campaign statistics update

Monitoring:
□ Set up alerts in Render for backend errors
□ Monitor Supabase database usage
□ Check Cunnekt API usage/limits
□ Review webhook logs regularly
```

---

**Created**: January 2025  
**Last Updated**: January 2025  
**Status**: ✅ All systems operational  
**Commits**: Backend 9418c7d, Frontend c28842f
