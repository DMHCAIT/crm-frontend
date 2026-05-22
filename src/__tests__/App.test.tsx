import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders App component', () => {
    render(<App />);
    const linkElement = screen.getByText(/welcome to the app/i);
    expect(linkElement).toBeInTheDocument();
});

test('checks if button is present', () => {
    render(<App />);
    const buttonElement = screen.getByRole('button', { name: /click me/i });
    expect(buttonElement).toBeInTheDocument();
});