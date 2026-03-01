import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VisionManager } from '../core/vision/VisionManager';
import { Creature3DRenderer, type CreatureMode } from '../core/graphics/Creature3DRenderer';
import { HummingbirdSVG } from './illustrations/HummingbirdSVG';
import { ClownfishSVG } from './illustrations/ClownfishSVG';
import { BeeSVG } from './illustrations/BeeSVG';
import { ButterflySVG } from './illustrations/ButterflySVG';

/* ─── Fullscreen Icons ─── */

const ExpandIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
);

const ContractIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
    </svg>
);

/* ─── Mode Config ─── */

interface ModeConfig {
    key: CreatureMode;
    label: string;
    icon: React.FC<{ className?: string; animated?: boolean }>;
    description: string;
}

const MODES_CONFIG: ModeConfig[] = [
    {
        key: 'BIRDS',
        label: 'Hummingbirds',
        icon: HummingbirdSVG,
        description: '3D Flying flock',
    },
    {
        key: 'FISH',
        label: 'Clownfish',
        icon: ClownfishSVG,
        description: '3D Underwater school',
    },
    {
        key: 'BEES',
        label: 'Bees',
        icon: BeeSVG,
        description: 'Buzzing swarm',
    },
    {
        key: 'BUTTERFLIES',
        label: 'Butterflies',
        icon: ButterflySVG,
        description: 'Graceful flutter',
    }
];

/* ─── Component ─── */

interface NatureMirrorProps {
    onReady?: () => void;
    initialMode?: CreatureMode;
}

