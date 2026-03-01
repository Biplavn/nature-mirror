import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-parchment/50 border-t border-field-amber/10">
            {/* Decorative border */}
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-center justify-center py-3">
                    <svg width="200" height="12" viewBox="0 0 200 12" className="text-field-amber/30">
                        <path d="M0 6 Q25 0 50 6 Q75 12 100 6 Q125 0 150 6 Q175 12 200 6" fill="none" stroke="currentColor" strokeWidth="1" />
                    </svg>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Logo & Tagline */}
                    <div className="text-center md:text-left">
                        <Link to="/" className="font-display text-xl font-bold text-ink">
                            🐛 BUGS
                        </Link>
                        <p className="text-ink-light text-sm mt-1">
                            Understanding creature behavior through interactive experiences
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6 text-sm">
                        <Link to="/" className="text-ink-light hover:text-field-green transition-colors">Home</Link>
                        <Link to="/experience" className="text-ink-light hover:text-field-green transition-colors">Experience</Link>
                        <Link to="/feedback" className="text-ink-light hover:text-field-green transition-colors">Feedback</Link>
                    </div>

                    {/* Credit */}
                    <div className="text-center md:text-right text-xs text-ink-light/60">
                        <p>Built with Three.js, MediaPipe & React</p>
                        <p className="mt-0.5">Creature behaviors based on biological research</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
