# Cunnekt WhatsApp API Integration Guide

## 🎯 Overview
This guide covers the complete integration of Cunnekt WhatsApp API into the DMHCA CRM system for automated WhatsApp marketing campaigns.

---

## 📋 Features Implemented

### ✅ Core Features
- **Single Message Sending** - Send individual WhatsApp messages to leads
- **Bulk Campaign Publishing** - Send personalized messages to multiple leads at once
- **Template Support** - Use WhatsApp approved message templates
- **Message Status Tracking** - Track delivery status (sent, delivered, read, failed)
- **Webhook Integration** - Receive incoming messages and status updates
- **Auto-Responses** - Automatic replies based on keywords
- **API Connection Testing** - Verify Cunnekt API connectivity

### 🎨 UI Components
- **Test Connection Button** - Verify API is working
- **Campaign Publishing** - Send bulk messages with real-time progress
- **Status Indicators** - Visual feedback for message delivery
- **Success/Failure Counters** - Track campaign results

---

## 🔧 Setup Instructions

### Step 1: Add API Key to Backend Environment

Add to `/crm-backend-main/.env`:

```bash
CUNNEKT_API_KEY=4d776c1d10d186e225f1985095d201eb9cc41ad4
```

⚠️ **IMPORTANT:** You've already shared this key publicly. For security, regenerate it:
1. Go to https://app2.cunnekt.com/dashboard/apisetup
2. Click "Regenerate Key"
3. Update `.env` with new key
4. Redeploy backend

### Step 2: Deploy Backend

The backend already has the integration at:
```
/crm-backend-main/api/cunnekt-whatsapp.js
```

Deploy to Render.com:
```bash
cd /Users/rubeenakhan/Downloads/CRM/crm-backend-main
git add api/cunnekt-whatsapp.js
git commit -m "feat: Add Cunnekt WhatsApp API integration"
git push origin master
```

### Step 3: Set Up Webhook (Optional but Recommended)

Set your callback URL in Cunnekt dashboard to:
```
https://your-backend-url.onrender.com/api/cunnekt-whatsapp?action=webhook
```

This enables:
- Receiving incoming messages from leads
- Message delivery status updates
- Auto-response features

### Step 4: Deploy Frontend

The frontend hook is ready at:
```
/crm-frontend-main/src/hooks/useCunnektWhatsApp.ts
```

Deploy to Vercel:
```bash
cd /Users/rubeenakhan/Downloads/CRM/crm-frontend-main
npm run build
git add .
git commit -m "feat: Integrate Cunnekt WhatsApp API for campaigns"
git push origin master
```

---

## 📡 API Endpoints

### Base URL
```
https://app2.cunnekt.com/v1
```

### Available Actions

#### 1. Test Connection
```
GET /api/cunnekt-whatsapp?action=test-connection
```

**Response:**
```json
{
  "success": true,
  "message": "Cunnekt WhatsApp API connected successfully",
  "account": {
    "name": "DMHCA",
    "status": "active"
  }
}
```

#### 2. Send Single Message
```
POST /api/cunnekt-whatsapp?action=send-message

Body:
{
  "phone": "919876543210",
  "message": "Hello! Your course admission is confirmed.",
  "leadId": "lead-123"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_abc123",
  "status": "sent",
  "phone": "919876543210"
}
```

#### 3. Send Bulk Messages (Campaign)
```
POST /api/cunnekt-whatsapp?action=send-bulk

Body:
{
  "leads": [
    {
      "id": "lead-1",
      "name": "John Doe",
      "phone": "919876543210",
      "course": "Medical Coding",
      "qualification": "Bachelor's"
    }
  ],
  "message": "Hi {name}! Interested in {course} for {qualification} graduates?",
  "campaignId": "campaign-123"
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "total": 100,
    "success": 95,
    "failed": 5,
    "details": [
      {
        "leadId": "lead-1",
        "name": "John Doe",
        "phone": "919876543210",
        "status": "sent",
        "messageId": "msg_abc123"
      },
      {
        "leadId": "lead-2",
        "name": "Jane Smith",
        "status": "failed",
        "error": "Invalid phone number"
      }
    ]
  }
}
```

#### 4. Send Template Message
```
POST /api/cunnekt-whatsapp?action=send-template

Body:
{
  "phone": "919876543210",
  "templateName": "admission_confirmation",
  "parameters": ["John Doe", "Medical Coding", "January 2026"],
  "leadId": "lead-123"
}
```

