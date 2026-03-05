import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VisionManager } from '../core/vision/VisionManager';
import { Creature3DRenderer, type CreatureMode } from '../core/graphics/Creature3DRenderer';
import { QualityManager } from '../core/graphics/QualityManager';
import { HummingbirdSVG } from './illustrations/HummingbirdSVG';
import { ClownfishSVG } from './illustrations/ClownfishSVG';
import { BeeSVG } from './illustrations/BeeSVG';
import { ButterflySVG } from './illustrations/ButterflySVG';
import { AudioManager } from '../core/audio/AudioManager';

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
        key: 'BEES',
        label: 'Bees',
        icon: BeeSVG,
        description: 'Energetic swarm',
    },
    {
        key: 'BIRDS',
        label: 'Hummingbirds',
        icon: HummingbirdSVG,
        description: 'Precise & curious',
    },
    {
        key: 'FISH',
        label: 'Clownfish',
        icon: ClownfishSVG,
        description: 'Flowing school',
    },
    {
        key: 'BUTTERFLIES',
        label: 'Butterflies',
        icon: ButterflySVG,
        description: 'Graceful flutter',
    },
];

/* ─── Behavior Hints & Facts ─── */

const BEHAVIOR_HINTS: Record<CreatureMode, string> = {
    BEES: "Bees are eager -- they'll rush to follow your every move",
    BIRDS: "Hummingbirds are cautious -- stay still and let them build trust",
    FISH: "Fish are timid -- stay steady and they'll drift close, but the smallest movement scares them",
    BUTTERFLIES: "Butterflies are free spirits -- they chase each other and scatter at the slightest touch",
};

const CREATURE_FACTS: Record<CreatureMode, string[]> = {
    BEES: [
        "Bees beat their wings 200 times per second",
        "A bee can fly at speeds up to 25 km/h",
        "Bees perform a waggle dance to communicate direction to their hive",
    ],
    BIRDS: [
        "Hummingbirds are the only birds that can fly backwards",
        "Their wings beat 50-80 times per second in a figure-8 pattern",
        "A hummingbird's heart beats over 1,200 times per minute",
    ],
    FISH: [
        "Fish swim by creating an S-wave that travels from head to tail",
        "Clownfish live in a symbiotic relationship with sea anemones",
        "Schools of fish move as one using lateral line sensors that detect water pressure",
    ],
    BUTTERFLIES: [
        "Butterflies taste with their feet",
        "A butterfly's erratic flight makes it harder for predators to catch them",
        "Some butterfly species migrate over 4,800 km",
    ],
};

/* ─── Component ─── */

interface NatureMirrorProps {
    onReady?: () => void;
    initialMode?: CreatureMode;
}

