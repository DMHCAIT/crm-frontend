// 🔍 Check User Hierarchy in Database
// This script shows the current user hierarchy setup in your database

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Check if Supabase credentials are available
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.log('❌ Missing Supabase credentials!');
  console.log('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkHierarchy() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 USER HIERARCHY CHECK');
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, username, email, role, reports_to, status, department')
      .order('role', { ascending: false });
    
    if (error) {
      console.log('❌ Error fetching users:', error.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️  No users found in database!');
      return;
    }
    
    console.log(`✅ Found ${users.length} users in database\n`);
    
    // Define role hierarchy
    const roleHierarchy = {
      'super_admin': 100,
      'admin': 90,
      'senior_manager': 85,
      'manager': 80,
      'team_leader': 70,
      'senior_counselor': 60,
      'counselor': 50,
      'junior_counselor': 40,
      'trainee': 30,
      'user': 20
    };
    
    // Create user map
    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = u;
    });
    
    // Display hierarchy tree
    console.log('👥 USER HIERARCHY TREE:\n');
    
    // Find root users (those who don't report to anyone)
    const rootUsers = users.filter(u => !u.reports_to);
    
    function displayUserTree(user, indent = 0) {
      const prefix = '  '.repeat(indent);
      const roleLevel = roleHierarchy[user.role] || 0;
      const statusIcon = user.status === 'active' ? '✅' : '⏸️';
      const subordinates = users.filter(u => u.reports_to === user.id);
      
      console.log(`${prefix}${statusIcon} ${user.name || user.username} (${user.role}) [Level: ${roleLevel}]`);
      console.log(`${prefix}   📧 ${user.email}`);
      console.log(`${prefix}   👤 Username: ${user.username || 'N/A'}`);
      console.log(`${prefix}   🆔 ID: ${user.id}`);
      if (user.department) {
        console.log(`${prefix}   🏢 Department: ${user.department}`);
      }
      if (subordinates.length > 0) {
        console.log(`${prefix}   👥 Manages: ${subordinates.length} users`);
      }
      console.log('');
      
      // Display subordinates
      subordinates.forEach(sub => {
        displayUserTree(sub, indent + 1);
      });
    }
    
    // Display all root users and their trees
    rootUsers.forEach(user => {
      displayUserTree(user);
    });
    
    // Display orphaned users (those who report to non-existent users)
    const orphanedUsers = users.filter(u => u.reports_to && !userMap[u.reports_to]);
    if (orphanedUsers.length > 0) {
      console.log('⚠️  ORPHANED USERS (report to non-existent users):\n');
      orphanedUsers.forEach(u => {
        console.log(`   ⚠️  ${u.name} (${u.email}) reports to ID: ${u.reports_to} [NOT FOUND]`);
      });
      console.log('');
    }
    
    // Summary by role
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 SUMMARY BY ROLE');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const roleCounts = {};
    users.forEach(u => {
      const role = u.role || 'undefined';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    Object.entries(roleCounts)
      .sort((a, b) => (roleHierarchy[b[0]] || 0) - (roleHierarchy[a[0]] || 0))
      .forEach(([role, count]) => {
        const level = roleHierarchy[role] || 0;
        console.log(`   ${role.padEnd(20)} : ${count} users [Level: ${level}]`);
      });
    
    // Check for potential issues
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔧 HIERARCHY HEALTH CHECK');
    console.log('═══════════════════════════════════════════════════════\n');
    
    let issues = 0;
    
    // Check 1: Users without roles
    const usersWithoutRole = users.filter(u => !u.role);
    if (usersWithoutRole.length > 0) {
      issues++;
      console.log(`⚠️  ${usersWithoutRole.length} users without roles:`);
      usersWithoutRole.forEach(u => console.log(`   - ${u.name || u.email}`));
      console.log('');
    }
    
    // Check 2: Users without usernames
    const usersWithoutUsername = users.filter(u => !u.username);
    if (usersWithoutUsername.length > 0) {
      issues++;
      console.log(`⚠️  ${usersWithoutUsername.length} users without usernames:`);
      usersWithoutUsername.forEach(u => console.log(`   - ${u.name} (${u.email})`));
      console.log('');
    }
    
    // Check 3: Inactive users
    const inactiveUsers = users.filter(u => u.status !== 'active');
    if (inactiveUsers.length > 0) {
      console.log(`ℹ️  ${inactiveUsers.length} inactive users:`);
      inactiveUsers.forEach(u => console.log(`   - ${u.name} (${u.email}) - Status: ${u.status}`));
      console.log('');
    }
    
    // Check 4: Circular references
    function hasCircularReference(userId, visited = new Set()) {
      if (visited.has(userId)) return true;
      visited.add(userId);
      
      const user = userMap[userId];
      if (!user || !user.reports_to) return false;
      
      return hasCircularReference(user.reports_to, visited);
    }
    
    const circularUsers = users.filter(u => hasCircularReference(u.id));
    if (circularUsers.length > 0) {
      issues++;
      console.log(`⚠️  ${circularUsers.length} users with circular reporting:`);
      circularUsers.forEach(u => console.log(`   - ${u.name} (${u.email})`));
      console.log('');
    }
    
    if (issues === 0) {
      console.log('✅ No critical hierarchy issues detected!');
    } else {
      console.log(`⚠️  Found ${issues} potential issues to review`);
    }
    
    // Test assignability
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔍 ASSIGNABILITY MATRIX');
    console.log('═══════════════════════════════════════════════════════\n');
    
    function getSubordinates(userId, depth = 0) {
      if (depth > 10) return []; // Prevent infinite loops
      const subs = users.filter(u => u.reports_to === userId);
      let allSubs = [...subs];
      subs.forEach(sub => {
        allSubs = [...allSubs, ...getSubordinates(sub.id, depth + 1)];
      });
      return allSubs;
    }
    
    const activeUsers = users.filter(u => u.status === 'active');
    activeUsers.forEach(user => {
      const subordinates = getSubordinates(user.id);
      let canAssignTo = [user]; // Can assign to self
      
      // Add subordinates
      canAssignTo = [...canAssignTo, ...subordinates];
      
      // Role-based additions
      if (user.role === 'super_admin') {
        canAssignTo = activeUsers;
      } else if (user.role === 'senior_manager') {
        const additionalUsers = activeUsers.filter(u => 
          ['manager', 'team_leader', 'counselor'].includes(u.role)
        );
        canAssignTo = [...new Set([...canAssignTo, ...additionalUsers])];
      } else if (user.role === 'manager') {
        const additionalUsers = activeUsers.filter(u => 
          ['team_leader', 'counselor'].includes(u.role)
        );
        canAssignTo = [...new Set([...canAssignTo, ...additionalUsers])];
      }
      
      console.log(`${user.name} (${user.role}):`);
      console.log(`   Can assign leads to ${canAssignTo.length} users:`);
      canAssignTo.slice(0, 5).forEach(u => {
        const isSelf = u.id === user.id;
        console.log(`   - ${u.name} (${u.role}) ${isSelf ? '👤' : ''}`);
      });
      if (canAssignTo.length > 5) {
        console.log(`   ... and ${canAssignTo.length - 5} more`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run the check
checkHierarchy()
  .then(() => {
    console.log('\n✨ Hierarchy check complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
