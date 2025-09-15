// 🔍 TEST LEAD DATABASE CONNECTION AND ISSUES

async function testLeadDatabaseIssues() {
    console.log('🔍 TESTING LEAD DATABASE CONNECTION');
    console.log('===================================\n');
    
    const backendURL = 'https://crm-backend-production-5e32.up.railway.app';
    
    // Get authentication token first
    console.log('1️⃣ Getting authentication token...');
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
        
        if (!loginResponse.ok) {
            console.log('❌ Login failed, cannot test leads');
            return;
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Authentication successful');
        
        // Test leads API
        console.log('\n2️⃣ Testing Leads API:');
        
        const leadsResponse = await fetch(`${backendURL}/api/leads`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const responseData = await leadsResponse.json();
        console.log(`Status: ${leadsResponse.status}`);
        console.log('Response:', JSON.stringify(responseData, null, 2));
        
        if (leadsResponse.ok) {
            console.log('\n📊 LEADS DATA ANALYSIS:');
            console.log(`✅ API Call: Successful`);
            console.log(`📈 Lead Count: ${responseData.count || 0}`);
            
            if (responseData.data && responseData.data.length > 0) {
                console.log('✅ Leads found in database');
                console.log('Sample lead:', responseData.data[0]);
            } else {
                console.log('⚠️ NO LEADS IN DATABASE - This is why Lead Management shows 0');
                console.log('\n🔧 SOLUTIONS:');
                console.log('1. Add sample leads to database');
                console.log('2. Check if Supabase table exists');
                console.log('3. Verify table schema matches API expectations');
            }
        } else {
            console.log('❌ LEADS API ERROR:');
            console.log('Error Details:', responseData);
        }
        
        // Test creating a sample lead
        console.log('\n3️⃣ Testing Lead Creation (to populate database):');
        
        const newLeadData = {
            fullName: 'Test Student',
            email: `test.student.${Date.now()}@example.com`,
            phone: '+91 9876543210',
            country: 'India',
            branch: 'MBBS',
            qualification: 'NEET',
            source: 'website',
            course: 'MBBS',
            priority: 'high'
        };
        
        const createResponse = await fetch(`${backendURL}/api/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newLeadData)
        });
        
        const createData = await createResponse.json();
        console.log(`Create Status: ${createResponse.status}`);
        
        if (createResponse.ok) {
            console.log('✅ Sample lead created successfully');
            console.log('Lead ID:', createData.data?.id);
        } else {
            console.log('❌ Lead creation failed:', createData);
        }
        
    } catch (error) {
        console.error('❌ Test Error:', error.message);
    }
    
    console.log('\n📋 NEXT STEPS TO FIX LEAD MANAGEMENT:');
    console.log('1. Fix database connection issues');
    console.log('2. Add sample leads if database is empty'); 
    console.log('3. Update Lead Management component to handle empty states');
    console.log('4. Add date filters and bulk transfer functionality');
}

// Run the test
testLeadDatabaseIssues().catch(console.error);