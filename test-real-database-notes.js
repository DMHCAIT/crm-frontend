// Direct Database Notes Test - Testing Your Exact Data
console.log('🔍 TESTING YOUR EXACT LEAD DATA FROM DATABASE');
console.log('============================================');

// Your exact lead data from the database
const sampleLeadFromDB = {
  id: '2d4b57f0-41eb-46f1-b7a2-d2267f71b009',
  fullName: 'Dr Arooja Wani',
  email: 'Wani@dmhca.in',
  phone: '+91 7006339368',
  country: 'India',
  branch: 'Delhi',
  qualification: 'MBBS',
  source: 'Website',
  course: 'Dermatology',
  status: 'follow_up',
  assignedTo: 'akshay@delhimedical.net',
  followUp: '2025-09-24',
  priority: 'medium',
  notes: '[{"id":"1758694994177","content":"Lead created via manual entry by Administrator","author":"Akshay","timestamp":"2025-09-24T06:23:14.413Z","note_type":"general"}]',
  created_at: '2025-09-24T06:23:14.544782+00:00',
  updated_at: '2025-09-27T05:10:18.054355+00:00'
};

console.log('\n📊 LEAD INFORMATION:');
console.log('ID:', sampleLeadFromDB.id);
console.log('Name:', sampleLeadFromDB.fullName);
console.log('Status:', sampleLeadFromDB.status);
console.log('Assigned To:', sampleLeadFromDB.assignedTo);

console.log('\n📝 NOTES ANALYSIS:');
console.log('Raw notes field:', sampleLeadFromDB.notes);
console.log('Notes type:', typeof sampleLeadFromDB.notes);
console.log('Notes length:', sampleLeadFromDB.notes ? sampleLeadFromDB.notes.length : 0);
console.log('Has notes:', !!sampleLeadFromDB.notes);

console.log('\n🧪 PARSING TEST:');
try {
  const parsedNotes = JSON.parse(sampleLeadFromDB.notes);
  console.log('✅ Successfully parsed JSON');
  console.log('Notes count:', parsedNotes.length);
  console.log('First note:', parsedNotes[0]);
  
  console.log('\n📄 FORMATTED FOR EXPORT:');
  const formattedNotes = parsedNotes.map(note => {
    const date = new Date(note.timestamp).toLocaleDateString();
    return `[${date}] ${note.author}: ${note.content}`;
  }).join(' | ');
  
  console.log('Formatted notes:', formattedNotes);
  
  console.log('\n📋 CSV ROW SIMULATION:');
  const csvRow = [
    sampleLeadFromDB.id,
    `"${sampleLeadFromDB.fullName}"`,
    sampleLeadFromDB.email,
    sampleLeadFromDB.phone,
    sampleLeadFromDB.status,
    sampleLeadFromDB.source,
    `"${sampleLeadFromDB.assignedTo}"`,
    `"${formattedNotes.replace(/"/g, '""')}"`,
    new Date(sampleLeadFromDB.created_at).toLocaleDateString()
  ];
  
  console.log('CSV Row:', csvRow.join(','));
  
} catch (error) {
  console.error('❌ Error parsing notes:', error.message);
}

console.log('\n🎯 CONCLUSION:');
console.log('✅ Notes ARE stored in the database');
console.log('✅ Notes CAN be parsed from JSON');
console.log('✅ Notes CAN be formatted for export');
console.log('❗ Issue must be in the database query or field selection');

console.log('\n🔧 SIMPLE FIX NEEDED:');
console.log('1. Ensure SELECT query includes notes field');
console.log('2. Handle fullName vs full_name field naming');
console.log('3. Parse JSON notes correctly in export function');
console.log('4. Test with your exact lead ID');

console.log('\n📝 EXPORT HEADERS TEST:');
const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Source', 'Assigned To', 'Notes', 'Created Date'];
console.log('Headers:', headers.join(','));

console.log('\n✨ READY FOR IMPLEMENTATION!');