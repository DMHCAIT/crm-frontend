// 🎯 CREATE SAMPLE LEADS TO POPULATE DATABASE

async function createSampleLeads() {
    console.log('🎯 CREATING SAMPLE LEADS FOR TESTING');
    console.log('====================================\n');
    
    const backendURL = 'https://crm-backend-production-5e32.up.railway.app';
    
    // Sample leads data
    const sampleLeads = [
        {
            fullName: 'Rahul Sharma',
            email: 'rahul.sharma@example.com',
            phone: '+91 9876543210',
            country: 'India',
            branch: 'MBBS',
            qualification: 'NEET - 650 marks',
            source: 'website',
            course: 'MBBS',
            priority: 'high',
            notes: 'Interested in MBBS admission, called twice'
        },
        {
            fullName: 'Priya Patel',
            email: 'priya.patel@example.com',
            phone: '+91 9876543211',
            country: 'India',
            branch: 'BDS',
            qualification: 'NEET - 580 marks',
            source: 'facebook',
            course: 'BDS',
            priority: 'medium',
            notes: 'Interested in dental course, parent inquiry'
        },
        {
            fullName: 'Aakash Kumar',
            email: 'aakash.kumar@example.com',
            phone: '+91 9876543212',
            country: 'India',
            branch: 'MBBS',
            qualification: 'NEET - 720 marks',
            source: 'referral',
            course: 'MBBS',
            priority: 'high',
            notes: 'High scorer, very interested, ready to pay fees'
        },
        {
            fullName: 'Neha Singh',
            email: 'neha.singh@example.com',
            phone: '+91 9876543213',
            country: 'India',
            branch: 'BAMS',
            qualification: 'NEET - 520 marks',
            source: 'whatsapp',
            course: 'BAMS',
            priority: 'medium',
            notes: 'Interested in Ayurvedic medicine'
        },
        {
            fullName: 'Arjun Reddy',
            email: 'arjun.reddy@example.com',
            phone: '+91 9876543214',
            country: 'India',
            branch: 'MBBS',
            qualification: 'NEET - 690 marks',
            source: 'website',
            course: 'MBBS',
            priority: 'high',
            notes: 'From Hyderabad, needs hostel information'
        }
    ];
    
    // Get authentication token
    try {
        console.log('1️⃣ Getting authentication token...');
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
            console.log('❌ Login failed');
            return;
        }
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Authentication successful');
        
        // Create each lead
        console.log('\n2️⃣ Creating sample leads...');
        
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < sampleLeads.length; i++) {
            const lead = sampleLeads[i];
            console.log(`\n   Creating lead ${i + 1}: ${lead.fullName}`);
            
            try {
                const createResponse = await fetch(`${backendURL}/api/leads`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(lead)
                });
                
                if (createResponse.ok) {
                    const result = await createResponse.json();
                    console.log(`   ✅ Created: ${lead.fullName} (ID: ${result.data?.id})`);
                    successCount++;
                } else {
                    const error = await createResponse.json();
                    console.log(`   ❌ Failed: ${lead.fullName} - ${error.error}`);
                    failCount++;
                }
                
                // Add small delay between requests
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.log(`   ❌ Error creating ${lead.fullName}: ${error.message}`);
                failCount++;
            }
        }
        
        console.log('\n📊 SUMMARY:');
        console.log(`✅ Successfully created: ${successCount} leads`);
        console.log(`❌ Failed to create: ${failCount} leads`);
        
        if (successCount > 0) {
            console.log('\n🎉 SUCCESS! Lead Management should now show data.');
            console.log('   Go to https://www.crmdmhca.com/');
            console.log('   Login and check Lead Management page');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the sample data creation
createSampleLeads().catch(console.error);