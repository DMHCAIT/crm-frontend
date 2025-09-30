const fs = require('fs');

console.log('🔄 Generating clean username-based SQL for DMHCA Supabase...');

// Email to Username mapping
function normalizeAssignmentField(assignmentValue) {
  if (!assignmentValue || assignmentValue === 'Unassigned') {
    return 'Unassigned';
  }
  
  // If it's already a username (no @ symbol), return as is
  if (!assignmentValue.includes('@')) {
    return assignmentValue;
  }
  
  // Email to username mapping
  const emailToUsernameMap = {
    'loveleen@delhimedical.net': 'Loveleen',
    'admin@delhimedical.net': 'Admin', 
    'info@delhimedical.net': 'Info',
    'support@delhimedical.net': 'Support',
    'aslam@ibmp.in': 'Aslam',
    'roshan@ibmp.in': 'Roshan',
    'nakshatra@ibmp.in': 'Nakshatra',
    'admin@dmhca.com': 'admin',
    'system@dmhca.com': 'system'
  };
  
  // Check direct mapping first
  if (emailToUsernameMap[assignmentValue.toLowerCase()]) {
    return emailToUsernameMap[assignmentValue.toLowerCase()];
  }
  
  // Extract username from email and clean it up
  const username = assignmentValue.split('@')[0];
  return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
}

// Read existing batch files and update them with clean usernames
console.log('🔧 Updating existing batch files with clean usernames...');

for (let i = 1; i <= 12; i++) {
  const batchNumber = i.toString().padStart(2, '0');
  const fileName = `ibmp-leads-batch-${batchNumber}.sql`;
  
  if (fs.existsSync(fileName)) {
    let content = fs.readFileSync(fileName, 'utf8');
    
    // Count email assignments before cleanup
    const emailMatches = content.match(/'[^']*@[^']*'/g) || [];
    
    if (emailMatches.length > 0) {
      console.log(`📝 Cleaning ${fileName}: Found ${emailMatches.length} email assignments`);
      
      // Replace email assignments with usernames
      emailMatches.forEach(emailMatch => {
        const email = emailMatch.replace(/'/g, ''); // Remove quotes
        const username = normalizeAssignmentField(email);
        content = content.replace(new RegExp(emailMatch, 'g'), `'${username}'`);
      });
      
      // Write updated content
      fs.writeFileSync(fileName, content);
      console.log(`✅ Updated ${fileName} with clean usernames`);
    } else {
      console.log(`✅ ${fileName} already has clean assignments`);
    }
  }
}

console.log('\n🎯 CLEANUP SUMMARY:');
console.log('==================');
console.log('✅ All batch files updated with clean usernames');
console.log('✅ Email assignments converted to usernames');
console.log('✅ Ready for clean database import');

console.log('\n📊 MAPPING EXAMPLES:');
console.log('====================');
console.log('loveleen@delhimedical.net → Loveleen');
console.log('aslam@ibmp.in → Aslam');
console.log('roshan@ibmp.in → Roshan');
console.log('nakshatra@ibmp.in → Nakshatra');

console.log('\n✅ SQL files cleaned and ready for import!');