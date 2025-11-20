# CRM Project Structure

## 📁 Folder Organization

```
CRM/
├── crm-frontend-main/     ← FRONTEND CODE HERE
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
│
├── crm-backend-main/      ← BACKEND CODE HERE
│   ├── api/
│   ├── config/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── .env                   ← Root configuration
├── .gitignore
└── Documentation files
```

## ⚠️ Important Notes

- **Frontend**: All React/TypeScript frontend code is in `crm-frontend-main/`
- **Backend**: All Node.js/Express backend code is in `crm-backend-main/`
- **Do NOT** create a `src/` folder in the root directory
- **Do NOT** place frontend files outside `crm-frontend-main/`

## 🚀 Running the Project

### Frontend
```bash
cd crm-frontend-main
npm install
npm run dev
```

### Backend
```bash
cd crm-backend-main
npm install
npm start
```

## 📝 Last Updated
November 12, 2025 - Folder structure reorganization complete
