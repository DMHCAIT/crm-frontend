import * as XLSX from 'xlsx';

export function readLeadImportRows(buffer: ArrayBuffer): string[][] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error('The import file has no worksheet');
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' })
    .map(row => row.map(cell => String(cell ?? '').trim()));
}
