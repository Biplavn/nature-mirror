import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
    }, [location]);

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className={`sticky top-0 z-50 transition-all duration-300 ${
            scrolled ? 'bg-cream/95 backdrop-blur-sm shadow-sm border-b border-field-amber/10' : 'bg-transparent'
        }`}>
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="text-3xl">🐛</span>
                    <span className="font-display text-2xl font-bold text-ink tracking-wide group-hover:text-field-green transition-colors">
                        BUGS
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link
                        to="/"
                        className={`text-sm font-medium transition-colors ${
                            isActive('/') ? 'text-field-green' : 'text-ink-light hover:text-ink'
                        }`}
                    >
                        Home
                    </Link>
                    <Link
                        to="/feedback"
                        className={`text-sm font-medium transition-colors ${
                            isActive('/feedback') ? 'text-field-green' : 'text-ink-light hover:text-ink'
                        }`}
                    >
                        Feedback
                    </Link>
                    <Link
                        to="/experience"
                        className="px-5 py-2.5 bg-field-green text-cream rounded-lg text-sm font-medium hover:bg-field-green-dark transition-colors shadow-sm"
                    >
                        Enter Experience →
                    </Link>
                </div>

                {/* Mobile menu button */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden p-2 text-ink-light hover:text-ink"
                    aria-label="Menu"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {menuOpen ? (
                            <path d="M18 6L6 18M6 6l12 12" />
                        ) : (
                            <path d="M3 12h18M3 6h18M3 18h18" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden bg-cream/95 backdrop-blur-sm border-t border-field-amber/10 px-6 py-4 space-y-3">
                    <Link to="/" className="block text-sm font-medium text-ink-light hover:text-ink">Home</Link>
                    <Link to="/feedback" className="block text-sm font-medium text-ink-light hover:text-ink">Feedback</Link>
                    <Link to="/experience" className="block px-4 py-2 bg-field-green text-cream rounded-lg text-sm font-medium text-center">
                        Enter Experience →
                    </Link>
                </div>
            )}
        </nav>
    );
};
