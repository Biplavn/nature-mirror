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

    // Debug canvas (only shown in development)
    private debugCanvas: HTMLCanvasElement | null = null;
    private debugCtx: CanvasRenderingContext2D | null = null;
    private readonly isDebug = import.meta.env.DEV;

    // Tracking state
    private leftHandVisible = false;
    private rightHandVisible = false;
    // Confidence values used in debug display
    private _leftHandConfidence = 0;
    private _rightHandConfidence = 0;

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

        // Create debug overlay (dev only)
        if (this.isDebug) {
            this.createDebugCanvas();
        }

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

    private createDebugCanvas() {
        this.debugCanvas = document.createElement('canvas');
        this.debugCanvas.width = 320;
        this.debugCanvas.height = 240;
        this.debugCanvas.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 320px;
            height: 240px;
            border: 2px solid #00ff00;
            z-index: 9999;
            border-radius: 8px;
            background: #000;
        `;
        document.body.appendChild(this.debugCanvas);
        this.debugCtx = this.debugCanvas.getContext('2d')!;
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
                    this._leftHandConfidence = confidence;
                } else {
                    // This is actually the RIGHT hand on screen
                    const smoothed = this.smoothPoint(handCenter, this.smoothedRightHand);
                    this.smoothedRightHand = smoothed;
                    rightHand = { position: smoothed, confidence };
                    this.rightHandVisible = true;
                    this._rightHandConfidence = confidence;
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

    private drawDebug(results: Results, leftHand: HandPosition | null, rightHand: HandPosition | null) {
        if (!this.debugCtx || !this.debugCanvas) return;

        const ctx = this.debugCtx;
        const w = this.debugCanvas.width;
        const h = this.debugCanvas.height;

        // Clear and draw video
        ctx.save();
        ctx.scale(-1, 1); // Mirror
        ctx.drawImage(this.video, -w, 0, w, h);
        ctx.restore();

        // Draw hand landmarks
        if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
                // Draw connections
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
                ctx.lineWidth = 1;

                // Draw landmarks
                for (const landmark of landmarks) {
                    const x = (1 - landmark.x) * w; // Mirror x
                    const y = landmark.y * h;

                    ctx.fillStyle = '#00ff00';
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Draw detected hand positions
        if (leftHand) {
            const x = (1 - leftHand.position.x) * w;
            const y = leftHand.position.y * h;
            ctx.fillStyle = '#ff0000';
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('L', x - 4, y + 4);
        }

        if (rightHand) {
            const x = (1 - rightHand.position.x) * w;
            const y = rightHand.position.y * h;
            ctx.fillStyle = '#0088ff';
            ctx.strokeStyle = '#0088ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('R', x - 4, y + 4);
        }

        // Status text
        ctx.fillStyle = '#fff';
        ctx.font = '11px monospace';
        ctx.fillText(`Left: ${this.leftHandVisible ? `YES (${(this._leftHandConfidence * 100).toFixed(0)}%)` : 'NO'}`, 5, 15);
        ctx.fillText(`Right: ${this.rightHandVisible ? `YES (${(this._rightHandConfidence * 100).toFixed(0)}%)` : 'NO'}`, 5, 28);
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

        this.debugCanvas?.remove();
        this.hands?.close();
    }
}
