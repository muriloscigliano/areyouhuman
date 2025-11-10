# Lenis Smooth Scroll Setup

## Overview
Lenis smooth scrolling is now integrated with GSAP for a polished scroll experience.

## Key Features
- ✅ Integrated with GSAP ScrollTrigger
- ✅ Automatically disabled on mobile devices (< 768px)
- ✅ Simple, performant configuration
- ✅ Clean composable pattern

## Implementation

### Composable: `src/composables/useLenis.js`
- Mobile detection via user agent and screen width
- GSAP ticker integration for optimal performance
- Clean destroy method for cleanup

### Settings
```js
{
  duration: 1.2,              // Smooth transition duration
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2
}
```

### Mobile Detection
Lenis is automatically disabled when:
- Screen width < 768px
- Mobile user agent detected

### Usage with ScrollTrigger
GSAP ScrollTrigger is automatically synced:
```js
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
```

## GSAP Usage Review

### Current GSAP Implementation
- **AreYouHuman.vue**: Character animations, drag interactions, pulse effects
- **HeroSection.vue**: Title/logo character animations
- **StatementSection.vue**: Scroll-triggered text animations
- **AnimatedGradientBackground.vue**: WebGL uniform animations
- **WhatWeDoSections.vue**: Section entrance animations
- **WebGLPortalTransition.vue**: Transition progress animations

### Performance Notes
- All ScrollTriggers properly killed on component unmount
- GSAP ticker used for Lenis integration (no duplicate RAF loops)
- Lag smoothing disabled for smooth scroll

## Testing
Build successful with no errors. Lenis composable loads automatically on page mount.

## Component Architecture Changes

### Migrated to Astro (Static):
- FooterSection
- WhatWeBuildSection  
- FrameworkAuditSection
- WhatWeDoSection
- WhatWeDoSections

**Why**: No interactivity needed, better performance with server-rendered HTML

### Kept as Vue (Interactive):
- AreYouHuman (drag slider)
- HeroSection (character animations)
- StatementSection (ScrollTrigger animations)
- AI Chat components

**Result**: ~11KB JS reduction + faster page load

## Next Steps
If you need to:
- Adjust scroll speed: Change `duration` in useLenis.js
- Change easing: Modify the `easing` function
- Disable on specific elements: Add `data-lenis-prevent` attribute
- Stop scrolling programmatically: Call `lenis.stop()`

