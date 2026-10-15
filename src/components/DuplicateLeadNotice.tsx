import type { DuplicateMatch, LeadDetails } from '../lib/leadDuplicates';

interface Props {
  duplicates: DuplicateMatch[];
  checking?: boolean;
  error?: string | null;
  onView: (lead: LeadDetails) => void;
  onRetry?: () => void;
}

export default function DuplicateLeadNotice({ duplicates, checking, error, onView, onRetry }: Props) {
  if (checking) return <p role="status" className="mb-4 text-sm text-blue-700">Checking phone and email across CRM...</p>;
  if (error) return (
    <div role="alert" className="mb-4 text-sm text-red-700">
      Duplicate check failed: {error}. Saving is blocked until the check succeeds.
      {onRetry && <button type="button" className="ml-2 underline" onClick={onRetry}>Retry check</button>}
    </div>
  );
  if (!duplicates.length) return null;
  return (
    <div role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="font-semibold text-amber-900">Duplicate lead found. This lead cannot be added again.</p>
      {duplicates.map((match, index) => (
        <div key={index} className="mt-2 text-sm text-amber-900">
          <span>Matching {match.matchedBy.join(' and ')}. Assigned to: {match.assignedTo || 'Unassigned'}.</span>
          {match.canView ? (
            <button type="button" className="ml-3 font-semibold text-blue-700 underline" onClick={() => onView(match.lead)}>
              View lead
            </button>
          ) : (
            <span className="ml-2">Outside your bucket. Only ownership is visible.</span>
          )}
        </div>
      ))}
    </div>
  );
}
