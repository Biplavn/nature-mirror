# Nature Mirror - Technical Documentation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │              NatureMirror Component              │   │
│  │  ┌───────────────┐    ┌────────────────────┐   │   │
│  │  │ VisionManager │    │ Creature3DRenderer │   │   │
│  │  │  (MediaPipe)  │───▶│    (Three.js)      │   │   │
│  │  └───────────────┘    └────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React + TypeScript | UI framework |
| 3D Rendering | Three.js | WebGL-based 3D graphics |
| Hand Tracking | MediaPipe Hands | Real-time hand detection |
| Build Tool | Vite | Fast development and bundling |
| Styling | Tailwind CSS | Utility-first CSS |

## Project Structure

```
Nature Mirror 2/
├── docs/                    # Documentation
├── public/
│   └── models/             # 3D GLB model files
│       ├── bee.glb
│       ├── fish.glb
│       └── hummingbird.glb
├── src/
│   ├── components/
│   │   └── NatureMirror.tsx    # Main component
│   ├── core/
│   │   ├── graphics/
│   │   │   └── Creature3DRenderer.ts  # 3D creature system
│   │   └── vision/
│   │       ├── VisionManager.ts       # Hand tracking
│   │       └── types.ts               # Type definitions
│   ├── styles/
│   │   └── global.css
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

## Core Systems

### 1. Vision System (VisionManager.ts)

Handles real-time hand tracking using MediaPipe Hands.

**Key Features:**
- Webcam capture and processing
- Hand landmark detection
- Confidence-based filtering
- Position smoothing

**Output Data:**
```typescript
interface TrackingData {
    leftHand: { x: number; y: number; confidence: number } | null;
    rightHand: { x: number; y: number; confidence: number } | null;
    head: { x: number; y: number } | null;
    bodyCenter: { x: number; y: number } | null;
    hasBody: boolean;
}
```

### 2. Graphics System (Creature3DRenderer.ts)

Manages 3D creature rendering, physics, and behavior.

**Key Components:**

#### Creature Types
- `Hummingbird`: Flying bird with wing animations
- `Fish`: Swimming fish with body undulation
- `Bee`: Flying insect with swarm behavior

#### Physics System
- **Spring-damper model**: Smooth attraction to hand position
- **Position-based collision**: Prevents overlapping without oscillation
- **Boundary constraints**: Keeps creatures in visible area

#### Behavior System
- **State machine**: HOVERING, CURIOUS, STARTLED, etc.
- **Personality traits**: boldness, curiosity, territoriality
- **Natural transitions**: Timer-based state changes

### 3. Collision Resolution

Uses **position-based collision** (not force-based) for smooth separation:

```typescript
// Position-based collision (no oscillation)
for each pair of creatures:
    if distance < minDistance:
        overlap = minDistance - distance
        push each creature apart by overlap/2
```

This approach:
- Resolves overlaps instantly
- Doesn't cause bouncing/jumping
- Runs after physics update
- Multiple iterations for stability

## Performance Considerations

1. **Model optimization**: GLB format for efficient loading
2. **Reduced pixel ratio**: Limited to 1.5x for performance
3. **Half-resolution bloom**: Post-processing optimization
4. **Instanced rendering**: Efficient for multiple creatures
5. **Object pooling**: Reuse creatures instead of creating/destroying

## Screen-to-World Mapping

```typescript
screenTo3D(screenX, screenY): Vector3 {
    // Map screen coordinates to 3D world space
    const x = (screenX / width - 0.5) * 70;  // Horizontal range
    const y = -(screenY / height - 0.5) * 45; // Vertical range
    return new Vector3(x, y, 0);
}
```

## Build & Development

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Future Enhancements

1. **WebXR support**: AR on mobile devices
2. **Sound effects**: Ambient nature sounds
3. **More creatures**: Butterflies, fireflies, etc.
4. **Seasonal themes**: Different creature sets
5. **Multi-user**: Shared experiences
