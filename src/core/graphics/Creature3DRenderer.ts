/**
 * 3D Creature Renderer - Hummingbirds and Fish
 *
 * Supports multiple creature types with natural motion:
 * - Hummingbirds: Realistic hovering with figure-8 wing motion, behavioral states
 * - Fish: Realistic swimming with boids schooling behavior
 *
 * Hummingbird behavior based on research:
 * - Figure-8 wing pattern during hovering (40-80 beats/sec)
 * - 75% lift on downstroke, 25% on upstroke
 * - Can fly backwards, sideways, and hover precisely
 * - Speed: 30+ mph regular, 55-60 mph during courtship dives
 * - Extremely territorial and curious
 * - Startle response with rapid escape
 *
 * Sources:
 * - https://journals.biologists.com/jeb/article/221/20/jeb178228 (wing tuning)
 * - https://elifesciences.org/articles/11159 (muscle performance)
 * - https://www.birdsandblooms.com/birding/attracting-hummingbirds/ (behavior)
 * - https://journals.biologists.com/jeb/article/219/22/3518 (escape maneuvers)
 *
 * Fish behavior sources:
 * - https://www.pnas.org/doi/10.1073/pnas.2113206118 (fish kinematics)
 * - https://www.red3d.com/cwr/boids/ (boids algorithm)
 * - https://animalbehaviorcorner.com/clownfish-behavior/ (clownfish behavior)
 */

import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

export type CreatureMode = 'BIRDS' | 'FISH' | 'BEES' | 'BUTTERFLIES';

export interface TrackingData {
    leftHand: { x: number; y: number; confidence: number } | null;
    rightHand: { x: number; y: number; confidence: number } | null;
    head: { x: number; y: number } | null;
    bodyCenter: { x: number; y: number } | null;
    hasBody: boolean;
}

// ========================================
// HUMMINGBIRD TYPES
// ========================================

type HummingbirdBehavior = 'HOVERING' | 'FEEDING' | 'CURIOUS' | 'TERRITORIAL' | 'STARTLED' | 'DARTING' | 'RETURNING' | 'DIVE_DISPLAY' | 'CHASING';

interface Hummingbird {
    index: number;
    group: THREE.Group;
    mixer: THREE.AnimationMixer | null;
    action: THREE.AnimationAction | null;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    acceleration: THREE.Vector3;
    targetPosition: THREE.Vector3;
    trackingTarget: 'leftHand' | 'rightHand' | 'head' | 'body';
    glowMeshes: THREE.Mesh[];

    // Behavioral state
    behavior: HummingbirdBehavior;
    behaviorTimer: number;
    phase: number;

    // Personality traits
    boldness: number;        // 0-1: how likely to approach vs flee
    curiosity: number;       // 0-1: how interested in hands
    territoriality: number;  // 0-1: how aggressive toward other birds

    // Physical properties
    maxSpeed: number;
    hoverSpeed: number;      // Speed when hovering (near zero)
    dartSpeed: number;       // Speed during rapid darts
    turnRate: number;

    // Hovering mechanics (figure-8 wing simulation)
    hoverPhase: number;
    hoverAmplitudeX: number;
    hoverAmplitudeY: number;
    hoverAmplitudeZ: number;
    hoverOffset: THREE.Vector3;  // Personal space offset from target

    // Head/neck tracking
    headLookTarget: THREE.Vector3;
    headRotation: { x: number; y: number };
    vigilanceTimer: number;  // Time until next head swivel
    neckBone: THREE.Object3D | null;  // Reference to neck bone for independent head movement
    headBone: THREE.Object3D | null;  // Reference to head bone
    neckRestRotation: THREE.Euler;    // Rest rotation to restore from

    // Startle state
    startleIntensity: number;
    fleeDirection: THREE.Vector3;

    // Territorial state
    territorialTarget: Hummingbird | null;
    chargeDirection: THREE.Vector3;

    // Smoothed rotations
    smoothedPitch: number;
    smoothedYaw: number;
    smoothedRoll: number;

    // Wing animation
    wingBeatPhase: number;
    targetWingSpeed: number;

    // Creature-to-creature interactions
    chaseTarget: Hummingbird | null;
    diveStartY: number;
}

// ========================================
// FISH TYPES
// ========================================

type FishBehavior = 'IDLE' | 'CURIOUS' | 'STARTLED' | 'SCHOOLING' | 'FEEDING' | 'TIGHT_SCHOOL' | 'FOLLOWING';

// Fish body segment for procedural animation
interface FishSegment {
    mesh: THREE.Mesh;
    baseRotation: number;  // Base rotation offset
    amplitude: number;     // Wave amplitude for this segment
    phaseOffset: number;   // Phase offset in the wave
}

interface Fish {
    index: number;
    group: THREE.Group;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    acceleration: THREE.Vector3;
    targetPosition: THREE.Vector3;
    trackingTarget: 'leftHand' | 'rightHand' | 'head' | 'body';

    // Body segments for undulation animation (anchor at head)
    segments: FishSegment[];
    tailFin: THREE.Mesh | null;
    dorsalFin: THREE.Mesh | null;
    pectoralFins: THREE.Mesh[];

    behavior: FishBehavior;
    behaviorTimer: number;
    phase: number;
    swimPhase: number;  // Phase for swimming undulation

    boldness: number;
    curiosity: number;
    schoolingStrength: number;

    maxSpeed: number;
    cruiseSpeed: number;
    turnRate: number;

    // Fish-specific colors
    bodyColor: THREE.Color;
    stripeColor: THREE.Color;

    startleIntensity: number;
    fleeDirection: THREE.Vector3;

    smoothedHeading: number;
    smoothedPitch: number;

    // Creature-to-creature interactions
    leader: Fish | null;
    tightSchoolTimer: number;
}

// ========================================
// BEE TYPES - Using actual 3D model
// ========================================

type BeeBehavior = 'FORAGING' | 'SWARMING' | 'HOVERING' | 'INVESTIGATING' | 'DEFENSIVE' | 'DANCING';

interface Bee {
    index: number;
    // 3D model group (cloned from bee.glb)
    group: THREE.Group;
    mixer: THREE.AnimationMixer | null;
    action: THREE.AnimationAction | null;

    // Position and physics
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    acceleration: THREE.Vector3;
    targetPosition: THREE.Vector3;
    trackingTarget: 'leftHand' | 'rightHand' | 'swarm';

    // Behavior
    behavior: BeeBehavior;
    behaviorTimer: number;
    phase: number;  // Individual phase offset

    // Personality
    boldness: number;
    curiosity: number;
    swarmAffinity: number;  // How much they stick to the swarm

    // Physics
    maxSpeed: number;
    cruiseSpeed: number;

    // Animation
    wingPhase: number;       // Wing beat phase
    bodyBobPhase: number;    // Body bobbing while flying
    zigzagPhase: number;     // Zigzag flight pattern

    // Rotation
    smoothedYaw: number;
    smoothedPitch: number;
    smoothedRoll: number;

    // Startle
    startleIntensity: number;
    fleeDirection: THREE.Vector3;

    // Dance (waggle dance when near hand)
    dancePhase: number;
    danceIntensity: number;

    // Creature-to-creature interactions
    recruitTarget: Bee | null;
}

// ========================================
// BUTTERFLY TYPES
// ========================================

type ButterflyBehavior = 'FLUTTERING' | 'GLIDING' | 'CURIOUS' | 'PERCHING' | 'STARTLED' | 'DRIFTING' | 'FOLLOWING_CHAIN' | 'SPIRAL_DANCE';

interface Butterfly {
    index: number;
    group: THREE.Group;
    mixer: THREE.AnimationMixer | null;
    action: THREE.AnimationAction | null;

    position: THREE.Vector3;
    velocity: THREE.Vector3;
    acceleration: THREE.Vector3;
    targetPosition: THREE.Vector3;
    trackingTarget: 'leftHand' | 'rightHand' | 'wander';

    behavior: ButterflyBehavior;
    behaviorTimer: number;
    phase: number;

    // Personality
    boldness: number;
    curiosity: number;
    restfulness: number;  // How likely to perch/rest

    // Physics
    maxSpeed: number;
    cruiseSpeed: number;

    // Animation
    wingPhase: number;
    wingSpeed: number;        // Current wing flap speed
    targetWingSpeed: number;  // Target wing speed (changes with behavior)
    glideTimer: number;       // Time remaining in glide phase
    flapAmplitude: number;    // Wing flap amplitude

    // Drift mechanics (butterflies float and drift)
    driftPhase: number;
    driftAmplitudeX: number;
    driftAmplitudeY: number;

    // Rotation
    smoothedYaw: number;
    smoothedPitch: number;
    smoothedRoll: number;

    // Startle
    startleIntensity: number;
    fleeDirection: THREE.Vector3;

    // Glow
    glowMeshes: THREE.Mesh[];

    // Creature-to-creature interactions
    chainLeader: Butterfly | null;
    spiralPartner: Butterfly | null;
    spiralPhase: number;
}

export class Creature3DRenderer {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private composer: EffectComposer;
    private hummingbirds: Hummingbird[] = [];
    private fish: Fish[] = [];
    private bees: Bee[] = [];
    private butterflies: Butterfly[] = [];
    private sharedBeeMaterials: Map<string, THREE.Material> = new Map();
    private sharedBeeGeometries: Map<string, THREE.BufferGeometry> = new Map();
    private birdModel: GLTF | null = null;
    private fishModel: GLTF | null = null;
    private beeModel: GLTF | null = null;
    private butterflyModel: GLTF | null = null;
    private clock = new THREE.Clock();
    private time = 0;
    private width: number;
    private height: number;
    private currentMode: CreatureMode = 'BIRDS';
    private creatureCount: number;

    // Bee count
    private readonly BEE_COUNT = 40;
    private frameCounter = 0;  // For alternating collision frames

    // Tracking
    private tracking: TrackingData = {
        leftHand: null, rightHand: null, head: null, bodyCenter: null, hasBody: false
    };

    // Smooth mode transitions
    private transitionState: 'idle' | 'exiting' | 'waiting' | 'entering' = 'idle';
    private transitionTimer = 0;
    private pendingMode: CreatureMode | null = null;
    private readonly TRANSITION_EXIT_DURATION = 1.5;
    private readonly TRANSITION_GAP_DURATION = 1.0;
    private readonly TRANSITION_ENTER_DURATION = 1.2;

    // Body detection state for dynamic spawning
    private prevHasBody = false;
    private prevHandCount = 0;
    private spawnCooldown = 0;

    // Previous hand positions for velocity detection
    private prevLeftHand: THREE.Vector3 | null = null;
    private prevRightHand: THREE.Vector3 | null = null;
    private handVelocityLeft = new THREE.Vector3();
    private handVelocityRight = new THREE.Vector3();

    // Hand indicators
    private handIndicators: { left: HTMLDivElement | null; right: HTMLDivElement | null } = {
        left: null, right: null
    };

    // Reusable temp vectors to avoid per-frame allocations
    private readonly _tmpVec1 = new THREE.Vector3();
    private readonly _tmpVec2 = new THREE.Vector3();
    private readonly _tmpVec3 = new THREE.Vector3();

    // ========================================
    // HUMMINGBIRD PHYSICS CONSTANTS
    // ========================================

    // Hovering mechanics - Based on biomechanics research:
    // - Hummingbird body oscillates only 1-2° per wingbeat (nearly imperceptible)
    // - Head stays perfectly stable via vestibulo-collic reflex
    // - Wing beat 40-50 Hz, figure-8 pattern
    private readonly HOVER_DRIFT_FREQUENCY = 0.8;   // Very slow drift (subtle)
    private readonly HOVER_VERTICAL_BOB = 0.02;     // Minimal vertical bob (1-2° = ~0.02 rad)

    // Flight speeds (relative units) - smoother, more controlled
    private readonly BIRD_HOVER_SPEED = 2.0;        // Gentle hovering movement
    private readonly BIRD_CRUISE_SPEED = 6;         // Smooth cruising
    private readonly BIRD_DART_SPEED = 15;          // Quick but controlled darting
    private readonly BIRD_MAX_SPEED = 25;           // Reasonable maximum

    // Acceleration - gentler for smoother motion
    private readonly BIRD_ACCELERATION = 25;        // Smooth acceleration
    private readonly BIRD_TURN_RATE = 4;            // Gradual turns

    // Behavioral triggers
    private readonly BIRD_CURIOSITY_RADIUS = 18;    // Distance to notice hands
    private readonly BIRD_STARTLE_THRESHOLD = 10;   // Hand velocity to startle
    private readonly BIRD_STARTLE_RADIUS = 8;       // Distance for startle
    private readonly BIRD_STARTLE_DURATION = 0.8;   // Quick recovery
    private readonly BIRD_TERRITORIAL_RADIUS = 5;   // Distance to trigger chase

    // ========================================
    // FISH PHYSICS CONSTANTS
    // ========================================

    private readonly SEPARATION_RADIUS = 5;
    private readonly ALIGNMENT_RADIUS = 8;
    private readonly SEPARATION_WEIGHT = 5.0;
    private readonly ALIGNMENT_WEIGHT = 1.5;
    private readonly COHESION_WEIGHT = 0.3;

    private readonly CURIOSITY_RADIUS = 15;

    private readonly STARTLE_THRESHOLD = 8;
    private readonly STARTLE_RADIUS = 12;
    private readonly STARTLE_DURATION = 1.5;
    private readonly FLEE_SPEED = 18;

    private readonly FISH_CRUISE_SPEED = 4;
    private readonly FISH_MAX_SPEED = 12;
    private readonly FISH_DRAG = 0.92;
    private readonly TURN_RATE = 3;

    // ========================================
    // BEE PHYSICS CONSTANTS
    // ========================================

    // Bee flight mechanics (based on research)
    // Wing beat: 220-250 Hz - too fast to animate, use blur effect
    private readonly BEE_WING_FREQUENCY = 40;    // Visual frequency (actual ~230Hz)
    private readonly BEE_HOVER_BOB = 0.08;       // Vertical bobbing amplitude
    private readonly BEE_ZIGZAG_AMPLITUDE = 0.3; // Side-to-side zigzag
    private readonly BEE_ZIGZAG_FREQUENCY = 3;   // Zigzag cycles per second

    // Flight speeds - bees are fast!
    private readonly BEE_CRUISE_SPEED = 12;      // Normal flight (doubled)
    private readonly BEE_MAX_SPEED = 28;         // Maximum speed (nearly doubled)

    // Swarm behavior
    private readonly BEE_SWARM_RADIUS = 8;       // Radius of swarm cohesion
    private readonly BEE_SEPARATION_RADIUS = 1.5; // Minimum distance between bees
    private readonly BEE_ALIGNMENT_WEIGHT = 1.5;
    private readonly BEE_COHESION_WEIGHT = 1.0;
    private readonly BEE_SEPARATION_WEIGHT = 2.0;

    // Behavioral triggers
    private readonly BEE_CURIOSITY_RADIUS = 12;  // Distance to notice hands
    private readonly BEE_STARTLE_THRESHOLD = 12; // Hand velocity to startle
    private readonly BEE_STARTLE_RADIUS = 6;     // Distance for startle
    private readonly BEE_STARTLE_DURATION = 0.6; // Quick recovery

    // Dance behavior (waggle dance)
    private readonly BEE_DANCE_RADIUS = 5;       // Distance from hand to start dancing
    private readonly BEE_DANCE_FREQUENCY = 8;    // Waggle frequency

    // ========================================
    // BUTTERFLY PHYSICS CONSTANTS
    // ========================================

    private readonly BUTTERFLY_COUNT = 15;

    // Wing mechanics - butterflies have rapid wing beats
    private readonly BUTTERFLY_WING_FREQUENCY = 10;    // ~10 Hz wing beat (real: 8-12 Hz)
    private readonly BUTTERFLY_FLAP_AMPLITUDE = 0.8;   // Wing flap visual amplitude

    // Flight speeds - butterflies are fast and erratic
    private readonly BUTTERFLY_CRUISE_SPEED = 3.5;     // Frantic cruising
    private readonly BUTTERFLY_MAX_SPEED = 8;          // Maximum speed (when startled)
    private readonly BUTTERFLY_DRIFT_SPEED = 2.5;      // Fast drifting

    // Drift mechanics - butterflies dart and zigzag
    private readonly BUTTERFLY_DRIFT_FREQUENCY = 0.5;  // Faster direction shifts
    private readonly BUTTERFLY_DRIFT_AMPLITUDE = 1.5;  // Stronger drift

    // Flap-pause rhythm - butterflies alternate flapping and gliding
    private readonly BUTTERFLY_FLAP_CYCLE = 0.8;       // Faster flap-pause cycle

    // Behavioral triggers
    private readonly BUTTERFLY_CURIOSITY_RADIUS = 14;  // Distance to notice hands
    private readonly BUTTERFLY_STARTLE_THRESHOLD = 4;   // Very sensitive to hand movement
    private readonly BUTTERFLY_STARTLE_RADIUS = 10;    // Large scatter radius
    private readonly BUTTERFLY_STARTLE_DURATION = 1.2; // Recovery time
    private readonly BUTTERFLY_SCATTER_THRESHOLD = 2;  // Even slower movement causes scatter
    private readonly BUTTERFLY_PERCH_RADIUS = 3;       // Distance to "land" on hand

    // Separation
    private readonly BUTTERFLY_SEPARATION_RADIUS = 4.0;
    private readonly BUTTERFLY_SEPARATION_WEIGHT = 2.5;

