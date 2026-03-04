/**
 * AudioManager — Meditation / spa ambient soundscapes for BUGS
 *
 * Each creature mode produces a warm, evolving drone built from
 * layered detuned sine waves at consonant intervals (root, fifth,
 * octave). Slight detuning between pairs creates natural warmth
 * and slow beating. A thin filtered noise accent adds air texture.
 *
 * Hands modulate the drone: proximity boosts volume, opens filter,
 * widens detuning for shimmer, and speeds evolution.
 */

import type { CreatureMode } from '../graphics/Creature3DRenderer';

// ────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────

interface AmbientScape {
    gain: GainNode;
    sources: AudioScheduledSourceNode[];
    nodes: AudioNode[];
    targetVolume: number;
    active: boolean;

    // Reactive targets
    reactiveFilter: BiquadFilterNode | null;
    reactiveFilterBase: number;
    reactiveFilterRange: number;
    proximityGain: GainNode | null;
    stereoPanner: StereoPannerNode | null;

    // Detunable oscillator pairs for shimmer effect
    detunePairs: { oscA: OscillatorNode; oscB: OscillatorNode; baseDetune: number }[];

    // LFOs for rate modulation
    lfoNodes: OscillatorNode[];
    lfoBaseRates: number[];
}

// ────────────────────────────────────────────────────
// Noise buffer generator (for accent layers only)
// ────────────────────────────────────────────────────

function createNoiseBuffer(ctx: AudioContext, type: 'white' | 'pink' | 'brown', duration = 2): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    } else if (type === 'pink') {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
    } else {
        let last = 0;
        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;
            last = (last + 0.02 * white) / 1.02;
            data[i] = last * 3.5;
        }
    }

    return buffer;
}

function createLoopingNoise(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
}

// ────────────────────────────────────────────────────
// LFO helper
// ────────────────────────────────────────────────────

function createLFO(
    ctx: AudioContext,
    rate: number,
    depth: number,
    target: AudioParam
): { osc: OscillatorNode; gain: GainNode } {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = rate;

    const gain = ctx.createGain();
    gain.gain.value = depth;

    osc.connect(gain);
    gain.connect(target);
    osc.start();

    return { osc, gain };
}

/**
 * Creates a detuned oscillator pair — two sine waves slightly apart
 * in frequency. The slow beating between them creates warmth.
 * Returns both oscillators and a shared gain node.
 */
function createDetunedPair(
    ctx: AudioContext,
    freq: number,
    detuneCents: number,
    volume: number,
    destination: AudioNode
): {
    oscA: OscillatorNode;
    oscB: OscillatorNode;
    gain: GainNode;
} {
    const oscA = ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.value = freq;
    oscA.detune.value = -detuneCents;

    const oscB = ctx.createOscillator();
    oscB.type = 'sine';
    oscB.frequency.value = freq;
    oscB.detune.value = detuneCents;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    oscA.connect(gain);
    oscB.connect(gain);
    gain.connect(destination);

    oscA.start();
    oscB.start();

    return { oscA, oscB, gain };
}

// ────────────────────────────────────────────────────
// AudioManager
// ────────────────────────────────────────────────────

export class AudioManager {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private ambientGain: GainNode | null = null;

    private muted = false;
    private initialized = false;
    private readonly MASTER_VOLUME = 0.18;

    // Noise buffers
    private whiteNoise: AudioBuffer | null = null;
    private brownNoise: AudioBuffer | null = null;
    private pinkNoise: AudioBuffer | null = null;

    // Active scapes
    private currentScape: AmbientScape | null = null;
    private currentMode: CreatureMode | null = null;
    private fadingScape: AmbientScape | null = null;

    // Hand tracking
    private prevLeft: { x: number; y: number } | null = null;
    private prevRight: { x: number; y: number } | null = null;
    private leftVelocity = 0;
    private rightVelocity = 0;
    private smoothedProximity = 0;

    private visibilityHandler: (() => void) | null = null;

    // ─── Public API ─────────────────────────────────

