// Shared CRM Constants
// This file contains all standardized values used across the CRM system

export const STATUS_OPTIONS = [
  'Fresh',
  'Follow Up',
  'Warm',
  'Hot',
  'Enrolled',
  'Not Interested',
  'Junk'
] as const;

export type StatusType = typeof STATUS_OPTIONS[number];

export const STATUS_COLORS = {
  'Hot': 'bg-red-100 text-red-800 border-red-200',
  'Warm': 'bg-orange-100 text-orange-800 border-orange-200', 
  'Follow Up': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Fresh': 'bg-blue-100 text-blue-800 border-blue-200',
  'Enrolled': 'bg-green-100 text-green-800 border-green-200',
  'Not Interested': 'bg-gray-100 text-gray-800 border-gray-200',
  'Junk': 'bg-red-100 text-red-800 border-red-200'
} as const;

export const STATUS_MESSAGES = {
  'Fresh': 'New lead captured',
  'Hot': 'Marked as hot lead',
  'Follow Up': 'Follow-up scheduled',
  'Warm': 'Lead qualified as warm',
  'Not Interested': 'Lead marked as not interested',
  'Enrolled': 'Converted to student',
  'Junk': 'Lead marked as junk'
} as const;

export const STATUS_ICONS = {
  'Hot': '🔥',
  'Warm': '🌡️',
  'Follow Up': '📞',
  'Not Interested': '❌',
  'Enrolled': '✅',
  'Fresh': '🆕',
  'Junk': '🗑️'
} as const;

// Priority options
export const PRIORITY_OPTIONS = [
  'low',
  'medium', 
  'high',
  'urgent'
] as const;

// Source options  
export const SOURCE_OPTIONS = [
  'website',
  'social_media',
  'referral',
  'manual',
  'advertisement'
] as const;

export default {
  STATUS_OPTIONS,
  STATUS_COLORS,
  STATUS_MESSAGES,
  STATUS_ICONS,
  PRIORITY_OPTIONS,
  SOURCE_OPTIONS
};