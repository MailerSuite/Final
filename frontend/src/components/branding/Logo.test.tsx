/**
 * Logo Component Tests
 */

import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo Component', () => {
    it('renders without crashing', () => {
        render(<Logo />);
        expect(screen.getByText('Mailer')).toBeInTheDocument();
        expect(screen.getByText('Suite')).toBeInTheDocument();
    });

    it('renders icon variant correctly', () => {
        render(<Logo variant="icon" />);
        // Should not have text content
        expect(screen.queryByText('Mailer')).not.toBeInTheDocument();
    });

    it('renders text variant correctly', () => {
        render(<Logo variant="text" />);
        expect(screen.getByText('Mailer')).toBeInTheDocument();
        expect(screen.getByText('Suite')).toBeInTheDocument();
    });

    it('renders compact variant correctly', () => {
        render(<Logo variant="compact" />);
        expect(screen.getByText('MS2')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(<Logo className="custom-class" />);
        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('handles click events', () => {
        const handleClick = jest.fn();
        render(<Logo onClick={handleClick} />);

        const logoElement = screen.getByText('Mailer').closest('div');
        if (logoElement) {
            logoElement.click();
            expect(handleClick).toHaveBeenCalledTimes(1);
        }
    });
}); 