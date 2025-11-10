# Font Optimization Guide

## Current Status

### ✅ Completed Optimizations
1. **Added `font-display: swap`** - Prevents FOIT (Flash of Invisible Text)
2. **Removed unused fonts** - Deleted 11 unused font variants
3. **Kept only 5 essential fonts**:
   - PPNeueMachina-PlainRegular.otf (117 KB)
   - PPNeueMachina-PlainUltrabold.otf (120 KB)
   - PPSupplyMono-Regular.otf (23 KB)
   - PPSupplyMono-Ultralight.otf (24 KB)
   - PPSupplySans-Regular.otf (45 KB)
   - **Total: 329 KB**

### 🎯 Next Step: Convert OTF to WOFF2

**Expected savings**: ~247 KB (75% reduction) → Final size ~82 KB

## How to Convert Fonts to WOFF2

### Option 1: Using Online Tool (Easiest)
1. Go to https://cloudconvert.com/otf-to-woff2
2. Upload each .otf file from `public/fonts/`
3. Download the converted .woff2 files
4. Replace the old files

### Option 2: Using Command Line (Recommended for batch)

```bash
# Install woff2 tools (macOS)
brew install woff2

# Convert all fonts
cd public/fonts/
for font in *.otf; do
  woff2_compress "$font"
done

# This will create .woff2 files alongside the .otf files
```

### Option 3: Using Python fontTools

```bash
# Install fonttools
pip install fonttools brotli

# Convert fonts
cd public/fonts/
for font in *.otf; do
  python -m fontTools.ttLib.woff2 compress "$font"
done
```

## After Conversion

Update `src/layouts/LandingLayout.astro` to use WOFF2 format:

```astro
<!-- Custom Fonts -->
<style>
  @font-face {
    font-family: 'PP Neue Machina';
    src: url('/fonts/PPNeueMachina-PlainRegular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'PP Neue Machina';
    src: url('/fonts/PPNeueMachina-PlainUltrabold.woff2') format('woff2');
    font-weight: 800;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'PP Supply Mono';
    src: url('/fonts/PPSupplyMono-Regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'PP Supply Mono';
    src: url('/fonts/PPSupplyMono-Ultralight.woff2') format('woff2');
    font-weight: 200;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'PP Supply Sans';
    src: url('/fonts/PPSupplySans-Regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
</style>
```

Then delete the old .otf files:
```bash
rm public/fonts/*.otf
```

## Performance Impact

### Before Optimizations
- 17 font files
- ~1.6 MB total
- FOIT on slow connections
- html2canvas: 500 KB loaded globally
- Three.js: Full library (~580 KB)

### After All Optimizations
- 5 WOFF2 fonts: ~82 KB
- `font-display: swap`: No FOIT
- html2canvas: Lazy loaded (only when needed)
- Three.js: Tree-shaken (~200 KB)
- **Total savings: ~1.2 MB (60-70% reduction)**

## Browser Support

WOFF2 is supported by:
- Chrome 36+
- Firefox 39+
- Safari 12+
- Edge 14+

**Coverage**: 97%+ of all browsers

## Additional Optimization (Optional)

### Font Subsetting
If you only use specific characters (e.g., Latin alphabet), you can subset fonts to reduce size even further:

```bash
# Using pyftsubset (part of fonttools)
pyftsubset font.woff2 \
  --output-file=font-subset.woff2 \
  --unicodes=U+0020-007F,U+00A0-00FF \
  --layout-features='*' \
  --flavor=woff2
```

This can reduce font size by another 50-70% if you don't need full Unicode support.
