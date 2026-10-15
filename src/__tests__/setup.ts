import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Unexpected network request in unit test'))));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
