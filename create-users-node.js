// Node.js User Creation Script for DMHCA CRM
const https = require('https');

const createUser = async (userData) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(userData);
    
    const options = {
      hostname: 'crm-backend-production-5e32.up.railway.app',
      port: 443,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log(`✅ User ${userData.email}:`, result);
          resolve(result);
        } catch (error) {
          console.error(`❌ Parse error for ${userData.email}:`, error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Network error for ${userData.email}:`, error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

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
    email: "lahareesh@dmhca.in",
    password: "Developer@123"
  }
];

// Create all users sequentially
const createAllUsers = async () => {
  console.log('🚀 Starting user creation process...\n');
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    try {
      console.log(`📝 Creating user ${i + 1}/${users.length}: ${user.email}`);
      await createUser(user);
      console.log('✅ Success!\n');
      
      // Add a small delay between requests
      if (i < users.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Failed to create ${user.email}:`, error.message);
      console.log('');
    }
  }
  
  console.log('🎉 User creation process completed!');
};

// Run the script
createAllUsers();
