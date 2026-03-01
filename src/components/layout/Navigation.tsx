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
            scrolled ? 'bg-cream/95 backdrop-blur-sm border-b border-ink/[0.04]' : 'bg-transparent'
        }`}>
            <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="group">
                    <span className="font-display text-xl font-bold text-ink tracking-wide group-hover:text-field-green transition-colors">
                        BUGS
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link
                        to="/"
                        className={`font-sans text-xs tracking-widest uppercase transition-colors ${
                            isActive('/') ? 'text-ink' : 'text-ink-light/50 hover:text-ink'
                        }`}
                    >
                        Home
                    </Link>
                    <Link
                        to="/feedback"
                        className={`font-sans text-xs tracking-widest uppercase transition-colors ${
                            isActive('/feedback') ? 'text-ink' : 'text-ink-light/50 hover:text-ink'
                        }`}
                    >
                        Feedback
                    </Link>
                    <Link
                        to="/experience"
                        className="font-sans text-xs tracking-widest uppercase text-field-green hover:text-field-green-dark transition-colors"
                    >
                        Experience →
                    </Link>
                </div>

                {/* Mobile menu button */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden p-2 text-ink-light hover:text-ink"
                    aria-label="Menu"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                <div className="md:hidden bg-cream/95 backdrop-blur-sm border-t border-ink/[0.04] px-6 py-5 space-y-4">
                    <Link to="/" className="block font-sans text-sm text-ink-light hover:text-ink transition-colors">Home</Link>
                    <Link to="/feedback" className="block font-sans text-sm text-ink-light hover:text-ink transition-colors">Feedback</Link>
                    <Link to="/experience" className="block font-sans text-sm text-field-green hover:text-field-green-dark transition-colors">
                        Experience →
                    </Link>
                </div>
            )}
        </nav>
    );
};
