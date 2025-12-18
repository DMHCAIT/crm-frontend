# 🚀 Quick Setup Guide - New Features

## Prerequisites
- Node.js 16+ installed
- Supabase account with database access
- SMTP email account (Gmail recommended)

---

## 📦 Step 1: Install Dependencies (5 minutes)

### Backend
```bash
cd crm-backend-main
npm install node-cron nodemailer
```

### Frontend
```bash
cd crm-frontend-main
npm install chart.js react-chartjs-2
```

---

## 🗄️ Step 2: Database Setup (10 minutes)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Select your project
   - Navigate to SQL Editor

2. **Run Migration Script**
   - Copy contents of `database-migration-v2.2.0.sql`
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for completion message: ✅ Migration Complete

3. **Verify Tables Created**
   ```sql
   SELECT * FROM scheduled_exports LIMIT 1;
   SELECT * FROM documents LIMIT 1;
   SELECT * FROM export_history LIMIT 1;
   ```

4. **Create Storage Bucket**
   - Go to Storage in Supabase Dashboard
   - Click "New bucket"
   - Name: `crm-documents`
   - Public: Yes
   - File size limit: 10MB
   - Click "Create bucket"

---

## ⚙️ Step 3: Environment Configuration (5 minutes)

### Backend `.env` File
Add these lines to `crm-backend-main/.env`:

```bash
# Email Configuration for Scheduled Exports
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Existing variables (verify these exist)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
JWT_SECRET=your-jwt-secret-key
```

**Get Gmail App Password**:
1. Go to Google Account Settings
2. Security → 2-Step Verification
3. App passwords → Generate
4. Copy the 16-character password

---

## 🔧 Step 4: Backend Integration (10 minutes)

### Edit `crm-backend-main/server.js`

Add these imports at the top (after existing requires):
```javascript
const scheduledExportsRouter = require('./api/scheduled-exports');
const documentsRouter = require('./api/documents');
```

Add these routes (after existing app.use statements):
```javascript
// New feature routes
app.use('/api/scheduled-exports', scheduledExportsRouter);
app.use('/api/documents', documentsRouter);
```

### Test Backend
```bash
cd crm-backend-main
npm start

# In another terminal, test endpoints:
curl http://localhost:5000/api/scheduled-exports
```

---

## 🎨 Step 5: Frontend Integration (15 minutes)

### 1. Import Responsive CSS
Edit `crm-frontend-main/src/index.css`, add at the end:
```css
/* Import responsive styles */
@import './styles/responsive.css';
```

### 2. Update API Client
Edit `crm-frontend-main/src/lib/backend.ts`:

Add to the `getApiClient()` return object:
```typescript
// Scheduled Exports
getScheduledExports: () => api.get('/scheduled-exports'),
createScheduledExport: (data: any) => api.post('/scheduled-exports', data),
updateScheduledExport: (id: string, data: any) => 
  api.put(`/scheduled-exports/${id}`, data),
deleteScheduledExport: (id: string) => 
  api.delete(`/scheduled-exports/${id}`),

// Documents
uploadDocument: (formData: FormData) => 
  api.post('/documents/upload', formData),
getDocuments: (entityType: string, entityId: string) => 
  api.get(`/documents/${entityType}/${entityId}`),
deleteDocument: (id: string) => 
  api.delete(`/documents/${id}`),

// Advanced Analytics
getAdvancedAnalytics: (params: any) => 
  api.get('/enhanced-analytics', { params }),
```

### 3. Add Routes
Edit `crm-frontend-main/src/App.tsx`:

Add imports:
```typescript
import ScheduledExports from './components/ScheduledExports';
import AdvancedAnalyticsCharts from './components/AdvancedAnalyticsCharts';
```

Add routes inside `<Routes>`:
```typescript
<Route path="/scheduled-exports" element={<ScheduledExports />} />
<Route path="/analytics-charts" element={<AdvancedAnalyticsCharts />} />
```

### 4. Add Navigation Links (Optional)
Edit your sidebar/navigation component:
```tsx
<Link to="/scheduled-exports">
  <Clock className="w-5 h-5" />
  Scheduled Exports
</Link>

<Link to="/analytics-charts">
  <BarChart className="w-5 h-5" />
  Analytics
</Link>
```

### 5. Add Document Upload to Lead/Student Pages
Edit `LeadDetails.tsx` or `StudentDetails.tsx`:
```tsx
import DocumentUpload from './DocumentUpload';

// Inside component:
<DocumentUpload 
  entityType="lead" 
  entityId={lead.id}
  onUploadComplete={() => {
    // Refresh data or show success message
  }}
/>
```

---

## 🧪 Step 6: Testing (15 minutes)

