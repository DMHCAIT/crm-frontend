import React, { useId } from 'react';
import { toLocalCallTime } from '../lib/callSchedule';

interface Props {
  value?: string | null;
  onChange: (value: string | null) => void;
  autoSave?: boolean;
}

const ScheduledCallField: React.FC<Props> = ({ value, onChange, autoSave = false }) => {
  const id = useId();
  return (
    <div onClick={event => event.stopPropagation()}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        Schedule a Call
      </label>
      <input
        id={id}
        type="datetime-local"
        value={toLocalCallTime(value)}
        onChange={event => onChange(event.target.value ? new Date(event.target.value).toISOString() : null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <p className="text-xs text-gray-500 mt-1">
        {autoSave ? 'Changes to the call reminder save automatically.' : value ? `Call scheduled for ${new Date(value).toLocaleString()}. Save the lead to confirm.` :
          'Choose a date and time. Save the lead to confirm the call reminder.'}
      </p>
    </div>
  );
};

export default ScheduledCallField;
