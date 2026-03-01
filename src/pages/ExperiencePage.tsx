import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { NatureMirror } from '../components/NatureMirror';
import { ExperienceLoader } from '../components/experience/ExperienceLoader';
import type { CreatureMode } from '../core/graphics/Creature3DRenderer';

const ExperiencePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showLoader, setShowLoader] = useState(true);
    const [sceneReady, setSceneReady] = useState(false);
    const initialMode = (searchParams.get('mode') as CreatureMode) || 'BIRDS';

    // Toggle body class for full-viewport dark mode
    useEffect(() => {
        document.body.classList.add('experience-mode');
        return () => {
            document.body.classList.remove('experience-mode');
        };
    }, []);

    const handleSceneReady = useCallback(() => {
        setSceneReady(true);
        setTimeout(() => setShowLoader(false), 800);
    }, []);

    return (
        <div className="relative w-full h-full">
            {/* The 3D scene */}
            <NatureMirror
                onReady={handleSceneReady}
                initialMode={initialMode}
            />

            {/* Loading overlay */}
            {showLoader && <ExperienceLoader isReady={sceneReady} />}

            {/* Back button */}
            <button
                onClick={() => navigate('/')}
                className="fixed top-4 left-4 z-[200] flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-sm text-white/70 rounded-lg border border-white/10 hover:bg-black/70 hover:text-white transition-all text-sm"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
            </button>
        </div>
    );
};

export default ExperiencePage;
