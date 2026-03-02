import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { NatureMirror } from '../components/NatureMirror';
import { ExperienceLoader } from '../components/experience/ExperienceLoader';
import { ButterflySVG } from '../components/illustrations/ButterflySVG';
import type { CreatureMode } from '../core/graphics/Creature3DRenderer';

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

const ExperiencePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showLoader, setShowLoader] = useState(true);
    const [sceneReady, setSceneReady] = useState(false);
    const [mobile] = useState(isMobile);
    const initialMode = (searchParams.get('mode') as CreatureMode) || 'BIRDS';

    // Toggle body class for full-viewport dark mode + exit fullscreen on cleanup
    useEffect(() => {
        document.body.classList.add('experience-mode');
        return () => {
            document.body.classList.remove('experience-mode');
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        };
    }, []);

    const handleSceneReady = useCallback(() => {
        setSceneReady(true);
        setTimeout(() => setShowLoader(false), 800);
    }, []);

    if (mobile) {
        return (
            <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-8 text-center">
                <div className="w-20 h-20 text-field-green/50 mb-8 animate-float">
                    <ButterflySVG animated={true} className="w-full h-full" />
                </div>
                <h1 className="font-display text-3xl font-bold text-ink mb-3">
                    Best on Desktop
                </h1>
                <p className="font-sans text-ink-light text-base leading-relaxed max-w-xs mb-8">
                    BUGS uses your webcam and hand tracking, an experience best enjoyed on a desktop or laptop.
                </p>
                <Link
                    to="/"
                    className="px-8 py-3.5 bg-field-green text-cream rounded-lg font-sans text-sm font-medium tracking-wide uppercase hover:bg-field-green-dark transition-colors"
                >
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {/* The 3D scene */}
            <NatureMirror
                onReady={handleSceneReady}
                initialMode={initialMode}
            />

            {/* Loading overlay */}
            {showLoader && <ExperienceLoader isReady={sceneReady} />}

            {/* Back button — bubble style */}
            <button
                onClick={() => navigate('/')}
                className="group fixed top-4 left-4 z-[200] w-12 h-12 rounded-full bg-white/[0.07] backdrop-blur-sm text-white/40 border border-white/[0.05] hover:bg-white/[0.12] hover:text-white/70 hover:scale-110 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 ease-out flex items-center justify-center"
                title="Back to home"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:-translate-x-0.5 transition-transform duration-300">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
            </button>
        </div>
    );
};

export default ExperiencePage;