    init(): void {
        if (this.initialized) return;

        try {
            this.ctx = new AudioContext();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.MASTER_VOLUME;
            this.masterGain.connect(this.ctx.destination);

            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.value = 1.0;
            this.ambientGain.connect(this.masterGain);

            this.whiteNoise = createNoiseBuffer(this.ctx, 'white');
            this.brownNoise = createNoiseBuffer(this.ctx, 'brown');
            this.pinkNoise = createNoiseBuffer(this.ctx, 'pink');

            // Autoplay policy
            if (this.ctx.state === 'suspended') {
                const resume = () => {
                    this.ctx?.resume();
                    document.removeEventListener('click', resume);
                    document.removeEventListener('touchstart', resume);
                };
                document.addEventListener('click', resume, { once: false });
                document.addEventListener('touchstart', resume, { once: false });
            }

            // Tab visibility
            this.visibilityHandler = () => {
                if (document.hidden) this.suspend();
                else this.resume();
            };
            document.addEventListener('visibilitychange', this.visibilityHandler);

            this.initialized = true;
            console.log('AudioManager initialized');
        } catch (err) {
            console.warn('AudioManager: Web Audio API not available', err);
        }
    }

    setMode(mode: CreatureMode): void {
        if (!this.ctx || !this.initialized) return;
        if (mode === this.currentMode) return;

        const fadeTime = 3.0; // Slow meditative crossfade
        const now = this.ctx.currentTime;

        if (this.currentScape) {
            const oldScape = this.currentScape;
            oldScape.gain.gain.setValueAtTime(oldScape.gain.gain.value, now);
            oldScape.gain.gain.linearRampToValueAtTime(0, now + fadeTime);

            if (this.fadingScape) this.teardownScape(this.fadingScape);
            this.fadingScape = oldScape;
            setTimeout(() => {
                if (this.fadingScape === oldScape) {
                    this.teardownScape(oldScape);
                    this.fadingScape = null;
                }
            }, (fadeTime + 0.5) * 1000);
        }

        const newScape = this.buildScape(mode);
        if (newScape) {
            newScape.gain.gain.setValueAtTime(0, now);
            newScape.gain.gain.linearRampToValueAtTime(newScape.targetVolume, now + fadeTime);
            this.currentScape = newScape;
        }

        this.currentMode = mode;
    }