#### 5. Get Message Status
```
GET /api/cunnekt-whatsapp?action=get-status&messageId=msg_abc123
```

**Response:**
```json
{
  "success": true,
  "status": {
    "messageId": "msg_abc123",
    "status": "delivered",
    "timestamp": "2025-12-19T10:30:00Z"
  }
}
```

#### 6. Webhook Handler
```
POST /api/cunnekt-whatsapp?action=webhook

Body (from Cunnekt):
{
  "type": "message.received",
  "data": {
    "from": "919876543210",
    "message": "I want to know about courses",
    "messageId": "msg_incoming_123"
  }
}
```

---

## 🎭 Auto-Response Keywords

The system automatically responds to these keywords:

| Keyword | Auto-Response |
|---------|--------------|
| `info`, `course`, `details` | Course information with list of programs |
| `callback`, `call me`, `contact` | Callback scheduling message |
| `fee`, `price`, `cost` | Fee information and callback request |
| `admission`, `enroll`, `join` | Admission process information |

**Example:**
```
Lead: "I want info about courses"
Bot: "Thank you for your interest! 🎓

We offer courses in:
• Medical Coding
• Healthcare Administration
• Clinical Research

Reply 'CALLBACK' for a free consultation!"
```

---

## 💻 Frontend Usage

### Using the Hook

```typescript
import { useCunnektWhatsApp } from '../hooks/useCunnektWhatsApp';

const MyComponent = () => {
  const { sendBulk, testConnection, sendMessage } = useCunnektWhatsApp();

  // Test API connection
  const handleTest = async () => {
    const result = await testConnection.refetch();
    console.log(result.data);
  };

  // Send single message
  const handleSingleMessage = async () => {
    const result = await sendMessage.mutateAsync({
      phone: '919876543210',
      message: 'Hello from CRM!',
      leadId: 'lead-123'
    });
    console.log(result);
  };

  // Send bulk campaign
  const handleCampaign = async () => {
    const result = await sendBulk.mutateAsync({
      leads: selectedLeads,
      message: templateMessage,
      campaignId: 'campaign-123'
    });
    console.log(result.results);
  };

  return (
    <div>
      <button onClick={handleTest}>Test Connection</button>
      <button onClick={handleSingleMessage}>Send Message</button>
      <button onClick={handleCampaign}>Send Campaign</button>
    </div>
  );
};
```

---

## 📊 Campaign Flow

### Step-by-Step Process

1. **Filter Leads**
   - Use Lead Segmentation filters (country, qualification, course, age)
   - Select target leads for campaign

2. **Create Template**
   - Write message with variables: `{name}`, `{course}`, `{qualification}`, `{country}`
   - Save template for reuse

3. **Create Campaign**
   - Choose template
   - Select filtered leads
   - Name the campaign

4. **Publish Campaign**
   - Click "Publish via Cunnekt"
   - System sends messages in batches of 10
   - 2-second delay between batches to respect rate limits
   - Real-time progress tracking

5. **View Results**
   - Success/failure counts displayed
   - Detailed results copied to clipboard
   - Campaign status updated to "sent"

---

## 🔐 Security Best Practices

### API Key Management
- ✅ Store in environment variables
- ✅ Never commit to Git
- ✅ Regenerate if exposed
- ✅ Use different keys for dev/prod

### Rate Limiting
- Sends 10 messages per batch
- 2-second delay between batches
- Prevents API throttling

### Data Privacy
- Messages logged to `communications` table
- Phone numbers cleaned (spaces/dashes removed)
- Lead consent tracked

---

## 🐛 Troubleshooting

### Connection Test Fails
```
Error: Connection failed: Unauthorized
```
**Solution:** Check `CUNNEKT_API_KEY` in backend `.env`

### Messages Not Sending
```
Error: Invalid phone number
```
**Solution:** Ensure phone numbers include country code (e.g., `919876543210`)

### Webhook Not Receiving
```
No incoming messages logged
```
**Solution:** 
1. Verify callback URL in Cunnekt dashboard
2. Ensure backend is publicly accessible
3. Check backend logs for webhook errors

### Rate Limit Errors
```
Error: Too many requests
```
**Solution:** Increase delay between batches in `sendBulkMessages` function

---

## 📈 Database Schema

### Communications Table

Auto-created entries for each message:

