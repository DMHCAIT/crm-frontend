import { describe, it, expect } from 'vitest';
import Dashboard from '../../components/Dashboard';

describe('Dashboard Component', () => {
    it('renders correctly', () => {
        const { container } = render(<Dashboard />);
        expect(container).toBeInTheDocument();
    });
});