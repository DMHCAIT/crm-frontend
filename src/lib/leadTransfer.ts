import type { StatusType } from '../constants/crmConstants';

export function buildTransferUpdate(assignedTo: string, status: StatusType | '') {
  return { assignedTo, ...(status ? { status } : {}) };
}
