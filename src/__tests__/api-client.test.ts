import { beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('VITE_API_BASE_URL', 'https://backend.example.test/api');
  vi.stubEnv('VITE_API_BACKEND_URL', 'https://backend.example.test/api');
  localStorage.setItem('crm_auth_token', 'unit-test-token');
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' }
});
const document = {
  id: 'doc', document_name: 'example.txt', document_type: 'other',
  file_url: 'https://files.example.test/example.txt', file_size: 7, mime_type: 'text/plain',
  original_filename: 'example.txt', created_at: '2026-01-01T00:00:00Z', uploaded_by_id: 'viewer'
};

it('normalizes the separately deployed backend URL without duplicating /api', async () => {
  const { getApiClient } = await import('../lib/backend');
  vi.mocked(fetch).mockResolvedValueOnce(json({ success: true, data: { count: 5 } }));
  const result = await getApiClient().get('/analytics-events/summary');
  expect(result.data).toEqual({ success: true, data: { count: 5 } });
  const [url, options] = vi.mocked(fetch).mock.calls[0];
  expect(url).toBe('https://backend.example.test/api/analytics-events/summary');
  expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer unit-test-token');
});

it('retains authentication on uploads and lets the browser supply multipart boundaries', async () => {
  const { getApiClient } = await import('../lib/backend');
  vi.mocked(fetch).mockResolvedValueOnce(json({ success: true, document }));
  const body = new FormData();
  body.append('file', new File(['example'], 'example.txt', { type: 'text/plain' }));
  body.append('entityType', 'student');
  body.append('entityId', 'student-1');
  const result = await getApiClient().uploadDocument(body);
  const [, options] = vi.mocked(fetch).mock.calls[0];
  expect(options?.body).toBeInstanceOf(FormData);
  expect(options?.body instanceof FormData && options.body.get('student_id')).toBe('student-1');
  expect(options?.body instanceof FormData && options.body.get('document_name')).toBe('example.txt');
  expect(options?.body instanceof FormData && options.body.get('document_type')).toBe('other');
  expect(result.document.name).toBe('example.txt');
  expect(result.document.file_url).toBe(document.file_url);
  const headers = new Headers(options?.headers);
  expect(headers.get('Authorization')).toBe('Bearer unit-test-token');
  expect(headers.has('Content-Type')).toBe(false);
});

it('maps scheduled-export database columns and sends snake-case updates', async () => {
  const { getApiClient } = await import('../lib/backend');
  const schedule = {
    id: 'schedule', name: 'Weekly', export_type: 'leads', format: 'csv', frequency: 'weekly',
    schedule_time: '09:00', email: 'viewer@example.test', next_run: '2026-02-01T09:00:00Z', status: 'paused'
  };
  vi.mocked(fetch).mockResolvedValueOnce(json({ schedule }));
  const result = await getApiClient().updateScheduledExport('schedule', {
    status: 'paused', nextRun: schedule.next_run
  });
  expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({
    status: 'paused', next_run: schedule.next_run
  });
  expect(result.schedule.exportType).toBe('leads');
  expect(result.schedule.nextRun).toBe(schedule.next_run);
});

it('looks up only the requested lead and rejects missing or inaccessible records', async () => {
  const { getApiClient } = await import('../lib/backend');
  vi.mocked(fetch).mockResolvedValueOnce(json({ success: true, leads: [{ id: 'a b' }] }));
  expect(await getApiClient().getLeadById('a b')).toEqual({ id: 'a b' });
  expect(vi.mocked(fetch).mock.calls[0][0]).toBe('https://backend.example.test/api/leads?id=a%20b&pageSize=1');
  vi.mocked(fetch).mockResolvedValueOnce(json({ success: true, leads: [] }));
  await expect(getApiClient().getLeadById('missing')).rejects.toThrow('Lead not found or access denied');
});

it('propagates backend failures rather than returning successful empty data', async () => {
  const { getApiClient } = await import('../lib/backend');
  vi.mocked(fetch).mockResolvedValueOnce(json({ error: 'Duplicate lead' }, 409));
  await expect(getApiClient().createLead({ fullName: 'Example' })).rejects.toThrow('Duplicate lead');
});
