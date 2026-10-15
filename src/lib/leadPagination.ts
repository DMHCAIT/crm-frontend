export type LeadPageSize = number | 'all';

interface LeadPage<T> {
  success: boolean;
  leads: T[];
  total: number;
}

export async function fetchAllLeadPages<T extends { id: string }>(
  fetchPage: (page: number, pageSize: number) => Promise<LeadPage<T>>
): Promise<LeadPage<T> & { data: T[]; totalLeads: number }> {
  const pageSize = 500;
  const leads: T[] = [];
  const ids = new Set<string>();
  let total: number | undefined;
  for (let page = 1; ; page++) {
    const response = await fetchPage(page, pageSize);
    if (!response.success || !Array.isArray(response.leads) ||
        !Number.isInteger(response.total) || response.total < 0) {
      throw new Error('Unable to load all leads: invalid page response');
    }
    if (total !== undefined && total !== response.total) {
      throw new Error('The lead list changed while loading. Please retry to load all leads.');
    }
    total = response.total;
    for (const lead of response.leads) {
      if (!lead.id || ids.has(lead.id)) {
        throw new Error('The lead list changed while loading. Please retry to load all leads.');
      }
      ids.add(lead.id);
      leads.push(lead);
    }
    if (leads.length === total) {
      return { success: true, leads, data: leads, total, totalLeads: total };
    }
    if (leads.length > total || response.leads.length !== pageSize) {
      throw new Error('Unable to load all leads: incomplete page. Please retry.');
    }
  }
}

export function areAllLeadsSelected(leads: { id: string }[], selectedIds: string[]): boolean {
  const selected = new Set(selectedIds);
  return leads.length > 0 && leads.every(lead => selected.has(lead.id));
}

export function toggleAllLeadSelection(leads: { id: string }[], selectedIds: string[]): string[] {
  return areAllLeadsSelected(leads, selectedIds) ? [] : leads.map(lead => lead.id);
}
