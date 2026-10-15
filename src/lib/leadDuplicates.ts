export interface LeadDetails {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  branch: string;
  qualification: string;
  source: string;
  course: string;
  status: string;
  assignedTo: string;
  followUp: string;
  scheduledCallAt?: string | null;
  scheduledCallDismissedAt?: string | null;
  company: string;
  createdAt: string;
  updatedAt: string;
  updated_by?: string;
  notes: { id: string; content: string; timestamp: string; author: string }[];
  fees?: number;
  estimatedValue?: number;
  estimated_value?: number;
  actualRevenue?: number;
  actual_revenue?: number;
  salePrice?: number;
  sale_price?: number;
  currency?: 'USD' | 'INR';
}

export type DuplicateMatch = {
  assignedTo: string | null;
  matchedBy: ('email' | 'phone')[];
} & ({ canView: true; lead: LeadDetails } | { canView: false; lead?: never });

export interface ImportLead {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  branch: string;
  qualification: string;
  source: string;
  course: string;
  followUp: string;
  company: string;
  notes: string;
  rowNumber: number;
}

export interface ImportReview {
  total: number;
  accepted: ImportLead[];
  duplicates: { rowNumber: number; reason: string }[];
  invalid: { rowNumber: number; error: string }[];
}

export const contactKey = (email: string, phone: string) => JSON.stringify([email.trim(), phone.trim()]);

export const isInternationalPhone = (phone: string) =>
  /^\+[1-9][\d\s()-]{6,28}$/.test(phone.trim()) &&
  phone.replace(/\D/g, '').length >= 7 && phone.replace(/\D/g, '').length <= 15;

export const hasCheckableContact = (email: string, phone: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || phone.replace(/\D/g, '').length >= 7;
