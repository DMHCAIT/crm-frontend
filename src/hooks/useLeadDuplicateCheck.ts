import { useEffect, useState } from 'react';
import { getApiClient } from '../lib/backend';
import { contactKey, hasCheckableContact, type DuplicateMatch } from '../lib/leadDuplicates';

export function useLeadDuplicateCheck(email: string, phone: string, enabled: boolean, userId?: string) {
  const [result, setResult] = useState<{
    key: string;
    duplicates: DuplicateMatch[];
    error: string | null;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${userId || ''}:${contactKey(email, phone)}`;
  const checkable = enabled && hasCheckableContact(email, phone);

  useEffect(() => {
    if (!checkable) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const duplicates = await getApiClient().checkLeadDuplicates(email, phone);
        if (active) setResult({ key, duplicates, error: null });
      } catch (error) {
        if (active) setResult({
          key, duplicates: [],
          error: error instanceof Error ? error.message : 'Unable to check duplicate leads'
        });
      }
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [email, phone, key, checkable, attempt]);

  const current = checkable && result?.key === key ? result : null;
  return {
    duplicates: current?.duplicates || [],
    error: current?.error || null,
    checking: checkable && !current,
    retry: () => { setResult(null); setAttempt(value => value + 1); }
  };
}
