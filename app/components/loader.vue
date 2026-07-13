<script setup lang="ts">

</script>

<template>
<div class="loader"></div>
</template>

<style scoped>
.loader {
  border: 16px solid #1c6ade;
  border-top: 16px solid #fff;
  border-radius: 50%;
  width: 120px;
  height: 120px;
  animation: spin 2s linear infinite;
  will-change: transform;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>