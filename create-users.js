// User Creation Script for DMHCA CRM
// Run this in the browser console when on your frontend application

const createUser = async (userData) => {
  try {
    const response = await fetch('https://crm-backend-production-5e32.up.railway.app/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    console.log(`User ${userData.email}:`, result);
    return result;
  } catch (error) {
    console.error(`Error creating user ${userData.email}:`, error);
  }
};

// Example usage:
const users = [
  {
    name: "Santhosh DMHCA",
    email: "santhosh@dmhca.in",
    password: "Santhu@123"
  },
  {
    name: "Admin User",
    email: "admin@dmhca.in",
    password: "Admin@123"
  },
  {
    name: "Counselor User",
    email: "counselor@dmhca.in",
    password: "Counselor@123"
  }
];

// Create all users
users.forEach(user => createUser(user));
