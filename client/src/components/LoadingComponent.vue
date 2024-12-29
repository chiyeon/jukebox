<template>
   <div class="loading">
      <p>{{ message ? message : "Loading" }}</p>
   </div>
</template>

<script setup>
import { defineProps } from "vue"

defineProps(["message"])
</script>

<style scoped>
.loading {
   position: fixed;
   left: 0;
   top: 0;
   z-index: 400;

   width: 100vw;
   height: 100vh;

   background-color: var(--background-transparent);

   display: flex;
   justify-content: center;
   align-items: center;
}

.loading p {
   font-size: 24px;
   font-weight: bold;
   color: var(--foreground-1);
}
</style>
