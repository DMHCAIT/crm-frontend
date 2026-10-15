export interface ScheduledCallLead {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  scheduledCallAt: string | null;
  scheduledCallDismissedAt?: string | null;
  updatedAt: string;
}

export function isCallPending(lead: ScheduledCallLead): boolean {
  if (!lead.scheduledCallAt || lead.scheduledCallDismissedAt) return false;
  const due = Date.parse(lead.scheduledCallAt);
  return Number.isFinite(due) && !(Date.parse(lead.updatedAt) >= due);
}

export function dueCalls(leads: ScheduledCallLead[], now: number): ScheduledCallLead[] {
  return leads.filter(lead => isCallPending(lead) && Date.parse(lead.scheduledCallAt!) <= now)
    .sort((a, b) => Date.parse(a.scheduledCallAt!) - Date.parse(b.scheduledCallAt!));
}

export function nextCallDelay(leads: ScheduledCallLead[], now: number): number | null {
  const future = leads.filter(isCallPending).map(lead => Date.parse(lead.scheduledCallAt!))
    .filter(due => due > now);
  return future.length ? Math.min(future.reduce((earliest, due) => Math.min(earliest, due)) - now, 2147483647) : null;
}

export function toLocalCallTime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
