<template>
  <!-- This component has no visual output, it just initializes Lenis -->
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useLenis } from '../composables/useLenis.js';

const { initLenis, destroyLenis } = useLenis();

onMounted(() => {
  initLenis();
});

onUnmounted(() => {
  destroyLenis();
});
</script>
