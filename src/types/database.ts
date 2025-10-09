// Complete TypeScript interfaces matching your database schema

// ===========================
// LEADS
// ===========================
export interface DatabaseLead {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  country?: string;
  branch?: string;
  qualification?: string;
  source?: string;
  course?: string;
  status?: string;
  assignedTo?: string;
  followUp?: string;

  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  created_at: string;
  updated_at: string;
}

// ===========================
// STUDENTS
// ===========================
export interface DatabaseStudent {
  id: string;
  created_at: string;
  updated_at: string;
  student_id?: string;
  name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  current_address?: string;
  permanent_address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  course?: string;
  specialization?: string;
  batch_year?: number;
  admission_date?: string;
  expected_completion_date?: string;
  status: 'enrolled' | 'active' | 'completed' | 'dropped' | 'suspended' | 'on_leave';
  progress: number; // 0-100
  total_fees?: number;
  fees_paid?: number;
  fees_pending?: number;
  originated_from_lead?: string; // UUID reference to leads table
  assigned_counselor?: string; // UUID reference to users table
  notes?: string;
  custom_fields?: Record<string, any>;
}

// ===========================
// USERS
// ===========================
export interface DatabaseUser {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  username: string;
  email: string;
  password_hash?: string;
  phone?: string;
  office_phone?: string;
  role: 'super_admin' | 'senior_manager' | 'manager' | 'team_leader' | 'counselor';
  department?: string;
  designation?: string;
  location?: string;
  branch?: string;
  date_of_birth?: string;
  join_date?: string;
  status: 'active' | 'inactive' | 'suspended';
  reports_to?: string; // UUID reference to another user
  assignedTo?: string; // Manager or supervisor assigned to this user
  profile_image?: string;
  last_login?: string;
  login_count?: number;
  preferences?: Record<string, any>;
}

// ===========================
// ANALYTICS EVENTS
// ===========================
export interface AnalyticsEvent {
  id: string;
  created_at: string;
  event_type: string;
  event_name: string;
  description?: string;
  user_id?: string;
  lead_id?: string;
  student_id?: string;
  event_data?: Record<string, any>;
  properties?: Record<string, any>;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  duration?: number;
  value?: number;
  category?: string;
  source?: string;
  medium?: string;
  campaign?: string;
}

// ===========================
// COMMUNICATIONS
// ===========================
export interface Communication {
  id: string;
  created_at: string;
  type: 'email' | 'sms' | 'whatsapp' | 'call' | 'meeting' | 'letter' | 'chat';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content?: string;
  sender?: string;
  recipient?: string;
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed' | 'pending' | 'completed';
  lead_id?: string;
  student_id?: string;
  user_id?: string;
  campaign_id?: string;
  scheduled_at?: string;
  delivered_at?: string;
  read_at?: string;
  channel_specific_data?: Record<string, any>;
  attachments?: string[];
  response_received?: boolean;
  opened?: boolean;
  clicked?: boolean;
  responded?: boolean;
}

// ===========================
// CAMPAIGNS
// ===========================
export interface Campaign {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'whatsapp' | 'phone' | 'multi_channel';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  target_audience?: string;
  target_criteria?: Record<string, any>;
  subject?: string;
  content?: string;
  template_id?: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  total_recipients?: number;
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  responded?: number;
  converted?: number;
  failed?: number;
  created_by?: string;
  automation_rules?: Record<string, any>;
  is_automated?: boolean;
  tags?: string[];
  custom_fields?: Record<string, any>;
}

// ===========================
// DOCUMENTS
// ===========================
export interface Document {
  id: string;
  created_at: string;
  updated_at: string;
  document_name: string;
  document_type: string;
  file_url?: string;
  file_size?: number;
  file_type?: string;
  student_id?: string;
  lead_id?: string;
  uploaded_by?: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  notes?: string;
  tags?: string[];
  is_required?: boolean;
  expiry_date?: string;
  version?: number;
  parent_document_id?: string;
  is_confidential?: boolean;
  access_level?: string;
}