    updateProximity(
        leftHand: { x: number; y: number } | null,
        rightHand: { x: number; y: number } | null,
        hasCreatures: boolean
    ): void {
        if (!this.ctx || !this.currentScape || this.muted) return;

        const now = this.ctx.currentTime;
        const smoothing = 0.7;

        // Compute velocities
        if (leftHand && this.prevLeft) {
            const dx = leftHand.x - this.prevLeft.x;
            const dy = leftHand.y - this.prevLeft.y;
            this.leftVelocity = this.leftVelocity * smoothing + Math.sqrt(dx * dx + dy * dy) * (1 - smoothing);
        } else {
            this.leftVelocity *= 0.92;
        }
        this.prevLeft = leftHand ? { x: leftHand.x, y: leftHand.y } : null;

        if (rightHand && this.prevRight) {
            const dx = rightHand.x - this.prevRight.x;
            const dy = rightHand.y - this.prevRight.y;
            this.rightVelocity = this.rightVelocity * smoothing + Math.sqrt(dx * dx + dy * dy) * (1 - smoothing);
        } else {
            this.rightVelocity *= 0.92;
        }
        this.prevRight = rightHand ? { x: rightHand.x, y: rightHand.y } : null;

        const handsPresent = !!(leftHand || rightHand);
        const combinedVelocity = Math.min(this.leftVelocity + this.rightVelocity, 0.15);
        const normalizedVelocity = combinedVelocity / 0.15;

        const targetProximity = handsPresent && hasCreatures ? 1.0 : 0.0;
        this.smoothedProximity += (targetProximity - this.smoothedProximity) * 0.04;

        // Stereo
        let stereoBias = 0;
        if (leftHand && rightHand) {
            stereoBias = (rightHand.x - leftHand.x) * 0.5;
        } else if (leftHand) {
            stereoBias = (leftHand.x - 0.5) * 0.4;
        } else if (rightHand) {
            stereoBias = (rightHand.x - 0.5) * 0.4;
        }
        stereoBias = Math.max(-0.3, Math.min(0.3, stereoBias));

        const scape = this.currentScape;

        // 1. Volume boost: 1.0 → 1.5 when hands near
        if (scape.proximityGain) {
            const targetGain = 1.0 + this.smoothedProximity * 0.5;
            scape.proximityGain.gain.setTargetAtTime(targetGain, now, 0.1);
        }

        // 2. Filter sweep on noise accent
        if (scape.reactiveFilter) {
            const targetFreq = scape.reactiveFilterBase +
                scape.reactiveFilterRange * this.smoothedProximity;
            scape.reactiveFilter.frequency.setTargetAtTime(targetFreq, now, 0.15);
        }

        // 3. Stereo panning
        if (scape.stereoPanner) {
            scape.stereoPanner.pan.setTargetAtTime(stereoBias, now, 0.12);
        }

        // 4. Detuning shimmer — widen detuning with velocity
        for (const pair of scape.detunePairs) {
            const extraDetune = normalizedVelocity * 8; // up to 8 cents extra
            const newDetune = pair.baseDetune + extraDetune;
            pair.oscA.detune.setTargetAtTime(-newDetune, now, 0.2);
            pair.oscB.detune.setTargetAtTime(newDetune, now, 0.2);
        }

        // 5. LFO rate modulation
        for (let i = 0; i < scape.lfoNodes.length; i++) {
            const newRate = scape.lfoBaseRates[i] * (1.0 + normalizedVelocity * 1.5);
            scape.lfoNodes[i].frequency.setTargetAtTime(newRate, now, 0.3);
        }
    }

    setMuted(muted: boolean): void {
        this.muted = muted;
        if (!this.masterGain || !this.ctx) return;
        const now = this.ctx.currentTime;
        this.masterGain.gain.setTargetAtTime(muted ? 0 : this.MASTER_VOLUME, now, 0.15);
    }

    get isMuted(): boolean {
        return this.muted;
    }

    suspend(): void {
        this.ctx?.suspend();
    }

    resume(): void {
        if (!this.muted) this.ctx?.resume();
    }

