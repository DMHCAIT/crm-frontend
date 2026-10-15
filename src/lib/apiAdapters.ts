import type { CrmDocument, DatabaseDocument, DatabaseScheduledExport, ScheduledExport } from '../types/api';

export function mapDocument(document: DatabaseDocument): CrmDocument {
  if (!document?.id || !document.file_url || !document.document_name) {
    throw new Error('Invalid document response');
  }
  return {
    ...document,
    name: document.document_name,
    size: document.file_size,
    type: document.mime_type,
    url: document.file_url,
    uploadedAt: document.created_at,
    uploadedBy: document.uploaded_by?.fullName || document.uploaded_by?.name ||
      document.uploaded_by?.username || document.uploaded_by_id
  };
}

export function mapScheduledExport(schedule: DatabaseScheduledExport): ScheduledExport {
  if (!schedule?.id || !schedule.export_type || !schedule.next_run) {
    throw new Error('Invalid scheduled export response');
  }
  return {
    ...schedule,
    exportType: schedule.export_type,
    schedule: schedule.schedule_time,
    lastRun: schedule.last_run ?? undefined,
    nextRun: schedule.next_run
  };
}

export function scheduledExportUpdates(updates: Partial<ScheduledExport>) {
  const { exportType, schedule, lastRun, nextRun, ...rest } = updates;
  return {
    ...rest,
    ...(exportType === undefined ? {} : { export_type: exportType }),
    ...(schedule === undefined ? {} : { schedule_time: schedule }),
    ...(lastRun === undefined ? {} : { last_run: lastRun }),
    ...(nextRun === undefined ? {} : { next_run: nextRun })
  };
}
