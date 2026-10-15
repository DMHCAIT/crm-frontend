import { render, screen } from '@testing-library/react';
import { test, expect, vi } from 'vitest';
import App from '../App';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false, loading: false, error: null, user: null,
    login: vi.fn(), logout: vi.fn()
  })
}));

test('requires authentication before displaying CRM content', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  expect(screen.queryByText(/total leads/i)).not.toBeInTheDocument();
});

test('shows the login credential fields', () => {
  render(<App />);
  expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
});