<template>
  <section ref="sectionRef" class="statement-section" data-name="Statement Section">
    <ul>
      <li
        v-for="(word, wordIndex) in words"
        :key="wordIndex"
      >
        <span
          v-for="(char, charIndex) in word.chars"
          :key="`${wordIndex}-${charIndex}`"
          class="letter"
        >
          <span>{{ char }}</span>
          <span>{{ char }}</span>
        </span>
        <template v-if="wordIndex < words.length - 1">&nbsp;</template>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useGsap } from '../composables/useGsap.js';

const { gsap, ScrollTrigger } = useGsap();

const sectionRef = ref(null);

const words = [
  { chars: ['H', 'u', 'm', 'a', 'n', 'i', 't', 'y'] },
  { chars: ['A', 'm', 'p', 'l', 'i', 'f', 'i', 'e', 'd'] }
];

let scrollTriggerAnimation = null;
let observer = null;

const createAnimation = () => {
  if (scrollTriggerAnimation) return;
  
  scrollTriggerAnimation = gsap.to('.statement-section .letter', {
    yPercent: 100,
    ease: 'power1.inOut',
    scrollTrigger: {
      trigger: '.statement-section ul',
      start: '33.33% bottom',
      end: '100% 80%',
      scrub: 1,
    },
    stagger: {
      each: 0.05,
      from: 'random'
    }
  });
};

onMounted(async () => {
  await nextTick();
  
  if (!sectionRef.value) return;
  
  // Check if section is already visible
  const rect = sectionRef.value.getBoundingClientRect();
  const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
  
  if (isVisible) {
    createAnimation();
    return;
  }
  
  // Otherwise, wait for it to become visible
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0) {
        createAnimation();
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      }
    });
  }, { threshold: 0.01 });
  
  observer.observe(sectionRef.value);
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  
  if (scrollTriggerAnimation && scrollTriggerAnimation.scrollTrigger) {
    scrollTriggerAnimation.scrollTrigger.kill();
    scrollTriggerAnimation.kill();
  }
});
</script>

<style scoped>
.statement-section {
  padding: 60vh 0;
}

.statement-section ul {
  display: flex;
  flex-direction: column;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
}

.statement-section li {
  font-family: 'PP Neue Machina', sans-serif;
  font-weight: 800;
  font-size: clamp(86px, 18vw, 300px);
  line-height: 0.95;
  color: #fff;
  text-transform: uppercase;
  overflow: hidden;
  display: flex;
}

.statement-section .letter {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.statement-section .letter span:last-child {
  position: absolute;
  bottom: 100%;
  left: 0;
}

@media (max-width: 768px) {
  .statement-section li {
    font-size: clamp(60px, 15vw, 86px);
  }
}
</style>

