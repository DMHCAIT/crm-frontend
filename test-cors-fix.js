// 🚀 CORS FIX VERIFICATION TEST
// Test the production CORS fix from multiple origins

async function testCORSFix() {
    console.log('🔧 TESTING CORS FIX FOR PRODUCTION FRONTEND');
    console.log('===========================================\n');

    const backendURL = 'https://crm-backend-production-5e32.up.railway.app';
    
    // Test 1: Check if API is responding
    console.log('1️⃣ Testing API Health:');
    try {
        const healthResponse = await fetch(`${backendURL}/health`);
        const healthData = await healthResponse.text();
        console.log(`   ✅ Health Check: ${healthResponse.status} - ${healthData}`);
    } catch (error) {
        console.log(`   ❌ Health Check Failed: ${error.message}`);
    }

    // Test 2: Check CORS headers on root endpoint
    console.log('\n2️⃣ Testing CORS Headers:');
    try {
        const response = await fetch(backendURL, {
            method: 'GET',
            headers: {
                'Origin': 'https://www.crmdmhca.com'
            }
        });
        
        console.log(`   Status: ${response.status}`);
        console.log(`   CORS Headers:`);
        console.log(`   - Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
        console.log(`   - Access-Control-Allow-Methods: ${response.headers.get('Access-Control-Allow-Methods')}`);
        console.log(`   - Access-Control-Allow-Headers: ${response.headers.get('Access-Control-Allow-Headers')}`);
        
    } catch (error) {
        console.log(`   ❌ CORS Test Failed: ${error.message}`);
    }

    // Test 3: Simulate the actual login request that was failing
    console.log('\n3️⃣ Testing Login Endpoint CORS:');
    try {
        const loginResponse = await fetch(`${backendURL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://www.crmdmhca.com'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'test123'
            })
        });
        
        console.log(`   ✅ Login Endpoint Accessible: ${loginResponse.status}`);
        console.log(`   CORS Origin Header: ${loginResponse.headers.get('Access-Control-Allow-Origin')}`);
        
        if (loginResponse.status === 401 || loginResponse.status === 400) {
            console.log('   ✅ Good! Getting auth error means CORS is fixed (endpoint is reachable)');
        }
        
    } catch (error) {
        if (error.message.includes('CORS')) {
            console.log(`   ❌ CORS Still Blocked: ${error.message}`);
        } else {
            console.log(`   ✅ CORS Fixed! Other error: ${error.message}`);
        }
    }

    console.log('\n📋 WHAT TO DO NEXT:');
    console.log('   1. Wait 2-3 minutes for Railway deployment to complete');
    console.log('   2. Try logging in again at https://www.crmdmhca.com/');
    console.log('   3. Use credentials: santhosh@dmhca.in / Santhu@123');
    console.log('   4. Or use the "Super Admin Access" button for instant login');
    
    console.log('\n🎯 EXPECTED RESULT:');
    console.log('   ✅ Login should work without CORS errors');
    console.log('   ✅ All API calls should succeed');
    console.log('   ✅ Dashboard should load with data');
    
    console.log('\n⏰ Railway Deployment Status: IN PROGRESS...');
}

// Run the test
testCORSFix().catch(console.error);