    destroy(): void {
        if (this.currentScape) {
            this.teardownScape(this.currentScape);
            this.currentScape = null;
        }
        if (this.fadingScape) {
            this.teardownScape(this.fadingScape);
            this.fadingScape = null;
        }
        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
        }
        this.ctx?.close();
        this.ctx = null;
        this.initialized = false;
    }

    // ─── Private: Scape Shell ────────────────────────

    private buildScape(mode: CreatureMode): AmbientScape | null {
        switch (mode) {
            case 'BEES': return this.buildBeesScape();
            case 'BIRDS': return this.buildBirdsScape();
            case 'FISH': return this.buildFishScape();
            case 'BUTTERFLIES': return this.buildButterfliesScape();
            default: return this.buildBeesScape();
        }
    }

    private createScapeShell(): {
        scapeGain: GainNode;
        proximityGain: GainNode;
        panner: StereoPannerNode;
        sources: AudioScheduledSourceNode[];
        nodes: AudioNode[];
        detunePairs: { oscA: OscillatorNode; oscB: OscillatorNode; baseDetune: number }[];
        lfoNodes: OscillatorNode[];
        lfoBaseRates: number[];
    } | null {
        if (!this.ctx || !this.ambientGain) return null;
        const ctx = this.ctx;

        const scapeGain = ctx.createGain();
        scapeGain.gain.value = 0;

        const panner = ctx.createStereoPanner();
        panner.pan.value = 0;

        const proximityGain = ctx.createGain();
        proximityGain.gain.value = 1.0;

        // Chain: layers → proximityGain → scapeGain → panner → ambientGain
        proximityGain.connect(scapeGain);
        scapeGain.connect(panner);
        panner.connect(this.ambientGain);

        return {
            scapeGain,
            proximityGain,
            panner,
            sources: [],
            nodes: [scapeGain, panner, proximityGain],
            detunePairs: [],
            lfoNodes: [],
            lfoBaseRates: [],
        };
    }

    // ═══════════════════════════════════════════════
    // BEES — Warm Hive Drone (A2)
    // Root 110Hz + Fifth 165Hz + Octave 220Hz
    // Warm, grounding, lowest drone
    // ═══════════════════════════════════════════════

    private buildBeesScape(): AmbientScape | null {
        const shell = this.createScapeShell();
        if (!shell || !this.ctx || !this.pinkNoise || !this.whiteNoise) return null;
        const ctx = this.ctx;
        const { proximityGain, sources, nodes, detunePairs, lfoNodes, lfoBaseRates } = shell;

        // Root drone: A2 (110Hz) — detuned pair for warmth
        const root = createDetunedPair(ctx, 110, 3, 0.25, proximityGain);
        sources.push(root.oscA, root.oscB);
        nodes.push(root.gain);
        detunePairs.push({ oscA: root.oscA, oscB: root.oscB, baseDetune: 3 });

        // Fifth: E3 (165Hz)
        const fifth = createDetunedPair(ctx, 165, 2, 0.12, proximityGain);
        sources.push(fifth.oscA, fifth.oscB);
        nodes.push(fifth.gain);
        detunePairs.push({ oscA: fifth.oscA, oscB: fifth.oscB, baseDetune: 2 });

        // Octave: A3 (220Hz)
        const octave = createDetunedPair(ctx, 220, 2.5, 0.08, proximityGain);
        sources.push(octave.oscA, octave.oscB);
        nodes.push(octave.gain);
        detunePairs.push({ oscA: octave.oscA, oscB: octave.oscB, baseDetune: 2.5 });

        // Slow breathing on root: 0.06Hz, depth 0.1
        const lfo1 = createLFO(ctx, 0.06, 0.1, root.gain.gain);
        sources.push(lfo1.osc);
        nodes.push(lfo1.gain);
        lfoNodes.push(lfo1.osc);
        lfoBaseRates.push(0.06);

        // Slower drift on fifth: 0.04Hz, depth 0.05
        const lfo2 = createLFO(ctx, 0.04, 0.05, fifth.gain.gain);
        sources.push(lfo2.osc);
        nodes.push(lfo2.gain);
        lfoNodes.push(lfo2.osc);
        lfoBaseRates.push(0.04);

        // Noise accent: thin pink LP 300Hz — subtle air
        const noiseSrc = createLoopingNoise(ctx, this.pinkNoise);
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 300;
        noiseFilter.Q.value = 0.5;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.04;

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(proximityGain);
        noiseSrc.start();
        sources.push(noiseSrc);
        nodes.push(noiseFilter, noiseGain);

        // SFX: Wing buzz — white noise HP 3kHz with 22Hz AM flutter
        const buzzSrc = createLoopingNoise(ctx, this.whiteNoise!);
        const buzzHP = ctx.createBiquadFilter();
        buzzHP.type = 'highpass';
        buzzHP.frequency.value = 3000;
        buzzHP.Q.value = 0.5;
        const buzzGain = ctx.createGain();
        buzzGain.gain.value = 0.025;

        buzzSrc.connect(buzzHP);
        buzzHP.connect(buzzGain);
        buzzGain.connect(proximityGain);
        buzzSrc.start();
        sources.push(buzzSrc);
        nodes.push(buzzHP, buzzGain);

        // Fast AM at 22Hz — creates rapid flutter/buzz character
        const buzzAM = createLFO(ctx, 22, 0.02, buzzGain.gain);
        sources.push(buzzAM.osc);
        nodes.push(buzzAM.gain);
        lfoNodes.push(buzzAM.osc);
        lfoBaseRates.push(22);

        // Slow swell on buzz: 0.1Hz, depth 0.015 — breathes in/out
        const buzzSwell = createLFO(ctx, 0.1, 0.015, buzzGain.gain);
        sources.push(buzzSwell.osc);
        nodes.push(buzzSwell.gain);
        lfoNodes.push(buzzSwell.osc);
        lfoBaseRates.push(0.1);

        return {
            gain: shell.scapeGain,
            sources,
            nodes,
            targetVolume: 0.7,
            active: true,
            reactiveFilter: noiseFilter,
            reactiveFilterBase: 300,
            reactiveFilterRange: 600,
            proximityGain,
            stereoPanner: shell.panner,
            detunePairs,
            lfoNodes,
            lfoBaseRates,
        };
    }

    // ═══════════════════════════════════════════════
    // BIRDS — Airy Forest Pad (G3)
    // Root 196Hz + Third 247Hz + Fifth 294Hz
    // Brighter, open, major tonality
    // ═══════════════════════════════════════════════

    private buildBirdsScape(): AmbientScape | null {
        const shell = this.createScapeShell();
        if (!shell || !this.ctx || !this.pinkNoise || !this.whiteNoise) return null;
        const ctx = this.ctx;
        const { proximityGain, sources, nodes, detunePairs, lfoNodes, lfoBaseRates } = shell;

        // Root: G3 (196Hz)
        const root = createDetunedPair(ctx, 196, 2.5, 0.2, proximityGain);
        sources.push(root.oscA, root.oscB);
        nodes.push(root.gain);
        detunePairs.push({ oscA: root.oscA, oscB: root.oscB, baseDetune: 2.5 });

        // Major third: B3 (247Hz)
        const third = createDetunedPair(ctx, 247, 2, 0.1, proximityGain);
        sources.push(third.oscA, third.oscB);
        nodes.push(third.gain);
        detunePairs.push({ oscA: third.oscA, oscB: third.oscB, baseDetune: 2 });

        // Fifth: D4 (294Hz)
        const fifthPair = createDetunedPair(ctx, 294, 3, 0.08, proximityGain);
        sources.push(fifthPair.oscA, fifthPair.oscB);
        nodes.push(fifthPair.gain);
        detunePairs.push({ oscA: fifthPair.oscA, oscB: fifthPair.oscB, baseDetune: 3 });

        // Breathing LFO on root: 0.07Hz, depth 0.08
        const lfo1 = createLFO(ctx, 0.07, 0.08, root.gain.gain);
        sources.push(lfo1.osc);
        nodes.push(lfo1.gain);
        lfoNodes.push(lfo1.osc);
        lfoBaseRates.push(0.07);

        // Slow swell on third: 0.05Hz, depth 0.04
        const lfo2 = createLFO(ctx, 0.05, 0.04, third.gain.gain);
        sources.push(lfo2.osc);
        nodes.push(lfo2.gain);
        lfoNodes.push(lfo2.osc);
        lfoBaseRates.push(0.05);

        // Noise accent: pink BP 800Hz — rustling air
        const noiseSrc = createLoopingNoise(ctx, this.pinkNoise);
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 800;
        noiseFilter.Q.value = 0.4;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.03;

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(proximityGain);
        noiseSrc.start();
        sources.push(noiseSrc);
        nodes.push(noiseFilter, noiseGain);

        // Gentle gust on noise: 0.08Hz, depth 0.02
        const lfo3 = createLFO(ctx, 0.08, 0.02, noiseGain.gain);
        sources.push(lfo3.osc);
        nodes.push(lfo3.gain);
        lfoNodes.push(lfo3.osc);
        lfoBaseRates.push(0.08);

        // SFX: Leaves rustling — white noise BP 3500Hz with gust modulation
        const rustleSrc = createLoopingNoise(ctx, this.whiteNoise!);
        const rustleFilter = ctx.createBiquadFilter();
        rustleFilter.type = 'bandpass';
        rustleFilter.frequency.value = 3500;
        rustleFilter.Q.value = 0.6;
        const rustleGain = ctx.createGain();
        rustleGain.gain.value = 0.03;

        rustleSrc.connect(rustleFilter);
        rustleFilter.connect(rustleGain);
        rustleGain.connect(proximityGain);
        rustleSrc.start();
        sources.push(rustleSrc);
        nodes.push(rustleFilter, rustleGain);

        // Gust LFO at 0.3Hz — leaves stirring
        const rustleGust = createLFO(ctx, 0.3, 0.02, rustleGain.gain);
        sources.push(rustleGust.osc);
        nodes.push(rustleGust.gain);
        lfoNodes.push(rustleGust.osc);
        lfoBaseRates.push(0.3);

        // Slow organic sweep: 0.07Hz, depth 0.015
        const rustleSweep = createLFO(ctx, 0.07, 0.015, rustleGain.gain);
        sources.push(rustleSweep.osc);
        nodes.push(rustleSweep.gain);
        lfoNodes.push(rustleSweep.osc);
        lfoBaseRates.push(0.07);

        return {
            gain: shell.scapeGain,
            sources,
            nodes,
            targetVolume: 0.65,
            active: true,
            reactiveFilter: noiseFilter,
            reactiveFilterBase: 800,
            reactiveFilterRange: 1200,
            proximityGain,
            stereoPanner: shell.panner,
            detunePairs,
            lfoNodes,
            lfoBaseRates,
        };
    }

    // ═══════════════════════════════════════════════
    // FISH — Deep Ocean Pad (E2)
    // Root 82Hz + Fifth 123Hz + Octave 165Hz
    // Deepest, most submerged, slow wave-like swells
    // ═══════════════════════════════════════════════

    private buildFishScape(): AmbientScape | null {
        const shell = this.createScapeShell();
        if (!shell || !this.ctx || !this.brownNoise || !this.pinkNoise) return null;
        const ctx = this.ctx;
        const { proximityGain, sources, nodes, detunePairs, lfoNodes, lfoBaseRates } = shell;

        // Root: E2 (82.4Hz) — deep oceanic
        const root = createDetunedPair(ctx, 82.4, 2, 0.3, proximityGain);
        sources.push(root.oscA, root.oscB);
        nodes.push(root.gain);
        detunePairs.push({ oscA: root.oscA, oscB: root.oscB, baseDetune: 2 });

        // Fifth: B2 (123.5Hz)
        const fifth = createDetunedPair(ctx, 123.5, 2.5, 0.15, proximityGain);
        sources.push(fifth.oscA, fifth.oscB);
        nodes.push(fifth.gain);
        detunePairs.push({ oscA: fifth.oscA, oscB: fifth.oscB, baseDetune: 2.5 });

        // Octave: E3 (164.8Hz)
        const octave = createDetunedPair(ctx, 164.8, 1.5, 0.08, proximityGain);
        sources.push(octave.oscA, octave.oscB);
        nodes.push(octave.gain);
        detunePairs.push({ oscA: octave.oscA, oscB: octave.oscB, baseDetune: 1.5 });

        // Deep wave swell on root: 0.04Hz, depth 0.15 — slow rise and fall
        const lfo1 = createLFO(ctx, 0.04, 0.15, root.gain.gain);
        sources.push(lfo1.osc);
        nodes.push(lfo1.gain);
        lfoNodes.push(lfo1.osc);
        lfoBaseRates.push(0.04);

        // Second wave interference: 0.06Hz, depth 0.08
        const lfo2 = createLFO(ctx, 0.06, 0.08, root.gain.gain);
        sources.push(lfo2.osc);
        nodes.push(lfo2.gain);
        lfoNodes.push(lfo2.osc);
        lfoBaseRates.push(0.06);

        // Fifth drift: 0.03Hz, depth 0.06
        const lfo3 = createLFO(ctx, 0.03, 0.06, fifth.gain.gain);
        sources.push(lfo3.osc);
        nodes.push(lfo3.gain);
        lfoNodes.push(lfo3.osc);
        lfoBaseRates.push(0.03);

        // Noise accent: brown LP 100Hz — deep water texture
        const noiseSrc = createLoopingNoise(ctx, this.brownNoise);
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 100;
        noiseFilter.Q.value = 0.5;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.06;

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(proximityGain);
        noiseSrc.start();
        sources.push(noiseSrc);
        nodes.push(noiseFilter, noiseGain);

        // Slow wave on noise: 0.05Hz, depth 0.04
        const lfo4 = createLFO(ctx, 0.05, 0.04, noiseGain.gain);
        sources.push(lfo4.osc);
        nodes.push(lfo4.gain);
        lfoNodes.push(lfo4.osc);
        lfoBaseRates.push(0.05);

        // SFX: Water lapping — pink noise BP 500Hz with wave-like modulation
        const lapSrc = createLoopingNoise(ctx, this.pinkNoise!);
        const lapFilter = ctx.createBiquadFilter();
        lapFilter.type = 'bandpass';
        lapFilter.frequency.value = 500;
        lapFilter.Q.value = 0.8;
        const lapGain = ctx.createGain();
        lapGain.gain.value = 0.035;

        lapSrc.connect(lapFilter);
        lapFilter.connect(lapGain);
        lapGain.connect(proximityGain);
        lapSrc.start();
        sources.push(lapSrc);
        nodes.push(lapFilter, lapGain);

        // Wave LFO at 0.4Hz — gentle lapping rhythm
        const lapWave = createLFO(ctx, 0.4, 0.025, lapGain.gain);
        sources.push(lapWave.osc);
        nodes.push(lapWave.gain);
        lfoNodes.push(lapWave.osc);
        lfoBaseRates.push(0.4);

        // Deep swell: 0.07Hz, depth 0.02
        const lapSwell = createLFO(ctx, 0.07, 0.02, lapGain.gain);
        sources.push(lapSwell.osc);
        nodes.push(lapSwell.gain);
        lfoNodes.push(lapSwell.osc);
        lfoBaseRates.push(0.07);

        // SFX: Deep water body movement — brown LP 200Hz with slow surge
        const deepSrc = createLoopingNoise(ctx, this.brownNoise);
        const deepFilter = ctx.createBiquadFilter();
        deepFilter.type = 'lowpass';
        deepFilter.frequency.value = 200;
        deepFilter.Q.value = 0.3;
        const deepGain = ctx.createGain();
        deepGain.gain.value = 0.04;

        deepSrc.connect(deepFilter);
        deepFilter.connect(deepGain);
        deepGain.connect(proximityGain);
        deepSrc.start();
        sources.push(deepSrc);
        nodes.push(deepFilter, deepGain);

        // Slow surge: 0.05Hz, depth 0.03
        const deepSurge = createLFO(ctx, 0.05, 0.03, deepGain.gain);
        sources.push(deepSurge.osc);
        nodes.push(deepSurge.gain);
        lfoNodes.push(deepSurge.osc);
        lfoBaseRates.push(0.05);

        return {
            gain: shell.scapeGain,
            sources,
            nodes,
            targetVolume: 0.65,
            active: true,
            reactiveFilter: noiseFilter,
            reactiveFilterBase: 100,
            reactiveFilterRange: 400,
            proximityGain,
            stereoPanner: shell.panner,
            detunePairs,
            lfoNodes,
            lfoBaseRates,
        };
    }

    // ═══════════════════════════════════════════════
    // BUTTERFLIES — Ethereal Garden (D3)
    // Root 147Hz + Fifth 220Hz + Octave 294Hz
    // Lightest, most ethereal, slowest evolution
    // ═══════════════════════════════════════════════

    private buildButterfliesScape(): AmbientScape | null {
        const shell = this.createScapeShell();
        if (!shell || !this.ctx || !this.pinkNoise || !this.whiteNoise) return null;
        const ctx = this.ctx;
        const { proximityGain, sources, nodes, detunePairs, lfoNodes, lfoBaseRates } = shell;

        // Root: D3 (146.8Hz)
        const root = createDetunedPair(ctx, 146.8, 2, 0.18, proximityGain);
        sources.push(root.oscA, root.oscB);
        nodes.push(root.gain);
        detunePairs.push({ oscA: root.oscA, oscB: root.oscB, baseDetune: 2 });

        // Fifth: A3 (220Hz)
        const fifth = createDetunedPair(ctx, 220, 2.5, 0.1, proximityGain);
        sources.push(fifth.oscA, fifth.oscB);
        nodes.push(fifth.gain);
        detunePairs.push({ oscA: fifth.oscA, oscB: fifth.oscB, baseDetune: 2.5 });

        // Octave: D4 (293.7Hz)
        const octave = createDetunedPair(ctx, 293.7, 1.5, 0.05, proximityGain);
        sources.push(octave.oscA, octave.oscB);
        nodes.push(octave.gain);
        detunePairs.push({ oscA: octave.oscA, oscB: octave.oscB, baseDetune: 1.5 });

        // Ultra-slow breathing on root: 0.03Hz, depth 0.08
        const lfo1 = createLFO(ctx, 0.03, 0.08, root.gain.gain);
        sources.push(lfo1.osc);
        nodes.push(lfo1.gain);
        lfoNodes.push(lfo1.osc);
        lfoBaseRates.push(0.03);

        // Glacial fifth drift: 0.02Hz, depth 0.04
        const lfo2 = createLFO(ctx, 0.02, 0.04, fifth.gain.gain);
        sources.push(lfo2.osc);
        nodes.push(lfo2.gain);
        lfoNodes.push(lfo2.osc);
        lfoBaseRates.push(0.02);

        // Noise accent: pink BP 500Hz — whisper of air
        const noiseSrc = createLoopingNoise(ctx, this.pinkNoise);
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 500;
        noiseFilter.Q.value = 0.3;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.025;

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(proximityGain);
        noiseSrc.start();
        sources.push(noiseSrc);
        nodes.push(noiseFilter, noiseGain);

        // SFX: Gentle air flutter — white noise HP 5kHz with soft 4Hz flutter
        const flutterSrc = createLoopingNoise(ctx, this.whiteNoise!);
        const flutterHP = ctx.createBiquadFilter();
        flutterHP.type = 'highpass';
        flutterHP.frequency.value = 5000;
        flutterHP.Q.value = 0.3;
        const flutterGain = ctx.createGain();
        flutterGain.gain.value = 0.015;

        flutterSrc.connect(flutterHP);
        flutterHP.connect(flutterGain);
        flutterGain.connect(proximityGain);
        flutterSrc.start();
        sources.push(flutterSrc);
        nodes.push(flutterHP, flutterGain);

        // Soft flutter at 4Hz — gentle, much slower than bees' 22Hz
        const flutterAM = createLFO(ctx, 4, 0.008, flutterGain.gain);
        sources.push(flutterAM.osc);
        nodes.push(flutterAM.gain);
        lfoNodes.push(flutterAM.osc);
        lfoBaseRates.push(4);

        // Ultra-slow drift: 0.03Hz, depth 0.008
        const flutterDrift = createLFO(ctx, 0.03, 0.008, flutterGain.gain);
        sources.push(flutterDrift.osc);
        nodes.push(flutterDrift.gain);
        lfoNodes.push(flutterDrift.osc);
        lfoBaseRates.push(0.03);

        return {
            gain: shell.scapeGain,
            sources,
            nodes,
            targetVolume: 0.55,
            active: true,
            reactiveFilter: noiseFilter,
            reactiveFilterBase: 500,
            reactiveFilterRange: 800,
            proximityGain,
            stereoPanner: shell.panner,
            detunePairs,
            lfoNodes,
            lfoBaseRates,
        };
    }

    // ─── Private: Teardown ───────────────────────────

    private teardownScape(scape: AmbientScape): void {
        scape.active = false;

        for (const source of scape.sources) {
            try { source.stop(); } catch { /* already stopped */ }
            try { source.disconnect(); } catch { /* already disconnected */ }
        }
        scape.sources.length = 0;

        for (const node of scape.nodes) {
            try { node.disconnect(); } catch { /* already disconnected */ }
        }
        scape.nodes.length = 0;

        scape.detunePairs.length = 0;
        scape.lfoNodes.length = 0;
        scape.lfoBaseRates.length = 0;
    }
}
