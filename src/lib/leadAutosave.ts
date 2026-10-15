import type { LeadDetails } from './leadDuplicates';
import { isInternationalPhone } from './leadDuplicates';

const fields = [
  'fullName', 'email', 'phone', 'country', 'branch', 'qualification', 'source',
  'course', 'company', 'status', 'assignedTo', 'followUp', 'scheduledCallAt',
  'estimatedValue', 'estimated_value', 'salePrice', 'sale_price'
] as const;

export class LeadAutosave {
  draft: Partial<LeadDetails>;
  private saved: Partial<LeadDetails>;
  private queue: Promise<boolean> = Promise.resolve(true);
  pending = 0;
  error: string | null = null;
  savedOnce = false;

  constructor(
    readonly id: string,
    lead: LeadDetails,
    private persist: (id: string, patch: Partial<LeadDetails>) => Promise<void>,
    private changed: () => void
  ) {
    this.draft = { ...lead };
    this.saved = { ...lead };
  }

  update(updater: (previous: Partial<LeadDetails>) => Partial<LeadDetails>) {
    this.draft = updater(this.draft);
    this.changed();
  }

  get dirty() {
    return fields.some(field => this.draft[field] !== this.saved[field]);
  }

  commit(): Promise<boolean> {
    const snapshot = { ...this.draft };
    this.pending++;
    this.changed();
    this.queue = this.queue.then(async () => {
      const patch = Object.fromEntries(fields
        .filter(field => snapshot[field] !== this.saved[field])
        .map(field => [field, field === 'followUp' && snapshot[field] === '' ? null : snapshot[field] ?? null])) as Partial<LeadDetails>;
      try {
        if (!Object.keys(patch).length) {
          this.error = null;
          return true;
        }
        if ('fullName' in patch && !patch.fullName?.trim()) throw new Error('Full name is required.');
        if ('email' in patch && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.email || '')) {
          throw new Error('Enter a valid email address.');
        }
        if ('phone' in patch && !isInternationalPhone(patch.phone || '')) {
          throw new Error('Phone must include +country code and 7 to 15 digits.');
        }
        for (const field of ['estimatedValue', 'estimated_value', 'salePrice', 'sale_price'] as const) {
          if (patch[field] != null && (!Number.isFinite(patch[field]) || patch[field]! < 0)) {
            throw new Error('Revenue values must be non-negative numbers.');
          }
        }
        await this.persist(this.id, patch);
        this.saved = { ...this.saved, ...snapshot };
        this.error = null;
        this.savedOnce = true;
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unable to save lead changes.';
        return false;
      } finally {
        this.pending--;
        this.changed();
      }
    });
    return this.queue;
  }
}
