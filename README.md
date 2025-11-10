# DMHCA CRM Frontend# DMHCA CRM Frontend - Production Ready



A comprehensive Customer Relationship Management (CRM) system built with React, TypeScript, and Vite for DMHCA Educational Institution.This is the production-ready frontend for the DMHCA CRM system.



## 🚀 Live Deployment## Live URLs

- **Frontend:** https://crm-frontend-final-fat2u1gb5-dmhca.vercel.app ✅ **LIVE & WORKING**

- **Frontend**: https://crm-frontend-final-fat2u1gb5-dmhca.vercel.app- **Backend:** https://crm-backend-production-5e32.up.railway.app ✅ **LIVE & WORKING**

- **Backend**: https://crm-backend-production-5e32.up.railway.app- **Database:** Supabase ✅ **CONNECTED**

- **Status**: ✅ Production Ready & Fully Functional

## Features

## ✨ Features- ✅ Lead Management

- ✅ Real-time Dashboard

### Core CRM Functionality- ✅ Analytics & Reports

- **📊 Dashboard**: Real-time overview of key metrics and activities- ✅ Multi-channel Integration

- **👥 Lead Management**: Complete lead tracking through sales pipeline- ✅ Secure Authentication (JWT + Supabase)

- **👤 User Management**: System user administration and role management- ✅ User Management

- **📞 Communications Hub**: Centralized multi-channel communication- ✅ CRM Pipeline

- **📈 Analytics**: Business insights, reporting, and data visualization- ✅ Student Management

- **🎓 Student Management**: Educational institution student tracking- ✅ Communications Hub

- **📝 Campaign Management**: Marketing campaign creation and tracking- ✅ Document Management

- ✅ Automation & Integrations

### Advanced Features

- **🔗 Multi-channel Integration**: Facebook, WhatsApp, Email support## Quick Start

- **📋 CRM Pipeline**: Visual sales pipeline management

- **⚙️ Automation**: Workflow automation and triggers1. Install dependencies:

- **📄 Document Management**: File storage and organization   ```bash

- **🔔 Notification System**: Real-time alerts and notifications   npm install

- **🎛️ Advanced Filtering**: Dynamic data filtering and search   ```

- **📊 Data Export**: Export capabilities for reports and data

2. Start development server:

## 🛠️ Tech Stack   ```bash

   npm run dev

- **Frontend Framework**: React 18.3.1 with TypeScript   ```

- **Build Tool**: Vite for fast development and building

- **Styling**: Tailwind CSS for responsive design3. Build for production:

- **Icons**: Lucide React icon library   ```bash

- **Backend Integration**: RESTful API with JWT authentication   npm run build

- **State Management**: React hooks and context   ```

- **Form Handling**: Controlled components with validation

- **Deployment**: Vercel (Frontend) + Railway (Backend)## Environment Variables

All environment variables are properly configured in `.env` file:

## 📁 Project Structure- ✅ Supabase URL and keys configured

- ✅ Backend API endpoints set

```- ✅ Production-ready configuration

crm-frontend/

├── src/## Status

│   ├── components/          # React components🚀 **FULLY OPERATIONAL - 100% Production Ready!**

│   │   ├── Dashboard.tsx    # Main dashboard

│   │   ├── LeadsManagement.tsx- ✅ Frontend deployed and working on Vercel

│   │   ├── UserManagement.tsx- ✅ Backend deployed and working on Railway  

│   │   ├── CommunicationsHub.tsx- ✅ Database connected via Supabase

│   │   ├── Analytics.tsx- ✅ Authentication system operational

│   │   ├── StudentsManagement.tsx- ✅ All API endpoints available

│   │   ├── CRMPipeline.tsx- ✅ Ready for real users and production traffic

│   │   └── ...

│   ├── hooks/              # Custom React hooks**Last updated:** September 12, 2025 - Full-stack deployment complete & validated

│   │   └── useAuth.ts

│   ├── lib/                # Utility libraries### Available API Endpoints ✅

│   │   ├── backend.ts      # API integrationThe backend now provides all required endpoints:

│   │   └── productionAuth.ts- Authentication: Login, register, verify, logout

│   ├── config/             # Configuration files- Dashboard: Stats and analytics 

│   ├── types/              # TypeScript type definitions- CRUD Operations: Leads, Students, Users, Communications, Documents, Payments

│   └── App.tsx            # Main application component- Integrations: WhatsApp, Email, Calendar, Facebook webhooks

├── public/                 # Static assets- Real-time: Analytics and notifications

├── package.json           # Dependencies and scripts
└── vite.config.ts         # Vite configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DMHCAIT/crm-frontend.git
   cd crm-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   ```
   http://localhost:5173
   ```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Environment Configuration

### Required Environment Variables

```env
# Frontend Configuration
VITE_API_BASE_URL=https://crm-backend-production-5e32.up.railway.app
VITE_APP_NAME=DMHCA CRM
VITE_APP_VERSION=2.0.0

# Authentication
VITE_JWT_SECRET=your-jwt-secret-key
VITE_AUTH_TOKEN_KEY=crm_auth_token

# External Integrations (Optional)
VITE_FACEBOOK_APP_ID=your-facebook-app-id
VITE_WHATSAPP_API_URL=your-whatsapp-api-url
```

## 🔐 Authentication

The CRM uses JWT-based authentication with the following features:
- Secure login/logout functionality
- Role-based access control (Admin, User, Super Admin)
- Token-based API authentication
- Session management with automatic renewal

## 📱 Responsive Design

The application is fully responsive and works across:
- **Desktop**: Full-featured interface
- **Tablet**: Optimized layout
- **Mobile**: Touch-friendly design

## 🧩 Key Components

### Dashboard
- Real-time metrics display
- Quick action buttons
- Recent activities feed
- Performance charts

### Lead Management
- Lead creation and editing
- Pipeline stage management
- Lead source tracking
- Conversion analytics

### User Management  
- User creation and modification
- Role assignment
- Permission management
- Activity logging

### Communications Hub
- Multi-channel communication
- Message history
- Automated responses
- Integration management

## 🔄 API Integration

The frontend integrates with the DMHCA CRM Backend API:
- RESTful API architecture
- JWT authentication
- Error handling and retry logic
- Real-time data synchronization

### API Endpoints
- `GET /api/leads` - Fetch leads
- `POST /api/leads` - Create lead
- `GET /api/users` - User management
- `GET /api/communications` - Communication data
- `GET /api/analytics` - Analytics data

## 📊 Data Models

The system supports comprehensive data structures:
- **Leads**: Contact info, stage, source, activities
- **Users**: Profile, roles, permissions, preferences  
- **Communications**: Messages, channels, timestamps
- **Students**: Academic info, enrollment data
- **Campaigns**: Marketing data, performance metrics

## 🚀 Deployment

### Vercel Deployment (Current)
The application is deployed on Vercel with automatic deployments from the main branch.

### Manual Deployment
```bash
npm run build
# Deploy the dist/ folder to your hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is proprietary software owned by DMHCA Educational Institution.

## 🆘 Support

For technical support or questions:
- **Email**: it@dmhca.edu
- **GitHub Issues**: [Create an issue](https://github.com/DMHCAIT/crm-frontend/issues)
- **Documentation**: Available in the `/docs` folder

## 🎯 Production Status

✅ **Fully Deployed & Operational**
- Frontend: Vercel deployment active
- Backend: Railway deployment active  
- Database: Supabase connected
- Authentication: JWT system working
- All CRM features functional

---

**DMHCA CRM Frontend v2.0** - Built with ❤️ for educational excellence.