export const NatureMirror: React.FC<NatureMirrorProps> = ({ onReady, initialMode = 'BIRDS' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeMode, setActiveMode] = useState<CreatureMode>(initialMode);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const systemsRef = useRef<{
        vision: VisionManager | null;
        renderer: Creature3DRenderer | null;
    }>({
        vision: null,
        renderer: null
    });

    // Fullscreen change listener
    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        let destroyed = false;
        let animationId: number | null = null;
        let resizeHandler: (() => void) | null = null;

        const init = async () => {
            try {
                console.log('Initializing BUGS experience...');

                const renderer = new Creature3DRenderer(containerRef.current!, 10);

                if (initialMode !== 'BIRDS') {
                    renderer.setMode(initialMode);
                }

                const vision = new VisionManager();

                try {
                    await vision.start();
                    setCameraActive(true);
                } catch (e) {
                    console.warn('Camera unavailable:', e);
                    setCameraActive(false);
                }

                if (destroyed) return;

                systemsRef.current = { vision, renderer };

                const animate = () => {
                    if (destroyed) return;

                    const { vision, renderer } = systemsRef.current;
                    if (!renderer) return;

                    const mask = vision?.getMask();
                    if (mask) {
                        renderer.updateTracking({
                            leftHand: mask.hands.left ? {
                                x: (1 - mask.hands.left.position.x) * window.innerWidth,
                                y: mask.hands.left.position.y * window.innerHeight,
                                confidence: mask.hands.left.confidence
                            } : null,
                            rightHand: mask.hands.right ? {
                                x: (1 - mask.hands.right.position.x) * window.innerWidth,
                                y: mask.hands.right.position.y * window.innerHeight,
                                confidence: mask.hands.right.confidence
                            } : null,
                            head: mask.head ? {
                                x: (1 - mask.head.x) * window.innerWidth,
                                y: mask.head.y * window.innerHeight
                            } : null,
                            bodyCenter: mask.bodyCenter ? {
                                x: (1 - mask.bodyCenter.x) * window.innerWidth,
                                y: mask.bodyCenter.y * window.innerHeight
                            } : null,
                            hasBody: mask.data.some(v => v > 128)
                        });
                    }

                    renderer.update(1);
                    animationId = requestAnimationFrame(animate);
                };

                animate();

                resizeHandler = () => {
                    systemsRef.current.renderer?.resize(window.innerWidth, window.innerHeight);
                };
                window.addEventListener('resize', resizeHandler);

                console.log('BUGS experience initialized!');
                setIsLoading(false);
                onReady?.();

            } catch (err) {
                console.error('Init error:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            }
        };

        init();

        return () => {
            destroyed = true;
            if (animationId) cancelAnimationFrame(animationId);
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
            }

            const { vision, renderer } = systemsRef.current;
            vision?.stop();
            renderer?.destroy();
        };
    }, [initialMode, onReady]);

    const handleModeChange = useCallback((mode: CreatureMode) => {
        if (systemsRef.current.renderer?.isTransitioning) return;
        setActiveMode(mode);
        systemsRef.current.renderer?.setMode(mode);
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        } else {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    }, []);

    if (error) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]">
                <div className="bg-black/50 backdrop-blur p-8 rounded-lg border border-white/10 max-w-md mx-4 text-center">
                    <h2 className="font-display text-xl font-bold text-field-amber mb-4">Something went wrong</h2>
                    <p className="font-sans text-white/60 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-field-green hover:bg-field-green-dark text-cream rounded-full font-sans text-sm font-medium uppercase tracking-wide transition-colors"
                    >
                        Reload
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            <div ref={containerRef} className="absolute inset-0" />

            {!isLoading && (
                <>
                    {/* Status indicator — minimal glowing dot */}
                    <div
                        className={`absolute top-[18px] left-[52px] z-10 w-2.5 h-2.5 rounded-full animate-pulse-soft ${
                            cameraActive
                                ? 'bg-field-green shadow-[0_0_8px_rgba(74,124,89,0.5)]'
                                : 'bg-field-amber shadow-[0_0_8px_rgba(201,146,61,0.5)]'
                        }`}
                        title={cameraActive ? 'Camera active' : 'Demo mode'}
                    />

                    {/* Mode Selector — bubble buttons with creature SVGs */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                        <div className="flex gap-4 bg-black/40 backdrop-blur-xl p-3 rounded-full border border-white/[0.06]">
                            {MODES_CONFIG.map((mode) => {
                                const Icon = mode.icon;
                                const isActive = activeMode === mode.key;
                                return (
                                    <button
                                        key={mode.key}
                                        onClick={() => handleModeChange(mode.key)}
                                        className={`
                                            w-16 h-16 rounded-full flex items-center justify-center
                                            transition-all duration-300 ease-out
                                            ${isActive
                                                ? 'bg-cream text-ink scale-110 shadow-lg shadow-cream/20'
                                                : 'bg-white/[0.07] text-white/40 border border-white/[0.05] hover:bg-white/[0.12] hover:text-white/70 hover:scale-110 hover:shadow-lg hover:shadow-white/5'
                                            }
                                        `}
                                        title={mode.label}
                                    >
                                        <Icon className="w-9 h-9" animated={isActive} />
                                    </button>
                                );
                            })}
                        </div>
                        {/* Active mode label */}
                        <p className="font-sans text-[11px] tracking-wide text-white/40 text-center mt-2.5">
                            {MODES_CONFIG.find(m => m.key === activeMode)?.label}
                        </p>
                    </div>

                    {/* Fullscreen toggle — bubble style */}
                    <button
                        onClick={toggleFullscreen}
                        className="absolute bottom-6 right-6 z-10 w-12 h-12 rounded-full bg-white/[0.07] backdrop-blur-sm text-white/40 border border-white/[0.05] hover:bg-white/[0.12] hover:text-white/70 hover:scale-110 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 ease-out flex items-center justify-center"
                        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    >
                        {isFullscreen ? <ContractIcon /> : <ExpandIcon />}
                    </button>

                    {cameraActive && (
                        <div
                            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 opacity-0 animate-fade-up"
                            style={{ animationDelay: '2s', animationFillMode: 'forwards' }}
                        >
                            <p className="font-sans text-white/25 text-xs">Move in front of the camera</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
