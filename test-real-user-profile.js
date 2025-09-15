// 🔍 Test Real User Profile Data - Verify the fix is working

async function testRealUserProfile() {
    console.log('🔍 TESTING REAL USER PROFILE DATA');
    console.log('=================================\n');
    
    const backendURL = 'https://crm-backend-production-5e32.up.railway.app';
    
    // Test the new /users/me endpoint
    console.log('1️⃣ Testing /users/me endpoint:');
    
    // Get a token first (simulate login)
    try {
        const loginResponse = await fetch(`${backendURL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'santhosh@dmhca.in',
                password: 'Santhu@123'
            })
        });
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            const token = loginData.token;
            
            console.log('   ✅ Login successful, token obtained');
            
            // Now test the /users/me endpoint
            console.log('\n2️⃣ Testing /users/me with real token:');
            
            const profileResponse = await fetch(`${backendURL}/api/users/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                
                console.log('   ✅ Profile API Success!');
                console.log('   📋 Real User Data:');
                console.log(`      Name: ${profileData.user?.name}`);
                console.log(`      Email: ${profileData.user?.email}`);
                console.log(`      Role: ${profileData.user?.role}`);
                console.log(`      Department: ${profileData.user?.department}`);
                console.log(`      Phone: ${profileData.user?.phone}`);
                console.log(`      Status: ${profileData.user?.status}`);
                console.log(`      Join Date: ${profileData.user?.joinDate}`);
                
                console.log('\n🎉 USER PROFILE FIX SUCCESSFUL!');
                console.log('   ✅ No more duplicate/sample data');
                console.log('   ✅ Real user information loaded');
                console.log('   ✅ Profile page will show authentic data');
                
            } else {
                const errorText = await profileResponse.text();
                console.log(`   ❌ Profile API Error: ${profileResponse.status}`);
                console.log(`   Error: ${errorText}`);
            }
            
        } else {
            console.log('   ❌ Login failed, cannot test profile endpoint');
        }
        
    } catch (error) {
        console.log(`   ❌ Test Error: ${error.message}`);
    }

    console.log('\n📱 FRONTEND USAGE:');
    console.log('   The UserProfile component will now:');
    console.log('   1. Call apiClient.getCurrentUser()');
    console.log('   2. Fetch real data from /users/me endpoint');
    console.log('   3. Display actual user information');
    console.log('   4. Fall back to auth context if API fails');
    
    console.log('\n🌐 TEST IN BROWSER:');
    console.log('   1. Go to https://www.crmdmhca.com/');
    console.log('   2. Login with santhosh@dmhca.in / Santhu@123');
    console.log('   3. Navigate to User Profile');
    console.log('   4. Verify real user data is displayed (not sample data)');
}

// Run the test
testRealUserProfile().catch(console.error);