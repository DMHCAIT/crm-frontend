# Quick Implementation Guide - Priority Endpoints

This is a condensed version focusing on the **most critical endpoints** you should implement first to get the enhanced CRM fully functional.

## 🎯 Phase 1: Critical Endpoints (2 weeks)

### 1. Analytics Dashboard (HIGH PRIORITY)
```javascript
// GET /analytics/dashboard?range=30d
app.get('/analytics/dashboard', async (req, res) => {
  const { range = '30d' } = req.query;
  
  try {
    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(range.replace('d', '')));
    
    // Query database for metrics
    const totalLeads = await db.leads.count();
    const totalStudents = await db.students.count();
    const conversions = await db.students.count({ 
      where: { originated_from_lead: { not: null } }
    });
    
    const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;
    
    // Lead sources aggregation
    const leadSources = await db.leads.groupBy(['source']).count();
    
    res.json({
      overview: {
        totalLeads,
        totalStudents,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        revenue: 842000, // Calculate from payments table when implemented
        activeUsers: 45
      },
      trends: {
        leadsChange: 12.5, // Calculate week-over-week change
        studentsChange: 5.4,
        conversionChange: 2.1,
        revenueChange: 18.2
      },
      leadSources: leadSources.map(source => ({
        source: source.source,
        count: source._count,
        percentage: (source._count / totalLeads) * 100
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Campaign Management (HIGH PRIORITY)
```javascript
// POST /campaigns - Create campaign
app.post('/campaigns', async (req, res) => {
  try {
    const campaign = await db.campaigns.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        type: req.body.type, // email, sms, whatsapp, phone
        status: 'draft',
        target_audience: req.body.target_audience,
        subject: req.body.subject,
        content: req.body.content,
        total_recipients: 0,
        created_by: req.user.id
      }
    });
    
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /campaigns - List campaigns
app.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await db.campaigns.findMany({
      where: {
        status: req.query.status || undefined,
        type: req.query.type || undefined
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(req.query.limit) || 50
    });
    
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /campaigns/:id/launch - Launch campaign
app.post('/campaigns/:id/launch', async (req, res) => {
  try {
    // Update campaign status
    const campaign = await db.campaigns.update({
      where: { id: req.params.id },
      data: { 
        status: 'active',
        started_at: new Date()
      }
    });
    
    // Here you would trigger actual campaign sending
    // (email service, SMS service, etc.)
    
    res.json({ 
      success: true, 
      campaign_id: campaign.id,
      message: 'Campaign launched successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Enhanced Communications (HIGH PRIORITY)
```javascript
// POST /communications - Create communication
app.post('/communications', async (req, res) => {
  try {
    const communication = await db.communications.create({
      data: {
        type: req.body.type, // email, sms, whatsapp, call
        direction: req.body.direction, // inbound, outbound
        subject: req.body.subject,
        content: req.body.content,
        sender: req.body.sender,
        recipient: req.body.recipient,
        status: 'sent',
        lead_id: req.body.lead_id,
        student_id: req.body.student_id,
        user_id: req.user.id,
        delivered_at: new Date()
      }
    });
    
    res.json(communication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /communications - List communications
app.get('/communications', async (req, res) => {
  try {
    const communications = await db.communications.findMany({
      where: {
        user_id: req.query.user_id || req.user.id,
        type: req.query.type || undefined,
        direction: req.query.direction || undefined
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(req.query.limit) || 100
    });
    
    res.json(communications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 4. Document Verification (HIGH PRIORITY)
```javascript
// GET /documents - List documents
app.get('/documents', async (req, res) => {
  try {
    const documents = await db.documents.findMany({
      where: {
        status: req.query.status || undefined,
        student_id: req.query.student_id || undefined,
        document_type: req.query.document_type || undefined
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(req.query.limit) || 50
    });
    
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /documents/:id/verify - Verify document
app.post('/documents/:id/verify', async (req, res) => {
  try {
    const document = await db.documents.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status, // verified, rejected
        verification_notes: req.body.verification_notes,
        verified_by: req.user.id,
        verified_at: new Date()
      }
    });
    
    // Create notification for student/lead
    if (req.body.status === 'verified') {
      await db.notifications.create({
        data: {
          title: 'Document Verified',
          message: `Your ${document.document_type} has been verified`,
          type: 'success',
          user_id: document.uploaded_by
        }
      });
    }
    
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 5. Basic Notifications (MEDIUM PRIORITY)
```javascript
// GET /notifications - Get user notifications
app.get('/notifications', async (req, res) => {
  try {
    const notifications = await db.notifications.findMany({
      where: {
        user_id: req.query.userId || req.user.id,
        is_read: req.query.is_read === 'false' ? false : undefined
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(req.query.limit) || 50
    });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /notifications - Create notification
app.post('/notifications', async (req, res) => {
  try {
    const notification = await db.notifications.create({
      data: {
        title: req.body.title,
        message: req.body.message,
        type: req.body.type || 'info',
        user_id: req.body.user_id,
        lead_id: req.body.lead_id,
        student_id: req.body.student_id,
        priority: req.body.priority || 'normal'
      }
    });
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🗄️ Database Schema Updates Needed

Add these tables to your database (if not already present):

```sql
-- Analytics Events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  event_type VARCHAR NOT NULL,
  event_name VARCHAR NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id),
  lead_id UUID REFERENCES leads(id),
  student_id UUID REFERENCES students(id),
  event_data JSONB DEFAULT '{}',
  properties JSONB DEFAULT '{}'
);

-- Campaigns  
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp', 'phone')),
  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  subject VARCHAR,
  content TEXT,
  total_recipients INT DEFAULT 0,
  sent INT DEFAULT 0,
  delivered INT DEFAULT 0,
  opened INT DEFAULT 0,
  clicked INT DEFAULT 0,
  converted INT DEFAULT 0,
  created_by UUID REFERENCES users(id)
);

-- Communications (enhance existing or create new)
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  type VARCHAR NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp', 'call', 'meeting')),
  direction VARCHAR NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  subject VARCHAR,
  content TEXT,
  sender VARCHAR,
  recipient VARCHAR,
  status VARCHAR DEFAULT 'sent',
  lead_id UUID REFERENCES leads(id),
  student_id UUID REFERENCES students(id),
  user_id UUID REFERENCES users(id),
  delivered_at TIMESTAMP,
  read_at TIMESTAMP
);

-- Documents (enhance existing or create new)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  document_name VARCHAR NOT NULL,
  document_type VARCHAR NOT NULL,
  file_url TEXT,
  file_size INT,
  student_id UUID REFERENCES students(id),
  lead_id UUID REFERENCES leads(id),
  uploaded_by UUID REFERENCES users(id),
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  verification_notes TEXT
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  user_id UUID NOT NULL REFERENCES users(id),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  lead_id UUID REFERENCES leads(id),
  student_id UUID REFERENCES students(id)
);
```

## 🚀 Quick Start Deployment

1. **Add these routes to your existing backend**
2. **Run database migrations for new tables**  
3. **Test each endpoint with Postman/curl**
4. **Deploy to Railway**
5. **Verify frontend integration**

This covers the core functionality needed for your enhanced frontend to work properly. Start with these endpoints and expand gradually!