<template>
   <div :class="{ notification: true, hidden: hidden }">
      <p>{{ message }}</p>
   </div>
</template>

<script setup>
import { defineProps } from "vue"

defineProps([ "message", "hidden" ])
</script>

<style scoped>
.notification {
   position: fixed;
   top: 0;
   left: 50%;
   transform: translateX(-50%);
   font-size: 20px;
   font-weight: bold;

   background-color: var(--background-2);

   padding: 10px;
   margin-top: 20px;
   border-radius: 4px;

   transition: 300ms transform cubic-bezier(1, 0, 0, 1);

   z-index: 506;
}

.notification.hidden {
   transform: translateX(-50%) translateY(-200%);
}

.notification p {
   margin: 0;
   text-align: center;
   color: var(--foreground-1);
}
</style>