### Test Scheduled Exports
1. Start backend: `npm start` in `crm-backend-main`
2. Start frontend: `npm run dev` in `crm-frontend-main`
3. Navigate to `/scheduled-exports`
4. Click "New Schedule"
5. Fill form:
   - Name: "Test Weekly Export"
   - Type: Leads Data
   - Format: CSV
   - Frequency: Weekly
   - Time: Current time + 2 minutes
   - Email: Your email
6. Click "Create Schedule"
7. Wait 2 minutes for email

### Test Document Upload
1. Navigate to any lead details page
2. Find Document Upload section
3. Drag & drop a PDF file
4. Watch upload progress
5. Verify file appears in list
6. Click "View" to open document
7. Test delete functionality

### Test Mobile Responsive
1. Open browser DevTools (F12)
2. Toggle device toolbar (mobile view)
3. Test at different widths:
   - 375px (iPhone SE)
   - 768px (iPad)
   - 1024px (Desktop)
4. Verify sidebar collapses on mobile
5. Check table scrolling
6. Test form stacking

### Test Analytics Charts
1. Navigate to `/analytics-charts`
2. Verify all 6 charts load
3. Change date range filter
4. Check data updates
5. Test chart interactions (hover, click)
6. Verify responsive on mobile

---

## 🚀 Step 7: Deploy to Production (20 minutes)

### Backend (Railway/Render)

**Railway**:
```bash
cd crm-backend-main
railway up
railway env set SMTP_HOST=smtp.gmail.com
railway env set SMTP_PORT=587
railway env set SMTP_USER=your-email@gmail.com
railway env set SMTP_PASSWORD=your-app-password
```

**Render**:
1. Go to Render dashboard
2. Select your service
3. Environment → Add variables:
   - `SMTP_HOST` = smtp.gmail.com
   - `SMTP_PORT` = 587
   - `SMTP_USER` = your email
   - `SMTP_PASSWORD` = your app password
4. Click "Save" → Auto redeploy

### Frontend (Vercel)

```bash
cd crm-frontend-main
npm run build  # Test build locally first
vercel --prod  # Deploy to production
```

Or use Vercel Dashboard:
1. Go to Vercel project
2. Settings → Git → Redeploy latest commit
3. Wait for build to complete

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend health check: `https://your-backend.com/api/health`
- [ ] Scheduled exports endpoint: `https://your-backend.com/api/scheduled-exports`
- [ ] Documents endpoint: `https://your-backend.com/api/documents`
- [ ] Frontend loads without errors
- [ ] All charts render correctly
- [ ] Mobile view works properly
- [ ] Document upload works
- [ ] Email delivery works (create test schedule)
- [ ] Supabase Storage has files
- [ ] No console errors

---

## 🐛 Troubleshooting

### Issue: "Supabase not configured" error
**Solution**: Check `.env` file has `SUPABASE_URL` and `SUPABASE_KEY`

### Issue: Email not sending
**Solutions**:
- Verify SMTP credentials in `.env`
- Check Gmail app password is correct
- Enable "Less secure app access" if using Gmail
- Check spam folder for test emails

### Issue: "bucket not found" error
**Solution**: 
1. Go to Supabase Storage
2. Create bucket named `crm-documents`
3. Set public access to Yes

### Issue: Charts not rendering
**Solutions**:
- Run `npm install chart.js react-chartjs-2`
- Clear browser cache
- Check browser console for errors
- Verify Chart.js version >= 4.4.1

### Issue: Mobile layout broken
**Solution**: 
- Verify `responsive.css` is imported in `index.css`
- Clear browser cache
- Check for CSS conflicts

### Issue: Cron jobs not running
**Solutions**:
- Check server logs for cron initialization
- Verify `node-cron` is installed
- Test manual execution endpoint first
- Check server timezone matches schedule time

---

## 📞 Support

If you encounter issues:

1. **Check Logs**:
   - Backend: `railway logs` or Render dashboard
   - Frontend: Browser console (F12)

2. **Database Issues**:
   - Supabase Dashboard → Table Editor
   - Verify migration ran successfully

3. **Email Issues**:
   - Test SMTP credentials separately
   - Use online SMTP testing tools

---

## 🎉 Success!

You've successfully implemented:
- ✅ Scheduled Exports with email delivery
- ✅ Document Upload with Supabase Storage
- ✅ Mobile Responsive design
- ✅ Advanced Analytics with Chart.js

**Total Setup Time**: ~60 minutes  
**System Completion**: 98% ✅

**Next Steps**:
1. Train users on new features
2. Create user documentation
3. Monitor scheduled exports execution
4. Review analytics insights weekly

---

**Questions?** Check `NEW_FEATURES_IMPLEMENTATION.md` for detailed documentation.
