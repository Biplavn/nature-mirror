/**
 * Vision Manager with MediaPipe Hands
 *
 * Uses dedicated hand tracking neural network for precise hand detection
 * Similar to Tesla's approach: specialized networks for specific tasks
 *
 * Features:
 * - 21 landmarks per hand (fingertips, knuckles, wrist)
 * - Real-time tracking at 30+ FPS
 * - Smooth interpolation for stable tracking
 */

import { Hands } from '@mediapipe/hands';
import type { Results } from '@mediapipe/hands';
import type { SegmentationResult, VisionConfig, Point2D, HandPosition } from './types';

export class VisionManager {
    private video: HTMLVideoElement;
    private hands: Hands | null = null;
    private isActive = false;
    private animationId: number | null = null;

    // Last detected positions
    private lastResult: SegmentationResult | null = null;

    // Smoothed hand positions for stability
    private smoothedLeftHand: Point2D | null = null;
    private smoothedRightHand: Point2D | null = null;
    private readonly smoothing = 0.5; // Higher = more responsive, lower = smoother

    // Camera preview canvas (always visible in top-right corner)
    private debugCanvas: HTMLCanvasElement | null = null;
    private debugCtx: CanvasRenderingContext2D | null = null;
    private previewWrapper: HTMLDivElement | null = null;
    private toggleBtn: HTMLButtonElement | null = null;
    private cameraVisible = true;

    // Tracking state
    private leftHandVisible = false;
    private rightHandVisible = false;

    constructor(_config?: VisionConfig) {
        this.video = document.createElement('video');
        this.video.autoplay = true;
        this.video.playsInline = true;
        this.video.muted = true;
    }

