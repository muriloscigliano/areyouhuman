import { ref, readonly } from 'vue';

const isOpen = ref(false);

function open() {
  isOpen.value = true;
}

function close() {
  isOpen.value = false;
}

function toggle() {
  isOpen.value = !isOpen.value;
}

export function useContactModal() {
  return {
    isOpen: readonly(isOpen),
    open,
    close,
    toggle,
  };
}

