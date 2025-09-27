// Test Lead Assignment Visibility Issue
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testLeadAssignmentVisibility() {
  console.log('🔍 TESTING LEAD ASSIGNMENT VISIBILITY ISSUE');
  console.log('=' .repeat(60));
  
  try {
    // 1. Get all users to understand the hierarchy
    console.log('\n1️⃣ FETCHING ALL USERS');
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, username, email, name, role, reports_to, branch')
      .order('username');
    
    if (usersError) throw usersError;
    
    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach(user => {
      console.log(`  ${user.username} (${user.email}) - Role: ${user.role} - Branch: ${user.branch} - Reports to: ${user.reports_to}`);
    });
    
    // 2. Get all leads to see current assignments
    console.log('\n2️⃣ FETCHING ALL LEADS');
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, email, full_name, assigned_to, assignedTo, assignedcounselor, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (leadsError) throw leadsError;
    
    console.log(`Found ${allLeads.length} recent leads:`);
    allLeads.forEach(lead => {
      console.log(`  ${lead.full_name} (${lead.email}) - assigned_to: "${lead.assigned_to}" - Status: ${lead.status}`);
      if (lead.assignedTo) console.log(`    assignedTo: "${lead.assignedTo}"`);
      if (lead.assignedcounselor) console.log(`    assignedcounselor: "${lead.assignedcounselor}"`);
    });
    
    // 3. Test assignment visibility for a specific scenario
    console.log('\n3️⃣ TESTING ASSIGNMENT VISIBILITY');
    
    // Find a regular user (not super admin)
    const regularUser = allUsers.find(user => user.role !== 'super_admin' && user.username);
    
    if (regularUser) {
      console.log(`\nTesting visibility for user: ${regularUser.username} (${regularUser.email})`);
      
      // Get subordinate usernames for this user
      const subordinateUsernames = await getSubordinateUsernames(regularUser.id, allUsers);
      console.log(`User ${regularUser.username} supervises: [${subordinateUsernames.join(', ')}]`);
      
      // Filter leads this user should be able to see
      const visibleLeads = allLeads.filter(lead => {
        const leadAssignee = lead.assigned_to || lead.assignedTo || lead.assignedcounselor;
        
        // User's own leads
        const isOwnLead = leadAssignee === regularUser.username;
        
        // Subordinate leads
        const isSubordinateLead = subordinateUsernames.includes(leadAssignee);
        
        if (isOwnLead || isSubordinateLead) {
          console.log(`  ✅ ${lead.full_name} - Assignee: "${leadAssignee}" - Reason: ${isOwnLead ? 'Own lead' : 'Subordinate lead'}`);
          return true;
        }
        
        return false;
      });
      
      console.log(`\nUser ${regularUser.username} should see ${visibleLeads.length} out of ${allLeads.length} leads`);
      
      // 4. Test a specific assignment scenario
      console.log('\n4️⃣ TESTING SPECIFIC ASSIGNMENT SCENARIO');
      
      if (allLeads.length > 0) {
        const testLead = allLeads[0];
        console.log(`\nTesting with lead: ${testLead.full_name} (${testLead.id})`);
        console.log(`Current assignment: assigned_to="${testLead.assigned_to}"`);
        
        // Simulate assigning this lead to our test user
        console.log(`\nIf we assign this lead to ${regularUser.username}:`);
        const simulatedLead = { ...testLead, assigned_to: regularUser.username };
        
        const wouldBeVisible = canAccessLead(simulatedLead, regularUser, subordinateUsernames);
        console.log(`Would ${regularUser.username} see this lead? ${wouldBeVisible ? '✅ YES' : '❌ NO'}`);
      }
    }
    
    // 5. Check for common assignment issues
    console.log('\n5️⃣ CHECKING FOR COMMON ASSIGNMENT ISSUES');
    
    const assignmentIssues = [];
    
    allLeads.forEach(lead => {
      const assignments = [
        { field: 'assigned_to', value: lead.assigned_to },
        { field: 'assignedTo', value: lead.assignedTo },
        { field: 'assignedcounselor', value: lead.assignedcounselor }
      ].filter(a => a.value);
      
      if (assignments.length === 0) {
        assignmentIssues.push(`Lead ${lead.full_name}: No assignment found`);
      } else if (assignments.length > 1) {
        const values = assignments.map(a => `${a.field}="${a.value}"`).join(', ');
        assignmentIssues.push(`Lead ${lead.full_name}: Multiple assignments - ${values}`);
      } else {
        // Check if assigned user exists
        const assignedValue = assignments[0].value;
        const assignedUser = allUsers.find(u => u.username === assignedValue);
        if (!assignedUser) {
          assignmentIssues.push(`Lead ${lead.full_name}: Assigned to non-existent user "${assignedValue}"`);
        }
      }
    });
    
    if (assignmentIssues.length > 0) {
      console.log('⚠️ Found assignment issues:');
      assignmentIssues.forEach(issue => console.log(`  ${issue}`));
    } else {
      console.log('✅ No assignment issues found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Helper function to get subordinate usernames
function getSubordinateUsernames(userId, allUsers) {
  const subordinateUsernames = [];
  const visited = new Set();
  
  function findSubordinates(supervisorId) {
    if (visited.has(supervisorId)) return;
    visited.add(supervisorId);
    
    allUsers.forEach(user => {
      if (user.reports_to === supervisorId && user.username) {
        if (!subordinateUsernames.includes(user.username)) {
          subordinateUsernames.push(user.username);
        }
        findSubordinates(user.id);
      }
    });
  }
  
  findSubordinates(userId);
  return subordinateUsernames;
}

// Helper function to check access
function canAccessLead(lead, currentUser, subordinateUsernames = []) {
  if (!currentUser) return false;
  
  const leadAssignee = lead.assigned_to || lead.assignedTo || lead.assignedcounselor;
  
  // User can access their own leads
  if (leadAssignee === currentUser.username) {
    return true;
  }
  
  // User can access subordinates' leads
  return subordinateUsernames.includes(leadAssignee);
}

// Run the test
testLeadAssignmentVisibility();