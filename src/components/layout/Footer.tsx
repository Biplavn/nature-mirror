import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
    return (
        <footer className="border-t border-ink/[0.04]">
            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Logo */}
                    <Link to="/" className="font-display text-lg font-bold text-ink">
                        BUGS
                    </Link>

                    {/* Links */}
                    <div className="flex items-center gap-8 font-sans text-xs tracking-widest uppercase">
                        <Link to="/" className="text-ink-light/40 hover:text-ink-light transition-colors">Home</Link>
                        <Link to="/experience" className="text-ink-light/40 hover:text-ink-light transition-colors">Experience</Link>
                        <Link to="/feedback" className="text-ink-light/40 hover:text-ink-light transition-colors">Feedback</Link>
                    </div>

                    {/* BART Labs */}
                    <a href="https://www.bartlabs.in" target="_blank" rel="noopener noreferrer"
                       className="opacity-30 hover:opacity-60 transition-opacity">
                        <img src="/bartlabs-logo.png" alt="BART Labs" className="h-5" />
                    </a>
                </div>
            </div>
        </footer>
    );
};