export const NatureMirror: React.FC<NatureMirrorProps> = ({ onReady, initialMode = 'BEES' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeMode, setActiveMode] = useState<CreatureMode>(initialMode);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [handsDetected, setHandsDetected] = useState(false);

    const [isMuted, setIsMuted] = useState(false);
    const [factIndex, setFactIndex] = useState(0);

    // Cycle fun facts every 8 seconds, reset on mode change
    useEffect(() => {
        setFactIndex(0);
        const interval = setInterval(() => {
            setFactIndex(prev => (prev + 1) % CREATURE_FACTS[activeMode].length);
        }, 8000);
        return () => clearInterval(interval);
    }, [activeMode]);

    const systemsRef = useRef<{
        vision: VisionManager | null;
        renderer: Creature3DRenderer | null;
        audio: AudioManager | null;
    }>({
        vision: null,
        renderer: null,
        audio: null,
    });

    // Refs for clap detection (needs access inside animate closure)
    const activeModeRef = useRef<CreatureMode>(activeMode);
    const clapRef = useRef<{
        distHistory: number[];
        lastClapTime: number;
    }>({
        distHistory: [],
        lastClapTime: 0,
    });
    const handleModeChangeRef = useRef<(mode: CreatureMode) => void>(() => {});

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

                // Detect device capability and set quality
                const qualityMgr = new QualityManager();
                const quality = qualityMgr.settings;

                const renderer = new Creature3DRenderer(containerRef.current!, 10, quality);

                if (initialMode !== 'BEES') {
                    renderer.setMode(initialMode);
                }

                const vision = new VisionManager({
                    width: quality.cameraWidth,
                    height: quality.cameraHeight,
                    fps: 30,
                    modelComplexity: quality.mediaComplexity,
                    cameraWidth: quality.cameraWidth,
                    cameraHeight: quality.cameraHeight,
                });

                try {
                    await vision.start();
                    setCameraActive(true);
                } catch (e) {
                    console.warn('Camera unavailable:', e);
                    setCameraActive(false);
                }

                if (destroyed) return;

                // Initialize audio system
                const audio = new AudioManager();
                audio.init();
                audio.setMode(initialMode);

                systemsRef.current = { vision, renderer, audio };

                // Clap detection tuning
                const CLAP_HISTORY_SIZE = 6;      // ~200ms window at 30fps MediaPipe
                const CLAP_CLOSE_DIST = 0.18;     // Relaxed from 0.08 (smoothing-safe)
                const CLAP_FAR_DIST = 0.25;       // Hands must start 25%+ apart
                const CLAP_MIN_VELOCITY = 0.015;  // Min avg closing speed per frame
                const CLAP_COOLDOWN_MS = 800;     // Reduced from 1500ms

                const animate = () => {
                    if (destroyed) return;

                    // FPS monitoring for auto-downgrade
                    qualityMgr.fpsMonitor.tick();

                    const { vision, renderer } = systemsRef.current;
                    if (!renderer) return;

                    const mask = vision?.getMask();

                    // Detect first hand presence
                    if (mask && (mask.hands.left || mask.hands.right)) {
                        setHandsDetected(true);
                    }

                    // Clap detection — velocity-based with rolling distance window
                    if (mask?.hands.left && mask?.hands.right) {
                        const dx = mask.hands.left.position.x - mask.hands.right.position.x;
                        const dy = mask.hands.left.position.y - mask.hands.right.position.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const clap = clapRef.current;

                        // Build rolling distance history
                        clap.distHistory.push(dist);
                        if (clap.distHistory.length > CLAP_HISTORY_SIZE) {
                            clap.distHistory.shift();
                        }

                        // Evaluate when we have a full window
                        if (clap.distHistory.length === CLAP_HISTORY_SIZE) {
                            const oldest = clap.distHistory[0];
                            const newest = clap.distHistory[CLAP_HISTORY_SIZE - 1];
                            const closingVelocity = (oldest - newest) / (CLAP_HISTORY_SIZE - 1);

                            if (
                                newest < CLAP_CLOSE_DIST &&
                                oldest > CLAP_FAR_DIST &&
                                closingVelocity > CLAP_MIN_VELOCITY &&
                                Date.now() - clap.lastClapTime > CLAP_COOLDOWN_MS &&
                                !renderer.isTransitioning
                            ) {
                                const currentIdx = MODES_CONFIG.findIndex(m => m.key === activeModeRef.current);
                                const nextIdx = (currentIdx + 1) % MODES_CONFIG.length;
                                handleModeChangeRef.current(MODES_CONFIG[nextIdx].key);
                                clap.lastClapTime = Date.now();
                                clap.distHistory.length = 0; // Prevent double-fire
                            }
                        }
                    } else {
                        // Reset when a hand disappears
                        clapRef.current.distHistory.length = 0;
                    }

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

                    // Update audio proximity based on hand positions
                    systemsRef.current.audio?.updateProximity(
                        mask?.hands.left?.position ?? null,
                        mask?.hands.right?.position ?? null,
                        !!(mask?.hands.left || mask?.hands.right)
                    );

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

            const { vision, renderer, audio } = systemsRef.current;
            vision?.stop();
            renderer?.destroy();
            audio?.destroy();
        };
    }, [initialMode, onReady]);

    const handleModeChange = useCallback((mode: CreatureMode) => {
        if (systemsRef.current.renderer?.isTransitioning) return;
        setActiveMode(mode);
        activeModeRef.current = mode;
        systemsRef.current.renderer?.setMode(mode);
        systemsRef.current.audio?.setMode(mode);
    }, []);
    handleModeChangeRef.current = handleModeChange;

    const toggleMute = useCallback(() => {
        const audio = systemsRef.current.audio;
        if (!audio) return;
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        audio.setMuted(newMuted);
    }, [isMuted]);

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

                    {/* Behavior hint + rotating fun facts at top */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 max-w-lg text-center">
                        <p className="font-sans text-white/25 text-xs">
                            {BEHAVIOR_HINTS[activeMode]}
                        </p>
                        <p
                            key={`${activeMode}-${factIndex}`}
                            className="font-sans text-white/20 text-xs mt-2 opacity-0 animate-fade-up"
                            style={{ animationFillMode: 'forwards' }}
                        >
                            {CREATURE_FACTS[activeMode][factIndex]}
                        </p>
                    </div>

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

                    {/* Bottom-right controls */}
                    <div className="absolute bottom-6 right-6 z-10 flex gap-3">
                        {/* Mute toggle */}
                        <button
                            onClick={toggleMute}
                            className="w-12 h-12 rounded-full bg-white/[0.07] backdrop-blur-sm text-white/40 border border-white/[0.05] hover:bg-white/[0.12] hover:text-white/70 hover:scale-110 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 ease-out flex items-center justify-center"
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            {isMuted ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                    <line x1="23" y1="9" x2="17" y2="15" />
                                    <line x1="17" y1="9" x2="23" y2="15" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </svg>
                            )}
                        </button>

                        {/* Fullscreen toggle */}
                        <button
                            onClick={toggleFullscreen}
                            className="w-12 h-12 rounded-full bg-white/[0.07] backdrop-blur-sm text-white/40 border border-white/[0.05] hover:bg-white/[0.12] hover:text-white/70 hover:scale-110 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 ease-out flex items-center justify-center"
                            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        >
                            {isFullscreen ? <ContractIcon /> : <ExpandIcon />}
                        </button>
                    </div>

                    {cameraActive && !handsDetected && (
                        <div
                            className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 opacity-0 animate-fade-up"
                            style={{ animationDelay: '2s', animationFillMode: 'forwards' }}
                        >
                            <p className="font-sans text-white/25 text-xs">Wave your hands in front of the camera ✨</p>
                        </div>
                    )}

                    {cameraActive && handsDetected && (
                        <div
                            className="absolute bottom-36 left-1/2 -translate-x-1/2 z-10 opacity-0 animate-fade-up"
                            style={{ animationFillMode: 'forwards' }}
                        >
                            <p className="font-sans text-white/25 text-xs">Clap to switch creatures 👏</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
