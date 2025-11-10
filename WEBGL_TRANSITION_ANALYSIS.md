# WebGL Transition Analysis - oscarpico.es

## Overview
The website uses a **WebGL2 canvas** inside a `.wrapper-scene` div to create smooth page transitions. The transition effect is rendered using WebGL shaders on a full-screen canvas overlay.

## Key Findings

### HTML Structure
```html
<div class="app__wrapper">
  <div class="wrapper-scene">
    <canvas width="1200" height="1946"></canvas>
  </div>
  <!-- Page content -->
</div>
```

### CSS Implementation

**Wrapper Scene:**
- `position: relative`
- `z-index: 8` (default)
- `z-index: 6` (when `.BOTTOM` class applied)
- `z-index: 11` (when `.TOP` class applied)
- `pointer-events: none` (allows clicks to pass through)
- `transition: all` (enables CSS transitions)
- `height: 0px` (collapsed by default)
- `width: 1200px` (fixed width)
- `overflow: visible`

**Canvas:**
- `position: fixed`
- `width: 100%`
- `height: 100%`
- `top: 0px`
- `left: 0px`
- Full viewport coverage
- WebGL2 context enabled

### Technical Stack
- **Framework**: Nuxt.js (Vue.js)
- **Component**: `WebGLScene.vue`
- **WebGL**: WebGL2 context
- **Smooth Scrolling**: Lenis library (`lenis lenis-smooth` classes)

### How the Transition Works

1. **Canvas Overlay**: A fixed-position canvas covers the entire viewport
2. **Z-Index Management**: The wrapper-scene uses different z-index values to control layering during transitions
3. **WebGL Rendering**: The canvas renders WebGL shader effects (likely a transition mask/shader)
4. **State Classes**: Classes like `.BOTTOM` and `.TOP` control the z-index positioning
5. **CSS Transitions**: The `transition: all` property animates CSS changes smoothly

### Implementation Approach

The transition likely works as follows:

1. **On Navigation**:
   - WebGLScene component detects route change
   - Canvas renders a transition shader effect (e.g., slide, fade, or morphing effect)
   - Z-index is adjusted to bring the scene to the top
   - Height/opacity may be animated via CSS or WebGL

2. **During Transition**:
   - WebGL shader animates the transition effect
   - The canvas acts as an overlay between pages
   - Content behind is captured or rendered to texture

3. **After Transition**:
   - Transition completes
   - Z-index returns to normal
   - Canvas may be hidden or reset

### Key CSS Classes

- `.wrapper-scene` - Base container
- `.wrapper-scene.BOTTOM` - Lower z-index (z-index: 6)
- `.wrapper-scene.TOP` - Higher z-index (z-index: 11)

### Recommended Implementation Strategy

To replicate this effect:

1. **Create WebGL Scene Component**:
   - Vue component with canvas element
   - Initialize WebGL2 context
   - Create shader programs for transition effects

2. **Transition Shader**:
   - Vertex shader for geometry
   - Fragment shader for visual effect (slide, fade, morph, etc.)
   - Uniforms for animation progress (0.0 to 1.0)

3. **Route Integration**:
   - Hook into Vue Router navigation
   - Trigger transition on route change
   - Animate shader uniforms during transition

4. **CSS Setup**:
   - Fixed position canvas overlay
   - Z-index management
   - Pointer-events: none to allow interaction

5. **Animation Loop**:
   - RequestAnimationFrame for smooth rendering
   - Update shader uniforms based on transition progress
   - Clean up after transition completes

### Libraries That Could Help

- **Three.js** - Easier WebGL abstraction (optional, raw WebGL2 works too)
- **GSAP** - Animation timeline management (already installed)
- **Lenis** - Smooth scrolling (can be added)
- **Vue Router** - Navigation hooks (if adding client-side routing)

### Implementation Created

I've created a `WebGLTransition.vue` component that:
- Uses raw WebGL2 (no Three.js dependency)
- Supports 5 transition effects (slide, fade, blur, morph, reveal)
- Works with Vue 3 Composition API
- Handles canvas resizing and cleanup
- Falls back gracefully if WebGL isn't available
- Matches the oscarpico.es structure with z-index management

### Performance Considerations

- Use `will-change` CSS property for optimization
- Render at device pixel ratio for crisp visuals
- Use texture caching for page captures
- Optimize shader complexity for 60fps

