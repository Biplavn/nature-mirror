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

                    {/* Credit */}
                    <p className="font-sans text-xs text-ink-light/30">
                        Creature behaviors inspired by nature
                    </p>
                </div>
            </div>
        </footer>
    );
};