    public async start() {
        console.log('Starting Vision Manager with MediaPipe Hands...');

        // Initialize MediaPipe Hands
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1, // 0=lite, 1=full
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults((results) => this.onHandsResults(results));

        // Get camera
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
                facingMode: 'user'
            }
        });

        this.video.srcObject = stream;
        await this.video.play();
        console.log('Camera:', this.video.videoWidth, 'x', this.video.videoHeight);

        // Create camera preview overlay
        this.createDebugCanvas();

        // Initialize result
        this.lastResult = {
            width: this.video.videoWidth,
            height: this.video.videoHeight,
            data: new Uint8Array(0),
            hands: { left: null, right: null },
            head: null,
            bodyCenter: null
        };

        this.isActive = true;
        this.processLoop();

        console.log('MediaPipe Hands initialized!');
    }

    // MediaPipe hand landmark connections for skeleton drawing
    private static readonly HAND_CONNECTIONS: [number, number][] = [
        [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8],       // Index
        [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
        [0, 13], [13, 14], [14, 15], [15, 16],// Ring
        [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
        [5, 9], [9, 13], [13, 17]             // Palm
    ];

    private createDebugCanvas() {
        // Create a wrapper div for the preview — glassmorphic style matching React overlays
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 100;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        this.previewWrapper = wrapper;

        // 16:9 canvas to match camera aspect ratio — no more stretching
        this.debugCanvas = document.createElement('canvas');
        this.debugCanvas.width = 320;
        this.debugCanvas.height = 180;
        this.debugCanvas.style.cssText = `
            display: block;
            width: 240px;
            height: 135px;
            background: #000;
        `;

        wrapper.appendChild(this.debugCanvas);
        document.body.appendChild(wrapper);
        this.debugCtx = this.debugCanvas.getContext('2d')!;

        // Create toggle button — styled to match the back button / status indicator
        const btn = document.createElement('button');
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><span style="margin-left:6px">Hide</span>`;
        btn.style.cssText = `
            position: fixed;
            top: 159px;
            right: 16px;
            z-index: 100;
            display: flex;
            align-items: center;
            padding: 6px 12px;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(8px);
            color: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Inter', system-ui, sans-serif;
            font-size: 13px;
            letter-spacing: 0.025em;
            transition: all 0.2s ease;
            outline: none;
        `;
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(0, 0, 0, 0.7)';
            btn.style.color = 'rgba(255, 255, 255, 1)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(0, 0, 0, 0.5)';
            btn.style.color = 'rgba(255, 255, 255, 0.7)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        });
        btn.addEventListener('click', () => this.toggleCameraPreview());
        document.body.appendChild(btn);
        this.toggleBtn = btn;
    }

    private toggleCameraPreview() {
        this.cameraVisible = !this.cameraVisible;

        if (this.previewWrapper && this.toggleBtn) {
            if (this.cameraVisible) {
                // Show preview
                this.previewWrapper.style.opacity = '1';
                this.previewWrapper.style.transform = 'translateY(0)';
                this.previewWrapper.style.pointerEvents = 'auto';
                this.toggleBtn.style.top = '159px';
                this.toggleBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><span style="margin-left:6px">Hide</span>`;
            } else {
                // Hide preview
                this.previewWrapper.style.opacity = '0';
                this.previewWrapper.style.transform = 'translateY(-10px)';
                this.previewWrapper.style.pointerEvents = 'none';
                this.toggleBtn.style.top = '16px';
                this.toggleBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg><span style="margin-left:6px">Show Camera</span>`;
            }
        }
    }

    private processLoop = async () => {
        if (!this.isActive || !this.hands) return;

        if (this.video.readyState >= 2) {
            await this.hands.send({ image: this.video });
        }

        this.animationId = requestAnimationFrame(this.processLoop);
    };

    private onHandsResults(results: Results) {
        // Reset visibility
        this.leftHandVisible = false;
        this.rightHandVisible = false;

        let leftHand: HandPosition | null = null;
        let rightHand: HandPosition | null = null;

        if (results.multiHandLandmarks && results.multiHandedness) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i];

                // Get wrist position (landmark 0) as hand center
                // Or use middle finger tip (landmark 12) for more precise tracking
                const wrist = landmarks[0];
                const middleTip = landmarks[12];

                // Use average of wrist and middle finger for stable center
                const handCenter: Point2D = {
                    x: (wrist.x + middleTip.x) / 2,
                    y: (wrist.y + middleTip.y) / 2
                };

                const confidence = handedness.score || 0.8;

                // Note: MediaPipe reports "Left" when it sees your right hand (mirror)
                // So we flip the labels
                if (handedness.label === 'Right') {
                    // This is actually the LEFT hand on screen
                    const smoothed = this.smoothPoint(handCenter, this.smoothedLeftHand);
                    this.smoothedLeftHand = smoothed;
                    leftHand = { position: smoothed, confidence };
                    this.leftHandVisible = true;
                } else {
                    // This is actually the RIGHT hand on screen
                    const smoothed = this.smoothPoint(handCenter, this.smoothedRightHand);
                    this.smoothedRightHand = smoothed;
                    rightHand = { position: smoothed, confidence };
                    this.rightHandVisible = true;
                }
            }
        }

        // Decay smoothed positions when hands not visible
        if (!this.leftHandVisible) {
            this.smoothedLeftHand = null;
        }
        if (!this.rightHandVisible) {
            this.smoothedRightHand = null;
        }

        // Update result
        this.lastResult = {
            width: this.video.videoWidth,
            height: this.video.videoHeight,
            data: new Uint8Array(0),
            hands: { left: leftHand, right: rightHand },
            head: null,
            bodyCenter: this.calculateBodyCenter(leftHand, rightHand)
        };

        // Draw debug
        this.drawDebug(results, leftHand, rightHand);
    }

    private smoothPoint(current: Point2D, prev: Point2D | null): Point2D {
        if (!prev) return current;
        return {
            x: prev.x + (current.x - prev.x) * this.smoothing,
            y: prev.y + (current.y - prev.y) * this.smoothing
        };
    }

    private calculateBodyCenter(left: HandPosition | null, right: HandPosition | null): Point2D | null {
        if (left && right) {
            return {
                x: (left.position.x + right.position.x) / 2,
                y: (left.position.y + right.position.y) / 2
            };
        }
        if (left) return left.position;
        if (right) return right.position;
        return null;
    }

    private drawDebug(results: Results, _leftHand: HandPosition | null, _rightHand: HandPosition | null) {
        if (!this.debugCtx || !this.debugCanvas) return;

        const ctx = this.debugCtx;
        const w = this.debugCanvas.width;
        const h = this.debugCanvas.height;

        // Clear and draw mirrored video feed
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(this.video, -w, 0, w, h);
        ctx.restore();

        // Slight darkening overlay so landmarks pop
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, w, h);

        // Draw hand skeletons with connections
        if (results.multiHandLandmarks && results.multiHandedness) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i];

                // Color per hand: cyan for left (user's left), orange for right
                const isLeftHand = handedness.label === 'Right'; // MediaPipe mirrors
                const color = isLeftHand ? '#00e5ff' : '#ff9100';
                const glowColor = isLeftHand ? 'rgba(0, 229, 255, 0.3)' : 'rgba(255, 145, 0, 0.3)';

                // Draw skeleton connections
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 6;

                for (const [a, b] of VisionManager.HAND_CONNECTIONS) {
                    const la = landmarks[a];
                    const lb = landmarks[b];
                    const ax = (1 - la.x) * w;
                    const ay = la.y * h;
                    const bx = (1 - lb.x) * w;
                    const by = lb.y * h;

                    ctx.beginPath();
                    ctx.moveTo(ax, ay);
                    ctx.lineTo(bx, by);
                    ctx.stroke();
                }

                // Draw landmark dots
                ctx.shadowBlur = 0;
                for (let j = 0; j < landmarks.length; j++) {
                    const lm = landmarks[j];
                    const x = (1 - lm.x) * w;
                    const y = lm.y * h;

                    // Fingertips (4, 8, 12, 16, 20) get larger dots
                    const isFingertip = j === 4 || j === 8 || j === 12 || j === 16 || j === 20;
                    const radius = isFingertip ? 4 : 2;

                    ctx.fillStyle = isFingertip ? '#ffffff' : color;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    public getMask(): SegmentationResult | null {
        return this.lastResult;
    }

    public getSourceVideo(): HTMLVideoElement {
        return this.video;
    }

    public stop() {
        this.isActive = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.video.srcObject) {
            (this.video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }

        this.previewWrapper?.remove();
        this.toggleBtn?.remove();
        this.hands?.close();
    }
}
