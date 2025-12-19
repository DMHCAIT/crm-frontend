# 🗄️ Database Setup for Campaign Persistence

## **IMPORTANT: Run this in Supabase SQL Editor BEFORE testing**

### Step 1: Access Supabase SQL Editor
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Run the SQL Script
Copy and paste the contents of `create-campaigns-table.sql` into the SQL Editor and click "Run"

### Step 3: Verify Tables Were Created
Run this query to check:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'whatsapp_%';
```

You should see:
- whatsapp_campaigns
- whatsapp_templates

### Step 4: Check Default Templates
```sql
SELECT * FROM whatsapp_templates;
```

You should see 4 default templates:
1. Welcome Message
2. Course Info
3. Follow-up
4. Enrollment Reminder

---

## **Quick Test Queries**

### View Recent Campaigns
```sql
SELECT 
  id,
  name,
  status,
  lead_count,
  total_sent,
  total_failed,
  created_at
FROM whatsapp_campaigns 
ORDER BY created_at DESC 
LIMIT 10;
```

### View WhatsApp Responses
```sql
SELECT 
  id,
  lead_id,
  content,
  recipient,
  status,
  campaign_id,
  sent_at
FROM communications 
WHERE type = 'whatsapp' 
  AND direction = 'inbound'
ORDER BY sent_at DESC 
LIMIT 20;
```

### Campaign Statistics
```sql
SELECT 
  c.name,
  c.status,
  c.total_sent,
  c.total_delivered,
  c.total_failed,
  c.total_read,
  c.total_replied,
  COUNT(comm.id) as message_count
FROM whatsapp_campaigns c
LEFT JOIN communications comm ON comm.campaign_id = c.id
GROUP BY c.id, c.name, c.status, c.total_sent, c.total_delivered, c.total_failed, c.total_read, c.total_replied
ORDER BY c.created_at DESC;
```

---

## **Troubleshooting**

### Error: "table already exists"
This means the tables are already created. No action needed!

### Error: "permission denied"
You need to be the database owner to create tables. Contact your Supabase admin.

### Error: "column campaign_id does not exist"
The communications table doesn't have the campaign_id column yet. The SQL script will add it automatically.

---

## **After Running SQL**

1. **Restart your backend** (Render will auto-deploy on push)
2. **Clear browser cache** and reload frontend
3. **Test creating a campaign** - it should now persist!
4. **Check Responses tab** - incoming messages will appear here

---

## **Database Schema Summary**

### whatsapp_campaigns
- **id**: Primary key
- **name**: Campaign name (e.g., "Summer Enrollment Drive")
- **template**: Message template text
- **segment_filters**: JSON with filter criteria
- **lead_count**: Number of leads targeted
- **status**: draft/sending/sent/failed/paused
- **created_by**: User ID who created it
- **Statistics**: total_sent, total_delivered, total_failed, total_read, total_replied

### whatsapp_templates
- **id**: Primary key
- **name**: Template name (e.g., "Welcome Message")
- **content**: Template text with {variables}
- **variables**: JSON array like ["name", "course"]
- **category**: marketing/followup/enrollment/reminder/general
- **is_active**: Boolean flag
- **usage_count**: How many times used

---

## **RLS Policies**

The script sets up Row Level Security policies:

1. **Users can view their own campaigns**
2. **Users can create campaigns**
3. **Users can update their own campaigns**
4. **Everyone can view active templates**
5. **Admins can manage all templates**

---

**Created**: January 2025  
**Status**: ✅ Ready to run  
**Required**: Before testing campaign persistence
