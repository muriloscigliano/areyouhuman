<template>
  <div ref="containerRef" class="pixel-canvas-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useGsap } from '../composables/useGsap.js';

const props = defineProps({
  colors: {
    type: String,
    default: '#f8fafc,#f1f5f9,#cbd5e1'
  },
  gap: {
    type: Number,
    default: 5
  },
  speed: {
    type: Number,
    default: 35
  },
  shimmerIntensity: {
    type: Number,
    default: 0.3
  },
  noFocus: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  triggerSelector: {
    type: String,
    default: ''
  },
  debug: {
    type: Boolean,
    default: false
  }
});

const containerRef = ref(null);
let pixelCanvasElement = null;
const { gsap, loadScrollTrigger } = useGsap();
let scrollTriggerAnimation = null;

// Define classes at module level (browser only)
let Pixel, PixelCanvas;

if (typeof window !== 'undefined') {
  Pixel = class Pixel {
    constructor(canvas, context, x, y, color, speed, delay, shimmerIntensity = 0.5) {
      this.width = canvas.width;
      this.height = canvas.height;
      this.ctx = context;
      this.x = x;
      this.y = y;
      this.color = color;
      this.speed = this.getRandomValue(0.1, 0.9) * speed;
      this.size = 0;
      this.sizeStep = Math.random() * 0.4;
      this.minSize = 0.5;
      this.maxSizeInteger = 2;
      this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
      this.delay = delay;
      this.counter = 0;
      this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
      this.isIdle = false;
      this.isReverse = false;
      this.isShimmer = false;
      this.shimmerIntensity = shimmerIntensity; // Store intensity for shimmer
    }

    getRandomValue(min, max) {
      return Math.random() * (max - min) + min;
    }

    draw() {
      const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
      this.ctx.fillStyle = this.color;
      this.ctx.fillRect(
        this.x + centerOffset,
        this.y + centerOffset,
        this.size,
        this.size
      );
    }

    appear() {
      this.isIdle = false;
      if (this.counter <= this.delay) {
        this.counter += this.counterStep;
        return;
      }
      if (this.size >= this.maxSize) {
        this.isShimmer = true;
      }
      if (this.isShimmer) {
        this.shimmer();
      } else {
        this.size += this.sizeStep;
      }
      this.draw();
    }

    disappear() {
      this.isShimmer = false;
      this.counter = 0;
      if (this.size <= 0) {
        this.isIdle = true;
        return;
      } else {
        this.size -= 0.1;
      }
      this.draw();
    }

    shimmer() {
      // Calculate shimmer minSize based on intensity
      // Higher intensity (closer to 1) = more flashing (smaller minSize relative to maxSize)
      const shimmerMinSize = this.maxSize * (1 - this.shimmerIntensity);
      
      if (this.size >= this.maxSize) {
        this.isReverse = true;
      } else if (this.size <= shimmerMinSize) {
        this.isReverse = false;
      }
      if (this.isReverse) {
        this.size -= this.speed;
      } else {
        this.size += this.speed;
      }
      this.draw(); // Draw the pixel with updated size for shimmer effect
    }
  };

  PixelCanvas = class PixelCanvas extends HTMLElement {
    static register(tag = "pixel-canvas") {
      if ("customElements" in window && !customElements.get(tag)) {
        customElements.define(tag, PixelCanvas);
      }
    }

    static css = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: absolute;
        top: 0;
        left: 0;
        will-change: auto;
      }
      canvas {
        display: block;
        width: 100%;
        height: 100%;
        will-change: contents;
      }
    `;

    get colors() {
      return this.dataset.colors?.split(",") || ["#f8fafc", "#f1f5f9", "#cbd5e1"];
    }

    get gap() {
      const value = this.dataset.gap || 5;
      const min = 4;
      const max = 50;
      if (value <= min) {
        return min;
      } else if (value >= max) {
        return max;
      } else {
        return parseInt(value);
      }
    }

    get speed() {
      const value = this.dataset.speed || 35;
      const min = 0;
      const max = 100;
      const throttle = 0.001;
      if (value <= min || this.reducedMotion) {
        return min;
      } else if (value >= max) {
        return max * throttle;
      } else {
        return parseInt(value) * throttle;
      }
    }

    get noFocus() {
      return this.hasAttribute("data-no-focus");
    }

    get shimmerIntensity() {
      const value = parseFloat(this.dataset.shimmerIntensity) || 0.5;
      return Math.max(0, Math.min(1, value)); // Clamp between 0 and 1
    }

    connectedCallback() {
      const debug = this.hasAttribute('data-debug');
      if (debug) console.log('PixelCanvas: connectedCallback called');

      this._parent = this.parentNode;
      
      // Force explicit dimensions on the custom element itself
      this.style.display = 'block';
      this.style.position = 'absolute';
      this.style.top = '0';
      this.style.left = '0';
      this.style.right = '0';
      this.style.bottom = '0';
      this.style.width = '100%';
      this.style.height = '100%';
      
      const canvas = document.createElement("canvas");
      const sheet = new CSSStyleSheet();
      this.shadowroot = this.attachShadow({ mode: "open" });
      sheet.replaceSync(PixelCanvas.css);
      this.shadowroot.adoptedStyleSheets = [sheet];
      this.shadowroot.append(canvas);
      this.canvas = this.shadowroot.querySelector("canvas");
      this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
      this.timeInterval = 1000 / 45; // 45fps for smoother performance
      this.timePrevious = performance.now();
      this.reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // Use a more reliable initialization approach
      const initialize = () => {
        // Get parent dimensions first
        const parentRect = this._parent?.getBoundingClientRect();
        const rect = this.getBoundingClientRect();
        
        let width, height;
        
        if (parentRect && parentRect.width > 0 && parentRect.height > 0) {
          width = Math.floor(parentRect.width);
          height = Math.floor(parentRect.height);
        } else if (rect.width > 0 && rect.height > 0) {
          width = Math.floor(rect.width);
          height = Math.floor(rect.height);
        } else {
          // Fallback to viewport
          width = window.innerWidth;
          height = window.innerHeight;
          this.style.width = `${width}px`;
          this.style.height = `${height}px`;
        }
        
        if (debug) console.log('PixelCanvas: Initializing with dimensions', { width, height, parentRect, rect });
        
        if (width > 0 && height > 0) {
          this.init();
        } else {
          console.warn('PixelCanvas: Still no dimensions, retrying...');
          setTimeout(initialize, 100);
        }
      };

      // Wait for next frame, then initialize
      requestAnimationFrame(() => {
        setTimeout(initialize, 50);
      });

      this.resizeObserver = new ResizeObserver(() => {
        // Only reinitialize on resize - redraw static pixels
        setTimeout(() => {
          // Cancel any animations first
          if (this.animation) {
            cancelAnimationFrame(this.animation);
            this.animation = null;
          }
          // Reinitialize (will redraw static pixels)
          initialize();
        }, 10);
      });
      this.resizeObserver.observe(this);
      
      // Don't add hover/focus listeners since we want static pixels
      // if (this._parent) {
      //   this._parent.addEventListener("mouseenter", this);
      //   this._parent.addEventListener("mouseleave", this);
      //   if (!this.noFocus) {
      //     this._parent.addEventListener("focusin", this);
      //     this._parent.addEventListener("focusout", this);
      //   }
      // }
    }

    disconnectedCallback() {
      this.resizeObserver.disconnect();
      // Cancel any animations
      if (this.animation) {
        cancelAnimationFrame(this.animation);
        this.animation = null;
      }
      // Event listeners removed since we're not using them
      // if (this._parent) {
      //   this._parent.removeEventListener("mouseenter", this);
      //   this._parent.removeEventListener("mouseleave", this);
      //   if (!this.noFocus) {
      //     this._parent.removeEventListener("focusin", this);
      //     this._parent.removeEventListener("focusout", this);
      //   }
      // }
      delete this._parent;
    }

    handleEvent(event) {
      this[`on${event.type}`](event);
    }

    onmouseenter() {
      // Disabled - static pixels only
      // this.handleAnimation("appear");
    }

    onmouseleave() {
      // Disabled - static pixels only
      // this.handleAnimation("disappear");
    }

    onfocusin(e) {
      // Disabled - static pixels only
      // if (e.currentTarget.contains(e.relatedTarget)) return;
      // this.handleAnimation("appear");
    }

    onfocusout(e) {
      // Disabled - static pixels only
      // if (e.currentTarget.contains(e.relatedTarget)) return;
      // this.handleAnimation("disappear");
    }

    handleAnimation(name) {
      cancelAnimationFrame(this.animation);
      this.animation = this.animate(name);
    }

    init() {
      // Get dimensions - should already be set by connectedCallback
      const parentRect = this._parent?.getBoundingClientRect();
      const rect = this.getBoundingClientRect();
      
      let width, height;
      
      if (parentRect && parentRect.width > 0 && parentRect.height > 0) {
        width = Math.floor(parentRect.width);
        height = Math.floor(parentRect.height);
      } else if (rect.width > 0 && rect.height > 0) {
        width = Math.floor(rect.width);
        height = Math.floor(rect.height);
      } else {
        width = window.innerWidth;
        height = window.innerHeight;
      }
      
      const debug = this.hasAttribute('data-debug');
      if (debug) console.log('PixelCanvas: init() called with dimensions:', { width, height, parentRect, rect });

      if (width === 0 || height === 0) {
        if (debug) console.warn('PixelCanvas: Skipping init - no dimensions');
        return;
      }

      // Set canvas dimensions
      this.pixels = [];
      this.canvas.width = width;
      this.canvas.height = height;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;

      // Ensure canvas is visible
      this.canvas.style.display = 'block';
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';

      this.createPixels();
      if (debug) console.log('PixelCanvas: Created', this.pixels.length, 'pixels');

      // Initialize pixels at size 0 - will animate in with appear() method
      if (this.pixels.length > 0) {
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        // Set all pixels to size 0 initially - ready for appear animation
        this.pixels.forEach(pixel => {
          pixel.size = 0;
          pixel.isShimmer = false;
          pixel.isIdle = true; // Start idle, will animate when triggered
          pixel.counter = 0; // Reset counter for delay
        });

        if (debug) console.log('PixelCanvas: Pixels initialized for entrance animation', {
          pixelCount: this.pixels.length,
          canvasWidth: this.canvas.width,
          canvasHeight: this.canvas.height
        });
      } else {
        console.error('PixelCanvas: No pixels created!', { width, height, gap: this.gap });
      }
    }

    getDistanceToCanvasCenter(x, y) {
      const dx = x - this.canvas.width / 2;
      const dy = y - this.canvas.height / 2;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance;
    }

    createPixels() {
      for (let x = 0; x < this.canvas.width; x += this.gap) {
        for (let y = 0; y < this.canvas.height; y += this.gap) {
          const color = this.colors[
            Math.floor(Math.random() * this.colors.length)
          ];
          const delay = this.reducedMotion
            ? 0
            : this.getDistanceToCanvasCenter(x, y);
          this.pixels.push(
            new Pixel(this.canvas, this.ctx, x, y, color, this.speed, delay, this.shimmerIntensity)
          );
        }
      }
    }

    animate(fnName) {
      this.animation = requestAnimationFrame(() => this.animate(fnName));

      // Safety check: ensure pixels array exists
      if (!this.pixels || this.pixels.length === 0) {
        const debug = this.hasAttribute('data-debug');
        if (debug) console.warn('PixelCanvas: No pixels to animate');
        cancelAnimationFrame(this.animation);
        return;
      }

      const timeNow = performance.now();
      const timePassed = timeNow - this.timePrevious;
      if (timePassed < this.timeInterval) return;
      this.timePrevious = timeNow - (timePassed % this.timeInterval);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let i = 0; i < this.pixels.length; i++) {
        this.pixels[i][fnName]();
      }
      // Keep animation running for shimmer effect
    }
  };

  // Auto-register when module loads in browser (only if customElements API is available)
  if (typeof window !== 'undefined' && 'customElements' in window && PixelCanvas && typeof PixelCanvas.register === 'function') {
    try {
      PixelCanvas.register();
    } catch (error) {
      console.warn('PixelCanvas: Failed to register custom element', error);
    }
  }
}

onMounted(() => {
  if (typeof window === 'undefined' || props.disabled) {
    if (props.disabled && props.debug) {
      console.log('PixelCanvas: Disabled via prop');
    }
    return;
  }

  if (!containerRef.value) {
    if (props.debug) console.warn('PixelCanvas: Container ref not available');
    return;
  }

  // Ensure custom element is registered
  if (!('customElements' in window) || !customElements.get('pixel-canvas')) {
    if (props.debug) console.warn('PixelCanvas: Custom element not registered, attempting to register...');
    if (PixelCanvas && typeof PixelCanvas.register === 'function') {
      try {
        PixelCanvas.register();
      } catch (error) {
        console.error('PixelCanvas: Failed to register custom element', error);
        return;
      }
    } else {
      console.error('PixelCanvas: PixelCanvas class not available');
      return;
    }
  }

  // Create and append the element
  pixelCanvasElement = document.createElement('pixel-canvas');
  pixelCanvasElement.setAttribute('data-colors', props.colors);
  pixelCanvasElement.setAttribute('data-gap', props.gap.toString());
  pixelCanvasElement.setAttribute('data-speed', props.speed.toString());
  pixelCanvasElement.setAttribute('data-shimmer-intensity', props.shimmerIntensity.toString());
  if (props.noFocus) {
    pixelCanvasElement.setAttribute('data-no-focus', '');
  }
  if (props.debug) {
    pixelCanvasElement.setAttribute('data-debug', '');
  }

  try {
    containerRef.value.appendChild(pixelCanvasElement);
    if (props.debug) console.log('PixelCanvas: Element created and appended');
  } catch (error) {
    console.error('PixelCanvas: Failed to append element', error);
    return;
  }

  // Setup ScrollTrigger entrance animation
  setupScrollTrigger();
});

const setupScrollTrigger = async () => {
  if (typeof window === 'undefined' || props.disabled) return;
  
  try {
    await nextTick();
    
    // Load ScrollTrigger
    const ScrollTrigger = await loadScrollTrigger();
    if (!ScrollTrigger) {
      if (props.debug) console.warn('PixelCanvas: ScrollTrigger not available');
      return;
    }

    // Register ScrollTrigger
    try {
      gsap.registerPlugin(ScrollTrigger);
    } catch (e) {
      // Already registered, ignore
    }

    // Wait for element to be ready
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!pixelCanvasElement || !containerRef.value) {
      if (props.debug) console.warn('PixelCanvas: Elements not ready');
      return;
    }
    
    // Find parent section - use triggerSelector if provided
    let parentSection;
    if (props.triggerSelector) {
      parentSection = containerRef.value.closest(props.triggerSelector);
    }

    if (!parentSection) {
      parentSection = containerRef.value.closest('.statement-section');
    }

    if (!parentSection) {
      parentSection = containerRef.value.closest('section');
    }

    if (!parentSection) {
      if (props.debug) console.warn('PixelCanvas: Parent section not found');
      return;
    }

    if (props.debug) console.log('PixelCanvas: Using trigger section:', parentSection.className || parentSection.tagName);

    let appearAnimationFrame = null;
    let hasTriggered = false;

    const runAppearAnimation = () => {
      if (hasTriggered) return;
      hasTriggered = true;

      if (!pixelCanvasElement || !pixelCanvasElement.pixels || !pixelCanvasElement.ctx) {
        if (props.debug) console.warn('PixelCanvas: Cannot run appear animation - element not ready');
        return;
      }

      if (props.debug) console.log('PixelCanvas: Starting appear animation');
      
      // Cancel any existing animations
      if (appearAnimationFrame) {
        cancelAnimationFrame(appearAnimationFrame);
      }
      if (pixelCanvasElement.animation) {
        cancelAnimationFrame(pixelCanvasElement.animation);
        pixelCanvasElement.animation = null;
      }
      
      // Reset all pixels
      pixelCanvasElement.pixels.forEach(pixel => {
        pixel.size = 0;
        pixel.isShimmer = false;
        pixel.isIdle = true;
        pixel.counter = 0;
      });
      
      // Animation loop
      const animateAppear = () => {
        if (!pixelCanvasElement || !pixelCanvasElement.pixels) return;
        
        // Clear canvas
        pixelCanvasElement.ctx.clearRect(0, 0, pixelCanvasElement.canvas.width, pixelCanvasElement.canvas.height);
        
        // Check if all pixels have appeared
        let allDone = true;
        pixelCanvasElement.pixels.forEach(pixel => {
          pixel.appear();
          // Pixel is done appearing when isShimmer is true (set when size >= maxSize)
          if (!pixel.isShimmer) {
            allDone = false;
          }
        });
        
        if (!allDone) {
          // Continue animation
          appearAnimationFrame = requestAnimationFrame(animateAppear);
        } else {
          // All pixels appeared - start shimmer
          if (props.debug) console.log('PixelCanvas: All pixels appeared, starting shimmer');
          appearAnimationFrame = null;

          // Enable shimmer on all pixels
          pixelCanvasElement.pixels.forEach(pixel => {
            pixel.isShimmer = true;
          });

          // Start shimmer animation loop
          if (typeof pixelCanvasElement.handleAnimation === 'function') {
            pixelCanvasElement.handleAnimation('shimmer');
          }
        }
      };
      
      // Start animation
      animateAppear();
    };
    
    // Check if already in viewport
    const checkInView = () => {
      const rect = parentSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      return rect.top < viewportHeight * 0.7 && rect.bottom > 0;
    };
    
    // Create ScrollTrigger
    scrollTriggerAnimation = ScrollTrigger.create({
      trigger: parentSection,
      start: 'top 70%', // Start when 30% into viewport for better visibility
      once: true,
      onEnter: () => {
        if (props.debug) console.log('PixelCanvas: ScrollTrigger onEnter fired');
        runAppearAnimation();
      }
    });

    // If already in view, trigger immediately
    if (checkInView()) {
      if (props.debug) console.log('PixelCanvas: Already in view, triggering immediately');
      setTimeout(() => {
        runAppearAnimation();
      }, 300);
    }

    if (props.debug) console.log('PixelCanvas: ScrollTrigger setup complete');
  } catch (error) {
    console.error('PixelCanvas: ScrollTrigger setup error', error);
  }
};

onUnmounted(() => {
  // Clean up ScrollTrigger animation
  if (scrollTriggerAnimation && scrollTriggerAnimation.scrollTrigger) {
    scrollTriggerAnimation.scrollTrigger.kill();
    scrollTriggerAnimation.kill();
  }
  
  if (pixelCanvasElement && pixelCanvasElement.parentNode) {
    pixelCanvasElement.parentNode.removeChild(pixelCanvasElement);
  }
});
</script>

<style scoped>
.pixel-canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.pixel-canvas-container :deep(pixel-canvas) {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}
</style>
