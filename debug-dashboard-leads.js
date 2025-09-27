// DEBUG TEST FOR DASHBOARD LEADS ISSUE
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const JWT_SECRET = process.env.JWT_SECRET || 'simple-secret-key';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('🔍 DEBUG: Dashboard Leads Assignment Test');

// Initialize Supabase client
let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase client initialized');
} else {
  console.error('❌ Missing Supabase credentials');
}

async function testLeadAssignment() {
  try {
    console.log('\n=== TESTING LEAD ASSIGNMENT ISSUE ===\n');
    
    // 1. Test users in database
    console.log('1. Checking users in database...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email, name, role')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log('👥 Users found:', users.map(u => `${u.username} (${u.email}) - ${u.role}`));
    
    // 2. Test leads assignment
    console.log('\n2. Checking leads assignment...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, fullName, email, assigned_to, assignedTo, assignedcounselor, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (leadsError) {
      console.error('❌ Error fetching leads:', leadsError);
      return;
    }
    
    console.log('📋 Recent leads assignment:');
    leads.forEach(lead => {
      console.log(`  - ${lead.fullName} (${lead.email})`);
      console.log(`    assigned_to: "${lead.assigned_to}"`);
      console.log(`    assignedTo: "${lead.assignedTo}"`);
      console.log(`    assignedcounselor: "${lead.assignedcounselor}"`);
      console.log(`    created_at: ${lead.created_at}`);
      console.log('');
    });
    
    // 3. Test lead filtering for specific user
    console.log('\n3. Testing lead filtering for specific user...');
    const testUser = users[0];
    if (testUser) {
      console.log(`Testing for user: ${testUser.username} (${testUser.email})`);
      
      const userLeads = leads.filter(lead => {
        const leadAssignee = lead.assigned_to || lead.assignedTo || lead.assignedcounselor;
        return leadAssignee && leadAssignee.toLowerCase() === testUser.username.toLowerCase();
      });
      
      console.log(`Found ${userLeads.length} leads for user ${testUser.username}:`);
      userLeads.forEach(lead => {
        console.log(`  - ${lead.fullName} assigned to: "${lead.assigned_to}"`);
      });
    }
    
    // 4. Check JWT token decoding
    console.log('\n4. Testing JWT token decoding...');
    const sampleToken = jwt.sign({
      username: testUser?.username || 'testuser',
      email: testUser?.email || 'test@example.com',
      role: testUser?.role || 'counselor',
      id: testUser?.id || 'test-id'
    }, JWT_SECRET, { expiresIn: '24h' });
    
    const decoded = jwt.verify(sampleToken, JWT_SECRET);
    console.log('JWT decoded:', decoded);
    
    console.log('\n=== TEST COMPLETED ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLeadAssignment();