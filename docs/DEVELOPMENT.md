# Nature Mirror - Development Guide

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern browser with WebGL support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd "Nature Mirror 2"

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Code Architecture

### Entry Point Flow

```
main.tsx
  └── App.tsx
        └── NatureMirror.tsx
              ├── VisionManager (hand tracking)
              └── Creature3DRenderer (3D graphics)
```

### Key Classes

#### VisionManager

Manages MediaPipe hand tracking and webcam.

```typescript
class VisionManager {
    // Initialize camera and MediaPipe
    async initialize(): Promise<void>

    // Get current tracking data
    getTrackingData(): TrackingData

    // Cleanup resources
    dispose(): void
}
```

#### Creature3DRenderer

Manages all 3D creatures and rendering.

```typescript
class Creature3DRenderer {
    // Set creature mode
    setMode(mode: CreatureMode): void  // 'BIRDS' | 'FISH' | 'BEES'

    // Update tracking data from vision
    setTrackingData(data: TrackingData): void

    // Main update loop (called each frame)
    update(dt: number): void

    // Cleanup
    dispose(): void
}
```

## Adding New Creature Types

### 1. Define the Creature Interface

```typescript
interface NewCreature {
    group: THREE.Group;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    acceleration: THREE.Vector3;
    behavior: NewCreatureBehavior;
    // ... creature-specific properties
}
```

### 2. Create the Creature

```typescript
private createNewCreatures() {
    // Load model or create procedural geometry
    // Initialize creature properties
    // Add to scene
}
```

### 3. Update Logic

```typescript
private updateAllNewCreatures(delta: number) {
    for (const creature of this.newCreatures) {
        // Update behavior state
        // Calculate forces
        // Apply physics
        // Resolve collisions
    }
}
```

### 4. Collision Resolution

```typescript
private resolveNewCreatureCollisions() {
    const minDistance = 3.0;

    for (let iter = 0; iter < 3; iter++) {
        for (let i = 0; i < creatures.length; i++) {
            for (let j = i + 1; j < creatures.length; j++) {
                // Position-based collision resolution
            }
        }
    }
}
```

## Physics System

### Spring-Damper Model

Creatures use spring-damper physics for smooth movement:

```typescript
// Calculate spring force toward target
const toTarget = target.clone().sub(position);
const springForce = toTarget.multiplyScalar(springStrength);

// Apply damping
const damping = velocity.clone().multiplyScalar(-dampingFactor);

// Update acceleration
acceleration.add(springForce).add(damping);
```

### Position-Based Collision

Unlike force-based collision (which causes oscillation), position-based collision directly moves overlapping creatures apart:

```typescript
// After physics update
for each creature pair (i, j):
    diff = position[i] - position[j]
    dist = diff.length()

    if dist < minDistance:
        overlap = minDistance - dist
        pushDir = diff.normalize()

        // Push apart equally
        position[i] += pushDir * overlap * 0.5
        position[j] -= pushDir * overlap * 0.5
```

## Behavior State Machine

Each creature type has a behavior state machine:

```
          ┌──────────────────────┐
          │      HOVERING        │
          └──────────┬───────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │ CURIOUS │  │ DARTING │  │ FEEDING │
   └────┬────┘  └────┬────┘  └────┬────┘
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
              ┌───────────┐
              │ STARTLED  │ (on fast hand movement)
              └─────┬─────┘
                    │
                    ▼
              ┌───────────┐
              │ RETURNING │
              └───────────┘
```

## Performance Tips

1. **Object Pooling**: Reuse creature objects instead of creating/destroying
2. **LOD**: Use simpler models for distant creatures
3. **Frustum Culling**: Don't update creatures outside camera view
4. **Batch Rendering**: Use instanced meshes for many similar creatures
5. **Throttle Hand Tracking**: Process every other frame if needed

## Debugging

### Enable Debug Visualization

```typescript
// In Creature3DRenderer
private debug = true;

// Add debug helpers
if (this.debug) {
    // Draw collision radii
    // Show velocity vectors
    // Display behavior states
}
```

### Console Logging

```typescript
// Log creature states
console.log('Bird states:', this.hummingbirds.map(b => b.behavior));

// Log tracking data
console.log('Tracking:', this.tracking);
```

## Common Issues

### Creatures Not Following Hand
1. Check `tracking.leftHand` / `tracking.rightHand` is not null
2. Verify confidence threshold (default: 0.3)
3. Ensure `screenTo3D` mapping is correct

### Creatures Clustering
1. Verify collision resolution is called after physics
2. Check `minDistance` value
3. Ensure collision iterations are sufficient (3+)

### Creatures Jumping/Oscillating
1. Make sure using position-based (not force-based) collision
2. Reduce spring strength
3. Increase damping factor

### Performance Issues
1. Reduce creature count
2. Lower pixel ratio
3. Disable post-processing (bloom)
4. Use simpler models
