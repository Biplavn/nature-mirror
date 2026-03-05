/**
 * Quality Manager - Adaptive quality system for low-end device support
 *
 * Detects device capability and provides quality presets.
 * On powerful devices, everything is unchanged (high tier = current defaults).
 * On weak devices (iPads, old laptops), scales down creature counts,
 * bloom, MediaPipe complexity, pixel ratio, and frame rate target.
 *
 * Inspired by Unity's Adaptive Performance and TouchDesigner's cook-time profiler.
 */

export type QualityTier = 'high' | 'medium' | 'low';

export interface QualitySettings {
    tier: QualityTier;
    pixelRatio: number;
    bloomEnabled: boolean;
    bloomResolutionScale: number;
    creatureMultiplier: number;
    mediaComplexity: 0 | 1;
    cameraWidth: number;
    cameraHeight: number;
    targetFPS: number;
}

const QUALITY_PRESETS: Record<QualityTier, Omit<QualitySettings, 'pixelRatio'>> = {
    high: {
        tier: 'high',
        bloomEnabled: true,
        bloomResolutionScale: 0.25,
        creatureMultiplier: 1.0,
        mediaComplexity: 1,
        cameraWidth: 1280,
        cameraHeight: 720,
        targetFPS: 60,
    },
    medium: {
        tier: 'medium',
        bloomEnabled: true,
        bloomResolutionScale: 0.125,
        creatureMultiplier: 0.6,
        mediaComplexity: 0,
        cameraWidth: 640,
        cameraHeight: 480,
        targetFPS: 45,
    },
    low: {
        tier: 'low',
        bloomEnabled: false,
        bloomResolutionScale: 0,
        creatureMultiplier: 0.35,
        mediaComplexity: 0,
        cameraWidth: 640,
        cameraHeight: 360,
        targetFPS: 30,
    },
};

/**
 * Detect device capability and return appropriate quality tier
 */
function detectDeviceTier(): QualityTier {
    // Check for mobile / tablet
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIPad = /iPad/i.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 4;

    // Device memory (RAM in GB, Chrome only)
    const memory = (navigator as { deviceMemory?: number }).deviceMemory || 8;

    // GPU detection via WebGL
    let gpuTier: QualityTier = 'high';
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
                const rendererLower = renderer.toLowerCase();

                // Detect weak GPUs
                if (rendererLower.includes('intel') && !rendererLower.includes('iris')) {
                    gpuTier = 'low'; // Intel HD Graphics (not Iris)
                } else if (rendererLower.includes('intel uhd')) {
                    gpuTier = 'medium'; // Intel UHD is okay
                } else if (rendererLower.includes('apple gpu') || rendererLower.includes('apple a')) {
                    // Apple A-series chips -- older ones are weak
                    gpuTier = 'medium';
                } else if (rendererLower.includes('mali') || rendererLower.includes('adreno')) {
                    gpuTier = 'medium'; // Mobile GPUs
                } else if (rendererLower.includes('swiftshader') || rendererLower.includes('llvmpipe')) {
                    gpuTier = 'low'; // Software rendering
                }
            }
        }
        canvas.remove();
    } catch {
        // Ignore WebGL detection errors
    }

    // Combine signals
    let score = 0;

    // CPU score (0-2)
    if (cores >= 8) score += 2;
    else if (cores >= 4) score += 1;

    // Memory score (0-2)
    if (memory >= 8) score += 2;
    else if (memory >= 4) score += 1;

    // GPU score (0-2)
    if (gpuTier === 'high') score += 2;
    else if (gpuTier === 'medium') score += 1;

    // Device type penalty
    if (isIPad) score = Math.min(score, 3); // Cap iPad at medium
    if (isMobile && !isIPad) score = Math.min(score, 2); // Cap phones at low

    // Map score to tier
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
}

/**
 * FPS Monitor - tracks frame rate and triggers quality adaptation
 */
export class FPSMonitor {
    private frameTimes: number[] = [];
    private lastTime = 0;
    private readonly SAMPLE_SIZE = 60;
    private downgradeCount = 0;

    tick(): void {
        const now = performance.now();
        if (this.lastTime > 0) {
            this.frameTimes.push(now - this.lastTime);
            if (this.frameTimes.length > this.SAMPLE_SIZE) {
                this.frameTimes.shift();
            }
        }
        this.lastTime = now;
    }

    getAverageFPS(): number {
        if (this.frameTimes.length < 10) return 60;
        const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        return 1000 / avgFrameTime;
    }

    shouldDowngrade(targetFPS: number): boolean {
        const fps = this.getAverageFPS();
        if (fps < targetFPS * 0.7) {
            this.downgradeCount++;
            return this.downgradeCount > 3;
        }
        this.downgradeCount = 0;
        return false;
    }

    resetCounters(): void {
        this.downgradeCount = 0;
    }
}

/**
 * Main quality manager
 */
export class QualityManager {
    private currentTier: QualityTier;
    readonly settings: QualitySettings;
    readonly fpsMonitor = new FPSMonitor();

    constructor() {
        this.currentTier = detectDeviceTier();
        const preset = QUALITY_PRESETS[this.currentTier];

        // Compute pixel ratio based on tier
        const dpr = window.devicePixelRatio || 1;
        let pixelRatio: number;
        switch (this.currentTier) {
            case 'high': pixelRatio = Math.min(dpr, 1.5); break;
            case 'medium': pixelRatio = Math.min(dpr, 1.0); break;
            case 'low': pixelRatio = 1.0; break;
        }

        this.settings = { ...preset, pixelRatio };
        console.log(`Quality: ${this.currentTier} (cores=${navigator.hardwareConcurrency}, dpr=${dpr.toFixed(1)})`);
    }

    get tier(): QualityTier {
        return this.currentTier;
    }

    /**
     * Downgrade quality one level. Returns true if downgrade happened.
     */
    downgrade(): boolean {
        if (this.currentTier === 'high') {
            this.applyTier('medium');
            return true;
        }
        if (this.currentTier === 'medium') {
            this.applyTier('low');
            return true;
        }
        return false;
    }

    private applyTier(tier: QualityTier) {
        this.currentTier = tier;
        const preset = QUALITY_PRESETS[tier];
        Object.assign(this.settings, preset);

        const dpr = window.devicePixelRatio || 1;
        switch (tier) {
            case 'high': this.settings.pixelRatio = Math.min(dpr, 1.5); break;
            case 'medium': this.settings.pixelRatio = Math.min(dpr, 1.0); break;
            case 'low': this.settings.pixelRatio = 1.0; break;
        }

        this.fpsMonitor.resetCounters();
        console.log(`Quality downgraded to: ${tier}`);
    }
}
