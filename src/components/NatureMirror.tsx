import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VisionManager } from '../core/vision/VisionManager';
import { Creature3DRenderer, type CreatureMode } from '../core/graphics/Creature3DRenderer';
import { Bird, Fish, Bug } from 'lucide-react';

const ButterflyIcon = ({ size = 22 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" />
        <path d="M5.5 6C3 6 1 8 1 10.5S3 16 5.5 16c1.5 0 3.5-1 6.5-4C8 9 6.5 6 5.5 6z" />
        <path d="M18.5 6C21 6 23 8 23 10.5S21 16 18.5 16c-1.5 0-3.5-1-6.5-4 3-3 5-6 6.5-6z" />
    </svg>
);

interface ModeConfig {
    key: CreatureMode;
    label: string;
    icon: React.ReactNode;
    description: string;
    gradient: string;
}

const MODES_CONFIG: ModeConfig[] = [
    {
        key: 'BIRDS',
        label: 'Hummingbirds',
        icon: <Bird size={22} />,
        description: '3D Flying flock',
        gradient: 'from-sky-400 to-blue-600'
    },
    {
        key: 'FISH',
        label: 'Clownfish',
        icon: <Fish size={22} />,
        description: '3D Underwater school',
        gradient: 'from-cyan-400 to-teal-600'
    },
    {
        key: 'BEES',
        label: 'Bees',
        icon: <Bug size={22} />,
        description: 'Buzzing swarm',
        gradient: 'from-yellow-400 to-amber-600'
    },
    {
        key: 'BUTTERFLIES',
        label: 'Butterflies',
        icon: <ButterflyIcon size={22} />,
        description: 'Graceful flutter',
        gradient: 'from-violet-400 to-indigo-600'
    }
];

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
    const [fps, setFps] = useState(0);

    const systemsRef = useRef<{
        vision: VisionManager | null;
        renderer: Creature3DRenderer | null;
    }>({
        vision: null,
        renderer: null
    });

    useEffect(() => {
        if (!containerRef.current) return;

        let destroyed = false;
        let animationId: number | null = null;
        let lastTime = performance.now();
        let frameCount = 0;
        let resizeHandler: (() => void) | null = null;

        const init = async () => {
            try {
                console.log('Initializing BUGS experience...');

                const renderer = new Creature3DRenderer(containerRef.current!, 10);

                // Set initial mode if different from default
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

                    frameCount++;
                    const now = performance.now();
                    if (now - lastTime >= 1000) {
                        setFps(frameCount);
                        frameCount = 0;
                        lastTime = now;
                    }

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

    if (error) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
                <div className="bg-red-900/50 backdrop-blur p-8 rounded-2xl border border-red-500/30 max-w-md mx-4 text-center">
                    <h2 className="text-red-400 text-xl font-bold mb-4">Error</h2>
                    <p className="text-red-200 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
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
                    {/* Status indicators — shifted right to avoid back button */}
                    <div className="absolute top-4 left-16 z-10 flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${cameraActive
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-green-400' : 'bg-yellow-400'}`} />
                            {cameraActive ? 'Camera On' : 'Demo Mode'}
                        </div>

                        <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white/70 border border-white/10">
                            FPS: {fps}
                        </div>
                    </div>

                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center">
                        <h1 className="text-xl font-bold text-white/90">BUGS</h1>
                        <p className="text-white/50 text-xs mt-0.5">
                            {MODES_CONFIG.find(m => m.key === activeMode)?.description}
                        </p>
                    </div>

                    {/* Mode Selector */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                        <div className="flex gap-2 bg-black/50 backdrop-blur-xl p-2 rounded-2xl border border-white/10">
                            {MODES_CONFIG.map((mode) => (
                                <button
                                    key={mode.key}
                                    onClick={() => handleModeChange(mode.key)}
                                    className={`
                                        flex flex-col items-center gap-1 px-4 py-3 rounded-xl
                                        transition-all duration-200
                                        ${activeMode === mode.key
                                            ? `bg-gradient-to-br ${mode.gradient} text-white scale-105`
                                            : 'text-white/50 hover:bg-white/10 hover:text-white'
                                        }
                                    `}
                                >
                                    {mode.icon}
                                    <span className="text-[10px] font-medium">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {cameraActive && (
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
                            <p className="text-white/30 text-xs">Move in front of the camera</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
