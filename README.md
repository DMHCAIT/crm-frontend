# CRM System

A comprehensive Customer Relationship Management system with full-stack architecture.

## Project Structure

```
CRM/
├── crm-backend-main/          # Backend API server
│   ├── api/                   # API endpoints
│   ├── config/               # Configuration files
│   └── utils/                # Utility functions
│
├── crm-frontend-main/         # Frontend React application
│   ├── src/                  # Source code
│   │   ├── components/       # React components
│   │   ├── lib/             # Libraries and utilities
│   │   ├── hooks/           # Custom React hooks
│   │   └── types/           # TypeScript type definitions
│   └── public/              # Static assets
│
├── docs/                     # Project documentation
│   ├── LEAD_ASSIGNMENT_VISIBILITY_FIX.md
│   ├── LEAD_ATTRIBUTION_ADMINISTRATOR_FIX.md
│   ├── LEAD_CREATION_ASSIGNMENT_FIX.md
│   └── USER_MANAGEMENT_REPORTS_TO_FIX.md
│
└── tests/                    # Test files and debugging scripts
    ├── dashboard-fix-complete-summary.js
    ├── debug-notes-export.js
    ├── notes-export-fix-patch.js
    ├── test-dashboard-filtering-fix.js
    ├── test-notes-export-fix.js
    ├── test-real-database-notes.js
    ├── username-only-assignment-test.js
    └── verify-notes-storage-test.js
```

## Features

### ✅ User Management System
- Hierarchical user structure with "Reports To" functionality
- Role-based access control
- User authentication with JWT tokens
- Database-driven user validation

### ✅ Lead Management System  
- Case-insensitive lead assignment and filtering
- Comprehensive lead attribution system
- Hierarchical lead visibility based on user relationships
- Real-time lead status tracking

### ✅ Authentication System
- JWT-based authentication with database lookups
- Dual lookup strategy (userId then username)
- Eliminated hardcoded fallbacks causing attribution issues
- Enhanced security with Supabase integration

### ✅ Database Integration
- Full Supabase integration replacing demo data
- Real-time data synchronization
- Comprehensive CRUD operations
- Data validation and integrity checks

### ✅ Email Integration
- Dual provider support (SendGrid & SMTP)
- 5 pre-built email templates (welcome, lead notifications, reports)
- Bulk email sending capabilities
- Automatic email notifications for calendar events

### ✅ Calendar Management
- Full event CRUD operations
- Conflict detection for time slots
- Event types: meetings, calls, demos, follow-ups, reminders
- Status tracking: scheduled, completed, cancelled, rescheduled
- Integration with leads and user management

### ✅ Security Features
- Rate limiting (100 req/15min general, 5 req/15min auth)
- Winston logging with file rotation
- Input validation using Joi schemas
- Global error handling and XSS protection
- No hardcoded credentials in production code

## Recent Updates

### 🚀 Production Security & Feature Completion (January 2024)
- **Security Hardening**: Eliminated all 10 CRITICAL vulnerabilities
  - Removed hardcoded credentials (admin/admin123)
  - Removed JWT fallbacks from 34 files
  - Deleted debug endpoints exposing system info
  - Implemented rate limiting and request validation
- **Logging Infrastructure**: Replaced 674 console.log statements with Winston
  - File rotation (error.log, combined.log)
  - Structured logging with levels (info, warn, error)
- **Email Service**: Complete email integration
  - SendGrid and SMTP support
  - 5 email templates for notifications
  - Bulk email capabilities
- **Calendar Service**: Full calendar management
  - Event CRUD with conflict detection
  - Integration with leads and users
  - Reminder system
- **Database Schema**: Fixed UUID/VARCHAR inconsistencies, added foreign keys and indexes
- **Code Quality**: 10+ Joi validation schemas, global error handling, XSS protection

### 🚀 Complete System Overhaul (September 2023)
- **Authentication System**: Fixed lead attribution showing as 'Administrator' instead of actual user
- **User Management**: Implemented complete CRUD operations with hierarchy support  
- **Lead System**: Enhanced case-insensitive username matching and assignment
- **Backend APIs**: Added users-supabase.js and assignable-users.js for comprehensive user management
- **Frontend Integration**: Updated backend.ts to use new Supabase endpoints

## Getting Started

### Backend Setup
```bash
cd crm-backend-main
npm install
npm start
```

### Frontend Setup  
```bash
cd crm-frontend-main
npm install
npm run dev
```

## Documentation
- **API Documentation**: See `/API_DOCUMENTATION.md` for complete API reference
- **Environment Setup**: See `/ENVIRONMENT_VARIABLES_GUIDE.md` for configuration
- **Fix Documentation**: Check `/docs` folder for detailed fix documentation
- **Test Files**: See `/tests` folder for debugging scripts and test files
- **Advanced Analytics**: See `README_ADVANCED_ANALYTICS.md` for analytics features
- **Security**: See `SECURITY_IMPROVEMENTS_REPORT.md` for security audit details

## Architecture
- **Backend**: Node.js with Express API
- **Frontend**: React with TypeScript and Vite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens with database validation
- **Styling**: Tailwind CSS