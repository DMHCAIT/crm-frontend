import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Phone, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getApiClient } from '../lib/backend';
import { dueCalls, nextCallDelay, type ScheduledCallLead } from '../lib/callSchedule';
import { LEADS_CHANGED_EVENT, OPEN_LEAD_EVENT, PENDING_LEAD_KEY } from '../lib/leadEvents';
import { useNotify } from './NotificationSystem';

const ScheduledCallReminders: React.FC<{ onNavigate: (section: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const queryKey = ['scheduled-calls', user?.id];
  const { data, error, refetch } = useQuery({
    queryKey,
    queryFn: () => getApiClient().getScheduledCalls(),
    enabled: !!user?.id,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 1
  });
  const [now, setNow] = useState(Date.now);
  const [dismissing, setDismissing] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => { setNow(Date.now()); void refetch(); };
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener(LEADS_CHANGED_EVENT, refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(LEADS_CHANGED_EVENT, refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refetch]);

  useEffect(() => {
    const current = Date.now();
    const delay = nextCallDelay(data?.leads || [], current);
    if (delay === null) return;
    const timer = setTimeout(() => setNow(Date.now()), delay);
    return () => clearTimeout(timer);
  }, [data, now]);

  const dismiss = async (lead: ScheduledCallLead) => {
    if (!lead.scheduledCallAt) return;
    setDismissing(ids => [...ids, lead.id]);
    try {
      const response = await getApiClient().dismissScheduledCall(lead.id, lead.scheduledCallAt);
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<typeof data>(queryKey, previous => previous ? {
        ...previous, leads: previous.leads.filter(item =>
          item.id !== lead.id || item.scheduledCallAt !== lead.scheduledCallAt)
      } : previous);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      window.dispatchEvent(new CustomEvent(LEADS_CHANGED_EVENT, { detail: response.data }));
    } catch (dismissError) {
      console.error('Scheduled call dismissal failed', dismissError);
      notify.error('Call Reminder Not Dismissed',
        dismissError instanceof Error ? dismissError.message : 'Please try again.');
    } finally {
      setDismissing(ids => ids.filter(id => id !== lead.id));
    }
  };

  const openLead = (lead: ScheduledCallLead) => {
    sessionStorage.setItem(PENDING_LEAD_KEY, JSON.stringify(lead));
    onNavigate('leads');
    window.dispatchEvent(new CustomEvent(OPEN_LEAD_EVENT, { detail: lead }));
  };

  const pending = dueCalls(data?.leads || [], Math.max(now, Date.now()));
  if (!user?.id || (!pending.length && !error)) return null;

  return (
    <section aria-label="Scheduled call reminders"
      className="fixed bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto z-[70] space-y-3">
      {error && (
        <div role="alert" className="bg-red-50 border border-red-300 rounded-lg p-3 text-sm text-red-800 shadow-lg">
          <p>Call reminders unavailable: {error.message}</p>
          <button onClick={() => void refetch()} className="mt-2 font-medium underline">Retry</button>
        </div>
      )}
      {pending.map(lead => (
        <div key={`${lead.id}:${lead.scheduledCallAt}`} role="alert"
          className="bg-white rounded-xl border-2 border-blue-500 p-4 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-blue-700 flex items-center gap-2">
              <Phone className="w-5 h-5" /> Scheduled Call Due
            </h2>
            <button aria-label={`Dismiss scheduled call for ${lead.fullName}`}
              disabled={dismissing.includes(lead.id)}
              onClick={() => void dismiss(lead)}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 font-medium text-gray-900">{lead.fullName}</p>
          {lead.phone && <p className="text-sm text-gray-600">{lead.phone}</p>}
          <p className="text-sm text-blue-700 mt-1">{new Date(lead.scheduledCallAt!).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">Stays open until you click X or update this lead.</p>
          <button onClick={() => openLead(lead)}
            className="mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Open Lead / Update
          </button>
        </div>
      ))}
    </section>
  );
};

export default ScheduledCallReminders;
