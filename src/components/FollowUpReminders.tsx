import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Clock } from 'lucide-react';
import { getApiClient } from '../lib/backend';
import { OPEN_LEAD_EVENT, LEADS_CHANGED_EVENT, PENDING_LEAD_KEY } from '../lib/leadEvents';

export { OPEN_LEAD_EVENT, LEADS_CHANGED_EVENT, PENDING_LEAD_KEY } from '../lib/leadEvents';

const POLL_MS = 60 * 1000;
const LOOKBACK_DAYS = 14;

const CLOSED_STATUSES = ['enrolled', 'not interested', 'not_interested'];

interface Reminder {
  id: string;
  name: string;
  followUp: string;
  lead: any;
}

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// A reminder is active while the follow-up is due and the lead has not been touched since.
const isPending = (lead: any, now: number) => {
  if (!lead?.followUp) return false;
  const due = new Date(lead.followUp).getTime();
  if (isNaN(due) || due > now) return false;
  const status = String(lead.status || '').toLowerCase();
  if (CLOSED_STATUSES.includes(status)) return false;
  const updated = lead.updatedAt ? new Date(lead.updatedAt).getTime() : 0;
  return !(updated > due);
};

const formatDue = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

interface Props {
  onNavigate: (section: string) => void;
}

const FollowUpReminders: React.FC<Props> = ({ onNavigate }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const from = new Date(Date.now() - LOOKBACK_DAYS * 86400000);
      const res: any = await getApiClient().getLeads(1, 200, {
        followUpFilter: 'custom',
        followUpDateType: 'between',
        followUpDateFrom: ymd(from),
        followUpDateTo: ymd(new Date())
      });
      const list: any[] = Array.isArray(res?.leads) ? res.leads : Array.isArray(res?.data) ? res.data : [];
      const now = Date.now();
      const pending = list
        .filter(l => isPending(l, now))
        .sort((a, b) => new Date(a.followUp).getTime() - new Date(b.followUp).getTime())
        .map(l => ({
          id: String(l.id),
          name: l.fullName || l.name || l.email || 'Lead',
          followUp: l.followUp,
          lead: l
        }));
      setReminders(pending);
    } catch (e) {
      console.error('Failed to load follow-up reminders', e);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    window.addEventListener(LEADS_CHANGED_EVENT, load);
    return () => {
      clearInterval(timer);
      window.removeEventListener(LEADS_CHANGED_EVENT, load);
    };
  }, [load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openLead = (r: Reminder) => {
    setOpen(false);
    sessionStorage.setItem(PENDING_LEAD_KEY, JSON.stringify(r.lead));
    onNavigate('leads');
    window.dispatchEvent(new CustomEvent(OPEN_LEAD_EVENT, { detail: r.lead }));
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
        onClick={() => setOpen(o => !o)}
        title="Follow-up reminders"
      >
        <Bell className="w-6 h-6" />
        {reminders.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {reminders.length > 99 ? '99+' : reminders.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-100 font-medium text-gray-800">
            Pending follow-ups ({reminders.length})
          </div>
          <div className="max-h-96 overflow-y-auto">
            {reminders.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">All follow-ups are up to date 🎉</div>
            ) : (
              reminders.map(r => (
                <button
                  key={r.id}
                  onClick={() => openLead(r)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50"
                >
                  <div className="text-sm font-medium text-gray-900 truncate">{r.name}</div>
                  <div className="text-xs text-red-600 flex items-center mt-0.5">
                    <Clock className="w-3 h-3 mr-1" /> Due {formatDue(r.followUp)} · update the lead to clear
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default FollowUpReminders;
