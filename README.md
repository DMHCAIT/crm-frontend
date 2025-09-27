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

## Recent Updates

### 🚀 Complete System Overhaul (September 2025)
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
- See `/docs` folder for detailed fix documentation
- Check `/tests` folder for debugging scripts and test files

## Architecture
- **Backend**: Node.js with Express API
- **Frontend**: React with TypeScript and Vite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens with database validation
- **Styling**: Tailwind CSS