// Shared CRM Constants
// This file contains all standardized values used across the CRM system

export const STATUS_OPTIONS = [
  'hot',
  'followup', 
  'warm',
  'not interested',
  'enrolled',
  'fresh',
  'junk'
] as const;

export type StatusType = typeof STATUS_OPTIONS[number];

export const STATUS_COLORS = {
  hot: 'bg-red-100 text-red-800 border-red-200',
  warm: 'bg-orange-100 text-orange-800 border-orange-200', 
  followup: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  fresh: 'bg-blue-100 text-blue-800 border-blue-200',
  enrolled: 'bg-green-100 text-green-800 border-green-200',
  'not interested': 'bg-gray-100 text-gray-800 border-gray-200',
  junk: 'bg-red-100 text-red-800 border-red-200'
} as const;

export const STATUS_MESSAGES = {
  fresh: 'New lead captured',
  hot: 'Marked as hot lead',
  followup: 'Follow-up scheduled',
  warm: 'Lead qualified as warm',
  'not interested': 'Lead marked as not interested',
  enrolled: 'Converted to student',
  junk: 'Lead marked as junk'
} as const;

export const STATUS_ICONS = {
  hot: '🔥',
  warm: '🌡️',
  followup: '📞',
  'not interested': '❌',
  enrolled: '✅',
  fresh: '🆕',
  junk: '🗑️'
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