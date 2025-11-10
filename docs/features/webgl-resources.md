# WebGL Transition Effect - Tutorial Resources

## What Is This Effect?

This is a **WebGL Shader-Based Page Transition Overlay**. It's also called:
- **WebGL Page Transition**
- **Shader Transition Effect**
- **Canvas Overlay Transition**
- **WebGL Mask Transition**

### How It Works

1. **Canvas Overlay**: A full-screen WebGL canvas sits on top of your content
2. **Shader Rendering**: Fragment shaders create the visual transition effect
3. **Animation**: The shader uniforms animate from 0 to 1 to create the transition
4. **Z-Index Management**: The overlay moves between layers during transitions

## Best Tutorials & Resources

### 1. **WebGL Fundamentals** (Start Here!)
**Website**: https://webglfundamentals.org/
- Complete beginner-to-advanced WebGL course
- Explains shaders, uniforms, and rendering
- Free and comprehensive
- **Key Sections**:
  - "2D Image Processing" (for transition effects)
  - "Shaders and GLSL"
  - "Textures"

### 2. **The Book of Shaders**
**Website**: https://thebookofshaders.com/
- Beautiful interactive guide to GLSL shaders
- Perfect for understanding fragment shaders
- **Key Chapters**:
  - Chapter 1: "Hello World"
  - Chapter 3: "Uniforms"
  - Chapter 6: "Color"
  - Chapter 8: "Patterns" (for transition patterns)

### 3. **Three.js Journey** (If Using Three.js)
**Website**: https://threejs-journey.com/
- Paid but excellent course
- Covers WebGL transitions and effects
- Section on "Page Transitions"

### 4. **Codrops Tutorials**
**Website**: https://tympanus.net/codrops/
- Search for "WebGL transition" or "shader transition"
- Real-world examples with code
- **Specific Tutorials**:
  - "WebGL Image Transitions"
  - "Shader-based Image Transitions"

### 5. **YouTube Channels**

**Bruno Simon - Three.js Journey**
- YouTube: Search "Bruno Simon WebGL transitions"
- Great visual explanations

**The Art of Code**
- YouTube: https://www.youtube.com/c/TheArtofCodeIsCool
- Shader programming tutorials
- Explains GLSL concepts visually

**SimonDev**
- YouTube: https://www.youtube.com/c/SimonDev
- WebGL and shader tutorials
- Practical examples

### 6. **GitHub Repositories to Study**

**WebGL Transition Libraries**:
- `gl-transitions` - Collection of GLSL transition shaders
  - GitHub: https://github.com/gl-transitions/gl-transitions
  - Website: https://gl-transitions.com/
  - **Perfect for learning!** - Shows shader code for various transitions

- `shadertoy-transitions` - ShaderToy transition effects
  - Search GitHub for "shader transition" or "webgl transition"

### 7. **Specific Learning Path**

#### Beginner Path:
1. **WebGL Fundamentals** → Learn basics (2-3 days)
2. **Book of Shaders** → Understand fragment shaders (2-3 days)
3. **Study gl-transitions.com** → See real transition shaders (1 day)
4. **Build simple fade transition** → Practice (1 day)

#### Intermediate Path:
1. **Learn about uniforms** → How to animate shaders
2. **Study transition patterns** → Slide, reveal, morph, etc.
3. **Integrate with Vue/React** → Connect to your framework
4. **Add texture sampling** → For image-based transitions

#### Advanced Path:
1. **Custom shader effects** → Create your own transitions
2. **Performance optimization** → 60fps rendering
3. **Texture capture** → Capture page content to texture
4. **Complex morphing** → Advanced distortion effects

## Key Concepts to Learn

### 1. **Fragment Shaders**
```glsl
// Basic structure
precision highp float;
uniform float u_progress;  // Animation progress (0.0 to 1.0)
varying vec2 v_uv;         // Texture coordinates (0.0 to 1.0)

void main() {
  // Your transition logic here
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
```

### 2. **Common Transition Patterns**

**Slide Transition**:
```glsl
float offset = mix(-1.0, 1.0, u_progress);
vec2 uv = v_uv + vec2(offset, 0.0);
```

**Fade Transition**:
```glsl
float alpha = 1.0 - abs(u_progress * 2.0 - 1.0);
```

**Reveal Transition**:
```glsl
float reveal = smoothstep(0.5, 0.0, distance(v_uv, vec2(0.5)) - u_progress);
```

### 3. **Animation Loop**
```javascript
function animate(time) {
  const progress = (time - startTime) / duration;
  gl.uniform1f(progressLocation, progress);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  
  if (progress < 1.0) {
    requestAnimationFrame(animate);
  }
}
```

## Recommended Learning Order

1. ✅ **WebGL Fundamentals** - Basics (1 week)
2. ✅ **Book of Shaders** - Shader programming (1 week)
3. ✅ **gl-transitions.com** - Study existing transitions (2-3 days)
4. ✅ **Build simple transition** - Practice (2-3 days)
5. ✅ **Integrate with your project** - Apply to Astro/Vue

## Quick Start Tutorial Links

### For Complete Beginners:
- **WebGL Fundamentals**: https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html
- **Book of Shaders Intro**: https://thebookofshaders.com/01/

### For Transition-Specific Learning:
- **GL Transitions Gallery**: https://gl-transitions.com/
  - Click any transition to see the shader code!
  - Perfect for understanding how transitions work

### For Framework Integration:
- **Three.js Transitions**: https://threejs.org/docs/#manual/en/introduction/Animation-system
- **Vue + WebGL**: Search "Vue WebGL component tutorial"

## What Makes oscarpico.es Special

Their implementation is notable because:
1. **Raw WebGL2** - No library overhead
2. **Smooth 60fps** - Optimized shaders
3. **Z-index layering** - Smart overlay management
4. **Multiple effects** - Different transitions for different routes

## Next Steps

1. **Start with WebGL Fundamentals** (free, comprehensive)
2. **Browse gl-transitions.com** to see shader code
3. **Modify the WebGLTransition.vue component** I created
4. **Experiment with different shader effects**

The component I created (`WebGLTransition.vue`) already implements the basic structure - you can now customize the shader effects by modifying the fragment shader code!