// ===========================
// PAYMENTS
// ===========================
export interface Payment {
  id: string;
  created_at: string;
  updated_at: string;
  payment_id?: string;
  amount: number;
  currency?: string;
  student_id: string;
  processed_by?: string;
  payment_method?: string;
  payment_gateway?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  transaction_id?: string;
  gateway_transaction_id?: string;
  payment_date?: string;
  due_date?: string;
  fee_type?: string;
  academic_year?: string;
  semester?: string;
  receipt_number?: string;
  invoice_url?: string;
  notes?: string;
  gateway_response?: Record<string, any>;
}

// ===========================
// NOTIFICATIONS
// ===========================
export interface Notification {
  id: string;
  created_at: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  user_id: string;
  is_read?: boolean;
  read_at?: string;
  lead_id?: string;
  student_id?: string;
  action_url?: string;
  action_label?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>;
  expires_at?: string;
}

// ===========================
// NOTES
// ===========================
export interface Note {
  id: string;
  created_at: string;
  updated_at: string;
  content: string;
  lead_id?: string;
  student_id?: string;
  user_id?: string;
  author_id: string;
  note_type: 'general' | 'follow_up' | 'important' | 'meeting' | 'call' | 'reminder';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_private?: boolean;
  reminder_at?: string;
  is_reminder_sent?: boolean;
  tags?: string[];
}

// ===========================
// AUTOMATION WORKFLOWS
// ===========================
export interface AutomationWorkflow {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_conditions?: Record<string, any>;
  actions?: Array<Record<string, any>>;
  status: 'active' | 'inactive' | 'draft';
  execution_count?: number;
  last_execution?: string;
  created_by?: string;
  is_enabled?: boolean;
  priority?: number;
  tags?: string[];
  category?: string;
}

// ===========================
// INTEGRATION LOGS
// ===========================
export interface IntegrationLog {
  id: string;
  created_at: string;
  integration_name: string;
  activity_type: string;
  description?: string;
  status?: 'success' | 'failure' | 'warning' | 'info';
  request_data?: Record<string, any>;
  response_data?: Record<string, any>;
  error_message?: string;
  execution_time?: number;
  records_processed?: number;
  lead_id?: string;
  student_id?: string;
  ip_address?: string;
  user_agent?: string;
}

// ===========================
// INTEGRATIONS STATUS
// ===========================
export interface IntegrationStatus {
  id: string;
  created_at: string;
  updated_at: string;
  integration_name: string;
  display_name?: string;
  description?: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing' | 'configuring';
  configuration?: Record<string, any>;
  credentials?: Record<string, any>;
  last_sync?: string;
  next_sync?: string;
  sync_frequency?: number;
  total_syncs?: number;
  successful_syncs?: number;
  failed_syncs?: number;
  last_error?: string;
  error_count?: number;
  version?: string;
  category?: string;
  features?: Array<string>;
  enabled?: boolean;
  configured_by?: string;
}

// ===========================
// USER PROFILES
// ===========================
export interface UserProfile {
  id: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
  phone?: string;
  role: 'super_admin' | 'senior_manager' | 'manager' | 'team_leader' | 'counselor' | 'viewer' | 'admin' | 'agent';
  department?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
  is_active?: boolean;
  designation?: string;
  location?: string;
  employee_id?: string;
  hire_date?: string;
  permissions?: Record<string, any>;
  settings?: Record<string, any>;
  timezone?: string;
}

// ===========================
// SYSTEM SETTINGS
// ===========================
export interface SystemSetting {
  id: string;
  created_at: string;
  updated_at: string;
  setting_key: string;
  setting_value?: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: string;
  description?: string;
  default_value?: string;
  is_public?: boolean;
  is_encrypted?: boolean;
  modified_by?: string;
  validation_rules?: Record<string, any>;
}

// ===========================
// USER SESSIONS
// ===========================
export interface UserSession {
  id: string;
  created_at: string;
  expires_at: string;
  session_token: string;
  refresh_token?: string;
  user_id?: string;
  device_info?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  location?: Record<string, any>;
  is_active?: boolean;
  last_activity?: string;
}