// SIMPLE NOTES EXPORT FIX PATCH
// This file contains the corrected formatNotes function to replace in enhanced-data-export.js

console.log('🔧 NOTES EXPORT PATCH READY');
console.log('===========================');

// This is the corrected formatNotes function that should replace the existing one:
const correctedFormatNotesFunction = `
// Helper function to format notes for export  
const formatNotes = (item, options) => {
  // Debug specific lead
  const isDebugLead = item.id === '2d4b57f0-41eb-46f1-b7a2-d2267f71b009';
  if (isDebugLead) {
    console.log('🔍 DEBUG: Processing Dr Arooja Wani lead notes');
    console.log('🔍 DEBUG: Notes value:', item.notes);
    console.log('🔍 DEBUG: Notes type:', typeof item.notes);
  }
  
  let notesToFormat = [];
  
  // Parse notes from leads.notes column (JSON string)
  if (item.notes && typeof item.notes === 'string' && item.notes.trim()) {
    try {
      notesToFormat = JSON.parse(item.notes);
      if (isDebugLead) {
        console.log('📝 DEBUG: Successfully parsed', notesToFormat.length, 'notes');
      }
    } catch (error) {
      if (isDebugLead) {
        console.log('📝 DEBUG: Error parsing notes:', error.message);
      }
      return '';
    }
  } else if (Array.isArray(item.notes)) {
    notesToFormat = item.notes;
  }
  
  if (!notesToFormat || notesToFormat.length === 0) {
    return '';
  }
  
  try {
    // Format each note: [date] Author: content
    const formattedNotes = notesToFormat.map(note => {
      const date = new Date(note.timestamp).toLocaleDateString();
      return \`[\${date}] \${note.author}: \${note.content}\`;
    }).join(' | ');
    
    // Escape quotes for CSV
    return \`"\${formattedNotes.replace(/"/g, '""')}"\`;
  } catch (error) {
    if (isDebugLead) {
      console.log('📝 DEBUG: Error formatting notes:', error.message);
    }
    return '"Error formatting notes"';
  }
};
`;

console.log('\n📋 KEY CHANGES:');
console.log('1. ✅ Prioritize leads.notes column (where data actually is)');
console.log('2. ✅ Handle JSON string parsing correctly');
console.log('3. ✅ Debug specific lead ID: 2d4b57f0-41eb-46f1-b7a2-d2267f71b009');
console.log('4. ✅ Proper CSV escaping');
console.log('5. ✅ Error handling with fallbacks');

console.log('\n🎯 EXPORT ROW CHANGES NEEDED:');
console.log('Replace item.full_name with item.fullName (match your database schema)');

const correctedBaseRow = `
leads: [
  item.id,
  '"' + (item.fullName || '') + '"',
  item.email || '',
  item.phone || '',
  item.status || '',
  item.source || '',
  '"' + (item.assigned_to || item.assignedTo || item.assignedcounselor || 'Unassigned') + '"',
  formatNotes(item, options),
  item.created_at ? new Date(item.created_at).toLocaleDateString() : ''
]
`;

console.log('\n📝 DATABASE QUERY FIX:');
console.log('Ensure SELECT explicitly includes: notes, fullName fields');

const correctedQuery = `
let query = supabase
  .from('leads') 
  .select('id, fullName, email, phone, status, source, assignedTo, assigned_to, assignedcounselor, notes, created_at, updated_at')
`;

console.log('\n🚀 IMPLEMENTATION STEPS:');
console.log('1. Fix the corrupted enhanced-data-export.js file');
console.log('2. Replace formatNotes function with corrected version');
console.log('3. Update baseRow to use item.fullName');
console.log('4. Ensure query selects notes field explicitly');
console.log('5. Test export with Dr Arooja Wani lead');

console.log('\n✨ Expected Result:');
console.log('CSV will include: "[9/24/2025] Akshay: Lead created via manual entry by Administrator"');

module.exports = {
  correctedFormatNotesFunction,
  correctedBaseRow,
  correctedQuery
};