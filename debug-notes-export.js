// Test script to check notes in database and export functionality
console.log('🔍 NOTES DATABASE & EXPORT INVESTIGATION');
console.log('========================================');

console.log('\n📋 ISSUE ANALYSIS:');
console.log('❌ Problem: Notes are saving but not appearing in lead exports');
console.log('❌ Sample data shows lead without notes column data');
console.log('❌ Need to verify: Are notes actually stored in leads.notes column?');

console.log('\n🔧 INVESTIGATION STEPS:');
console.log('1. Check if notes are being saved to leads.notes column');
console.log('2. Verify export query includes notes field');
console.log('3. Test formatExportRow function with sample data');
console.log('4. Debug the complete export flow');

console.log('\n🧪 TESTING EXPORT FUNCTION:');

// Simulate the formatNotes function
function formatNotes(notes) {
  if (!notes) return '';
  
  try {
    let notesArray = [];
    if (Array.isArray(notes)) {
      notesArray = notes;
    } else if (typeof notes === 'string') {
      notesArray = JSON.parse(notes);
    }
    
    const formattedNotes = notesArray.map(note => {
      const date = new Date(note.timestamp).toLocaleDateString();
      return `[${date}] ${note.author}: ${note.content}`;
    }).join(' | ');
    
    return `"${formattedNotes.replace(/"/g, '""')}"`;
  } catch (error) {
    console.log('❌ Error formatting notes:', error.message);
    return `"${notes.toString().replace(/"/g, '""')}"`;
  }
}

// Test with sample lead data (including the one you provided)
const sampleLeadWithNotes = {
  id: '2d4b57f0-41eb-46f1-b7a2-d2267f71b009',
  full_name: 'Dr Arooja Wani',
  email: 'Wani@dmhca.in',
  phone: '+91 7006339368',
  status: 'follow_up',
  source: 'Website',
  assigned_to: 'akshay@delhimedical.net',
  created_at: '2025-09-24T06:23:14.544782+00:00',
  notes: JSON.stringify([
    {
      id: '1727160000001',
      content: 'Initial contact made, interested in Dermatology course',
      author: 'Akshay Kumar',
      timestamp: '2025-09-24T06:25:00.000Z',
      note_type: 'general'
    },
    {
      id: '1727160120002',
      content: 'Follow-up scheduled for next week',
      author: 'Akshay Kumar', 
      timestamp: '2025-09-24T06:27:00.000Z',
      note_type: 'follow_up'
    }
  ])
};

const sampleLeadWithoutNotes = {
  id: '2d4b57f0-41eb-46f1-b7a2-d2267f71b009',
  full_name: 'Dr Arooja Wani',
  email: 'Wani@dmhca.in',
  phone: '+91 7006339368',
  status: 'follow_up',
  source: 'Website',
  assigned_to: 'akshay@delhimedical.net',
  created_at: '2025-09-24T06:23:14.544782+00:00',
  notes: null // This might be the issue
};

console.log('\n🧮 TESTING WITH NOTES:');
const formattedWithNotes = formatNotes(sampleLeadWithNotes.notes);
console.log('Notes data:', formattedWithNotes);

const exportRowWithNotes = [
  sampleLeadWithNotes.id,
  `"${sampleLeadWithNotes.full_name}"`,
  sampleLeadWithNotes.email,
  sampleLeadWithNotes.phone,
  sampleLeadWithNotes.status,
  sampleLeadWithNotes.source,
  `"${sampleLeadWithNotes.assigned_to}"`,
  formattedWithNotes,
  new Date(sampleLeadWithNotes.created_at).toLocaleDateString()
];

console.log('Export row:', exportRowWithNotes.join(','));

console.log('\n🧮 TESTING WITHOUT NOTES:');
const formattedWithoutNotes = formatNotes(sampleLeadWithoutNotes.notes);
console.log('Notes data:', formattedWithoutNotes);

const exportRowWithoutNotes = [
  sampleLeadWithoutNotes.id,
  `"${sampleLeadWithoutNotes.full_name}"`,
  sampleLeadWithoutNotes.email,
  sampleLeadWithoutNotes.phone,
  sampleLeadWithoutNotes.status,
  sampleLeadWithoutNotes.source,
  `"${sampleLeadWithoutNotes.assigned_to}"`,
  formattedWithoutNotes,
  new Date(sampleLeadWithoutNotes.created_at).toLocaleDateString()
];

console.log('Export row:', exportRowWithoutNotes.join(','));

console.log('\n🔍 POTENTIAL ISSUES:');
console.log('1. Database Query: Does SELECT * include notes column?');
console.log('2. Notes Column: Is it properly named "notes" in database?');
console.log('3. Data Type: Are notes stored as JSON or TEXT?');
console.log('4. Null Values: Are empty notes handled correctly?');

console.log('\n🚀 DEBUGGING RECOMMENDATIONS:');
console.log('1. Add console.log to export function to see actual data');
console.log('2. Check database schema for notes column');
console.log('3. Verify notes are saved correctly in addNote function');
console.log('4. Test with known lead that has notes');

console.log('\n✨ NEXT STEPS:');
console.log('1. Add debugging to enhanced-data-export.js');
console.log('2. Verify database query results');
console.log('3. Test export with sample lead ID');
console.log('4. Check if notes field exists in database');