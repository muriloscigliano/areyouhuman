# WebGL Transition Implementation Guide

## Summary of oscarpico.es Analysis

The website uses:
- **WebGL2 canvas** for transition effects
- **Fixed-position overlay** covering the viewport
- **Z-index management** (BOTTOM: 6, default: 8, TOP: 11)
- **Vue component** (`WebGLScene.vue`) handling the transition
- **Shader-based animations** for smooth page transitions

## Implementation Strategy for Astro + Vue

Since your project uses **Astro** (not Nuxt), we'll create a Vue component that can:
1. Handle section transitions (since Astro is mostly static)
2. Work with future routing if you add `@astrojs/view-transitions`
3. Create smooth WebGL effects for UI interactions

## Step 1: Install Dependencies

```bash
npm install three
```

Three.js makes WebGL easier than raw WebGL2.

## Step 2: Create WebGL Transition Component

See `src/components/WebGLTransition.vue` for the full implementation.

## Step 3: Integration Options

### Option A: Section Transitions (Current Setup)
Use for transitioning between sections on the same page:
- Hero → Chat section
- Chat → Features section
- Any scroll-triggered transitions

### Option B: View Transitions (Future)
If you add Astro View Transitions:
```bash
npm install @astrojs/view-transitions
```

Then integrate WebGLTransition with Astro's view transition events.

## Transition Effects Available

1. **Slide** - Horizontal/vertical slide
2. **Fade** - Opacity transition
3. **Blur** - Blur + fade effect
4. **Morph** - Distortion effect
5. **Reveal** - Curtain reveal effect

## Usage Example

```vue
<template>
  <WebGLTransition
    :active="isTransitioning"
    effect="slide"
    direction="horizontal"
    @complete="onTransitionComplete"
  />
</template>

<script setup>
import { ref } from 'vue';
import WebGLTransition from './WebGLTransition.vue';

const isTransitioning = ref(false);

function startTransition() {
  isTransitioning.value = true;
}

function onTransitionComplete() {
  isTransitioning.value = false;
  // Navigate or update content
}
</script>
```

## Performance Tips

1. **Use `will-change`** CSS property
2. **Limit shader complexity** for 60fps
3. **Disable during mobile** if performance is poor
4. **Use texture caching** for repeated effects

## Next Steps

1. Review the `WebGLTransition.vue` component
2. Test with your current sections
3. Customize shader effects to match your brand
4. Consider adding smooth scroll library (Lenis) for better UX

