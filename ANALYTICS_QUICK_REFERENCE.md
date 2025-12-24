# 🚀 Advanced Analytics - Quick Reference Card

## 📊 New Features at a Glance

### 1️⃣ **Lead Scoring** (0-100 points)
- **High (75-100):** Priority leads - Contact today
- **Medium (50-74):** Good prospects - Contact within 3 days  
- **Low (0-49):** Nurture leads - Use email campaigns

**Score Breakdown:**
- 30 pts: Engagement (emails opened, calls answered)
- 25 pts: Recency (last contact date)
- 20 pts: Source quality (Referral > Website > Cold Call)
- 15 pts: Profile completeness (phone, email, etc.)
- 10 pts: Behavioral signals (Hot > Warm > Follow Up)

---

### 2️⃣ **Churn Prediction** (Risk %)
- **High Risk (>70%):** 🚨 Urgent action needed within 24 hours
- **Medium Risk (40-70%):** ⚠️ Follow up within 3 days
- **Low Risk (<40%):** ✅ Healthy relationship

**Risk Factors:**
- No contact for 30+ days (+40%)
- Low recent activity (+30%)
- Status downgrade (+20%)
- Failed calls (+10%)

---

### 3️⃣ **Revenue Forecast**

```
Current Revenue: Actual sales closed (Enrolled leads)
Expected Forecast: Statistical prediction (95% confidence)
Optimistic: Best case scenario
Total Potential: Current + Pipeline
```

**How It Works:**
- Analyzes historical conversion rates by source
- Applies probability weights by lead status
- Calculates confidence intervals

---

### 4️⃣ **Pipeline Velocity**

**Key Metrics:**
- **Time to Contact:** Fresh → First touchpoint
- **Time to Qualify:** Fresh → Warm/Hot
- **Time to Convert:** Hot → Enrolled
- **Total Pipeline Time:** Fresh → Enrolled

**Healthy Benchmarks:**
- Time to Contact: < 24 hours
- Time to Qualify: < 7 days  
- Time to Convert: < 30 days
- Total Pipeline: < 7 days (168 hours)

---

### 5️⃣ **Cohort Analysis**

Tracks conversion rates by signup month:
- **Month 1:** Conversions within 30 days
- **Month 2:** Conversions within 60 days
- **Month 3:** Conversions within 90 days

**Insight:** Most conversions happen in Month 1 - focus early engagement!

---

## 🎯 Daily Actions

### **Morning Routine (10 min)**
1. Check "At-Risk Leads" - Contact High Risk immediately
2. Review "Top Leads" - Prioritize your day
3. Check Revenue Forecast - Know your targets

### **During the Day**
- Contact High-scored leads (75-100) first
- Follow "Next Best Action" recommendations
- Log all calls and emails (for tracking)

### **End of Day (5 min)**
- Update lead statuses
- Add notes to leads contacted
- Schedule tomorrow's follow-ups

---

## 📞 API Endpoints

### **Activity Tracking**
```
POST /api/analytics-events
Body: { type, leadId, metadata }
```

### **Lead Scoring**
```
POST /api/lead-scoring/calculate
Body: { leadId }

GET /api/lead-scoring/top-leads?limit=50
GET /api/lead-scoring/at-risk?limit=50
```

### **Analytics**
```
GET /api/enhanced-analytics/revenue-forecast
GET /api/enhanced-analytics/pipeline-velocity?days=90
```

---

## 🔢 Score Calculation Formula

```
Total Score = Engagement + Recency + Source + Profile + Behavioral

Engagement = min((email_opens × 3) + (calls_answered × 5), 30)
Recency = 25 (if <3 days) → 0 (if >60 days)
Source = Referral(20) > Website(18) > Facebook(13) > Cold(8)
Profile = (completed_fields / 6) × 15
Behavioral = Hot(10) > Warm(7) > Follow Up(5) > Fresh(3)
```

---

## 📈 Event Types to Track

