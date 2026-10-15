import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LeadDetails } from '../lib/leadDuplicates';
import { LeadAutosave } from '../lib/leadAutosave';

interface Props {
  lead: LeadDetails;
  save: (id: string, patch: Partial<LeadDetails>) => Promise<void>;
  register: (flush: (() => Promise<boolean>) | null) => void;
  children: (form: {
    editingLead: string;
    editedLead: Partial<LeadDetails>;
    setEditedLead: (updater: (previous: Partial<LeadDetails>) => Partial<LeadDetails>) => void;
  }) => ReactNode;
}

export default function AutoSaveLeadForm({ lead, save, register, children }: Props) {
  const [, render] = useState(0);
  const saveRef = useRef(save);
  saveRef.current = save;
  const [form] = useState(() => new LeadAutosave(
    lead.id, lead, (id, patch) => saveRef.current(id, patch), () => render(value => value + 1)
  ));

  useEffect(() => {
    register(async () => {
      do {
        if (!(await form.commit())) return false;
      } while (form.dirty);
      return true;
    });
    const warn = (event: BeforeUnloadEvent) => {
      if (form.dirty || form.pending) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      register(null);
      window.removeEventListener('beforeunload', warn);
    };
  }, [form, register]);

  return (
    <div>
      <div className="mb-3 text-sm" aria-live="polite">
        {form.error ? (
          <div role="alert" className="text-red-700">
            Not saved: {form.error}
            <button type="button" onClick={() => void form.commit()} className="ml-2 underline">Retry</button>
          </div>
        ) : (
          <p className="text-gray-600">
            {form.pending ? 'Saving...' : form.dirty ? 'Unsaved changes' :
              form.savedOnce ? 'All changes saved' : 'Edit directly. Changes save when you leave a field.'}
          </p>
        )}
      </div>
      <div
        onBlur={event => {
          if (event.target instanceof HTMLInputElement) void form.commit();
        }}
        onChange={event => {
          if ((event.target instanceof HTMLSelectElement && event.target.value !== '__custom__') ||
              (event.target instanceof HTMLInputElement && ['date', 'datetime-local'].includes(event.target.type))) {
            void form.commit();
          }
        }}
      >
        {children({
          editingLead: lead.id,
          editedLead: form.draft,
          setEditedLead: updater => form.update(updater)
        })}
      </div>
    </div>
  );
}