    constructor(container: HTMLElement, count: number = 5) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.creatureCount = count;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = null;

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
        this.camera.position.z = 30;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,  // Disable for better performance
            alpha: true,
            powerPreference: 'high-performance',
            precision: 'mediump'  // Use medium precision for better performance
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));  // Limit for performance
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        container.appendChild(this.renderer.domElement);

        // Post-processing with reduced resolution for performance
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width * 0.25, this.height * 0.25),  // Quarter resolution bloom for performance
            0.6, 0.4, 0.85  // Stronger glow, tighter radius, high threshold (selective bloom)
        );
        this.composer.addPass(bloomPass);

        // Lighting
        this.setupLights();
        this.createHandIndicators();

        // Load models
        this.loadModels();
    }

    private setupLights() {
        this.scene.add(new THREE.HemisphereLight(0x88ccff, 0x225588, 1.0));
        const sun = new THREE.DirectionalLight(0xffffff, 1.5);
        sun.position.set(5, 15, 10);
        this.scene.add(sun);
        const fill = new THREE.DirectionalLight(0x4488ff, 0.4);
        fill.position.set(-10, 0, -5);
        this.scene.add(fill);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    }

    private createHandIndicators() {
        this.handIndicators.left = document.createElement('div');
        this.handIndicators.left.style.cssText = `
            position: fixed; width: 6px; height: 6px; border-radius: 50%;
            background: #ff4444; pointer-events: none; z-index: 1000;
            display: none; transform: translate(-50%, -50%);
            box-shadow: 0 0 4px rgba(255, 68, 68, 0.6);
        `;
        document.body.appendChild(this.handIndicators.left);

        this.handIndicators.right = document.createElement('div');
        this.handIndicators.right.style.cssText = `
            position: fixed; width: 6px; height: 6px; border-radius: 50%;
            background: #4488ff; pointer-events: none; z-index: 1000;
            display: none; transform: translate(-50%, -50%);
            box-shadow: 0 0 4px rgba(68, 136, 255, 0.6);
        `;
        document.body.appendChild(this.handIndicators.right);
    }

    private async loadModels() {
        const loader = new GLTFLoader();

        try {
            this.birdModel = await loader.loadAsync('/models/hummingbird.glb');
            console.log('Bird model loaded!', this.birdModel.animations.length, 'animations');

            // Log all animation clip names and durations
            this.birdModel.animations.forEach((clip, i) => {
                console.log(`  Animation ${i}: "${clip.name}" duration=${clip.duration.toFixed(3)}s tracks=${clip.tracks.length}`);
            });

            // Log model dimensions to help with scaling
            const box = new THREE.Box3().setFromObject(this.birdModel.scene);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            console.log('Bird model dimensions:', size.x.toFixed(2), 'x', size.y.toFixed(2), 'x', size.z.toFixed(2));
            console.log('Bird model center:', center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2));

            // Log bone structure
            console.log('Bird model bone/mesh structure:');
            this.birdModel.scene.traverse((child: THREE.Object3D) => {
                if (child.type === 'Bone' || child.type === 'SkinnedMesh') {
                    console.log(`  ${child.type}: "${child.name}"`);
                }
            });
        } catch (e) {
            console.error('Failed to load bird model:', e);
            this.birdModel = null;  // Ensure fallback is used
        }

        try {
            this.fishModel = await loader.loadAsync('/models/fish.glb');
            console.log('Fish model loaded!', this.fishModel.animations.length, 'animations');
        } catch (e) {
            console.error('Failed to load fish model:', e);
        }

        try {
            this.beeModel = await loader.loadAsync('/models/bee.glb');
            console.log('Bee model loaded!', this.beeModel.animations.length, 'animations');
        } catch (e) {
            console.error('Failed to load bee model:', e);
        }

        try {
            this.butterflyModel = await loader.loadAsync('/models/Butterfly/ulysses_butterfly.glb');
            console.log('Butterfly model loaded!', this.butterflyModel.animations.length, 'animations');

            const box = new THREE.Box3().setFromObject(this.butterflyModel.scene);
            const size = box.getSize(new THREE.Vector3());
            console.log('Butterfly model dimensions:', size.x.toFixed(2), 'x', size.y.toFixed(2), 'x', size.z.toFixed(2));

            this.butterflyModel.scene.traverse((child: THREE.Object3D) => {
                if (child.type === 'Bone' || child.type === 'SkinnedMesh') {
                    console.log(`  Butterfly ${child.type}: "${child.name}"`);
                }
            });
        } catch (e) {
            console.error('Failed to load butterfly model:', e);
        }

        this.createCreatures();
    }

    private disposeGroup(group: THREE.Group) {
        group.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
                obj.geometry?.dispose();
                const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                for (const mat of mats) {
                    if (!mat) continue;
                    // Dispose textures
                    for (const key of Object.keys(mat)) {
                        const val = (mat as Record<string, unknown>)[key];
                        if (val instanceof THREE.Texture) {
                            val.dispose();
                        }
                    }
                    mat.dispose();
                }
            }
        });
    }

    private clearCreatures() {
        this.hummingbirds.forEach(bird => {
            bird.action?.stop();
            bird.mixer?.stopAllAction();
            bird.mixer?.uncacheRoot(bird.group);
            this.scene.remove(bird.group);
            this.disposeGroup(bird.group);
        });
        this.hummingbirds = [];

        this.fish.forEach(f => {
            this.scene.remove(f.group);
            this.disposeGroup(f.group);
        });
        this.fish = [];

        this.bees.forEach(bee => {
            bee.action?.stop();
            bee.mixer?.stopAllAction();
            bee.mixer?.uncacheRoot(bee.group);
            this.scene.remove(bee.group);
            this.disposeGroup(bee.group);
        });
        this.bees = [];
        this.sharedBeeMaterials.clear();
        this.sharedBeeGeometries.clear();

        this.butterflies.forEach(b => {
            b.action?.stop();
            b.mixer?.stopAllAction();
            b.mixer?.uncacheRoot(b.group);
            this.scene.remove(b.group);
            this.disposeGroup(b.group);
        });
        this.butterflies = [];
    }

    private createCreatures() {
        this.clearCreatures();

        if (this.currentMode === 'BIRDS') {
            this.createHummingbirds();
        } else if (this.currentMode === 'FISH') {
            this.createFish();
        } else if (this.currentMode === 'BEES') {
            this.createBees();
        } else if (this.currentMode === 'BUTTERFLIES') {
            this.createButterflies();
        }
    }

    // ========================================
    // HUMMINGBIRD CREATION
    // ========================================

    private createHummingbirds() {
        if (!this.birdModel) {
            console.log('No bird model loaded, using fallback');
            this.createFallbackBirds();
            return;
        }

        console.log('Creating hummingbirds from loaded model');
        const targets: Hummingbird['trackingTarget'][] = ['leftHand', 'leftHand', 'rightHand', 'rightHand', 'body'];

        for (let i = 0; i < this.creatureCount; i++) {
            const cloned = SkeletonUtils.clone(this.birdModel.scene);
            const group = new THREE.Group();
            group.add(cloned);

            // Auto-scale based on model bounding box
            const box = new THREE.Box3().setFromObject(cloned);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            // Target size: 2.5-3.5 units for visible, prominent hummingbirds
            const targetSize = 2.5 + Math.random() * 1.0;
            const scale = targetSize / maxDim;
            group.scale.setScalar(scale);
            console.log(`Bird ${i}: model max dim=${maxDim.toFixed(2)}, scale=${scale.toFixed(4)}`);

            // Fix model orientation for Sketchfab rufous hummingbird export
            // Screenshot shows birds flying backwards - model already faces -Z
            // Remove the 180° rotation so beak points forward (into movement direction)
            cloned.rotation.set(0, 0, 0);  // No base rotation needed

            // Create animation mixer on the cloned object
            const mixer = new THREE.AnimationMixer(cloned);
            let action: THREE.AnimationAction | null = null;

            if (this.birdModel.animations.length > 0) {
                // Clone the animation clip for this instance to avoid conflicts
                const originalClip = this.birdModel.animations[0];

                // Log animation info for first bird
                if (i === 0) {
                    console.log(`Original animation: "${originalClip.name}" duration=${originalClip.duration.toFixed(3)}s tracks=${originalClip.tracks.length}`);
                }

                // Create action from the clip
                action = mixer.clipAction(originalClip);
                action.setLoop(THREE.LoopRepeat, Infinity);
                action.clampWhenFinished = false;
                action.enabled = true;
                action.play();

                // Calculate timeScale for realistic wing beats
                // If clip duration is 1s and we want 50Hz, timeScale = 50
                // But hummingbird wing animation is typically one flap cycle
                // Real hummingbirds: 40-80 Hz wing beats
                const targetHz = 40 + Math.random() * 25; // 40-65 Hz
                // For very short animations, use reasonable timeScale
                const baseTimeScale = originalClip.duration > 0.1
                    ? targetHz * originalClip.duration
                    : targetHz / 10;  // For short clips, scale differently

                action.timeScale = Math.max(1, Math.min(baseTimeScale, 100)); // Clamp to reasonable range

                if (i === 0) {
                    console.log(`Wing animation: targetHz=${targetHz.toFixed(0)}, timeScale=${action.timeScale.toFixed(1)}`);
                }
            } else {
                console.warn('No animations found in bird model!');
            }

            // Find neck/head bones and setup materials
            const glowMeshes: THREE.Mesh[] = [];
            const boneRefs: { neck: THREE.Object3D | null; head: THREE.Object3D | null } = { neck: null, head: null };

            // Log bone structure for first bird only
            if (i === 0) {
                console.log('Hummingbird bone structure:');
                cloned.traverse((child: THREE.Object3D) => {
                    if (child.type === 'Bone' || child.name) {
                        console.log(`  ${child.type}: ${child.name}`);
                    }
                });
            }

            cloned.traverse((child: THREE.Object3D) => {
                // Look for neck/head bones by common naming conventions
                const nameLower = child.name.toLowerCase();
                // Extended bone name patterns for different rigging conventions
                if (nameLower.includes('neck') || nameLower.includes('hals') ||
                    nameLower.includes('spine2') || nameLower.includes('spine.002') ||
                    nameLower.includes('spine_02') || nameLower.includes('upperchest')) {
                    boneRefs.neck = child;
                }
                if ((nameLower.includes('head') || nameLower.includes('kopf') || nameLower.includes('skull'))
                    && !nameLower.includes('headtop')) {
                    boneRefs.head = child;
                }

                if (child instanceof THREE.Mesh) {
                    // Keep original materials from the detailed rufous hummingbird model
                    // Just add slight emissive for glow effect
                    const mat = child.material as THREE.MeshStandardMaterial;
                    if (mat && mat.emissive) {
                        mat.emissive = new THREE.Color(0x442200);  // Warm rufous glow
                        mat.emissiveIntensity = 0.25;
                    }
                    glowMeshes.push(child);
                }
            });

            // Store rest rotation for neck bone
            const neckRestRotation = boneRefs.neck ? boneRefs.neck.rotation.clone() : new THREE.Euler();

            // Random starting position
            const startPos = new THREE.Vector3(
                (Math.random() - 0.5) * 25,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 8
            );
            group.position.copy(startPos);
            this.scene.add(group);

            // Unique personality
            const boldness = 0.4 + Math.random() * 0.6;
            const curiosity = 0.5 + Math.random() * 0.5;
            const territoriality = 0.3 + Math.random() * 0.7;

            this.hummingbirds.push({
                index: i, group, mixer, action,
                position: startPos.clone(),
                velocity: new THREE.Vector3(),
                acceleration: new THREE.Vector3(),
                targetPosition: startPos.clone(),
                trackingTarget: targets[i % targets.length],
                glowMeshes,

                behavior: 'HOVERING',
                behaviorTimer: 1 + Math.random() * 2,
                phase: Math.random() * Math.PI * 2,

                boldness,
                curiosity,
                territoriality,

                maxSpeed: this.BIRD_MAX_SPEED * (0.9 + Math.random() * 0.2),
                hoverSpeed: this.BIRD_HOVER_SPEED,
                dartSpeed: this.BIRD_DART_SPEED * (0.9 + Math.random() * 0.2),
                turnRate: this.BIRD_TURN_RATE * (0.8 + Math.random() * 0.4),

                hoverPhase: Math.random() * Math.PI * 2,
                // Minimal hover motion - real hummingbirds appear almost stationary
                hoverAmplitudeX: 0.02 + Math.random() * 0.01,
                hoverAmplitudeY: 0.015 + Math.random() * 0.008,
                hoverAmplitudeZ: 0.01 + Math.random() * 0.005,
                // Arrange birds in a tight circle very close to the marker
                hoverOffset: new THREE.Vector3(
                    Math.cos((i / this.creatureCount) * Math.PI * 2) * 1.5,  // Larger orbit
                    Math.sin((i / this.creatureCount) * Math.PI * 2) * 1.2,  // Ellipse
                    (i % 2 === 0 ? 0.3 : -0.3)  // More depth variation
                ),

                headLookTarget: new THREE.Vector3(),
                headRotation: { x: 0, y: 0 },
                vigilanceTimer: Math.random() * 2,
                neckBone: boneRefs.neck,
                headBone: boneRefs.head,
                neckRestRotation,

                startleIntensity: 0,
                fleeDirection: new THREE.Vector3(),

                territorialTarget: null,
                chargeDirection: new THREE.Vector3(),

                smoothedPitch: 0,
                smoothedYaw: 0,
                smoothedRoll: 0,

                wingBeatPhase: Math.random() * Math.PI * 2,
                targetWingSpeed: 25,  // Much faster wing beats (hummingbirds: 50-80 Hz)

                chaseTarget: null,
                diveStartY: 0
            });
        }
        console.log(`Created ${this.hummingbirds.length} hummingbirds with individual personalities`);
    }

    private createFallbackBirds() {
        console.log('Creating fallback birds (procedural)');
        const targets: Hummingbird['trackingTarget'][] = ['leftHand', 'leftHand', 'rightHand', 'rightHand', 'body'];

        // Vibrant hummingbird colors
        const colors = [0x00ff88, 0xff6600, 0x00ccff, 0xff00aa, 0xffcc00];

        for (let i = 0; i < this.creatureCount; i++) {
            const group = new THREE.Group();
            const color = colors[i % colors.length];

            // Larger, more visible bird body (2.5-3.5 unit scale)
            const bodyGeo = new THREE.ConeGeometry(0.8, 2.4, 8);
            const bodyMat = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.5,
                roughness: 0.2,
                emissive: color,
                emissiveIntensity: 0.3
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.rotation.x = Math.PI / 2;
            group.add(body);

            // Add wings (proportionally larger)
            const wingGeo = new THREE.PlaneGeometry(1.6, 0.6);
            const wingMat = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.3,
                roughness: 0.4,
                emissive: color,
                emissiveIntensity: 0.2,
                side: THREE.DoubleSide
            });
            const leftWing = new THREE.Mesh(wingGeo, wingMat);
            leftWing.position.set(-1.0, 0, 0.4);
            leftWing.rotation.z = 0.3;
            group.add(leftWing);

            const rightWing = new THREE.Mesh(wingGeo, wingMat);
            rightWing.position.set(1.0, 0, 0.4);
            rightWing.rotation.z = -0.3;
            group.add(rightWing);

            const startPos = new THREE.Vector3(
                (Math.random() - 0.5) * 25,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 8
            );
            group.position.copy(startPos);
            this.scene.add(group);

            const boldness = 0.4 + Math.random() * 0.6;
            const curiosity = 0.5 + Math.random() * 0.5;
            const territoriality = 0.3 + Math.random() * 0.7;

            this.hummingbirds.push({
                index: i, group, mixer: null, action: null,
                position: startPos.clone(),
                velocity: new THREE.Vector3(),
                acceleration: new THREE.Vector3(),
                targetPosition: startPos.clone(),
                trackingTarget: targets[i % targets.length],
                glowMeshes: [body, leftWing, rightWing],

                behavior: 'HOVERING',
                behaviorTimer: 1 + Math.random() * 2,
                phase: Math.random() * Math.PI * 2,

                boldness, curiosity, territoriality,

                maxSpeed: this.BIRD_MAX_SPEED * (0.9 + Math.random() * 0.2),
                hoverSpeed: this.BIRD_HOVER_SPEED,
                dartSpeed: this.BIRD_DART_SPEED * (0.9 + Math.random() * 0.2),
                turnRate: this.BIRD_TURN_RATE * (0.8 + Math.random() * 0.4),

                hoverPhase: Math.random() * Math.PI * 2,
                // Minimal hover motion - steady, controlled hovering
                hoverAmplitudeX: 0.03 + Math.random() * 0.02,
                hoverAmplitudeY: 0.02 + Math.random() * 0.01,
                hoverAmplitudeZ: 0.015 + Math.random() * 0.01,
                hoverOffset: new THREE.Vector3(
                    Math.cos((i / this.creatureCount) * Math.PI * 2) * 1.5,  // Orbiting offset
                    Math.sin((i / this.creatureCount) * Math.PI * 2) * 1.2,
                    (i % 2 === 0 ? 0.3 : -0.3)
                ),

                headLookTarget: new THREE.Vector3(),
                headRotation: { x: 0, y: 0 },
                vigilanceTimer: Math.random() * 2,
                neckBone: null,  // Fallback birds don't have bones
                headBone: null,
                neckRestRotation: new THREE.Euler(),

                startleIntensity: 0,
                fleeDirection: new THREE.Vector3(),

                territorialTarget: null,
                chargeDirection: new THREE.Vector3(),

                smoothedPitch: 0,
                smoothedYaw: 0,
                smoothedRoll: 0,

                wingBeatPhase: Math.random() * Math.PI * 2,
                targetWingSpeed: 25,  // Faster wing beats

                chaseTarget: null,
                diveStartY: 0
            });
        }
    }

    // ========================================
    // FISH CREATION - Procedural with body segments
    // ========================================

    // Fish color palettes (clownfish, blue tang, etc.)
    private readonly FISH_PALETTES = [
        { body: 0xff6600, stripe: 0xffffff },  // Clownfish orange
        { body: 0xff4400, stripe: 0xffffff },  // Clownfish red
        { body: 0x2288ff, stripe: 0xffff00 },  // Blue tang
        { body: 0xffcc00, stripe: 0x000000 },  // Yellow tang
        { body: 0x00ff88, stripe: 0x004422 },  // Green chromis
    ];

    private createFish() {
        // Always use procedural fish for proper control
        this.createProceduralFish();
    }

    private createProceduralFish() {
        const targets: Fish['trackingTarget'][] = ['leftHand', 'leftHand', 'rightHand', 'rightHand', 'body'];

        // More fish for richer schooling behavior
        const fishCount = 20;

        for (let i = 0; i < fishCount; i++) {
            // Main group - anchor point is at the HEAD (front of fish)
            const group = new THREE.Group();

            // Choose a color palette
            const palette = this.FISH_PALETTES[i % this.FISH_PALETTES.length];
            const bodyColor = new THREE.Color(palette.body);
            const stripeColor = new THREE.Color(palette.stripe);

            // Fish scale - smaller fish
            const scale = 0.5 + Math.random() * 0.3;

            // Create body segments (from head to tail)
            // Each segment is a child of the previous, creating a chain
            const segments: FishSegment[] = [];
            const segmentCount = 5;
            let parentGroup: THREE.Group = group;

            for (let s = 0; s < segmentCount; s++) {
                const segmentGroup = new THREE.Group();

                // Segment sizes decrease toward tail
                const segmentScale = 1 - (s * 0.15);
                const width = 0.4 * segmentScale * scale;
                const height = 0.6 * segmentScale * scale;
                const depth = 0.5 * scale;

                // Create segment mesh (ellipsoid shape)
                const geo = new THREE.SphereGeometry(1, 12, 8);
                geo.scale(width, height, depth);

                // Alternate colors for stripes
                const isStripe = s === 1 || s === 3;
                const mat = new THREE.MeshStandardMaterial({
                    color: isStripe ? stripeColor : bodyColor,
                    metalness: 0.3,
                    roughness: 0.4,
                    emissive: isStripe ? stripeColor : bodyColor,
                    emissiveIntensity: 0.25
                });

                const mesh = new THREE.Mesh(geo, mat);
                segmentGroup.add(mesh);

                // Position segment relative to parent
                // First segment (head) is at origin, others are offset backward
                // Segments OVERLAP for smooth body appearance
                if (s > 0) {
                    segmentGroup.position.z = depth * 0.35;  // Overlap segments (was 0.8)
                }

                parentGroup.add(segmentGroup);

                segments.push({
                    mesh,
                    baseRotation: 0,
                    amplitude: 0.1 + (s * 0.08),  // Amplitude increases toward tail
                    phaseOffset: s * 0.4  // Phase delay for wave propagation
                });

                parentGroup = segmentGroup;
            }

            // Add tail fin (attached to last segment)
            const tailGeo = new THREE.ConeGeometry(0.3 * scale, 0.8 * scale, 4);
            tailGeo.rotateX(Math.PI / 2);
            const tailMat = new THREE.MeshStandardMaterial({
                color: bodyColor,
                metalness: 0.2,
                roughness: 0.5,
                emissive: bodyColor,
                emissiveIntensity: 0.2,
                side: THREE.DoubleSide
            });
            const tailFin = new THREE.Mesh(tailGeo, tailMat);
            tailFin.position.z = 0.2 * scale;  // Closer to body with overlapping segments
            parentGroup.add(tailFin);

            // Add dorsal fin (on top of middle segment)
            const dorsalGeo = new THREE.ConeGeometry(0.15 * scale, 0.5 * scale, 4);
            dorsalGeo.rotateZ(Math.PI);
            const dorsalMat = new THREE.MeshStandardMaterial({
                color: bodyColor,
                metalness: 0.2,
                roughness: 0.5,
                emissive: bodyColor,
                emissiveIntensity: 0.08,
                side: THREE.DoubleSide
            });
            const dorsalFin = new THREE.Mesh(dorsalGeo, dorsalMat);
            dorsalFin.position.y = 0.5 * scale;
            dorsalFin.position.z = 0.5 * scale;
            group.add(dorsalFin);

            // Add pectoral fins (sides)
            const pectoralFins: THREE.Mesh[] = [];
            const pectoralGeo = new THREE.ConeGeometry(0.1 * scale, 0.3 * scale, 4);

            for (let side = -1; side <= 1; side += 2) {
                const pectoralMat = new THREE.MeshStandardMaterial({
                    color: bodyColor,
                    metalness: 0.2,
                    roughness: 0.5,
                    emissive: bodyColor,
                    emissiveIntensity: 0.08,
                    side: THREE.DoubleSide
                });
                const fin = new THREE.Mesh(pectoralGeo.clone(), pectoralMat);
                fin.position.x = side * 0.35 * scale;
                fin.position.z = 0.2 * scale;
                fin.rotation.z = side * Math.PI / 3;
                group.add(fin);
                pectoralFins.push(fin);
            }

            // Add eye (simple sphere on head)
            const eyeGeo = new THREE.SphereGeometry(0.08 * scale, 8, 8);
            const eyeMat = new THREE.MeshStandardMaterial({
                color: 0x111111,
                metalness: 0.8,
                roughness: 0.2
            });
            for (let side = -1; side <= 1; side += 2) {
                const eye = new THREE.Mesh(eyeGeo, eyeMat);
                eye.position.x = side * 0.2 * scale;
                eye.position.y = 0.15 * scale;
                eye.position.z = -0.2 * scale;
                group.add(eye);
            }

            // Starting position
            const startPos = new THREE.Vector3(
                (Math.random() - 0.5) * 25,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 8
            );
            group.position.copy(startPos);
            this.scene.add(group);

            // Initial velocity
            const initialVel = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 1,
                (Math.random() - 0.5) * 1
            ).normalize().multiplyScalar(this.FISH_CRUISE_SPEED * 0.5);

            // Personality traits
            const boldness = 0.3 + Math.random() * 0.7;
            const curiosity = 0.4 + Math.random() * 0.6;
            const schoolingStrength = 0.5 + Math.random() * 0.5;

            this.fish.push({
                index: i, group,
                position: startPos.clone(),
                velocity: initialVel,
                acceleration: new THREE.Vector3(),
                targetPosition: startPos.clone(),
                trackingTarget: targets[i % targets.length],

                segments,
                tailFin,
                dorsalFin,
                pectoralFins,

                behavior: 'IDLE',
                behaviorTimer: Math.random() * 3,
                phase: Math.random() * Math.PI * 2,
                swimPhase: Math.random() * Math.PI * 2,

                boldness, curiosity, schoolingStrength,

                maxSpeed: this.FISH_MAX_SPEED * (0.8 + Math.random() * 0.4),
                cruiseSpeed: this.FISH_CRUISE_SPEED * (0.8 + Math.random() * 0.4),
                turnRate: this.TURN_RATE * (0.8 + Math.random() * 0.4),

                bodyColor,
                stripeColor,

                startleIntensity: 0,
                fleeDirection: new THREE.Vector3(),

                smoothedHeading: Math.atan2(initialVel.x, -initialVel.z),
                smoothedPitch: 0,

                leader: null,
                tightSchoolTimer: 0
            });
        }
        console.log(`Created ${this.fish.length} procedural fish with body segments`);
    }

    // ========================================
    // BEE CREATION - Using actual 3D model from bee.glb
    // ========================================

    private createBees() {
        if (!this.beeModel) {
            console.warn('Bee model not loaded, creating fallback bees');
            this.createFallbackBees();
            return;
        }

        const count = this.BEE_COUNT;
        const targets: Bee['trackingTarget'][] = ['leftHand', 'rightHand', 'swarm'];

        this.sharedBeeMaterials.clear();

        for (let i = 0; i < count; i++) {
            // Clone the bee model
            const cloned = SkeletonUtils.clone(this.beeModel.scene);
            const group = new THREE.Group();
            group.add(cloned);

            // Share materials and geometries across bee clones to reduce draw calls and memory
            if (i === 0) {
                // First clone: collect materials and geometries
                cloned.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh;
                        const mat = mesh.material as THREE.Material;
                        if (mat.name) {
                            this.sharedBeeMaterials.set(mat.name, mat);
                        }
                        if (mesh.geometry && mesh.name) {
                            this.sharedBeeGeometries.set(mesh.name, mesh.geometry);
                        }
                    }
                });
            } else {
                // Subsequent clones: reuse shared materials and geometries
                cloned.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh;
                        const mat = mesh.material as THREE.Material;
                        if (mat.name && this.sharedBeeMaterials.has(mat.name)) {
                            mesh.material = this.sharedBeeMaterials.get(mat.name)!;
                        }
                        if (mesh.name && this.sharedBeeGeometries.has(mesh.name)) {
                            mesh.geometry = this.sharedBeeGeometries.get(mesh.name)!;
                        }
                    }
                });
            }

            // Scale the bee (adjust as needed based on model size)
            const scale = 0.8 + Math.random() * 0.4;
            group.scale.setScalar(scale);

            // Setup animation mixer
            const mixer = new THREE.AnimationMixer(cloned);
            let action: THREE.AnimationAction | null = null;
            if (this.beeModel.animations.length > 0) {
                action = mixer.clipAction(this.beeModel.animations[0]);
                action.play();
                action.timeScale = 2 + Math.random();  // Varied wing speed
            }

            // Random starting position
            const startPos = new THREE.Vector3(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 6
            );
            group.position.copy(startPos);
            this.scene.add(group);

            // Random initial velocity
            const initialVel = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 1,
                (Math.random() - 0.5) * 1
            ).normalize().multiplyScalar(this.BEE_CRUISE_SPEED * 0.3);

            // Personality
            const boldness = 0.3 + Math.random() * 0.7;
            const curiosity = 0.4 + Math.random() * 0.6;
            const swarmAffinity = 0.5 + Math.random() * 0.5;

            const bee: Bee = {
                index: i, group,
                mixer,
                action,

                position: startPos.clone(),
                velocity: initialVel,
                acceleration: new THREE.Vector3(),
                targetPosition: startPos.clone(),
                trackingTarget: targets[i % targets.length],

                behavior: 'SWARMING',
                behaviorTimer: Math.random() * 3,
                phase: Math.random() * Math.PI * 2,

                boldness,
                curiosity,
                swarmAffinity,

                maxSpeed: this.BEE_MAX_SPEED * (0.8 + Math.random() * 0.4),
                cruiseSpeed: this.BEE_CRUISE_SPEED * (0.8 + Math.random() * 0.4),

                wingPhase: Math.random() * Math.PI * 2,
                bodyBobPhase: Math.random() * Math.PI * 2,
                zigzagPhase: Math.random() * Math.PI * 2,

                smoothedYaw: 0,
                smoothedPitch: 0,
                smoothedRoll: 0,

                startleIntensity: 0,
                fleeDirection: new THREE.Vector3(),

                dancePhase: 0,
                danceIntensity: 0,

                recruitTarget: null
            };

            this.bees.push(bee);
        }

        console.log(`Created ${this.bees.length} bees using 3D model`);
    }

    private createFallbackBees() {
        // Fallback procedural bees if model fails to load
        const count = this.BEE_COUNT;
        const targets: Bee['trackingTarget'][] = ['leftHand', 'rightHand', 'swarm'];

        for (let i = 0; i < count; i++) {
            const group = new THREE.Group();

            // Simple bee body
            const bodyGeo = new THREE.SphereGeometry(0.3, 12, 8);
            bodyGeo.scale(1, 0.8, 1.4);
            const bodyMat = new THREE.MeshStandardMaterial({
                color: 0xFFCC00,
                metalness: 0.2,
                roughness: 0.6,
                emissive: 0xFFAA00,
                emissiveIntensity: 0.2
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            group.add(body);

            // Wings
            const wingGeo = new THREE.PlaneGeometry(0.4, 0.2);
            const wingMat = new THREE.MeshStandardMaterial({
                color: 0xCCDDFF,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            const leftWing = new THREE.Mesh(wingGeo, wingMat);
            leftWing.position.set(-0.2, 0.15, 0);
            leftWing.rotation.z = -0.3;
            group.add(leftWing);

            const rightWing = new THREE.Mesh(wingGeo.clone(), wingMat.clone());
            rightWing.position.set(0.2, 0.15, 0);
            rightWing.rotation.z = 0.3;
            group.add(rightWing);

            const startPos = new THREE.Vector3(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 6
            );
            group.position.copy(startPos);
            this.scene.add(group);

            const initialVel = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 1,
                (Math.random() - 0.5) * 1
            ).normalize().multiplyScalar(this.BEE_CRUISE_SPEED * 0.3);

            const bee: Bee = {
                index: i, group,
                mixer: null,
                action: null,

                position: startPos.clone(),
                velocity: initialVel,
                acceleration: new THREE.Vector3(),
                targetPosition: startPos.clone(),
                trackingTarget: targets[i % targets.length],

                behavior: 'SWARMING',
                behaviorTimer: Math.random() * 3,
                phase: Math.random() * Math.PI * 2,

                boldness: 0.3 + Math.random() * 0.7,
                curiosity: 0.4 + Math.random() * 0.6,
                swarmAffinity: 0.5 + Math.random() * 0.5,

                maxSpeed: this.BEE_MAX_SPEED * (0.8 + Math.random() * 0.4),
                cruiseSpeed: this.BEE_CRUISE_SPEED * (0.8 + Math.random() * 0.4),

                wingPhase: Math.random() * Math.PI * 2,
                bodyBobPhase: Math.random() * Math.PI * 2,
                zigzagPhase: Math.random() * Math.PI * 2,

                smoothedYaw: 0,
                smoothedPitch: 0,
                smoothedRoll: 0,

                startleIntensity: 0,
                fleeDirection: new THREE.Vector3(),

                dancePhase: 0,
                danceIntensity: 0,

                recruitTarget: null
            };

            this.bees.push(bee);
        }
        console.log(`Created ${this.bees.length} fallback procedural bees`);
    }

    // ========================================
    // BUTTERFLY CREATION
    // ========================================

    private createButterflies() {
        if (!this.butterflyModel) {
            console.warn('Butterfly model not loaded');
            return;
        }

        const count = this.BUTTERFLY_COUNT;
        const targets: Butterfly['trackingTarget'][] = ['leftHand', 'rightHand', 'wander'];

        for (let i = 0; i < count; i++) {
            const cloned = SkeletonUtils.clone(this.butterflyModel.scene);
            const group = new THREE.Group();
            group.add(cloned);

            // Auto-scale based on model bounding box
            const box = new THREE.Box3().setFromObject(cloned);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            // Target size: 2.0-3.5 units for visible butterflies
            const targetSize = 2.0 + Math.random() * 1.5;
            const scale = targetSize / maxDim;
            group.scale.setScalar(scale);

            // Fix model orientation - rotate 180° so butterfly faces forward
            cloned.rotation.set(0, Math.PI, 0);

            if (i === 0) {
                console.log(`Butterfly: model max dim=${maxDim.toFixed(2)}, scale=${scale.toFixed(4)}`);
            }

            // Setup animation mixer
            const mixer = new THREE.AnimationMixer(cloned);
            let action: THREE.AnimationAction | null = null;
            if (this.butterflyModel.animations.length > 0) {
                action = mixer.clipAction(this.butterflyModel.animations[0]);
                action.setLoop(THREE.LoopRepeat, Infinity);
                action.play();
                // Butterflies flap slowly: 5-12 Hz
                const targetHz = 5 + Math.random() * 7;
                const clip = this.butterflyModel.animations[0];
                const baseTimeScale = clip.duration > 0.1
                    ? targetHz * clip.duration
                    : targetHz / 5;
                action.timeScale = Math.max(0.5, Math.min(baseTimeScale, 20));

                if (i === 0) {
                    console.log(`Butterfly wing animation: targetHz=${targetHz.toFixed(0)}, timeScale=${action.timeScale.toFixed(1)}`);
                }
            }

            // Apply emissive glow for iridescent butterfly look
            const glowMeshes: THREE.Mesh[] = [];
            cloned.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh) {
                    if (child.material) {
                        const mat = (child.material as THREE.MeshStandardMaterial);
                        if (mat.emissive) {
                            mat.emissive.set(0x1144aa);  // Blue iridescent glow
                            mat.emissiveIntensity = 0.3;
                        }
                    }
                    glowMeshes.push(child);
                }
            });

            // Random starting position - spread out
            const startPos = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 14,
                (Math.random() - 0.5) * 6
            );
            group.position.copy(startPos);
            this.scene.add(group);

            // Gentle initial velocity
            const initialVel = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 1,
                (Math.random() - 0.5) * 0.5
            ).normalize().multiplyScalar(this.BUTTERFLY_DRIFT_SPEED);

            const boldness = 0.3 + Math.random() * 0.7;
            const curiosity = 0.4 + Math.random() * 0.6;
            const restfulness = 0.2 + Math.random() * 0.6;

            const butterfly: Butterfly = {
                index: i, group,
                mixer,
                action,

                position: startPos.clone(),
                velocity: initialVel,
                acceleration: new THREE.Vector3(),
                targetPosition: startPos.clone(),
                trackingTarget: targets[i % targets.length],

                behavior: 'DRIFTING',
                behaviorTimer: Math.random() * 3,
                phase: Math.random() * Math.PI * 2,

                boldness,
                curiosity,
                restfulness,

                maxSpeed: this.BUTTERFLY_MAX_SPEED * (0.8 + Math.random() * 0.4),
                cruiseSpeed: this.BUTTERFLY_CRUISE_SPEED * (0.8 + Math.random() * 0.4),

                wingPhase: Math.random() * Math.PI * 2,
                wingSpeed: this.BUTTERFLY_WING_FREQUENCY,
                targetWingSpeed: this.BUTTERFLY_WING_FREQUENCY,
                glideTimer: 0,
                flapAmplitude: this.BUTTERFLY_FLAP_AMPLITUDE * (0.8 + Math.random() * 0.4),

                driftPhase: Math.random() * Math.PI * 2,
                driftAmplitudeX: this.BUTTERFLY_DRIFT_AMPLITUDE * (0.7 + Math.random() * 0.6),
                driftAmplitudeY: this.BUTTERFLY_DRIFT_AMPLITUDE * (0.5 + Math.random() * 0.5),

                smoothedYaw: 0,
                smoothedPitch: 0,
                smoothedRoll: 0,

                startleIntensity: 0,
                fleeDirection: new THREE.Vector3(),

                glowMeshes,

                chainLeader: null,
                spiralPartner: null,
                spiralPhase: Math.random() * Math.PI * 2
            };

            this.butterflies.push(butterfly);
        }

        console.log(`Created ${this.butterflies.length} butterflies using 3D model`);
    }

    // ========================================
    // TRACKING UPDATE
    // ========================================

    public updateTracking(data: TrackingData) {
        this.tracking = data;

        // Calculate hand velocities
        if (data.leftHand && data.leftHand.confidence > 0.3) {
            const newPos = this.screenTo3D(data.leftHand.x, data.leftHand.y);
            if (this.prevLeftHand) {
                this.handVelocityLeft.copy(newPos).sub(this.prevLeftHand);
            }
            this.prevLeftHand = newPos.clone();
        } else {
            this.prevLeftHand = null;
            this.handVelocityLeft.set(0, 0, 0);
        }

        if (data.rightHand && data.rightHand.confidence > 0.3) {
            const newPos = this.screenTo3D(data.rightHand.x, data.rightHand.y);
            if (this.prevRightHand) {
                this.handVelocityRight.copy(newPos).sub(this.prevRightHand);
            }
            this.prevRightHand = newPos.clone();
        } else {
            this.prevRightHand = null;
            this.handVelocityRight.set(0, 0, 0);
        }

        // Update indicators
        if (this.handIndicators.left) {
            if (data.leftHand && data.leftHand.confidence > 0.3) {
                this.handIndicators.left.style.display = 'block';
                this.handIndicators.left.style.left = `${data.leftHand.x}px`;
                this.handIndicators.left.style.top = `${data.leftHand.y}px`;
            } else {
                this.handIndicators.left.style.display = 'none';
            }
        }

        if (this.handIndicators.right) {
            if (data.rightHand && data.rightHand.confidence > 0.3) {
                this.handIndicators.right.style.display = 'block';
                this.handIndicators.right.style.left = `${data.rightHand.x}px`;
                this.handIndicators.right.style.top = `${data.rightHand.y}px`;
            } else {
                this.handIndicators.right.style.display = 'none';
            }
        }
    }

    public updateTarget(_x: number, _y: number, _hasTarget: boolean) {}

    /**
     * Dynamically distribute creatures between available hands
     * - If only one hand: all creatures follow that hand
     * - If two hands: split creatures evenly between hands
     * - Creatures smoothly transition to their new target
     */
    private distributeCreaturesToHands<T extends { trackingTarget: string }>(
        creatures: T[],
        leftHand: THREE.Vector3 | null,
        rightHand: THREE.Vector3 | null
    ) {
        const hasLeft = leftHand !== null;
        const hasRight = rightHand !== null;

        if (!hasLeft && !hasRight) {
            // No hands - keep current targets (will idle/wander)
            return;
        }

        if (hasLeft && hasRight) {
            // Both hands present - divide creatures between them
            const half = Math.ceil(creatures.length / 2);
            for (let i = 0; i < creatures.length; i++) {
                creatures[i].trackingTarget = i < half ? 'leftHand' : 'rightHand';
            }
        } else if (hasLeft) {
            // Only left hand - all creatures follow left
            for (const creature of creatures) {
                creature.trackingTarget = 'leftHand';
            }
        } else {
            // Only right hand - all creatures follow right
            for (const creature of creatures) {
                creature.trackingTarget = 'rightHand';
            }
        }
    }

    private screenTo3D(screenX: number, screenY: number): THREE.Vector3 {
        // Map screen coordinates to 3D world - expanded to cover full visible area
        // With camera at z=30, FOV=60, visible area is roughly ±35 horizontally, ±20 vertically
        const x = (screenX / this.width - 0.5) * 70;
        const y = -(screenY / this.height - 0.5) * 45;
        return new THREE.Vector3(x, y, 0);
    }

    // ========================================
    // MAIN UPDATE
    // ========================================

    public update(_dt: number) {
        const delta = Math.min(this.clock.getDelta(), 0.05);
        this.time += delta;
        this.frameCounter++;

        // Handle mode transition phases: exiting -> waiting (gap) -> entering
        if (this.transitionState === 'exiting') {
            this.transitionTimer += delta;
            if (this.transitionTimer >= this.TRANSITION_EXIT_DURATION) {
                // Exit phase complete - clear old creatures and start gap
                this.clearCreatures();
                this.transitionState = 'waiting';
                this.transitionTimer = 0;
            } else {
                // During exit: only apply physics so creatures fly out, skip behaviors
                this.updateTransitionPhysics(delta);
                this.composer.render();
                return;
            }
        }

        if (this.transitionState === 'waiting') {
            this.transitionTimer += delta;
            if (this.transitionTimer >= this.TRANSITION_GAP_DURATION) {
                // Gap complete - create new creatures at edges and start entering
                this.currentMode = this.pendingMode!;
                this.pendingMode = null;
                this.createCreatures();
                this.animateCreaturesFromEdges(true);
                this.transitionState = 'entering';
                this.transitionTimer = 0;
            } else {
                // During gap: render empty scene
                this.composer.render();
                return;
            }
        }

        if (this.transitionState === 'entering') {
            this.transitionTimer += delta;
            if (this.transitionTimer >= this.TRANSITION_ENTER_DURATION) {
                this.transitionState = 'idle';
                this.transitionTimer = 0;
            }
            // During entering: run normal updates so creatures fly in naturally
        }

        // Check for body/hand detection changes and handle dynamic spawning
        this.handleDynamicSpawning(delta);

        if (this.currentMode === 'FISH') {
            this.updateAllFish(delta);
        } else if (this.currentMode === 'BEES') {
            this.updateAllBees(delta);
        } else if (this.currentMode === 'BUTTERFLIES') {
            this.updateAllButterflies(delta);
        } else {
            this.updateAllHummingbirds(delta);
        }

        this.composer.render();
    }

    /**
     * Handle dynamic spawning when user enters/exits frame or changes hand count
     * - When body newly detected: creatures fly in from screen edges
     * - When hand count increases: more creatures come to greet
     */
    private handleDynamicSpawning(delta: number) {
        // Count current hands
        const currentHandCount =
            (this.tracking.leftHand?.confidence && this.tracking.leftHand.confidence > 0.3 ? 1 : 0) +
            (this.tracking.rightHand?.confidence && this.tracking.rightHand.confidence > 0.3 ? 1 : 0);
        const hasBody = this.tracking.hasBody || currentHandCount > 0;

        // Update cooldown
        if (this.spawnCooldown > 0) {
            this.spawnCooldown -= delta;
        }

        // Check for new body detection (user walked in)
        if (hasBody && !this.prevHasBody && this.spawnCooldown <= 0) {
            // User just appeared - animate creatures toward them from edges
            this.animateCreaturesFromEdges();
            this.spawnCooldown = 2.0; // Prevent rapid re-triggering
        }

        // Check for hand count increase
        if (currentHandCount > this.prevHandCount && this.spawnCooldown <= 0) {
            // More hands appeared - some creatures should react
            this.triggerCreatureReaction();
            this.spawnCooldown = 1.0;
        }

        // Update previous state
        this.prevHasBody = hasBody;
        this.prevHandCount = currentHandCount;
    }

    /**
     * Animate creatures flying in from screen edges.
     * If positionAtEdges is true, actually moves creatures to edge positions first
     * (used during mode transition so creatures enter from outside the screen).
     */
    private animateCreaturesFromEdges(positionAtEdges = false) {
        const edgePositions = [
            new THREE.Vector3(-20, 0, 0),   // Left edge
            new THREE.Vector3(20, 0, 0),    // Right edge
            new THREE.Vector3(0, 14, 0),    // Top edge
            new THREE.Vector3(0, -14, 0),   // Bottom edge
            new THREE.Vector3(-17, 10, -3), // Top-left
            new THREE.Vector3(17, 10, -3),  // Top-right
            new THREE.Vector3(-17, -10, -3),// Bottom-left
            new THREE.Vector3(17, -10, -3), // Bottom-right
        ];

        const placeAndLaunch = (
            creatures: Array<{ position: THREE.Vector3; velocity: THREE.Vector3; group: THREE.Group }>,
            inwardSpeed: number
        ) => {
            creatures.forEach((c, i) => {
                const edge = edgePositions[i % edgePositions.length];
                if (positionAtEdges) {
                    // Add some vertical/horizontal scatter so they don't all overlap
                    c.position.copy(edge);
                    c.position.x += (Math.random() - 0.5) * 3;
                    c.position.y += (Math.random() - 0.5) * 3;
                    c.position.z += (Math.random() - 0.5) * 2;
                    c.group.position.copy(c.position);
                }
                // Velocity toward center with some scatter
                c.velocity.copy(c.position).negate().normalize().multiplyScalar(inwardSpeed);
                c.velocity.x += (Math.random() - 0.5) * 1.0;
                c.velocity.y += (Math.random() - 0.5) * 1.0;
            });
        };

        if (this.currentMode === 'BIRDS') {
            placeAndLaunch(this.hummingbirds, 5);
        } else if (this.currentMode === 'FISH') {
            placeAndLaunch(this.fish, 4);
        } else if (this.currentMode === 'BEES') {
            placeAndLaunch(this.bees, 6);
        } else if (this.currentMode === 'BUTTERFLIES') {
            placeAndLaunch(this.butterflies, 2);
        }
    }

    /**
     * Trigger creature reaction when more hands appear
     */
    private triggerCreatureReaction() {
        // Make creatures more curious/active when new hand appears
        if (this.currentMode === 'BIRDS') {
            for (const bird of this.hummingbirds) {
                if (bird.behavior !== 'STARTLED') {
                    bird.behavior = 'CURIOUS';
                    bird.behaviorTimer = 2 + Math.random() * 2;
                }
            }
        } else if (this.currentMode === 'FISH') {
            for (const fish of this.fish) {
                if (fish.behavior !== 'STARTLED') {
                    fish.behavior = 'CURIOUS';
                    fish.behaviorTimer = 2 + Math.random() * 2;
                }
            }
        } else if (this.currentMode === 'BEES') {
            for (const bee of this.bees) {
                if (bee.behavior !== 'DEFENSIVE') {
                    bee.behavior = 'INVESTIGATING';
                    bee.behaviorTimer = 2 + Math.random() * 2;
                }
            }
        } else if (this.currentMode === 'BUTTERFLIES') {
            for (const b of this.butterflies) {
                if (b.behavior !== 'STARTLED') {
                    b.behavior = 'CURIOUS';
                    b.behaviorTimer = 2 + Math.random() * 3;
                }
            }
        }
    }

    /**
     * During exit transition, only apply velocity to move creatures off-screen.
     * Skip all behavior/hand-tracking logic.
     */
    private updateTransitionPhysics(delta: number) {
        const creatures = this.getCurrentCreatureArray();
        for (const c of creatures) {
            c.position.addScaledVector(c.velocity, delta);
            c.group.position.copy(c.position);
        }
        // Update animation mixers so wings still animate during exit
        for (const bird of this.hummingbirds) bird.mixer?.update(delta);
        for (const bee of this.bees) { bee.mixer?.update(delta); }
        for (const b of this.butterflies) { b.mixer?.update(delta); }
    }

    /**
     * Animate creatures flying toward screen edges for mode transition exit
     */
    private animateCreaturesToEdges() {
        const creatures = this.getCurrentCreatureArray();
        for (const c of creatures) {
            // Find nearest edge direction and send creature toward it
            const pos = c.position;
            let edgeX = pos.x > 0 ? 25 : -25;
            let edgeY = pos.y > 0 ? 18 : -18;
            // Pick whichever edge is closer
            const dx = Math.abs(edgeX - pos.x);
            const dy = Math.abs(edgeY - pos.y);
            const target = dx < dy
                ? new THREE.Vector3(edgeX, pos.y * 0.5, pos.z)
                : new THREE.Vector3(pos.x * 0.5, edgeY, pos.z);
            c.velocity.copy(target).sub(pos).normalize().multiplyScalar(12);
        }
    }

    private getCurrentCreatureArray(): Array<{ position: THREE.Vector3; velocity: THREE.Vector3; group: THREE.Group }> {
        switch (this.currentMode) {
            case 'BIRDS': return this.hummingbirds;
            case 'FISH': return this.fish;
            case 'BEES': return this.bees;
            case 'BUTTERFLIES': return this.butterflies;
        }
    }


    // ========================================
    // CREATURE-TO-CREATURE INTERACTIONS
    // ========================================

    private updateBirdInteractions(delta: number) {
        for (const bird of this.hummingbirds) {
            // Skip if in hand-driven behavior
            if (bird.behavior === 'CURIOUS' || bird.behavior === 'FEEDING' || bird.behavior === 'STARTLED') continue;

            // Clean up invalid targets
            if (bird.chaseTarget && !this.hummingbirds.includes(bird.chaseTarget)) {
                bird.chaseTarget = null;
                if (bird.behavior === 'CHASING' || bird.behavior === 'DIVE_DISPLAY') {
                    bird.behavior = 'HOVERING';
                    bird.behaviorTimer = 1;
                }
            }

            if (bird.behavior === 'TERRITORIAL' && bird.territoriality > 0.6) {
                // Look for nearby birds to interact with
                for (const other of this.hummingbirds) {
                    if (other === bird || other.behavior === 'STARTLED') continue;
                    const distSq = bird.position.distanceToSquared(other.position);

                    // Dive display: rise above and dive past
                    if (distSq < 36 && Math.random() < 0.05 * delta) {
                        bird.behavior = 'DIVE_DISPLAY';
                        bird.chaseTarget = other;
                        bird.diveStartY = bird.position.y + 5;
                        bird.behaviorTimer = 2.0;
                        break;
                    }

                    // Mutual chase: both territorial birds circle each other
                    if (distSq < 16 && other.behavior === 'TERRITORIAL' && other.territoriality > 0.6 && Math.random() < 0.03 * delta) {
                        bird.behavior = 'CHASING';
                        bird.chaseTarget = other;
                        bird.behaviorTimer = 2.5;
                        other.behavior = 'CHASING';
                        other.chaseTarget = bird;
                        other.behaviorTimer = 2.5;
                        break;
                    }
                }
            }
        }
    }

    private updateFishInteractions(delta: number) {
        // Check if any fish is startled -> trigger tight schooling
        const anyStartled = this.fish.some(f => f.behavior === 'STARTLED');
        if (anyStartled) {
            for (const fish of this.fish) {
                if (fish.behavior !== 'STARTLED' && fish.behavior !== 'TIGHT_SCHOOL') {
                    fish.behavior = 'TIGHT_SCHOOL';
                    fish.tightSchoolTimer = 3.0;
                }
            }
        }

        // Decay tight school timers
        for (const fish of this.fish) {
            if (fish.behavior === 'TIGHT_SCHOOL') {
                fish.tightSchoolTimer -= delta;
                if (fish.tightSchoolTimer <= 0) {
                    fish.behavior = 'SCHOOLING';
                    fish.behaviorTimer = 2 + Math.random() * 3;
                }
            }
        }

        // Leader-follower: highest boldness fish becomes leader
        if (this.fish.length > 1) {
            let leaderFish = this.fish[0];
            for (const f of this.fish) {
                if (f.boldness > leaderFish.boldness) leaderFish = f;
            }
            for (const fish of this.fish) {
                fish.leader = (fish === leaderFish) ? null : leaderFish;
                if (fish.leader && fish.behavior === 'IDLE' && Math.random() < 0.02 * delta) {
                    fish.behavior = 'FOLLOWING';
                    fish.behaviorTimer = 3 + Math.random() * 3;
                }
            }
        }
    }

    private updateBeeInteractions(delta: number) {
        // Recruitment dance: dancing bees attract nearby bees
        for (const bee of this.bees) {
            if (bee.behavior === 'DANCING') {
                for (const other of this.bees) {
                    if (other === bee || other.behavior === 'DANCING' || other.behavior === 'DEFENSIVE') continue;
                    const distSq = bee.position.distanceToSquared(other.position);
                    if (distSq < 64 && Math.random() < 0.1 * delta) {
                        other.recruitTarget = bee;
                        other.behavior = 'INVESTIGATING';
                        other.behaviorTimer = 2 + Math.random() * 2;
                    }
                }
            }
            // Clean up recruit targets
            if (bee.recruitTarget && !this.bees.includes(bee.recruitTarget)) {
                bee.recruitTarget = null;
            }
        }
    }

    private updateButterflyInteractions(delta: number) {
        for (const b of this.butterflies) {
            // Skip if in hand-driven or startle behavior
            if (b.behavior === 'CURIOUS' || b.behavior === 'STARTLED' || b.behavior === 'PERCHING') continue;

            // Clean up invalid targets
            if (b.chainLeader && !this.butterflies.includes(b.chainLeader)) {
                b.chainLeader = null;
                if (b.behavior === 'FOLLOWING_CHAIN') { b.behavior = 'FLUTTERING'; b.behaviorTimer = 1; }
            }
            if (b.spiralPartner && !this.butterflies.includes(b.spiralPartner)) {
                b.spiralPartner = null;
                if (b.behavior === 'SPIRAL_DANCE') { b.behavior = 'FLUTTERING'; b.behaviorTimer = 1; }
            }

            // Follow-the-leader chain: butterflies follow the one with lower index
            if (b.behavior === 'FLUTTERING' && b.index > 0 && Math.random() < 0.015 * delta) {
                const leader = this.butterflies[b.index - 1];
                if (leader && leader.behavior !== 'STARTLED') {
                    b.chainLeader = leader;
                    b.behavior = 'FOLLOWING_CHAIN';
                    b.behaviorTimer = 4 + Math.random() * 3;
                }
            }

            // Paired spiral dance
            if (b.behavior === 'FLUTTERING') {
                for (const other of this.butterflies) {
                    if (other === b || other.index <= b.index) continue;
                    if (other.behavior !== 'FLUTTERING') continue;
                    const distSq = b.position.distanceToSquared(other.position);
                    if (distSq < 16 && Math.random() < 0.2 * delta) {
                        b.behavior = 'SPIRAL_DANCE';
                        b.spiralPartner = other;
                        b.spiralPhase = 0;
                        b.behaviorTimer = 3.0;
                        other.behavior = 'SPIRAL_DANCE';
                        other.spiralPartner = b;
                        other.spiralPhase = Math.PI;
                        other.behaviorTimer = 3.0;
                        break;
                    }
                }
            }
        }
    }

    // ========================================
    // HUMMINGBIRD UPDATE SYSTEM
    // ========================================

    private updateAllHummingbirds(delta: number) {
        // Get hand positions
        const leftHandPos = this.tracking.leftHand?.confidence && this.tracking.leftHand.confidence > 0.3
            ? this.screenTo3D(this.tracking.leftHand.x, this.tracking.leftHand.y)
            : null;
        const rightHandPos = this.tracking.rightHand?.confidence && this.tracking.rightHand.confidence > 0.3
            ? this.screenTo3D(this.tracking.rightHand.x, this.tracking.rightHand.y)
            : null;

        // Dynamically distribute creatures between available hands
        this.distributeCreaturesToHands(this.hummingbirds, leftHandPos, rightHandPos);

        // Check for fast hand movement
        const leftHandSpeed = this.handVelocityLeft.length() * 60;
        const rightHandSpeed = this.handVelocityRight.length() * 60;
        const isLeftHandFast = leftHandSpeed > this.BIRD_STARTLE_THRESHOLD;
        const isRightHandFast = rightHandSpeed > this.BIRD_STARTLE_THRESHOLD;

        this.updateBirdInteractions(delta);

        for (const bird of this.hummingbirds) {
            bird.mixer?.update(delta);

            // Update behavior state
            this.updateHummingbirdBehavior(bird, delta, leftHandPos, rightHandPos, isLeftHandFast, isRightHandFast);

            // Reset acceleration
            bird.acceleration.set(0, 0, 0);

            // Apply behavior-specific forces
            this.applyHummingbirdBehaviorForce(bird, leftHandPos, rightHandPos, delta);

            // Check territorial interactions with other birds
            this.checkTerritorialBehavior(bird);

            // Hand proximity evasion - birds avoid slow hands at close range
            this.applyHandProximityEvasion(bird, leftHandPos, rightHandPos);

            // Force-based separation from other birds
            this.applyBirdSeparation(bird);

            // Apply boundary forces
            this.applyBirdBoundaryForce(bird);

            // Apply physics
            this.applyHummingbirdPhysics(bird, delta);

            // Update rotation and body orientation
            this.updateHummingbirdRotation(bird, delta);

            // Update head tracking (vigilance)
            this.updateHeadTracking(bird, delta, leftHandPos, rightHandPos);

            // Update position
            bird.group.position.copy(bird.position);

            // Update glow
            this.updateBirdGlow(bird);

            // Update wing animation speed
            this.updateWingAnimation(bird);
        }

        // Birds use force-based separation - no position-based collision needed
    }

    private updateHummingbirdBehavior(
        bird: Hummingbird,
        delta: number,
        leftHand: THREE.Vector3 | null,
        rightHand: THREE.Vector3 | null,
        isLeftFast: boolean,
        isRightFast: boolean
    ) {
        bird.behaviorTimer -= delta;

        // Decay startle
        if (bird.startleIntensity > 0) {
            bird.startleIntensity -= delta / this.BIRD_STARTLE_DURATION;
            if (bird.startleIntensity <= 0) {
                bird.startleIntensity = 0;
                bird.behavior = 'RETURNING';
                bird.behaviorTimer = 0.5;
            }
        }

        // Get target hand
        const targetHand = bird.trackingTarget === 'leftHand' ? leftHand :
            bird.trackingTarget === 'rightHand' ? rightHand : null;
        const handIsFast = bird.trackingTarget === 'leftHand' ? isLeftFast : isRightFast;
        const handVel = bird.trackingTarget === 'leftHand' ? this.handVelocityLeft : this.handVelocityRight;

        // Check for startle
        if (targetHand && handIsFast && bird.behavior !== 'STARTLED') {
            const distToHand = bird.position.distanceTo(targetHand);
            if (distToHand < this.BIRD_STARTLE_RADIUS) {
                bird.behavior = 'STARTLED';
                bird.startleIntensity = 1.0;
                bird.behaviorTimer = this.BIRD_STARTLE_DURATION;

                // Flee opposite to hand velocity with some randomness
                bird.fleeDirection.copy(handVel).negate().normalize();
                bird.fleeDirection.x += (Math.random() - 0.5) * 0.6;
                bird.fleeDirection.y += (Math.random() - 0.5) * 0.4;
                bird.fleeDirection.z += (Math.random() - 0.5) * 0.3;
                bird.fleeDirection.normalize();

                // Shy birds flee harder
                bird.startleIntensity *= (2 - bird.boldness);

                // Quick chip call (speed up wing animation briefly)
                bird.targetWingSpeed = 35;
                return;
            }
        }

        // Expire creature-to-creature interaction behaviors
        if ((bird.behavior === 'DIVE_DISPLAY' || bird.behavior === 'CHASING') && bird.behaviorTimer <= 0) {
            bird.behavior = 'HOVERING';
            bird.chaseTarget = null;
            bird.behaviorTimer = 1 + Math.random();
        }

        // Behavior state machine
        if (bird.behavior !== 'STARTLED' && bird.behaviorTimer <= 0) {
            const rand = Math.random();

            if (targetHand) {
                const distToHand = bird.position.distanceTo(targetHand);

                if (distToHand < this.BIRD_CURIOSITY_RADIUS) {
                    // Hand is nearby - rufous hummingbirds are VERY curious
                    if (rand < bird.curiosity * bird.boldness * 0.9) {
                        // High chance to approach curiously - rufous are bold
                        bird.behavior = 'CURIOUS';
                        bird.behaviorTimer = 3 + Math.random() * 4;  // Longer curiosity
                    } else if (rand < 0.7) {
                        // Dart around excitedly
                        bird.behavior = 'DARTING';
                        bird.behaviorTimer = 0.2 + Math.random() * 0.4;
                    } else if (rand < 0.85) {
                        // Feed nearby (hover and examine)
                        bird.behavior = 'FEEDING';
                        bird.behaviorTimer = 1 + Math.random() * 1.5;
                    } else {
                        // Brief hover before next action
                        bird.behavior = 'HOVERING';
                        bird.behaviorTimer = 0.5 + Math.random() * 1;
                    }
                } else {
                    // Hand is far - investigate!
                    if (rand < 0.6 * bird.curiosity) {
                        // Fly toward to investigate
                        bird.behavior = 'CURIOUS';
                        bird.behaviorTimer = 2 + Math.random() * 3;
                    } else if (rand < 0.4) {
                        bird.behavior = 'HOVERING';
                        bird.behaviorTimer = 2 + Math.random() * 3;
                    } else if (rand < 0.7) {
                        bird.behavior = 'DARTING';
                        bird.behaviorTimer = 0.2 + Math.random() * 0.4;
                    } else {
                        bird.behavior = 'FEEDING';
                        bird.behaviorTimer = 2 + Math.random() * 3;
                    }
                }
            } else {
                // No hand detected
                if (rand < 0.5) {
                    bird.behavior = 'HOVERING';
                    bird.behaviorTimer = 2 + Math.random() * 4;
                } else if (rand < 0.8) {
                    bird.behavior = 'DARTING';
                    bird.behaviorTimer = 0.2 + Math.random() * 0.5;
                } else {
                    bird.behavior = 'FEEDING';
                    bird.behaviorTimer = 3 + Math.random() * 4;
                }
            }
        }
    }

    private applyHummingbirdBehaviorForce(
        bird: Hummingbird,
        leftHand: THREE.Vector3 | null,
        rightHand: THREE.Vector3 | null,
        delta: number
    ) {
        const targetHand = bird.trackingTarget === 'leftHand' ? leftHand :
            bird.trackingTarget === 'rightHand' ? rightHand : null;

        // Update hover phase for figure-8 motion
        bird.hoverPhase += delta * this.HOVER_DRIFT_FREQUENCY * Math.PI * 2;

        switch (bird.behavior) {
            case 'STARTLED': {
                // Rapid escape
                const fleeForce = bird.fleeDirection.clone().multiplyScalar(
                    this.BIRD_ACCELERATION * 2 * bird.startleIntensity
                );
                bird.acceleration.add(fleeForce);
                bird.targetWingSpeed = 30 + bird.startleIntensity * 10;
                break;
            }

            case 'CURIOUS': {
                // Use ANY available hand
                const activeHand = targetHand || leftHand || rightHand;

                if (activeHand) {
                    // Spread birds around the target - wide enough to avoid overlap
                    const birdIndex = bird.index;
                    const numBirds = this.hummingbirds.length;
                    const phi = (birdIndex / numBirds) * Math.PI * 2;
                    const spreadRadius = 6.0;

                    const spreadOffset = new THREE.Vector3(
                        Math.cos(phi) * spreadRadius,
                        ((birdIndex % 3) - 1) * 1.5,
                        Math.sin(phi) * spreadRadius * 0.5
                    );

                    const targetPos = activeHand.clone().add(spreadOffset);
                    const toTarget = targetPos.clone().sub(bird.position);
                    const dist = toTarget.length();

                    // Strong spring for snappy repositioning
                    const springStrength = dist > 5 ? 40 : 25;
                    bird.acceleration.add(toTarget.multiplyScalar(springStrength));

                    // Strong damping for critically-damped settling (no oscillation)
                    bird.acceleration.add(bird.velocity.clone().multiplyScalar(-10));

                    // Apply hover motion when close and settled
                    if (dist <= 3) {
                        this.applyHoverMotion(bird);
                    }

                    bird.targetWingSpeed = 30;
                } else {
                    bird.behavior = 'HOVERING';
                }
                break;
            }

            case 'FEEDING': {
                // Hover in place with slight forward tilt (feeding posture)
                this.applyHoverMotion(bird);

                // Add small random movements (examining flowers)
                bird.acceleration.x += Math.sin(this.time * 5 + bird.phase) * 0.3;
                bird.acceleration.y += Math.cos(this.time * 4 + bird.phase * 1.3) * 0.2;

                bird.targetWingSpeed = 26;
                break;
            }

            case 'DARTING': {
                // Quick, erratic darting movements - very bird-like
                if (bird.behaviorTimer > 0) {
                    // Multiple direction changes during dart
                    if (Math.random() < 0.15) {
                        // Sudden direction change
                        const dartDir = new THREE.Vector3(
                            (Math.random() - 0.5) * 2,
                            (Math.random() - 0.3) * 1.5,  // Slight upward bias
                            (Math.random() - 0.5) * 1
                        ).normalize();

                        // Toward hand if present (curious darting)
                        if (targetHand) {
                            const toHand = targetHand.clone().sub(bird.position).normalize();
                            dartDir.lerp(toHand, 0.3);  // Blend toward hand
                        }

                        bird.acceleration.add(dartDir.multiplyScalar(this.BIRD_ACCELERATION * 2));
                    }

                    // Quick hover bursts between darts
                    if (bird.velocity.length() < 3) {
                        this.applyHoverMotion(bird);
                    }

                    bird.targetWingSpeed = 35;  // Very fast wings during darting
                }
                break;
            }

            case 'TERRITORIAL': {
                // Chase another bird
                if (bird.territorialTarget) {
                    const toTarget = bird.territorialTarget.position.clone().sub(bird.position);
                    const dist = toTarget.length();

                    if (dist > 1 && dist < 15) {
                        toTarget.normalize().multiplyScalar(this.BIRD_ACCELERATION * 1.2);
                        bird.acceleration.add(toTarget);
                        bird.targetWingSpeed = 34;
                    } else {
                        bird.behavior = 'HOVERING';
                        bird.territorialTarget = null;
                    }
                } else {
                    bird.behavior = 'HOVERING';
                }
                break;
            }

            case 'DIVE_DISPLAY': {
                if (bird.chaseTarget) {
                    if (bird.diveStartY > bird.position.y) {
                        // Rising phase - fly upward
                        bird.acceleration.y += this.BIRD_ACCELERATION * 1.5;
                        bird.targetWingSpeed = 34;
                    } else {
                        // Dive phase - swoop toward chase target
                        this._tmpVec1.copy(bird.chaseTarget.position).sub(bird.position).normalize().multiplyScalar(bird.dartSpeed);
                        bird.acceleration.add(this._tmpVec1);
                        bird.targetWingSpeed = 36;
                    }
                } else {
                    bird.behavior = 'HOVERING';
                    bird.behaviorTimer = 1;
                }
                break;
            }

            case 'CHASING': {
                if (bird.chaseTarget) {
                    // Perpendicular orbital force around chase target
                    this._tmpVec1.copy(bird.position).sub(bird.chaseTarget.position);
                    // Cross product with up vector (0,1,0) to get perpendicular
                    this._tmpVec2.set(
                        -this._tmpVec1.z,
                        0,
                        this._tmpVec1.x
                    ).normalize().multiplyScalar(8);
                    bird.acceleration.add(this._tmpVec2);
                    // Also steer slightly toward target to maintain distance
                    this._tmpVec1.normalize().multiplyScalar(-2);
                    bird.acceleration.add(this._tmpVec1);
                    bird.targetWingSpeed = 33;
                } else {
                    bird.behavior = 'HOVERING';
                    bird.behaviorTimer = 1;
                }
                break;
            }

            case 'RETURNING': {
                // Return to a comfortable position near the hand
                const returnTarget = targetHand
                    ? targetHand.clone().add(bird.hoverOffset)
                    : new THREE.Vector3(
                        Math.sin(bird.phase) * 8,
                        Math.cos(bird.phase * 0.7) * 5,
                        Math.sin(bird.phase * 0.5) * 3
                    );

                const toReturn = returnTarget.clone().sub(bird.position);
                const dist = toReturn.length();

                // Strong spring tracking for fast return to hand
                const springStrength = dist > 3 ? 50 : 30;
                bird.acceleration.add(toReturn.clone().multiplyScalar(springStrength));

                // Strong damping for stable arrival
                bird.acceleration.add(bird.velocity.clone().multiplyScalar(-12));
                bird.targetWingSpeed = 28;
                break;
            }

            case 'HOVERING':
            default: {
                // Use ANY available hand
                const activeHand = targetHand || leftHand || rightHand;

                if (activeHand) {
                    // Spread birds around the target position - wide enough to avoid overlap
                    const birdIndex = bird.index;
                    const numBirds = this.hummingbirds.length;
                    const phi = (birdIndex / numBirds) * Math.PI * 2;

                    const spreadRadius = 6.0;
                    const offset = new THREE.Vector3(
                        Math.cos(phi) * spreadRadius,
                        (birdIndex % 3 - 1) * 1.8,
                        Math.sin(phi) * spreadRadius * 0.6
                    );

                    const targetPos = activeHand.clone().add(offset);
                    const toTarget = targetPos.clone().sub(bird.position);
                    const dist = toTarget.length();

                    // Strong spring for quick repositioning
                    const springStrength = dist > 5 ? 40 : 22;
                    bird.acceleration.add(toTarget.multiplyScalar(springStrength));

                    // Strong damping for stable, critically-damped settling
                    bird.acceleration.add(bird.velocity.clone().multiplyScalar(-10));
                }

                this.applyHoverMotion(bird);
                bird.targetWingSpeed = 25;
                break;
            }
        }
    }

    private applyHoverMotion(bird: Hummingbird) {
        // Figure-8 hovering pattern (characteristic of hummingbirds)
        // Real hummingbirds appear nearly "locked in space" - very subtle motion
        const p = bird.hoverPhase;

        // Subtle figure-8: X and Z trace a lemniscate, Y has gentle bob
        const hoverX = Math.sin(p) * bird.hoverAmplitudeX;
        const hoverY = Math.sin(p * 2) * bird.hoverAmplitudeY +
                       Math.sin(p * 0.3) * this.HOVER_VERTICAL_BOB;
        const hoverZ = Math.sin(p * 2) * Math.cos(p) * bird.hoverAmplitudeZ;

        // Subtle - hummingbirds hover very stably
        bird.acceleration.x += hoverX * 0.5;
        bird.acceleration.y += hoverY * 0.5;
        bird.acceleration.z += hoverZ * 0.3;
    }

    private applyHandProximityEvasion(
        bird: Hummingbird,
        leftHand: THREE.Vector3 | null,
        rightHand: THREE.Vector3 | null
    ) {
        // Birds maintain a minimum distance from hands even when not startled
        // They won't fly through a slow-moving hand
        const minDist = 3.0;
        const evasionStrength = 8;
        const tv = this._tmpVec2;

        const hands = [leftHand, rightHand];
        for (const hand of hands) {
            if (!hand) continue;
            const dist = bird.position.distanceTo(hand);
            if (dist < minDist && dist > 0.1) {
                // Push away from hand, strength increases as distance decreases
                const factor = (1 - dist / minDist) * evasionStrength;
                tv.copy(bird.position).sub(hand).normalize().multiplyScalar(factor);
                bird.acceleration.add(tv);
            }
        }
    }

    private checkTerritorialBehavior(bird: Hummingbird) {
        if (bird.behavior === 'STARTLED' || bird.behavior === 'TERRITORIAL') return;

        // Check if another bird is too close
        for (const other of this.hummingbirds) {
            if (other === bird) continue;

            const dist = bird.position.distanceTo(other.position);
            if (dist < this.BIRD_TERRITORIAL_RADIUS && Math.random() < bird.territoriality * 0.02) {
                bird.behavior = 'TERRITORIAL';
                bird.territorialTarget = other;
                bird.behaviorTimer = 1 + Math.random() * 1.5;
                break;
            }
        }
    }

    private applyBirdSeparation(bird: Hummingbird) {
        const BIRD_SEP_RADIUS = 3.5;
        const BIRD_SEP_STRENGTH = 3.0;
        const sep = this._tmpVec3;
        sep.set(0, 0, 0);

        for (const other of this.hummingbirds) {
            if (other === bird) continue;
            const dx = bird.position.x - other.position.x;
            const dy = bird.position.y - other.position.y;
            const dz = bird.position.z - other.position.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < BIRD_SEP_RADIUS * BIRD_SEP_RADIUS && distSq > 0.0001) {
                const dist = Math.sqrt(distSq);
                // Proportional push: stronger when closer, zero at radius edge
                const overlap = (BIRD_SEP_RADIUS - dist) / BIRD_SEP_RADIUS;
                const pushStrength = overlap * BIRD_SEP_STRENGTH / dist;
                sep.x += dx * pushStrength;
                sep.y += dy * pushStrength;
                sep.z += dz * pushStrength;
            }
        }

        bird.acceleration.add(sep);
    }

    private applyBirdBoundaryForce(bird: Hummingbird) {
        // No X/Y boundary forces - let birds follow freely anywhere on screen
        // Only apply soft Z-axis constraint to keep birds visible
        const force = new THREE.Vector3();
        const maxZ = 15;

        if (bird.position.z > maxZ) {
            force.z -= (bird.position.z - maxZ) * 0.5;
        }
        if (bird.position.z < -maxZ) {
            force.z -= (bird.position.z + maxZ) * 0.5;
        }

        bird.acceleration.add(force);
    }

    /**
     * Position-based collision resolution for all birds.
     * Called AFTER physics update to directly separate overlapping birds.
     * This is smooth and doesn't cause oscillations like force-based collision.
     */
    private resolveCollisions(
        creatures: Array<{ position: THREE.Vector3; group: THREE.Group }>,
        minDistance: number,
        iterations: number
    ) {
        // Skip collision on odd frames - creatures self-correct over time
        if (this.frameCounter % 2 !== 0) return;
        const minDistSq = minDistance * minDistance;
        const tv = this._tmpVec1;

        for (let iter = 0; iter < iterations; iter++) {
            for (let i = 0; i < creatures.length; i++) {
                for (let j = i + 1; j < creatures.length; j++) {
                    const c1 = creatures[i];
                    const c2 = creatures[j];

                    tv.copy(c1.position).sub(c2.position);
                    const distSq = tv.lengthSq();

                    if (distSq < minDistSq && distSq > 0.000001) {
                        const dist = Math.sqrt(distSq);
                        const pushAmount = (minDistance - dist) * 0.3 / dist;
                        // tv is already (c1 - c2), use it as push direction
                        c1.position.addScaledVector(tv, pushAmount);
                        c2.position.addScaledVector(tv, -pushAmount);
                    }
                }
            }
        }

        for (const c of creatures) {
            c.group.position.copy(c.position);
        }
    }

    private applyHummingbirdPhysics(bird: Hummingbird, dt: number) {
        // Determine max speed based on behavior
        // NO DRAG for hover/curious - damping is handled in behavior force for direct response
        let maxSpeed = bird.hoverSpeed;
        let drag = 1.0;  // No drag by default - let damping handle it

        switch (bird.behavior) {
            case 'STARTLED':
                maxSpeed = bird.dartSpeed * (1 + bird.startleIntensity * 0.5);
                drag = 0.95;
                break;
            case 'DARTING':
                maxSpeed = bird.dartSpeed;
                drag = 0.92;
                break;
            case 'TERRITORIAL':
                maxSpeed = bird.dartSpeed * 0.8;
                drag = 0.9;
                break;
            case 'DIVE_DISPLAY':
                maxSpeed = bird.dartSpeed * 1.2;
                drag = 0.93;
                break;
            case 'CHASING':
                maxSpeed = bird.dartSpeed * 0.9;
                drag = 0.92;
                break;
            case 'CURIOUS':
            case 'RETURNING':
                maxSpeed = this.BIRD_CRUISE_SPEED * 1.5;  // Faster tracking
                drag = 1.0;  // No drag - damping in behavior handles stopping
                break;
            case 'FEEDING':
            case 'HOVERING':
            default:
                maxSpeed = this.BIRD_CRUISE_SPEED * 1.8;  // Increased for screen edge tracking
                drag = 1.0;  // No drag - damping in behavior handles stopping
                break;
        }

        // Limit acceleration
        const maxAccel = bird.behavior === 'STARTLED' ? this.BIRD_ACCELERATION * 2 : this.BIRD_ACCELERATION;
        if (bird.acceleration.length() > maxAccel) {
            bird.acceleration.normalize().multiplyScalar(maxAccel);
        }

        // Apply acceleration
        bird.velocity.add(bird.acceleration.clone().multiplyScalar(dt));

        // Apply drag
        bird.velocity.multiplyScalar(drag);

        // Limit speed
        const speed = bird.velocity.length();
        if (speed > maxSpeed) {
            bird.velocity.normalize().multiplyScalar(maxSpeed);
        }

        // Update position
        bird.position.add(bird.velocity.clone().multiplyScalar(dt));

        // Hard boundaries
        this.clampBirdToBoundaries(bird);
    }

    private clampBirdToBoundaries(bird: Hummingbird) {
        // Only clamp Z to keep birds visible - no X/Y limits
        const maxZ = 20;
        if (bird.position.z > maxZ) { bird.position.z = maxZ; bird.velocity.z *= -0.3; }
        if (bird.position.z < -maxZ) { bird.position.z = -maxZ; bird.velocity.z *= -0.3; }
    }

    private updateHummingbirdRotation(bird: Hummingbird, dt: number) {
        // BIRDS FACE THE DIRECTION THEY ARE MOVING
        // No creature can fly backwards - they always face their velocity
        const speed = bird.velocity.length();

        // Yaw: face movement direction (atan2 gives angle from velocity)
        let targetYaw = 0;
        if (speed > 0.5) {
            // Face the direction of movement - only update when clearly moving
            targetYaw = Math.atan2(bird.velocity.x, bird.velocity.z);
        } else {
            // When hovering, hold steady heading
            targetYaw = bird.smoothedYaw;
        }

        // Pitch: tilt based on vertical movement
        let targetPitch = 0;
        if (speed > 0.5) {
            // Pitch up when climbing, down when diving
            const horizontalSpeed = Math.sqrt(bird.velocity.x ** 2 + bird.velocity.z ** 2);
            targetPitch = Math.atan2(-bird.velocity.y, Math.max(horizontalSpeed, 0.1)) * 0.5;
        }
        if (bird.behavior === 'FEEDING') {
            targetPitch = 0.3;  // Forward lean for feeding
        }

        // Roll: bank into turns
        let targetRoll = 0;
        if (speed > 0.5) {
            // Calculate turn rate (change in yaw)
            const yawDiff = targetYaw - bird.smoothedYaw;
            // Normalize to -PI to PI
            const normalizedDiff = Math.atan2(Math.sin(yawDiff), Math.cos(yawDiff));
            targetRoll = normalizedDiff * 0.3;  // Bank into the turn
        }

        // Smooth rotation interpolation
        const smoothFactor = dt * 5.0;  // Responsive turning
        bird.smoothedYaw += (targetYaw - bird.smoothedYaw) * smoothFactor;
        bird.smoothedPitch += (targetPitch - bird.smoothedPitch) * smoothFactor * 0.6;
        bird.smoothedRoll += (targetRoll - bird.smoothedRoll) * smoothFactor * 0.8;

        // Apply rotations to body
        bird.group.rotation.y = bird.smoothedYaw;
        bird.group.rotation.x = bird.smoothedPitch;
        bird.group.rotation.z = bird.smoothedRoll;
    }

    private updateHeadTracking(
        bird: Hummingbird,
        delta: number,
        leftHand: THREE.Vector3 | null,
        rightHand: THREE.Vector3 | null
    ) {
        // Head looks at the closest point of interest:
        // nearby hand > camera (user). Vestibulo-collic reflex keeps head stable.
        const tv = this._tmpVec1;

        // Determine look target: closest hand if within range, otherwise camera
        let lookTarget: THREE.Vector3 | null = null;
        let closestDist = this.BIRD_CURIOSITY_RADIUS;

        if (leftHand) {
            const d = bird.position.distanceTo(leftHand);
            if (d < closestDist) { closestDist = d; lookTarget = leftHand; }
        }
        if (rightHand) {
            const d = bird.position.distanceTo(rightHand);
            if (d < closestDist) { lookTarget = rightHand; }
        }

        if (lookTarget) {
            tv.copy(lookTarget).sub(bird.position).normalize();
        } else {
            // Camera at (0, 0, 30)
            tv.set(-bird.position.x, -bird.position.y, 30 - bird.position.z).normalize();
        }

        const worldTargetYaw = Math.atan2(tv.x, -tv.z);
        const worldTargetPitch = Math.asin(Math.max(-1, Math.min(1, -tv.y))) * 0.3;

        // Faster smoothing so head doesn't lag behind body
        const headSmoothing = Math.min(1, delta * 6); // ~6 Hz response
        bird.headRotation.y += (worldTargetYaw - bird.headRotation.y) * headSmoothing;
        bird.headRotation.x += (worldTargetPitch - bird.headRotation.x) * headSmoothing;

        if (bird.neckBone) {
            // VESTIBULO-COLLIC REFLEX
            const localNeckYaw = bird.headRotation.y - bird.smoothedYaw;
            const localNeckPitch = bird.headRotation.x - bird.smoothedPitch;
            const localNeckRoll = -bird.smoothedRoll;

            // Soft clamping using tanh for smooth limits (no abrupt stops)
            const clampedYaw = Math.tanh(localNeckYaw * 1.2) * 0.85;
            const clampedPitch = Math.tanh(localNeckPitch * 1.5) * 0.5;
            const clampedRoll = Math.tanh(localNeckRoll * 2.0) * 0.35;

            bird.neckBone.rotation.set(
                bird.neckRestRotation.x + clampedPitch,
                bird.neckRestRotation.y + clampedYaw,
                bird.neckRestRotation.z + clampedRoll
            );
        }
    }

    private updateBirdGlow(bird: Hummingbird) {
        const speed = bird.velocity.length();
        const normalizedSpeed = speed / bird.maxSpeed;

        // Base iridescent glow
        let glowIntensity = 0.1 + Math.sin(this.time * 3 + bird.phase) * 0.03;

        // Speed glow
        glowIntensity += normalizedSpeed * 0.1;

        // Behavior glow
        if (bird.behavior === 'STARTLED') {
            glowIntensity += bird.startleIntensity * 0.2;
        } else if (bird.behavior === 'TERRITORIAL') {
            glowIntensity += 0.15; // Aggressive display
        } else if (bird.behavior === 'CURIOUS') {
            glowIntensity += 0.05;
        }

        for (const mesh of bird.glowMeshes) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat.emissiveIntensity !== undefined) {
                mat.emissiveIntensity += (glowIntensity - mat.emissiveIntensity) * 0.15;
            }
        }
    }

    private updateWingAnimation(bird: Hummingbird) {
        if (bird.action) {
            // Hummingbird wing beat facts:
            // - Hovering: 40-50 Hz
            // - Fast flight: 50-80 Hz
            // - Dive display: up to 200 Hz (Anna's hummingbird)
            // The targetWingSpeed is a multiplier on the base animation speed

            // Natural breathing-like variation in wing speed (subtle)
            const breathVariation = Math.sin(this.time * 1.5 + bird.phase) * 0.05;
            // Faster flutter variation
            const flutterVariation = Math.sin(this.time * 8 + bird.phase * 2.3) * 0.02;

            // Combine base target with natural variations
            const targetSpeed = bird.targetWingSpeed * (1 + breathVariation + flutterVariation);

            // Smooth transition to target speed
            const currentSpeed = bird.action.timeScale;
            const transitionRate = bird.behavior === 'STARTLED' ? 0.3 : 0.1; // Faster response when startled
            bird.action.timeScale += (targetSpeed - currentSpeed) * transitionRate;

            // Minimum wing speed - hummingbirds never stop flapping while airborne
            bird.action.timeScale = Math.max(bird.action.timeScale, 20);
        }
    }

    // ========================================
    // FISH UPDATE SYSTEM
    // ========================================

    private updateAllFish(delta: number) {
        const leftHandPos = this.tracking.leftHand?.confidence && this.tracking.leftHand.confidence > 0.3
            ? this.screenTo3D(this.tracking.leftHand.x, this.tracking.leftHand.y)
            : null;
        const rightHandPos = this.tracking.rightHand?.confidence && this.tracking.rightHand.confidence > 0.3
            ? this.screenTo3D(this.tracking.rightHand.x, this.tracking.rightHand.y)
            : null;

        // Use hand position as school center when available - this makes fish go TO the hand
        // Otherwise use average fish position
        let schoolCenter: THREE.Vector3;
        if (leftHandPos || rightHandPos) {
            // Use hand as the school center - fish will school around the hand
            schoolCenter = leftHandPos || rightHandPos!;
        } else {
            // No hand - use average position
            schoolCenter = new THREE.Vector3();
            for (const f of this.fish) {
                schoolCenter.add(f.position);
            }
            schoolCenter.divideScalar(this.fish.length);
        }

        const avgVelocity = new THREE.Vector3();
        for (const f of this.fish) {
            avgVelocity.add(f.velocity);
        }
        avgVelocity.divideScalar(this.fish.length);

        // Dynamically distribute fish between available hands
        this.distributeCreaturesToHands(this.fish, leftHandPos, rightHandPos);

        const leftHandSpeed = this.handVelocityLeft.length() * 60;
        const rightHandSpeed = this.handVelocityRight.length() * 60;
        const isLeftHandFast = leftHandSpeed > this.STARTLE_THRESHOLD;
        const isRightHandFast = rightHandSpeed > this.STARTLE_THRESHOLD;

        this.updateFishInteractions(delta);

        for (const fish of this.fish) {
            // Update behavior
            this.updateFishBehavior(fish, delta, leftHandPos, rightHandPos, isLeftHandFast, isRightHandFast);

            // Reset and calculate forces
            fish.acceleration.set(0, 0, 0);

            // Get target hand for this fish
            const targetHand = fish.trackingTarget === 'leftHand' ? leftHandPos :
                fish.trackingTarget === 'rightHand' ? rightHandPos : null;

            // Always apply separation to prevent fish overlapping
            // Full boids only when no hand (alignment + cohesion overpower hand tracking)
            const boidsForce = this.calculateBoidsForce(fish, schoolCenter, avgVelocity);
            if (targetHand) {
                // Only keep the separation component (zero out alignment/cohesion contribution)
                // calculateBoidsForce returns combined; recalculate just separation inline
                const sepForce = this._tmpVec3;
                sepForce.set(0, 0, 0);
                let sepCount = 0;
                for (const other of this.fish) {
                    if (other === fish) continue;
                    const dx = fish.position.x - other.position.x;
                    const dy = fish.position.y - other.position.y;
                    const dz = fish.position.z - other.position.z;
                    const distSq = dx * dx + dy * dy + dz * dz;
                    if (distSq < this.SEPARATION_RADIUS * this.SEPARATION_RADIUS && distSq > 0) {
                        const dist = Math.sqrt(distSq);
                        const invDist = 1 / dist;
                        sepForce.x += dx * invDist * invDist;
                        sepForce.y += dy * invDist * invDist;
                        sepForce.z += dz * invDist * invDist;
                        sepCount++;
                    }
                }
                if (sepCount > 0) {
                    sepForce.divideScalar(sepCount);
                    sepForce.normalize().multiplyScalar(this.SEPARATION_WEIGHT);
                    fish.acceleration.add(sepForce);
                }
            } else {
                fish.acceleration.add(boidsForce.multiplyScalar(fish.schoolingStrength * 0.6));
            }

            this.applyFishBehaviorForce(fish, leftHandPos, rightHandPos);
            this.applyFishBoundaryForce(fish);
            this.applyFishPhysics(fish, delta);

            // Update rotation and body undulation
            this.updateFishRotation(fish, delta);
            this.animateFishBody(fish, delta);

            // Update position
            fish.group.position.copy(fish.position);

            // Update visual effects
            this.updateFishGlow(fish);
        }

        // Fish use force-based separation via boids - no position-based collision needed
    }

    private updateFishBehavior(
        fish: Fish,
        delta: number,
        leftHand: THREE.Vector3 | null,
        rightHand: THREE.Vector3 | null,
        isLeftFast: boolean,
        isRightFast: boolean
    ) {
        fish.behaviorTimer -= delta;

        if (fish.startleIntensity > 0) {
            fish.startleIntensity -= delta / this.STARTLE_DURATION;
            if (fish.startleIntensity <= 0) {
                fish.startleIntensity = 0;
                fish.behavior = 'IDLE';
            }
        }

        const targetHand = fish.trackingTarget === 'leftHand' ? leftHand : rightHand;
        const handIsFast = fish.trackingTarget === 'leftHand' ? isLeftFast : isRightFast;
        const handVel = fish.trackingTarget === 'leftHand' ? this.handVelocityLeft : this.handVelocityRight;

        if (targetHand && handIsFast) {
            const distToHand = fish.position.distanceTo(targetHand);
            if (distToHand < this.STARTLE_RADIUS) {
                fish.behavior = 'STARTLED';
                fish.startleIntensity = 1.0;
                fish.behaviorTimer = this.STARTLE_DURATION;

                fish.fleeDirection.copy(handVel).negate().normalize();
                fish.fleeDirection.x += (Math.random() - 0.5) * 0.5;
                fish.fleeDirection.y += (Math.random() - 0.5) * 0.3;
                fish.fleeDirection.normalize();

                fish.startleIntensity *= (2 - fish.boldness);
            }
        }

        if (fish.behavior !== 'STARTLED' && fish.behaviorTimer <= 0) {
            const rand = Math.random();

            if (targetHand) {
                const distToHand = fish.position.distanceTo(targetHand);

                if (distToHand < this.CURIOSITY_RADIUS) {
                    if (rand < fish.curiosity * fish.boldness) {
                        fish.behavior = 'CURIOUS';
                        fish.behaviorTimer = 2 + Math.random() * 3;
                    } else if (rand < 0.7) {
                        fish.behavior = 'SCHOOLING';
                        fish.behaviorTimer = 1 + Math.random() * 2;
                    } else {
                        fish.behavior = 'IDLE';
                        fish.behaviorTimer = 1 + Math.random() * 2;
                    }
                } else {
                    if (rand < 0.4) {
                        fish.behavior = 'SCHOOLING';
                        fish.behaviorTimer = 2 + Math.random() * 4;
                    } else if (rand < 0.7) {
                        fish.behavior = 'FEEDING';
                        fish.behaviorTimer = 3 + Math.random() * 5;
                    } else {
                        fish.behavior = 'IDLE';
                        fish.behaviorTimer = 2 + Math.random() * 3;
                    }
                }
            } else {
                if (rand < 0.5) {
                    fish.behavior = 'SCHOOLING';
                    fish.behaviorTimer = 3 + Math.random() * 5;
                } else if (rand < 0.8) {
                    fish.behavior = 'FEEDING';
                    fish.behaviorTimer = 4 + Math.random() * 6;
                } else {
                    fish.behavior = 'IDLE';
                    fish.behaviorTimer = 2 + Math.random() * 4;
                }
            }
        }
    }

    private calculateBoidsForce(fish: Fish, schoolCenter: THREE.Vector3, _avgVelocity: THREE.Vector3): THREE.Vector3 {
        const separation = new THREE.Vector3();
        const alignment = new THREE.Vector3();
        const cohesion = new THREE.Vector3();

        let separationCount = 0;
        let alignmentCount = 0;

        for (const other of this.fish) {
            if (other === fish) continue;

            const dist = fish.position.distanceTo(other.position);

            if (dist < this.SEPARATION_RADIUS && dist > 0) {
                const diff = fish.position.clone().sub(other.position).normalize();
                diff.divideScalar(dist);
                separation.add(diff);
                separationCount++;
            }

            if (dist < this.ALIGNMENT_RADIUS) {
                alignment.add(other.velocity);
                alignmentCount++;
            }
        }

        if (separationCount > 0) {
            separation.divideScalar(separationCount);
            separation.normalize().multiplyScalar(this.SEPARATION_WEIGHT);
        }

        if (alignmentCount > 0) {
            alignment.divideScalar(alignmentCount);
            alignment.normalize().multiplyScalar(this.ALIGNMENT_WEIGHT);
        }

        cohesion.copy(schoolCenter).sub(fish.position);
        if (cohesion.length() > 0) {
            cohesion.normalize().multiplyScalar(this.COHESION_WEIGHT);
        }

        return separation.add(alignment).add(cohesion);
    }

    private applyFishBehaviorForce(fish: Fish, leftHand: THREE.Vector3 | null, rightHand: THREE.Vector3 | null) {
        const targetHand = fish.trackingTarget === 'leftHand' ? leftHand :
            fish.trackingTarget === 'rightHand' ? rightHand : null;

        switch (fish.behavior) {
            case 'STARTLED': {
                const fleeForce = fish.fleeDirection.clone().multiplyScalar(
                    this.FLEE_SPEED * fish.startleIntensity
                );
                fish.acceleration.add(fleeForce);
                break;
            }

            case 'CURIOUS': {
                // Use ANY available hand
                const activeHand = targetHand || leftHand || rightHand;

                if (activeHand) {
                    // Spread fish around the target in a loose orbit
                    const fishIndex = fish.index;
                    const numFish = this.fish.length;
                    // Slowly rotating angle so fish orbit, not freeze
                    const phi = (fishIndex / numFish) * Math.PI * 2 + this.time * 0.3;
                    const spreadRadius = 6.0;

                    const offset = new THREE.Vector3(
                        Math.cos(phi) * spreadRadius,
                        ((fishIndex % 3) - 1) * 2.0,
                        Math.sin(phi) * spreadRadius * 0.5
                    );

                    const targetPos = activeHand.clone().add(offset);
                    const toTarget = targetPos.clone().sub(fish.position);
                    const dist = toTarget.length();

                    // Gentle spring - fish glide toward position, not snap
                    const springStrength = dist > 8 ? 8 : 4;
                    fish.acceleration.add(toTarget.normalize().multiplyScalar(springStrength * Math.min(dist, 5)));

                    // Damping
                    fish.acceleration.add(fish.velocity.clone().multiplyScalar(-3));
                }
                break;
            }

            case 'FEEDING': {
                const feedingForce = new THREE.Vector3(
                    Math.sin(this.time * 3 + fish.phase) * Math.cos(this.time * 1.7 + fish.phase * 0.7),
                    Math.sin(this.time * 2.3 + fish.phase * 1.2) * 0.5,
                    Math.cos(this.time * 2.8 + fish.phase * 0.5) * 0.3
                ).multiplyScalar(2);
                fish.acceleration.add(feedingForce);
                break;
            }

            case 'IDLE': {
                const idleForce = new THREE.Vector3(
                    Math.sin(this.time * 0.8 + fish.phase) * 0.5,
                    Math.cos(this.time * 0.6 + fish.phase * 1.3) * 0.3,
                    Math.sin(this.time * 0.5 + fish.phase * 0.7) * 0.2
                );
                fish.acceleration.add(idleForce);
                break;
            }

            case 'TIGHT_SCHOOL': {
                // Tighter schooling but still with spread
                this._tmpVec1.set(0, 0, 0);
                for (const other of this.fish) {
                    this._tmpVec1.add(other.position);
                }
                this._tmpVec1.divideScalar(this.fish.length);
                // Moderate cohesion toward center - not so strong they overlap
                this._tmpVec2.copy(this._tmpVec1).sub(fish.position);
                const tsDist = this._tmpVec2.length();
                if (tsDist > 3) {
                    fish.acceleration.addScaledVector(this._tmpVec2.normalize(), 3);
                }
                // Alignment with neighbors
                fish.acceleration.addScaledVector(fish.velocity, -2);
                break;
            }

            case 'FOLLOWING': {
                if (fish.leader) {
                    // Steer toward a position 2 units behind leader's heading direction
                    this._tmpVec1.copy(fish.leader.velocity).normalize().multiplyScalar(-2);
                    this._tmpVec2.copy(fish.leader.position).add(this._tmpVec1).sub(fish.position);
                    fish.acceleration.addScaledVector(this._tmpVec2, 4);
                    fish.acceleration.addScaledVector(fish.velocity, -3);
                } else {
                    fish.behavior = 'SCHOOLING';
                    fish.behaviorTimer = 2;
                }
                break;
            }

            case 'SCHOOLING':
            default: {
                // Use ANY available hand
                const activeHand = targetHand || leftHand || rightHand;

                if (activeHand) {
                    const fishIndex = fish.index;
                    const numFish = this.fish.length;

                    // Slowly rotating spread so the school orbits the hand
                    const phi = (fishIndex / numFish) * Math.PI * 2 + this.time * 0.25;
                    const spreadRadius = 7.0;

                    const offset = new THREE.Vector3(
                        Math.cos(phi) * spreadRadius,
                        (fishIndex % 3 - 1) * 2.0 + Math.sin(this.time * 0.5 + fish.phase) * 0.8,
                        Math.sin(phi) * spreadRadius * 0.5
                    );
                    const targetPos = activeHand.clone().add(offset);
                    const toTarget = targetPos.clone().sub(fish.position);
                    const dist = toTarget.length();

                    // Gentle spring - fish glide smoothly, not snap
                    const springStrength = dist > 8 ? 6 : 3;
                    fish.acceleration.add(toTarget.normalize().multiplyScalar(springStrength * Math.min(dist, 6)));

                    // Smooth damping
                    fish.acceleration.add(fish.velocity.clone().multiplyScalar(-2.5));
                } else {
                    // Schooling without hand: gentle forward swimming with slight turns
                    const forwardBias = fish.velocity.clone().normalize().multiplyScalar(1.0);
                    // Add gentle wandering so school spreads and moves
                    forwardBias.x += Math.sin(this.time * 0.7 + fish.phase * 2) * 0.5;
                    forwardBias.y += Math.sin(this.time * 0.5 + fish.phase * 3) * 0.3;
                    fish.acceleration.add(forwardBias);
                }
                break;
            }
        }
    }

    private applyFishBoundaryForce(fish: Fish) {
        // No X/Y boundary forces - let fish follow freely anywhere on screen
        // Only apply soft Z-axis constraint to keep fish visible
        const force = new THREE.Vector3();
        const maxZ = 15;

        if (fish.position.z > maxZ) {
            force.z -= (fish.position.z - maxZ) * 0.5;
        }
        if (fish.position.z < -maxZ) {
            force.z -= (fish.position.z + maxZ) * 0.5;
        }

        fish.acceleration.add(force);
    }

    /**
     * Position-based collision resolution for all fish.
     * Called AFTER physics update to directly separate overlapping fish.
     */

    private applyFishPhysics(fish: Fish, dt: number) {
        // Higher acceleration for tracking behaviors
        const maxAccel = fish.behavior === 'STARTLED' ? 25 :
                         (fish.behavior === 'CURIOUS' || fish.behavior === 'SCHOOLING' || fish.behavior === 'TIGHT_SCHOOL' || fish.behavior === 'FOLLOWING') ? 30 : 15;
        if (fish.acceleration.length() > maxAccel) {
            fish.acceleration.normalize().multiplyScalar(maxAccel);
        }

        fish.velocity.add(fish.acceleration.clone().multiplyScalar(dt));
        fish.velocity.multiplyScalar(this.FISH_DRAG);

        const maxSpeed = fish.behavior === 'STARTLED'
            ? fish.maxSpeed * (1 + fish.startleIntensity)
            : fish.maxSpeed;

        const speed = fish.velocity.length();
        if (speed > maxSpeed) {
            fish.velocity.normalize().multiplyScalar(maxSpeed);
        }

        const minSpeed = fish.behavior === 'CURIOUS' ? 0.8 : 1.5;
        if (speed < minSpeed && fish.behavior !== 'STARTLED') {
            fish.velocity.normalize().multiplyScalar(minSpeed);
        }

        fish.position.add(fish.velocity.clone().multiplyScalar(dt));
        this.clampFishToBoundaries(fish);
    }

    private clampFishToBoundaries(fish: Fish) {
        // Only clamp Z to keep fish visible - no X/Y limits
        const maxZ = 20;
        if (fish.position.z > maxZ) { fish.position.z = maxZ; fish.velocity.z *= -0.5; }
        if (fish.position.z < -maxZ) { fish.position.z = -maxZ; fish.velocity.z *= -0.5; }
    }

    private updateFishRotation(fish: Fish, dt: number) {
        // FISH FACE THE DIRECTION THEY ARE SWIMMING
        // Fish model faces -Z by default, so add PI to flip
        const speed = fish.velocity.length();

        // Yaw: face movement direction (add PI because model faces -Z)
        let targetHeading = fish.smoothedHeading;
        if (speed > 0.05) {
            targetHeading = Math.atan2(fish.velocity.x, fish.velocity.z) + Math.PI;
        }

        // Pitch: tilt based on vertical movement
        let targetPitch = 0;
        if (speed > 0.05) {
            const horizontalSpeed = Math.sqrt(fish.velocity.x ** 2 + fish.velocity.z ** 2);
            targetPitch = Math.atan2(fish.velocity.y, Math.max(horizontalSpeed, 0.05)) * 0.4;
        }

        // Roll: bank into turns
        let targetRoll = 0;
        if (speed > 0.3) {
            const headingDiff = targetHeading - fish.smoothedHeading;
            const normalizedDiff = Math.atan2(Math.sin(headingDiff), Math.cos(headingDiff));
            targetRoll = normalizedDiff * 0.25;
        }

        // Smooth rotation transitions
        const turnSmooth = dt * 3.0;
        // Wrap heading difference to avoid 360-degree flips
        const headingErr = Math.atan2(Math.sin(targetHeading - fish.smoothedHeading), Math.cos(targetHeading - fish.smoothedHeading));
        fish.smoothedHeading += headingErr * turnSmooth;
        fish.smoothedPitch += (targetPitch - fish.smoothedPitch) * turnSmooth * 0.6;

        // Apply rotation
        fish.group.rotation.y = fish.smoothedHeading;
        fish.group.rotation.x = fish.smoothedPitch;
        fish.group.rotation.z += (targetRoll - fish.group.rotation.z) * turnSmooth * 0.8;
    }

    /**
     * Animate fish body segments with undulation
     * Creates a sine wave that propagates from head to tail
     * Based on BCF (body-caudal fin) propulsion research
     */
    private animateFishBody(fish: Fish, dt: number) {
        const speed = fish.velocity.length();

        // Update swim phase - faster swimming = faster undulation
        const baseFrequency = 6;  // Base oscillation frequency
        const speedMultiplier = 1 + (speed / fish.cruiseSpeed) * 0.5;
        fish.swimPhase += dt * baseFrequency * speedMultiplier;

        // Amplitude increases with speed (more vigorous swimming)
        const baseAmplitude = 0.15;
        const speedAmplitude = baseAmplitude * (0.5 + speed / fish.cruiseSpeed);

        // Animate each body segment
        for (let i = 0; i < fish.segments.length; i++) {
            const segment = fish.segments[i];

            // Wave propagates from head to tail with phase delay
            const wavePhase = fish.swimPhase - segment.phaseOffset;

            // Yaw oscillation (side-to-side) - main swimming motion
            const yawAngle = Math.sin(wavePhase) * segment.amplitude * speedAmplitude;

            // Apply rotation to segment's parent group
            const parentMesh = segment.mesh.parent;
            if (parentMesh) {
                parentMesh.rotation.y = yawAngle;

                // Subtle roll for more organic movement
                parentMesh.rotation.z = Math.sin(wavePhase * 0.5) * segment.amplitude * 0.3;
            }
        }

        // Animate tail fin - exaggerated movement
        if (fish.tailFin) {
            const tailPhase = fish.swimPhase - (fish.segments.length * 0.4);
            fish.tailFin.rotation.y = Math.sin(tailPhase) * 0.5 * speedAmplitude;
        }

        // Animate dorsal fin - subtle flutter
        if (fish.dorsalFin) {
            fish.dorsalFin.rotation.x = Math.sin(fish.swimPhase * 2) * 0.1;
        }

        // Animate pectoral fins - flutter and stabilization
        fish.pectoralFins.forEach((fin, index) => {
            const side = index === 0 ? 1 : -1;
            const finPhase = fish.swimPhase * 1.5 + index * Math.PI;
            fin.rotation.y = side * (0.3 + Math.sin(finPhase) * 0.2);
            fin.rotation.x = Math.sin(finPhase * 0.5) * 0.15;
        });
    }

    private updateFishGlow(fish: Fish) {
        const speed = fish.velocity.length();
        const normalizedSpeed = speed / fish.maxSpeed;

        // Calculate glow intensity
        let glowIntensity = 0.08 + Math.sin(this.time * 2 + fish.phase) * 0.02;
        glowIntensity += normalizedSpeed * 0.05;

        if (fish.behavior === 'STARTLED') {
            glowIntensity += fish.startleIntensity * 0.15;
        } else if (fish.behavior === 'CURIOUS') {
            glowIntensity += 0.03;
        }

        // Apply glow to all body segments
        for (const segment of fish.segments) {
            const mat = segment.mesh.material as THREE.MeshStandardMaterial;
            if (mat.emissiveIntensity !== undefined) {
                mat.emissiveIntensity += (glowIntensity - mat.emissiveIntensity) * 0.15;
            }
        }

        // Apply glow to fins
        if (fish.tailFin) {
            const mat = fish.tailFin.material as THREE.MeshStandardMaterial;
            if (mat.emissiveIntensity !== undefined) {
                mat.emissiveIntensity += (glowIntensity - mat.emissiveIntensity) * 0.15;
            }
        }
    }

    // ========================================
    // BEE UPDATE SYSTEM
    // ========================================

    private updateAllBees(delta: number) {
        if (this.bees.length === 0) return;

        // Get hand positions FIRST
        const leftHandPos = this.tracking.leftHand?.confidence && this.tracking.leftHand.confidence > 0.3
            ? this.screenTo3D(this.tracking.leftHand.x, this.tracking.leftHand.y)
            : null;
        const rightHandPos = this.tracking.rightHand?.confidence && this.tracking.rightHand.confidence > 0.3
            ? this.screenTo3D(this.tracking.rightHand.x, this.tracking.rightHand.y)
            : null;

        // Use hand position as swarm center when available - bees swarm around the hand
        let swarmCenter: THREE.Vector3;
        if (leftHandPos || rightHandPos) {
            swarmCenter = leftHandPos || rightHandPos!;
        } else {
            swarmCenter = new THREE.Vector3();
            for (const bee of this.bees) {
                swarmCenter.add(bee.position);
            }
            swarmCenter.divideScalar(this.bees.length);
        }

        const swarmVelocity = new THREE.Vector3();
        for (const bee of this.bees) {
            swarmVelocity.add(bee.velocity);
        }
        swarmVelocity.divideScalar(this.bees.length);

        // Dynamically distribute bees between available hands
        this.distributeCreaturesToHands(this.bees, leftHandPos, rightHandPos);

        // Check for fast hand movement
        const leftHandSpeed = this.handVelocityLeft.length() * 60;
        const rightHandSpeed = this.handVelocityRight.length() * 60;
        const isLeftHandFast = leftHandSpeed > this.BEE_STARTLE_THRESHOLD;
        const isRightHandFast = rightHandSpeed > this.BEE_STARTLE_THRESHOLD;

        this.updateBeeInteractions(delta);

        for (let i = 0; i < this.bees.length; i++) {
            const bee = this.bees[i];

            // Update behavior
            this.updateBeeBehavior(bee, delta, leftHandPos, rightHandPos, isLeftHandFast, isRightHandFast);

            // Reset acceleration
            bee.acceleration.set(0, 0, 0);

            // Get target hand for this bee
            const targetHand = bee.trackingTarget === 'leftHand' ? leftHandPos :
                               bee.trackingTarget === 'rightHand' ? rightHandPos : null;

            // ONLY apply swarm forces when NO hand is detected - otherwise it overpowers hand tracking
            if (!targetHand) {
                const swarmForce = this.calculateBeeSwarmForce(bee, swarmCenter, swarmVelocity);
                bee.acceleration.add(swarmForce.multiplyScalar(bee.swarmAffinity));
            }

            // Apply behavior-specific forces
            this.applyBeeBehaviorForce(bee, leftHandPos, rightHandPos, delta);

            // Apply boundary forces
            this.applyBeeBoundaryForce(bee);

            // Apply physics
            this.applyBeePhysics(bee, delta);

            // Update rotation
            this.updateBeeRotation(bee, delta);

            // Update wing animation phase
            bee.wingPhase += delta * this.BEE_WING_FREQUENCY;

            // Update animation mixer (for model animations)
            bee.mixer?.update(delta);

            // Update group position and rotation
            bee.group.position.copy(bee.position);
            bee.group.rotation.set(bee.smoothedPitch, bee.smoothedYaw, bee.smoothedRoll);
        }

        // Resolve collisions AFTER all bees are updated (position-based, no jumping)
        this.resolveCollisions(this.bees, 3.0, 1);
    }

    private updateBeeBehavior(
        bee: Bee,
        delta: number,
        leftHand: THREE.Vector3 | null,
        rightHand: THREE.Vector3 | null,
        isLeftFast: boolean,
        isRightFast: boolean
    ) {
        bee.behaviorTimer -= delta;

        // Decay startle
        if (bee.startleIntensity > 0) {
            bee.startleIntensity -= delta / this.BEE_STARTLE_DURATION;
            if (bee.startleIntensity <= 0) {
                bee.startleIntensity = 0;
                bee.behavior = 'SWARMING';
                bee.behaviorTimer = 0.5;
            }
        }

        // Decay dance
        if (bee.danceIntensity > 0) {
            bee.danceIntensity -= delta * 0.5;
        }

        // Get target hand
        const targetHand = bee.trackingTarget === 'leftHand' ? leftHand :
            bee.trackingTarget === 'rightHand' ? rightHand : null;
        const handIsFast = bee.trackingTarget === 'leftHand' ? isLeftFast : isRightFast;
        const handVel = bee.trackingTarget === 'leftHand' ? this.handVelocityLeft : this.handVelocityRight;

        // Check for startle
        if (targetHand && handIsFast && bee.behavior !== 'DEFENSIVE') {
            const distToHand = bee.position.distanceTo(targetHand);
            if (distToHand < this.BEE_STARTLE_RADIUS) {
                bee.behavior = 'DEFENSIVE';
                bee.startleIntensity = 1.0;
                bee.behaviorTimer = this.BEE_STARTLE_DURATION;

                // Flee opposite to hand velocity
                bee.fleeDirection.copy(handVel).negate().normalize();
                bee.fleeDirection.x += (Math.random() - 0.5) * 0.8;
                bee.fleeDirection.y += (Math.random() - 0.5) * 0.5;
                bee.fleeDirection.z += (Math.random() - 0.5) * 0.4;
                bee.fleeDirection.normalize();

                bee.startleIntensity *= (2 - bee.boldness);
                return;
            }
        }

        // Check for dance trigger (close to hand, hand is slow)
        if (targetHand && !handIsFast && bee.behavior !== 'DEFENSIVE') {
            const distToHand = bee.position.distanceTo(targetHand);
            if (distToHand < this.BEE_DANCE_RADIUS) {
                if (Math.random() < 0.02 * bee.curiosity) {
                    bee.behavior = 'DANCING';
                    bee.behaviorTimer = 1 + Math.random() * 2;
                    bee.danceIntensity = 0.8 + Math.random() * 0.2;
                }
            }
        }

        // Behavior state machine
        if (bee.behavior !== 'DEFENSIVE' && bee.behaviorTimer <= 0) {
            const rand = Math.random();

            if (targetHand) {
                const distToHand = bee.position.distanceTo(targetHand);

                if (distToHand < this.BEE_CURIOSITY_RADIUS) {
                    // Hand is nearby
                    if (rand < bee.curiosity * bee.boldness * 0.5) {
                        bee.behavior = 'INVESTIGATING';
                        bee.behaviorTimer = 2 + Math.random() * 3;
                    } else if (rand < 0.6) {
                        bee.behavior = 'HOVERING';
                        bee.behaviorTimer = 1 + Math.random() * 2;
                    } else {
                        bee.behavior = 'SWARMING';
                        bee.behaviorTimer = 2 + Math.random() * 3;
                    }
                } else {
                    // Hand is far
                    if (rand < 0.5) {
                        bee.behavior = 'SWARMING';
                        bee.behaviorTimer = 3 + Math.random() * 4;
                    } else if (rand < 0.8) {
                        bee.behavior = 'FORAGING';
                        bee.behaviorTimer = 2 + Math.random() * 3;
                    } else {
                        bee.behavior = 'HOVERING';
                        bee.behaviorTimer = 1 + Math.random() * 2;
                    }
                }
            } else {
                // No hand detected
                if (rand < 0.5) {
                    bee.behavior = 'SWARMING';
                    bee.behaviorTimer = 3 + Math.random() * 5;
                } else if (rand < 0.8) {
                    bee.behavior = 'FORAGING';
                    bee.behaviorTimer = 3 + Math.random() * 4;
                } else {
                    bee.behavior = 'HOVERING';
                    bee.behaviorTimer = 2 + Math.random() * 3;
                }
            }
        }
    }

    private calculateBeeSwarmForce(bee: Bee, swarmCenter: THREE.Vector3, _swarmVelocity: THREE.Vector3): THREE.Vector3 {
        const separation = new THREE.Vector3();
        const alignment = new THREE.Vector3();
        const cohesion = new THREE.Vector3();

        let separationCount = 0;
        let alignmentCount = 0;

        for (const other of this.bees) {
            if (other === bee) continue;

            const dist = bee.position.distanceTo(other.position);

            // Separation - avoid crowding
            if (dist < this.BEE_SEPARATION_RADIUS && dist > 0) {
                const diff = bee.position.clone().sub(other.position).normalize();
                diff.divideScalar(dist);  // Weight by inverse distance
                separation.add(diff);
                separationCount++;
            }

            // Alignment - match velocity of nearby bees
            if (dist < this.BEE_SWARM_RADIUS) {
                alignment.add(other.velocity);
                alignmentCount++;
            }
        }

        if (separationCount > 0) {
            separation.divideScalar(separationCount);
            separation.normalize().multiplyScalar(this.BEE_SEPARATION_WEIGHT);
        }

        if (alignmentCount > 0) {
            alignment.divideScalar(alignmentCount);
            alignment.normalize().multiplyScalar(this.BEE_ALIGNMENT_WEIGHT);
        }

        // Cohesion - move toward swarm center
        cohesion.copy(swarmCenter).sub(bee.position);
        if (cohesion.length() > 0) {
            cohesion.normalize().multiplyScalar(this.BEE_COHESION_WEIGHT);
        }

        return separation.add(alignment).add(cohesion);
    }

    private applyBeeBehaviorForce(
        bee: Bee,
        leftHand: THREE.Vector3 | null,
        rightHand: THREE.Vector3 | null,
        delta: number
    ) {
        const targetHand = bee.trackingTarget === 'leftHand' ? leftHand :
            bee.trackingTarget === 'rightHand' ? rightHand : null;

        // Update zigzag phase for flight pattern
        bee.zigzagPhase += delta * this.BEE_ZIGZAG_FREQUENCY * Math.PI * 2;
        bee.bodyBobPhase += delta * 8;

        switch (bee.behavior) {
            case 'DEFENSIVE': {
                // Rapid defensive flight away from threat
                const fleeForce = bee.fleeDirection.clone().multiplyScalar(
                    this.BEE_MAX_SPEED * 1.5 * bee.startleIntensity
                );
                bee.acceleration.add(fleeForce);
                break;
            }

            case 'INVESTIGATING': {
                // If recruited by a dancing bee, steer toward the recruiter
                if (bee.recruitTarget) {
                    this._tmpVec1.copy(bee.recruitTarget.position).sub(bee.position);
                    const rDist = this._tmpVec1.length();
                    const rSpring = rDist > 5 ? 38 : 24;
                    bee.acceleration.addScaledVector(this._tmpVec1, rSpring);
                    bee.acceleration.addScaledVector(bee.velocity, -6);
                    break;
                }

                // Use ANY available hand
                const activeHand = targetHand || leftHand || rightHand;

                if (activeHand) {
                    // Spread bees around target
                    const beeIndex = bee.index;
                    const numBees = this.bees.length;
                    const phi = (beeIndex / numBees) * Math.PI * 2;
                    const spreadRadius = 5.0;  // LARGE spread

                    const offset = new THREE.Vector3(
                        Math.cos(phi) * spreadRadius,
                        ((beeIndex % 3) - 1) * 1.2 + Math.sin(bee.bodyBobPhase) * 0.1,
                        Math.sin(phi) * spreadRadius * 0.5
                    );
                    const targetPos = activeHand.clone().add(offset);
                    const toTarget = targetPos.clone().sub(bee.position);
                    const dist = toTarget.length();

                    // Smooth spring
                    const springStrength = dist > 5 ? 38 : 24;
                    bee.acceleration.add(toTarget.multiplyScalar(springStrength));

                    // Smooth damping
                    bee.acceleration.add(bee.velocity.clone().multiplyScalar(-6));

                    // Separation
                    // Collision resolved after all bees updated
                } else {
                    bee.behavior = 'SWARMING';
                }
                break;
            }

            case 'DANCING': {
                // Waggle dance - figure-8 pattern
                bee.dancePhase += delta * this.BEE_DANCE_FREQUENCY;
                const waggleX = Math.sin(bee.dancePhase) * 0.8;
                const waggleY = Math.sin(bee.dancePhase * 2) * 0.3;
                const waggleZ = Math.cos(bee.dancePhase) * 0.4;

                bee.acceleration.x += waggleX * bee.danceIntensity * 15;
                bee.acceleration.y += waggleY * bee.danceIntensity * 10;
                bee.acceleration.z += waggleZ * bee.danceIntensity * 8;

                // Stay near hand if present
                if (targetHand) {
                    const toHand = targetHand.clone().sub(bee.position);
                    const dist = toHand.length();
                    if (dist > 3) {
                        toHand.normalize().multiplyScalar(dist * 2);
                        bee.acceleration.add(toHand);
                    }
                }
                break;
            }

            case 'FORAGING': {
                // Random exploration with zigzag pattern
                const forageDir = new THREE.Vector3(
                    Math.sin(this.time * 0.5 + bee.phase),
                    Math.sin(this.time * 0.3 + bee.phase * 1.3) * 0.5,
                    Math.cos(this.time * 0.4 + bee.phase * 0.7)
                ).normalize();

                const forageForce = forageDir.multiplyScalar(this.BEE_CRUISE_SPEED * 0.7);

                // Add characteristic zigzag
                const zigzag = new THREE.Vector3(
                    Math.sin(bee.zigzagPhase) * this.BEE_ZIGZAG_AMPLITUDE,
                    Math.sin(bee.bodyBobPhase) * this.BEE_HOVER_BOB,
                    Math.cos(bee.zigzagPhase * 0.7) * this.BEE_ZIGZAG_AMPLITUDE * 0.5
                );
                bee.acceleration.add(forageForce).add(zigzag);
                break;
            }

            case 'HOVERING':
            case 'SWARMING':
            default: {
                // Use ANY available hand
                const activeHand = targetHand || leftHand || rightHand;

                if (activeHand) {
                    // Spread bees around the target
                    const beeIndex = bee.index;
                    const numBees = this.bees.length;
                    const phi = (beeIndex / numBees) * Math.PI * 2;
                    const spreadRadius = 5.5;  // LARGE spread

                    const offset = new THREE.Vector3(
                        Math.cos(phi) * spreadRadius,
                        (beeIndex % 3 - 1) * 1.3 + Math.sin(bee.bodyBobPhase) * 0.1,
                        Math.sin(phi) * spreadRadius * 0.5
                    );

                    const targetPos = activeHand.clone().add(offset);
                    const toTarget = targetPos.clone().sub(bee.position);
                    const dist = toTarget.length();

                    // Smooth spring
                    const springStrength = dist > 5 ? 36 : 22;
                    bee.acceleration.add(toTarget.multiplyScalar(springStrength));

                    // Smooth damping
                    bee.acceleration.add(bee.velocity.clone().multiplyScalar(-5));

                    // Separation to prevent clustering
                    // Collision resolved after all bees updated
                } else {
                    // No hand - hover in place
                    const hoverForce = new THREE.Vector3(
                        Math.sin(bee.zigzagPhase * 0.5) * 0.3,
                        Math.sin(bee.bodyBobPhase) * this.BEE_HOVER_BOB * 5,
                        Math.cos(bee.zigzagPhase * 0.3) * 0.2
                    );
                    bee.acceleration.add(hoverForce);
                    bee.acceleration.add(bee.velocity.clone().multiplyScalar(-3));
                }

                // Add subtle zigzag for natural bee movement
                const zigzag = new THREE.Vector3(
                    Math.sin(bee.zigzagPhase) * this.BEE_ZIGZAG_AMPLITUDE * 0.15,
                    Math.sin(bee.bodyBobPhase) * this.BEE_HOVER_BOB * 0.5,
                    Math.cos(bee.zigzagPhase * 0.8) * this.BEE_ZIGZAG_AMPLITUDE * 0.1
                );
                bee.acceleration.add(zigzag);
                break;
            }
        }
    }

    private applyBeeBoundaryForce(bee: Bee) {
        // No X/Y boundary forces - let bees follow freely anywhere on screen
        // Only apply soft Z-axis constraint to keep bees visible
        const force = new THREE.Vector3();
        const maxZ = 15;

        if (bee.position.z > maxZ) {
            force.z -= (bee.position.z - maxZ) * 0.5;
        }
        if (bee.position.z < -maxZ) {
            force.z -= (bee.position.z + maxZ) * 0.5;
        }

        bee.acceleration.add(force);
    }

    /**
     * Position-based collision resolution for all bees.
     * Called AFTER physics update to directly separate overlapping bees.
     */

    private applyBeePhysics(bee: Bee, dt: number) {
        // Determine max speed based on behavior
        let maxSpeed = bee.cruiseSpeed;
        let drag = 0.9;

        switch (bee.behavior) {
            case 'DEFENSIVE':
                maxSpeed = bee.maxSpeed * (1 + bee.startleIntensity * 0.5);
                drag = 0.95;
                break;
            case 'INVESTIGATING':
                maxSpeed = bee.cruiseSpeed * 1.2;
                drag = 0.92;
                break;
            case 'DANCING':
                maxSpeed = bee.cruiseSpeed * 0.6;
                drag = 0.85;
                break;
            case 'HOVERING':
                maxSpeed = bee.cruiseSpeed * 1.5;  // Increased for screen edge tracking
                drag = 0.85;
                break;
            case 'FORAGING':
                maxSpeed = bee.cruiseSpeed;
                drag = 0.9;
                break;
            case 'SWARMING':
            default:
                maxSpeed = bee.cruiseSpeed * 1.8;  // Increased for faster hand tracking
                drag = 0.93;  // Slightly less drag for faster response
                break;
        }

        // Limit acceleration - higher for tracking behaviors to overcome swarm cohesion
        const maxAccel = bee.behavior === 'DEFENSIVE' ? 35 :
                         (bee.behavior === 'INVESTIGATING' || bee.behavior === 'SWARMING' || bee.behavior === 'HOVERING') ? 40 : 20;
        if (bee.acceleration.length() > maxAccel) {
            bee.acceleration.normalize().multiplyScalar(maxAccel);
        }

        // Apply acceleration
        bee.velocity.add(bee.acceleration.clone().multiplyScalar(dt));

        // Apply drag
        bee.velocity.multiplyScalar(drag);

        // Limit speed
        const speed = bee.velocity.length();
        if (speed > maxSpeed) {
            bee.velocity.normalize().multiplyScalar(maxSpeed);
        }

        // Minimum speed for most behaviors
        const minSpeed = bee.behavior === 'HOVERING' ? 0.1 : 0.5;
        if (speed < minSpeed && bee.behavior !== 'DEFENSIVE') {
            if (speed > 0.01) {
                bee.velocity.normalize().multiplyScalar(minSpeed);
            } else {
                // Give random direction if nearly stopped
                bee.velocity.set(
                    (Math.random() - 0.5),
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5)
                ).normalize().multiplyScalar(minSpeed);
            }
        }

        // Update position
        bee.position.add(bee.velocity.clone().multiplyScalar(dt));

        // Hard boundaries
        this.clampBeeToBoundaries(bee);
    }

    private clampBeeToBoundaries(bee: Bee) {
        // Only clamp Z to keep bees visible - no X/Y limits
        const maxZ = 20;
        if (bee.position.z > maxZ) { bee.position.z = maxZ; bee.velocity.z *= -0.3; }
        if (bee.position.z < -maxZ) { bee.position.z = -maxZ; bee.velocity.z *= -0.3; }
    }

    private updateBeeRotation(bee: Bee, dt: number) {
        // BEES FACE THE DIRECTION THEY ARE FLYING
        // No bee can fly backwards - always face velocity
        const speed = bee.velocity.length();
        const turnSmooth = dt * 5.0;

        // Yaw: face movement direction
        let targetYaw = bee.smoothedYaw;
        if (speed > 0.1) {
            targetYaw = Math.atan2(bee.velocity.x, bee.velocity.z);
        }

        // Pitch: tilt based on vertical movement
        let targetPitch = 0;
        if (speed > 0.1) {
            const horizontalSpeed = Math.sqrt(bee.velocity.x ** 2 + bee.velocity.z ** 2);
            targetPitch = Math.atan2(-bee.velocity.y, Math.max(horizontalSpeed, 0.1)) * 0.35;
        }

        // Roll: bank into turns + subtle buzzing waggle
        let targetRoll = Math.sin(this.time * 8 + bee.phase * 1.5) * 0.02;  // Buzzy waggle
        if (speed > 0.3) {
            const yawDiff = targetYaw - bee.smoothedYaw;
            const normalizedDiff = Math.atan2(Math.sin(yawDiff), Math.cos(yawDiff));
            targetRoll += normalizedDiff * 0.2;
        }

        // Add waggle roll during dance
        if (bee.behavior === 'DANCING') {
            targetRoll += Math.sin(bee.dancePhase * 2) * 0.3 * bee.danceIntensity;
        }

        // Smooth rotations
        bee.smoothedYaw += (targetYaw - bee.smoothedYaw) * turnSmooth;
        bee.smoothedPitch += (targetPitch - bee.smoothedPitch) * turnSmooth * 0.6;
        bee.smoothedRoll += (targetRoll - bee.smoothedRoll) * turnSmooth * 0.8;
    }

    // ========================================
    // BUTTERFLY UPDATE SYSTEM
    // ========================================

    private updateAllButterflies(delta: number) {
        if (this.butterflies.length === 0) return;

        const leftHandPos = this.tracking.leftHand?.confidence && this.tracking.leftHand.confidence > 0.3
            ? this.screenTo3D(this.tracking.leftHand.x, this.tracking.leftHand.y)
            : null;
        const rightHandPos = this.tracking.rightHand?.confidence && this.tracking.rightHand.confidence > 0.3
            ? this.screenTo3D(this.tracking.rightHand.x, this.tracking.rightHand.y)
            : null;

        this.distributeCreaturesToHands(this.butterflies, leftHandPos, rightHandPos);

        const leftHandSpeed = this.handVelocityLeft.length() * 60;
        const rightHandSpeed = this.handVelocityRight.length() * 60;
        const isLeftHandFast = leftHandSpeed > this.BUTTERFLY_STARTLE_THRESHOLD;
        const isRightHandFast = rightHandSpeed > this.BUTTERFLY_STARTLE_THRESHOLD;

        this.updateButterflyInteractions(delta);

        for (let i = 0; i < this.butterflies.length; i++) {
            const b = this.butterflies[i];

            // Update behavior state
            this.updateButterflyBehavior(b, delta, leftHandPos, rightHandPos, isLeftHandFast, isRightHandFast);

            // Reset acceleration
            b.acceleration.set(0, 0, 0);

            // Apply behavior-specific forces
            this.applyButterflyBehaviorForce(b, leftHandPos, rightHandPos, delta);

            // Apply separation from other butterflies
            this.applyButterflySeparation(b);

            // Apply boundary forces
            this.applyButterflyBoundaryForce(b);

            // Apply physics
            this.applyButterflyPhysics(b, delta);

            // Update rotation
            this.updateButterflyRotation(b, delta);

            // Update wing animation speed based on behavior
            this.updateButterflyWingAnimation(b, delta);

            // Update mixer
            b.mixer?.update(delta);

            // Update group transform
            b.group.position.copy(b.position);
            b.group.rotation.set(b.smoothedPitch, b.smoothedYaw, b.smoothedRoll);
        }

        // Resolve collisions
        this.resolveCollisions(this.butterflies, 2.0, 1);
    }

    private updateButterflyBehavior(
        b: Butterfly,
        delta: number,
        leftHand: THREE.Vector3 | null,
        rightHand: THREE.Vector3 | null,
        isLeftFast: boolean,
        isRightFast: boolean
    ) {
        b.behaviorTimer -= delta;

        // Decay startle
        if (b.startleIntensity > 0) {
            b.startleIntensity -= delta / this.BUTTERFLY_STARTLE_DURATION;
            if (b.startleIntensity <= 0) {
                b.startleIntensity = 0;
                b.behavior = 'DRIFTING';
                b.behaviorTimer = 1;
            }
        }

        const targetHand = b.trackingTarget === 'leftHand' ? leftHand :
            b.trackingTarget === 'rightHand' ? rightHand : null;
        const handIsFast = b.trackingTarget === 'leftHand' ? isLeftFast : isRightFast;
        const handVel = b.trackingTarget === 'leftHand' ? this.handVelocityLeft : this.handVelocityRight;

        // Check for startle - butterflies are VERY easily startled by hand movement
        if (targetHand && b.behavior !== 'STARTLED') {
            const distToHand = b.position.distanceTo(targetHand);
            const handSpeed = (b.trackingTarget === 'leftHand' ? this.handVelocityLeft : this.handVelocityRight).length() * 60;

            // Full startle on fast movement
            if (handIsFast && distToHand < this.BUTTERFLY_STARTLE_RADIUS) {
                b.behavior = 'STARTLED';
                b.startleIntensity = 1.0;
                b.behaviorTimer = this.BUTTERFLY_STARTLE_DURATION;

                b.fleeDirection.copy(handVel).negate().normalize();
                b.fleeDirection.x += (Math.random() - 0.5) * 1.0;
                b.fleeDirection.y += Math.random() * 0.5 + 0.3;
                b.fleeDirection.z += (Math.random() - 0.5) * 0.4;
                b.fleeDirection.normalize();

                b.startleIntensity *= (2 - b.boldness);
                return;
            }

            // Light scatter on even slow hand movement - butterflies near hand flee
            if (handSpeed > this.BUTTERFLY_SCATTER_THRESHOLD &&
                distToHand < this.BUTTERFLY_STARTLE_RADIUS * 0.6 &&
                (b.behavior === 'CURIOUS' || b.behavior === 'PERCHING' || b.behavior === 'FLUTTERING')) {
                b.behavior = 'STARTLED';
                b.startleIntensity = 0.5;
                b.behaviorTimer = this.BUTTERFLY_STARTLE_DURATION * 0.6;

                // Scatter in random direction away from hand
                b.fleeDirection.set(
                    b.position.x - targetHand.x + (Math.random() - 0.5) * 2,
                    Math.abs(b.position.y - targetHand.y) + Math.random() * 2,
                    b.position.z - targetHand.z + (Math.random() - 0.5) * 1
                ).normalize();
                return;
            }
        }

        // Expire creature-to-creature interaction behaviors
        if ((b.behavior === 'FOLLOWING_CHAIN' || b.behavior === 'SPIRAL_DANCE') && b.behaviorTimer <= 0) {
            b.chainLeader = null;
            b.spiralPartner = null;
            b.behavior = 'FLUTTERING';
            b.behaviorTimer = 1 + Math.random() * 2;
        }

        // Behavior state machine
        if (b.behavior !== 'STARTLED' && b.behaviorTimer <= 0) {
            const rand = Math.random();

            if (targetHand) {
                const distToHand = b.position.distanceTo(targetHand);

                if (distToHand < this.BUTTERFLY_PERCH_RADIUS && rand < b.restfulness * 0.4) {
                    // Very close to hand - might perch
                    b.behavior = 'PERCHING';
                    b.behaviorTimer = 2 + Math.random() * 4;
                } else if (distToHand < this.BUTTERFLY_CURIOSITY_RADIUS) {
                    if (rand < b.curiosity * b.boldness * 0.5) {
                        b.behavior = 'CURIOUS';
                        b.behaviorTimer = 2 + Math.random() * 3;
                    } else if (rand < 0.6) {
                        b.behavior = 'FLUTTERING';
                        b.behaviorTimer = 1.5 + Math.random() * 2;
                    } else {
                        b.behavior = 'GLIDING'; b.glideTimer = 0;
                        b.behaviorTimer = 1 + Math.random() * 2;
                    }
                } else {
                    if (rand < 0.4) {
                        b.behavior = 'DRIFTING';
                        b.behaviorTimer = 3 + Math.random() * 4;
                    } else if (rand < 0.7) {
                        b.behavior = 'FLUTTERING';
                        b.behaviorTimer = 2 + Math.random() * 3;
                    } else {
                        b.behavior = 'GLIDING'; b.glideTimer = 0;
                        b.behaviorTimer = 1.5 + Math.random() * 2.5;
                    }
                }
            } else {
                // No hand detected
                if (rand < 0.4) {
                    b.behavior = 'DRIFTING';
                    b.behaviorTimer = 3 + Math.random() * 5;
                } else if (rand < 0.7) {
                    b.behavior = 'FLUTTERING';
                    b.behaviorTimer = 2 + Math.random() * 3;
                } else {
                    b.behavior = 'GLIDING'; b.glideTimer = 0;
                    b.behaviorTimer = 2 + Math.random() * 3;
                }
            }
        }
    }

    private applyButterflyBehaviorForce(
        b: Butterfly,
        leftHand: THREE.Vector3 | null,
        rightHand: THREE.Vector3 | null,
        delta: number
    ) {
        const targetHand = b.trackingTarget === 'leftHand' ? leftHand :
            b.trackingTarget === 'rightHand' ? rightHand : null;

        // Update drift phase for natural meandering
        b.driftPhase += delta * this.BUTTERFLY_DRIFT_FREQUENCY * Math.PI * 2;

        // Reusable temp vectors to avoid allocations
        const tv1 = this._tmpVec1;
        const tv2 = this._tmpVec2;

        switch (b.behavior) {
            case 'STARTLED': {
                // Erratic omega-turn escape - butterflies make rapid random direction changes
                const fleeStr = this.BUTTERFLY_MAX_SPEED * 1.2 * b.startleIntensity;
                tv1.copy(b.fleeDirection).multiplyScalar(fleeStr);

                // Rapid random direction changes (omega turns), not smooth sine waves
                // Change direction sharply every ~0.15s
                const turnPhase = Math.floor(this.time * 7 + b.phase * 3);
                const seed = Math.sin(turnPhase * 127.1 + b.phase * 311.7);
                const seed2 = Math.cos(turnPhase * 269.5 + b.phase * 183.3);
                tv1.x += seed * 6 * b.startleIntensity;
                tv1.y += Math.abs(seed2) * 4 * b.startleIntensity; // Tend upward
                tv1.z += seed2 * 3 * b.startleIntensity;

                b.acceleration.add(tv1);
                break;
            }

            case 'CURIOUS': {
                const activeHand = targetHand || leftHand || rightHand;
                if (activeHand) {
                    // Butterfly approaches hand with wandering offset - close but not rigid
                    const bIdx = b.index;
                    const wanderAngle = this.time * 0.3 + bIdx * 1.7 + b.phase * 5;
                    const orbitRadius = 3.0 + Math.sin(this.time * 0.2 + b.phase) * 1.0;

                    tv1.set(
                        Math.cos(wanderAngle) * orbitRadius,
                        Math.sin(wanderAngle * 0.3 + b.phase) * 1.2 + ((bIdx % 3) - 1) * 0.8,
                        Math.sin(wanderAngle * 0.7) * orbitRadius * 0.2
                    );
                    tv2.copy(activeHand).add(tv1).sub(b.position);

                    // Spring-damper: strong enough to reach hand, damped to not oscillate
                    b.acceleration.addScaledVector(tv2, 10);
                    b.acceleration.addScaledVector(b.velocity, -5);
                } else {
                    b.behavior = 'DRIFTING';
                }
                break;
            }

            case 'PERCHING': {
                // Landing approach - slow descent then hold
                const activeHand = targetHand || leftHand || rightHand;
                if (activeHand) {
                    const bIdx = b.index;
                    // Tiny offset to spread perched butterflies
                    tv1.set(
                        ((bIdx % 3) - 1) * 1.2,
                        Math.sin(this.time * 0.8 + b.phase) * 0.08, // Very subtle breathing
                        ((bIdx % 2) - 0.5) * 0.5
                    );
                    tv2.copy(activeHand).add(tv1).sub(b.position);

                    // Strong spring to hold position
                    b.acceleration.addScaledVector(tv2, 20);
                    // Strong damping for stability
                    b.acceleration.addScaledVector(b.velocity, -8);
                } else {
                    b.behavior = 'DRIFTING';
                    b.behaviorTimer = 0;
                }
                break;
            }

            case 'FLUTTERING': {
                const activeHand = targetHand || leftHand || rightHand;
                if (activeHand) {
                    // Erratic fluttering in the hand area - wider orbit but stays nearby
                    const wanderT = this.time * 0.5 + b.phase * 7;
                    const radius = 4.5 + Math.sin(wanderT * 0.3) * 2.0;
                    const shiftPhase = Math.floor(wanderT * 0.8) * 2.17 + b.phase * 3.1;
                    tv1.set(
                        Math.sin(shiftPhase) * radius,
                        Math.cos(shiftPhase * 0.6 + b.phase) * 1.5 + Math.sin(wanderT) * 1.0,
                        Math.cos(shiftPhase * 1.3) * radius * 0.25
                    );
                    tv2.copy(activeHand).add(tv1).sub(b.position);

                    // Spring-damper to keep near hand while fluttering erratically
                    b.acceleration.addScaledVector(tv2, 8);
                    b.acceleration.addScaledVector(b.velocity, -4);
                } else {
                    // Frantic fluttering - dart between random waypoints across the screen
                    // Same approach as bee FORAGING: strong directional force, no velocity damping
                    // (let physics drag handle damping, just like bees)
                    const waypointPeriod = 4.0 + b.phase * 2.0; // 4-6 seconds - enough time to reach waypoint
                    const waypointIdx = Math.floor(this.time / waypointPeriod + b.phase * 10);
                    // Pseudo-random waypoint position using hash
                    const wpX = Math.sin(waypointIdx * 127.1 + b.phase * 311.7) * 16;
                    const wpY = Math.sin(waypointIdx * 269.5 + b.phase * 183.3) * 9;
                    // Direction toward waypoint
                    tv1.set(wpX - b.position.x, wpY - b.position.y, -b.position.z * 0.15);
                    const wpDist = tv1.length();
                    if (wpDist > 0.1) {
                        // Force must be ~25-30 for butterfly to reach ~4 units/sec with dt=0.016 and drag=0.90
                        // v_steady = F * dt / (1/drag - 1) → F = v * 0.111 / 0.016 ≈ v * 6.94
                        // For 4 units/sec: F ≈ 28
                        const forceScale = wpDist > 5 ? 28 :
                                          wpDist > 2 ? 16 :
                                          6;
                        b.acceleration.addScaledVector(tv1.normalize(), forceScale);
                    }
                    // Light erratic zigzag (much weaker than directional force)
                    b.acceleration.x += Math.sin(this.time * 5 + b.phase * 17) * 1.5;
                    b.acceleration.y += Math.sin(this.time * 3.7 + b.phase * 11) * 1.0;
                    b.acceleration.z += Math.cos(this.time * 4.2 + b.phase * 7) * 0.6;
                }
                break;
            }

            case 'GLIDING': {
                // Graceful spiral descent - wings mostly still, losing altitude naturally
                const activeHand = targetHand || leftHand || rightHand;
                if (activeHand) {
                    tv1.copy(activeHand).sub(b.position);
                    // Spring pull toward hand during glide
                    b.acceleration.addScaledVector(tv1, 4);
                    b.acceleration.addScaledVector(b.velocity, -2);
                }

                // Progressive altitude loss (accelerating descent like real glide)
                b.acceleration.y -= 0.5 + b.glideTimer * 0.3;
                b.glideTimer += delta;

                // Spiral drift during glide - circular path while descending
                const glideAngle = this.time * 1.2 + b.phase;
                b.acceleration.x += Math.cos(glideAngle) * 1.5;
                b.acceleration.z += Math.sin(glideAngle) * 0.8;

                // Very light damping - maintain momentum during glide
                b.acceleration.addScaledVector(b.velocity, -1.0);
                break;
            }

            case 'FOLLOWING_CHAIN': {
                if (b.chainLeader) {
                    // Steer toward position 3 units behind chainLeader's heading direction
                    tv1.copy(b.chainLeader.velocity).normalize().multiplyScalar(-3);
                    tv2.copy(b.chainLeader.position).add(tv1).sub(b.position);
                    b.acceleration.addScaledVector(tv2, 6);
                    b.acceleration.addScaledVector(b.velocity, -3);
                } else {
                    b.behavior = 'FLUTTERING';
                    b.behaviorTimer = 1;
                }
                break;
            }

            case 'SPIRAL_DANCE': {
                if (b.spiralPartner) {
                    // Orbit the midpoint between self and spiralPartner with increasing radius
                    tv1.copy(b.position).add(b.spiralPartner.position).multiplyScalar(0.5); // midpoint
                    const radius = 1.5 + b.behaviorTimer * 0.5; // increasing radius as timer counts down
                    b.spiralPhase += delta * 3;
                    tv2.set(
                        Math.cos(b.spiralPhase) * radius,
                        Math.sin(b.spiralPhase * 0.7) * 0.8,
                        Math.sin(b.spiralPhase) * radius * 0.5
                    );
                    tv1.add(tv2).sub(b.position);
                    b.acceleration.addScaledVector(tv1, 8);
                    b.acceleration.addScaledVector(b.velocity, -4);
                } else {
                    b.behavior = 'FLUTTERING';
                    b.behaviorTimer = 1;
                }
                break;
            }

            case 'DRIFTING':
            default: {
                const activeHand = targetHand || leftHand || rightHand;
                if (activeHand) {
                    // Drift toward the hand area with a wide orbit
                    const bIdx = b.index;
                    const wanderAngle = this.time * 0.2 + bIdx * 2.3 + b.phase * 4;
                    const radius = 5.5 + Math.sin(wanderAngle * 0.4) * 2.0;

                    tv1.set(
                        Math.cos(wanderAngle) * radius,
                        ((bIdx % 3) - 1) * 1.5 + Math.sin(b.driftPhase * 0.3) * 1.0,
                        Math.sin(wanderAngle * 0.6) * radius * 0.2
                    );
                    tv2.copy(activeHand).add(tv1).sub(b.position);

                    // Spring-damper to drift toward hand area
                    b.acceleration.addScaledVector(tv2, 6);
                    b.acceleration.addScaledVector(b.velocity, -3.5);
                } else {
                    // Drifting - pick new random waypoints across screen
                    // Same bee-style approach: directional force, no velocity damping
                    const waypointPeriod = 5.0 + b.phase * 3.0; // 5-8 seconds for slower drifting
                    const waypointIdx = Math.floor(this.time / waypointPeriod + b.phase * 7);
                    const wpX = Math.sin(waypointIdx * 71.3 + b.phase * 191.7) * 16;
                    const wpY = Math.cos(waypointIdx * 113.7 + b.phase * 67.3) * 9;
                    // Direction toward waypoint
                    tv1.set(wpX - b.position.x, wpY - b.position.y, -b.position.z * 0.12);
                    const wpDist2 = tv1.length();
                    if (wpDist2 > 0.1) {
                        // Slightly less force than FLUTTERING for a lazier drift
                        const forceScale2 = wpDist2 > 5 ? 22 :
                                           wpDist2 > 2 ? 12 :
                                           4;
                        b.acceleration.addScaledVector(tv1.normalize(), forceScale2);
                    }
                    // Light erratic zigzag
                    b.acceleration.x += Math.sin(this.time * 4 + b.phase * 13) * 1.2;
                    b.acceleration.y += Math.sin(this.time * 3 + b.phase * 9) * 0.8;
                    b.acceleration.z += Math.cos(this.time * 3.5 + b.phase * 5) * 0.4;
                    // NO velocity damping - let physics drag handle it
                }
                break;
            }
        }
    }

    private applyButterflySeparation(b: Butterfly) {
        const separation = this._tmpVec3;
        separation.set(0, 0, 0);
        let count = 0;

        for (const other of this.butterflies) {
            if (other === b) continue;
            const dist = b.position.distanceTo(other.position);
            if (dist < this.BUTTERFLY_SEPARATION_RADIUS && dist > 0) {
                // Inline subtraction to avoid clone
                const invDist = 1 / dist;
                separation.x += (b.position.x - other.position.x) * invDist * invDist;
                separation.y += (b.position.y - other.position.y) * invDist * invDist;
                separation.z += (b.position.z - other.position.z) * invDist * invDist;
                count++;
            }
        }

        if (count > 0) {
            separation.divideScalar(count);
            separation.normalize().multiplyScalar(this.BUTTERFLY_SEPARATION_WEIGHT);
            b.acceleration.add(separation);
        }
    }

    private applyButterflyBoundaryForce(b: Butterfly) {
        const force = new THREE.Vector3();
        const maxZ = 15;
        const maxX = 22; // Keep butterflies within visible screen area
        const maxY = 14;

        if (b.position.z > maxZ) force.z -= (b.position.z - maxZ) * 0.5;
        if (b.position.z < -maxZ) force.z -= (b.position.z + maxZ) * 0.5;

        // Soft X/Y boundaries so scattered butterflies stay visible
        if (b.position.x > maxX) force.x -= (b.position.x - maxX) * 0.8;
        if (b.position.x < -maxX) force.x -= (b.position.x + maxX) * 0.8;
        if (b.position.y > maxY) force.y -= (b.position.y - maxY) * 0.8;
        if (b.position.y < -maxY) force.y -= (b.position.y + maxY) * 0.8;

        b.acceleration.add(force);
    }

    private applyButterflyPhysics(b: Butterfly, dt: number) {
        let maxSpeed = b.cruiseSpeed;
        let drag = 0.88;

        switch (b.behavior) {
            case 'STARTLED':
                maxSpeed = b.maxSpeed * (1 + b.startleIntensity * 0.5);
                drag = 0.93;
                break;
            case 'CURIOUS':
                maxSpeed = b.cruiseSpeed * 0.6; // Slow down near hand
                drag = 0.88;
                break;
            case 'PERCHING':
                maxSpeed = b.cruiseSpeed * 0.1;
                drag = 0.75;
                break;
            case 'FLUTTERING':
                maxSpeed = b.cruiseSpeed * 2.0; // Fast enough to reach waypoints
                drag = 0.90;
                break;
            case 'GLIDING':
                maxSpeed = b.cruiseSpeed * 0.8;
                drag = 0.93;
                break;
            case 'FOLLOWING_CHAIN':
                maxSpeed = b.cruiseSpeed * 1.0;
                drag = 0.88;
                break;
            case 'SPIRAL_DANCE':
                maxSpeed = b.cruiseSpeed * 0.8;
                drag = 0.85;
                break;
            case 'DRIFTING':
            default:
                maxSpeed = b.cruiseSpeed * 1.8; // Fast enough to reach waypoints
                drag = 0.90;
                break;
        }

        // Limit acceleration - high enough for waypoint travel, lower when calm near hand
        const maxAccel = b.behavior === 'STARTLED' ? 25 :
            b.behavior === 'PERCHING' ? 6 :
            b.behavior === 'CURIOUS' ? 10 :
            b.behavior === 'GLIDING' ? 5 :
            (b.behavior === 'FLUTTERING' || b.behavior === 'DRIFTING') ? 30 : 15;
        if (b.acceleration.length() > maxAccel) {
            b.acceleration.normalize().multiplyScalar(maxAccel);
        }

        // === FLAP-PAUSE RHYTHM ===
        // Butterflies alternate between frantic flapping (upward lift + erratic thrust)
        // and brief pausing (sinking). Creates the jittery, unpredictable flight.
        const flapCycle = this.BUTTERFLY_FLAP_CYCLE * (0.8 + b.phase * 0.4);
        const flapT = ((this.time + b.phase * 10) % flapCycle) / flapCycle;
        const isFlapping = flapT < 0.6; // 60% flapping, 40% pausing

        // Suppress frantic movement when calm near hand (CURIOUS/PERCHING)
        const isCalm = b.behavior === 'CURIOUS' || b.behavior === 'PERCHING';

        if (b.behavior !== 'PERCHING' && b.behavior !== 'STARTLED') {
            if (isFlapping) {
                // Active flap: lift + erratic horizontal bursts
                // Reduced so it doesn't overpower directional waypoint travel
                const flapStrength = isCalm ? 1.2 : 2.0;
                b.acceleration.y += flapStrength;
                // Erratic zigzag - weaker so directional force dominates
                const zigzagStr = isCalm ? 0.5 : 1.2;
                const zigzag = Math.sin(this.time * 7 + b.phase * 17) * zigzagStr;
                b.acceleration.x += zigzag;
                b.acceleration.z += Math.cos(this.time * 5.5 + b.phase * 13) * zigzagStr * 0.4;
                // Occasional sharp direction change (reduced to not fight waypoint travel)
                if (!isCalm && Math.sin(this.time * 3.7 + b.phase * 23) > 0.85) {
                    b.acceleration.x += (Math.random() - 0.5) * 2.0;
                    b.acceleration.y += (Math.random() - 0.3) * 1.5;
                }
            } else {
                // Pause: sink and coast (reduced sink so butterflies don't lose altitude constantly)
                const sinkStr = isCalm ? 0.8 : 1.2;
                b.acceleration.y -= sinkStr;
                drag *= 0.95;
            }
        }

        b.velocity.add(b.acceleration.clone().multiplyScalar(dt));
        b.velocity.multiplyScalar(drag);

        const speed = b.velocity.length();
        if (speed > maxSpeed) {
            b.velocity.normalize().multiplyScalar(maxSpeed);
        }

        // Butterflies are always moving unless perching - minimum frantic speed
        const minSpeed = b.behavior === 'PERCHING' ? 0 :
            b.behavior === 'CURIOUS' ? 0.3 : 0.5;
        if (speed < minSpeed && b.behavior !== 'STARTLED' && b.behavior !== 'PERCHING') {
            if (speed > 0.01) {
                b.velocity.normalize().multiplyScalar(minSpeed);
            } else {
                b.velocity.set(
                    (Math.random() - 0.5),
                    (Math.random() - 0.5) * 0.3,
                    (Math.random() - 0.5)
                ).normalize().multiplyScalar(minSpeed);
            }
        }

        b.position.add(b.velocity.clone().multiplyScalar(dt));

        // Hard Z boundaries
        const maxZHard = 20;
        if (b.position.z > maxZHard) { b.position.z = maxZHard; b.velocity.z *= -0.3; }
        if (b.position.z < -maxZHard) { b.position.z = -maxZHard; b.velocity.z *= -0.3; }
    }

    private updateButterflyRotation(b: Butterfly, dt: number) {
        const speed = b.velocity.length();
        const turnSmooth = dt * 3.5; // Butterflies turn more slowly/gracefully

        // Yaw: face movement direction
        let targetYaw = b.smoothedYaw;
        if (speed > 0.1) {
            targetYaw = Math.atan2(b.velocity.x, b.velocity.z);
        }

        // Pitch: gentle tilt
        let targetPitch = 0;
        if (speed > 0.1) {
            const horizontalSpeed = Math.sqrt(b.velocity.x ** 2 + b.velocity.z ** 2);
            targetPitch = Math.atan2(-b.velocity.y, Math.max(horizontalSpeed, 0.1)) * 0.25;
        }

        // Roll: gentle banking + characteristic butterfly wobble
        let targetRoll = Math.sin(this.time * 4 + b.phase) * 0.08; // Gentle wobble
        if (speed > 0.2) {
            const yawDiff = targetYaw - b.smoothedYaw;
            const normalizedDiff = Math.atan2(Math.sin(yawDiff), Math.cos(yawDiff));
            targetRoll += normalizedDiff * 0.35; // More banking than bees
        }

        // Extra roll wobble during fluttering
        if (b.behavior === 'FLUTTERING') {
            targetRoll += Math.sin(this.time * 6 + b.phase * 2) * 0.15;
        }

        // Perching: level out
        if (b.behavior === 'PERCHING') {
            targetPitch *= 0.2;
            targetRoll *= 0.2;
        }

        b.smoothedYaw += (targetYaw - b.smoothedYaw) * turnSmooth;
        b.smoothedPitch += (targetPitch - b.smoothedPitch) * turnSmooth * 0.5;
        b.smoothedRoll += (targetRoll - b.smoothedRoll) * turnSmooth * 0.7;
    }

    private updateButterflyWingAnimation(b: Butterfly, delta: number) {
        // Butterfly wings always beat fast - even when perching they flutter rapidly
        switch (b.behavior) {
            case 'PERCHING':
                b.targetWingSpeed = this.BUTTERFLY_WING_FREQUENCY * 0.7; // Slightly slower at rest but still fast
                break;
            case 'GLIDING':
                b.targetWingSpeed = this.BUTTERFLY_WING_FREQUENCY * 0.8; // Fast even during glide
                break;
            case 'STARTLED':
                b.targetWingSpeed = this.BUTTERFLY_WING_FREQUENCY * 1.5; // Extra rapid panic
                break;
            default:
                b.targetWingSpeed = this.BUTTERFLY_WING_FREQUENCY; // Always fast
                break;
        }

        // Smooth wing speed transition
        b.wingSpeed += (b.targetWingSpeed - b.wingSpeed) * delta * 3;

        // Update animation timeScale
        if (b.action) {
            const clip = b.action.getClip();
            const baseTimeScale = clip.duration > 0.1
                ? b.wingSpeed * clip.duration
                : b.wingSpeed / 5;
            b.action.timeScale = Math.max(0.2, Math.min(baseTimeScale, 30));
        }

        // Update glow based on behavior
        const glowIntensity = b.behavior === 'CURIOUS' ? 0.3 :
            b.behavior === 'PERCHING' ? 0.1 :
            b.behavior === 'STARTLED' ? 0.4 : 0.15;

        for (const mesh of b.glowMeshes) {
            if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity !== undefined) {
                const mat = mesh.material as THREE.MeshStandardMaterial;
                mat.emissiveIntensity += (glowIntensity - mat.emissiveIntensity) * delta * 3;
            }
        }
    }

    // ========================================
    // PUBLIC METHODS
    // ========================================

    public setMode(mode: CreatureMode) {
        if (mode === this.currentMode && this.transitionState === 'idle') return;

        // If already transitioning, just update the pending mode
        if (this.transitionState !== 'idle') {
            this.pendingMode = mode;
            return;
        }

        // Start exit transition
        this.pendingMode = mode;
        this.transitionState = 'exiting';
        this.transitionTimer = 0;
        this.animateCreaturesToEdges();
    }

    public get isTransitioning(): boolean {
        return this.transitionState !== 'idle';
    }

    public resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
    }

    public destroy() {
        this.clearCreatures();
        this.handIndicators.left?.remove();
        this.handIndicators.right?.remove();

        // Dispose all scene objects
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry?.dispose();
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else if (object.material) {
                    object.material.dispose();
                }
            }
        });

        // Clear scene
        while (this.scene.children.length > 0) {
            this.scene.remove(this.scene.children[0]);
        }

        // Dispose models
        this.birdModel = null;
        this.fishModel = null;
        this.beeModel = null;
        this.butterflyModel = null;

        this.composer.dispose();
        this.renderer.dispose();
        this.renderer.forceContextLoss();
        this.renderer.domElement.remove();
    }
}