| Event Type | When to Track | Example Metadata |
|------------|---------------|------------------|
| `lead_viewed` | User opens lead details | `{ duration: 45 }` |
| `lead_created` | New lead added | `{ source: 'Facebook' }` |
| `status_change` | Status updated | `{ from: 'Fresh', to: 'Hot' }` |
| `email_sent` | Email sent to lead | `{ subject: 'Follow up' }` |
| `email_opened` | Lead opens email | `{ timestamp }` |
| `call_made` | Phone call placed | `{ duration: 180, outcome: 'answered' }` |
| `whatsapp_sent` | WhatsApp message sent | `{ template_id }` |
| `note_added` | Note added to lead | `{ note_length: 150 }` |

---

## 🎨 UI Components

### **LeadScoreBadge**
```tsx
<LeadScoreBadge 
  score={85} 
  scoreLevel="High"
  churnRisk={15}
  showChurn={true}
/>
```

### **LeadScoreCard**
```tsx
<LeadScoreCard
  leadId="abc123"
  score={75}
  breakdown={{ engagement: 25, recency: 20, ... }}
  recommendations={['Call within 24h', 'Send brochure']}
  nextAction={{ action: 'Make call', priority: 'High' }}
/>
```

---

## 🔧 Configuration

### **Source Quality Scores** (in `lead-scoring.js`)
```javascript
const sourceScores = {
  'Referral': 20,      // Best
  'Website': 18,
  'LinkedIn': 17,
  'Instagram': 15,
  'Facebook': 13,
  'Google Ads': 12,
  'Email Campaign': 10,
  'Cold Call': 8       // Lowest
};
```

### **Status Multipliers** (for forecasting)
```javascript
const statusMultiplier = {
  'Hot': 0.7,          // 70% likely to convert
  'Warm': 0.4,         // 40%
  'Follow Up': 0.25,   // 25%
  'Fresh': 0.10,       // 10%
  'Enrolled': 1.0      // Already converted
};
```

---

## 🚦 Status Indicators

| Score Range | Color | Badge | Action |
|-------------|-------|-------|--------|
| 75-100 | 🟢 Green | High | Contact today |
| 50-74 | 🟡 Yellow | Medium | Contact this week |
| 0-49 | ⚪ Gray | Low | Email campaign |

| Churn Risk | Color | Badge | Action |
|------------|-------|-------|--------|
| 70-100% | 🔴 Red | High | Urgent - 24h |
| 40-69% | 🟠 Orange | Medium | Follow up soon |
| 0-39% | 🟢 Green | Low | Healthy |

---

## 💡 Pro Tips

1. **Morning Priority List**
   - Filter leads by score DESC
   - Start with 75+ scores
   - Clear High Churn Risk first

2. **Status Changes**
   - Track all status changes
   - Helps improve velocity metrics
   - Enables churn prediction

3. **Profile Completeness**
   - Always add phone + email
   - Improves lead score by 15 points
   - Better targeting for campaigns

4. **Activity Logging**
   - Log every interaction
   - Builds engagement score
   - Trains prediction model

5. **Regular Score Updates**
   - Recalculate weekly (minimum)
   - Or after major status changes
   - Keep predictions fresh

---

## 📱 Mobile Quick Actions

### **View Lead Score**
```
Lead Card → Score Badge (top right)
Tap to see detailed breakdown
```

### **Check Recommendations**
```
Lead Details → Intelligence Card
Shows next best action + priority
```

### **Track Activity**
```
Auto-tracked:
- Lead views
- Status changes
- Notes added

Manual tracking:
- Calls made
- Emails sent
```

---

## 🎓 Training Checklist

- [ ] Understand lead scoring (0-100 scale)
- [ ] Know churn risk levels (High/Medium/Low)
- [ ] Use Top Leads dashboard daily
- [ ] Review At-Risk Leads every morning
- [ ] Follow Next Best Action suggestions
- [ ] Log all calls and emails
- [ ] Update lead statuses promptly
- [ ] Check revenue forecast weekly
- [ ] Monitor pipeline velocity monthly
- [ ] Review cohort analysis quarterly

---

## 📞 Quick Support

**Database Issues:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('analytics_events', 'lead_scores');
```

**Recalculate Single Lead:**
```bash
curl -X POST .../api/lead-scoring/calculate \
  -d '{"leadId": "YOUR_LEAD_ID"}'
```

**Recalculate All Leads:**
- Navigate to: Advanced Analytics
- Click: "Calculate All Scores" button
- Wait: ~1-2 minutes for 1000 leads

---

**🎯 Remember: High scores = High priority. Monitor churn risk daily!**
