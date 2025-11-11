/**
 * Debug Script for FrameworkAuditSection Text Visibility Issue
 *
 * Instructions:
 * 1. Open http://localhost:4322/ in your browser
 * 2. Wait for the page to fully load (after intro animation completes)
 * 3. Open browser DevTools (F12 or right-click -> Inspect)
 * 4. Go to the Console tab
 * 5. Copy and paste this entire script into the console
 * 6. Press Enter to run it
 */

console.log('=== FRAMEWORK AUDIT SECTION DEBUG SCRIPT ===\n');

// Find the wrapper
const wrapper = document.querySelector('[data-sticky-features-wrapper]');
if (!wrapper) {
  console.error('❌ Could not find [data-sticky-features-wrapper]');
} else {
  console.log('✅ Found wrapper element');
}

// Find all items
const items = Array.from(document.querySelectorAll('[data-sticky-feature-item]'));
console.log(`\n📊 Found ${items.length} feature items total`);

if (items.length === 0) {
  console.error('❌ No items found! The component may not have initialized.');
} else {
  // Focus on the first item
  const firstItem = items[0];
  console.log('\n=== FIRST ITEM ANALYSIS ===');

  // Check computed styles
  const firstItemStyles = window.getComputedStyle(firstItem);
  console.log('\n📐 First Item Computed Styles:');
  console.log(`  opacity: ${firstItemStyles.opacity}`);
  console.log(`  visibility: ${firstItemStyles.visibility}`);
  console.log(`  display: ${firstItemStyles.display}`);
  console.log(`  position: ${firstItemStyles.position}`);
  console.log(`  z-index: ${firstItemStyles.zIndex}`);

  // Check inline styles
  console.log('\n🎨 First Item Inline Styles:');
  console.log(`  style.opacity: ${firstItem.style.opacity || 'NOT SET'}`);
  console.log(`  style.visibility: ${firstItem.style.visibility || 'NOT SET'}`);
  console.log(`  style.display: ${firstItem.style.display || 'NOT SET'}`);

  // Find all text elements in first item
  const textElements = firstItem.querySelectorAll('[data-sticky-feature-text]');
  console.log(`\n📝 Found ${textElements.length} text elements in first item`);

  if (textElements.length === 0) {
    console.error('❌ No text elements found with [data-sticky-feature-text]!');
    console.log('\n🔍 Looking for alternative text elements...');

    const headers = firstItem.querySelectorAll('.sticky-features__header');
    const numbers = firstItem.querySelectorAll('.sticky-features__number');
    const headings = firstItem.querySelectorAll('.sticky-features__heading');
    const paragraphs = firstItem.querySelectorAll('.sticky-features__p');

    console.log(`  .sticky-features__header: ${headers.length}`);
    console.log(`  .sticky-features__number: ${numbers.length}`);
    console.log(`  .sticky-features__heading: ${headings.length}`);
    console.log(`  .sticky-features__p: ${paragraphs.length}`);
  } else {
    // Analyze each text element
    textElements.forEach((textEl, index) => {
      const computedStyles = window.getComputedStyle(textEl);
      console.log(`\n--- Text Element ${index + 1} ---`);
      console.log(`  Class: ${textEl.className}`);
      console.log(`  Computed opacity: ${computedStyles.opacity}`);
      console.log(`  Computed visibility: ${computedStyles.visibility}`);
      console.log(`  Computed display: ${computedStyles.display}`);
      console.log(`  Inline opacity: ${textEl.style.opacity || 'NOT SET'}`);
      console.log(`  Inline visibility: ${textEl.style.visibility || 'NOT SET'}`);
      console.log(`  Inline transform: ${textEl.style.transform || 'NOT SET'}`);
      console.log(`  Text content: "${textEl.textContent.trim().substring(0, 50)}..."`);
    });
  }

  // Check bounding rect
  const rect = firstItem.getBoundingClientRect();
  console.log('\n📏 First Item Position:');
  console.log(`  top: ${rect.top}px`);
  console.log(`  left: ${rect.left}px`);
  console.log(`  width: ${rect.width}px`);
  console.log(`  height: ${rect.height}px`);
  console.log(`  Is in viewport: ${rect.top < window.innerHeight && rect.bottom > 0}`);
}

// Check for main content visibility
const mainContent = document.getElementById('main-content');
if (mainContent) {
  console.log('\n🎬 Main Content State:');
  console.log(`  Has landing--hidden class: ${mainContent.classList.contains('landing--hidden')}`);
  console.log(`  Computed opacity: ${window.getComputedStyle(mainContent).opacity}`);
}

// Check ScrollTrigger instances
if (window.ScrollTrigger) {
  const triggers = window.ScrollTrigger.getAll();
  console.log(`\n📜 ScrollTrigger instances: ${triggers.length}`);

  triggers.forEach((trigger, index) => {
    console.log(`  Trigger ${index + 1}:`, {
      start: trigger.start,
      end: trigger.end,
      scroller: trigger.scroller,
      pin: trigger.pin
    });
  });
} else {
  console.warn('⚠️ ScrollTrigger not found on window');
}

console.log('\n=== DEBUG SCRIPT COMPLETE ===');
console.log('\n💡 Next Steps:');
console.log('  1. Check if text elements were found');
console.log('  2. Look at computed vs inline styles');
console.log('  3. Verify opacity/visibility values');
console.log('  4. Check if main-content still has landing--hidden class');