```sql
CREATE TABLE communications (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  type TEXT, -- 'whatsapp'
  direction TEXT, -- 'inbound' or 'outbound'
  content TEXT, -- Message text
  sender TEXT, -- Phone number (for inbound)
  recipient TEXT, -- Phone number (for outbound)
  status TEXT, -- 'sent', 'delivered', 'read', 'failed'
  message_id TEXT, -- Cunnekt message ID
  campaign_id TEXT, -- Campaign ID (if bulk send)
  is_auto_response BOOLEAN,
  sent_at TIMESTAMP,
  received_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📝 Message Personalization

### Available Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{name}` | Lead's name | John Doe |
| `{course}` | Interested course | Medical Coding |
| `{qualification}` | Education level | Bachelor's |
| `{country}` | Lead's country | India |

### Example Template
```
Hi {name}! 👋

We noticed you're interested in {course}. Great choice for {qualification} graduates!

Our next batch starts soon in {country}.

Reply 'CALLBACK' for a free consultation!
```

### Rendered Output
```
Hi John Doe! 👋

We noticed you're interested in Medical Coding. Great choice for Bachelor's graduates!

Our next batch starts soon in India.

Reply 'CALLBACK' for a free consultation!
```

---

## 🎉 Testing the Integration

### Manual Test Steps

1. **Test API Connection**
   ```
   Go to Lead Segmentation page
   Click "Test Cunnekt API" button
   Should see: ✅ Cunnekt WhatsApp API connected successfully
   ```

2. **Test Single Message**
   ```
   Filter to one lead
   Select the lead
   Create campaign with test template
   Publish campaign
   Check lead's WhatsApp for message
   ```

3. **Test Bulk Campaign**
   ```
   Filter to 5-10 test leads
   Select all
   Create campaign
   Publish
   Verify results: "✅ 9 sent, ❌ 1 failed"
   ```

4. **Test Incoming Messages**
   ```
   Send WhatsApp message to your Cunnekt number
   Use keyword like "info"
   Should receive auto-response
   Check communications table for logged message
   ```

---

## 📦 File Structure

```
crm-backend-main/
  api/
    cunnekt-whatsapp.js       # Main API integration
    
crm-frontend-main/
  src/
    hooks/
      useCunnektWhatsApp.ts   # React hook for API calls
    components/
      LeadSegmentation.tsx    # Updated with Cunnekt integration
```

---

## 🚀 Next Steps

### Recommended Enhancements

1. **WhatsApp Templates**
   - Create approved templates in Cunnekt dashboard
   - Add template selector in UI
   - Use for faster, pre-approved messages

2. **Scheduled Campaigns**
   - Implement cron job for scheduled sending
   - Store scheduled time in campaign

3. **Message History**
   - Add communication history view per lead
   - Show all past WhatsApp interactions

4. **Analytics Dashboard**
   - Track open rates, response rates
   - Campaign performance metrics
   - ROI tracking

5. **Media Support**
   - Send images, PDFs, documents
   - WhatsApp template with media

---

## 📞 Support

### Cunnekt Support
- Dashboard: https://app2.cunnekt.com
- Documentation: (Check Cunnekt website)
- API Status: Check API response for errors

### CRM Support
- Backend logs: Check Render.com logs
- Frontend console: Check browser DevTools
- Database: Check Supabase logs for communication entries

---

## ✅ Deployment Checklist

Before going live:

- [ ] Regenerate Cunnekt API key (current one is exposed)
- [ ] Add `CUNNEKT_API_KEY` to Render.com environment variables
- [ ] Set webhook callback URL in Cunnekt dashboard
- [ ] Test connection from production frontend
- [ ] Send test campaign to internal team
- [ ] Verify auto-responses work
- [ ] Check communications table is logging messages
- [ ] Set up monitoring/alerts for failed messages
- [ ] Document internal procedures for marketing team
- [ ] Train staff on using campaign features

---

## 🎓 Usage Guide for Marketing Team

### Creating a Campaign

1. Navigate to **Lead Segmentation** page
2. Apply filters (Country, Qualification, Course, Age)
3. Click **"Advanced Marketing"** button
4. Go to **"Templates"** tab
5. Click **"New Template"**
6. Create your message with variables
7. Go to **"Campaigns"** tab
8. Click **"New Campaign"**
9. Select template and name campaign
10. Click **"Publish via Cunnekt"**
11. Wait for confirmation
12. Review results (success/failure counts)

### Best Practices

- Test with small group first (5-10 leads)
- Personalize with variables
- Keep messages under 1000 characters
- Include clear call-to-action
- Monitor response rate
- Don't send to same lead multiple times per day

---

**Integration Complete! 🎉**

Your CRM now has full WhatsApp marketing automation powered by Cunnekt.
