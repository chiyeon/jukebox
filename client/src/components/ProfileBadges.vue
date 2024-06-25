<template>
   <div class="badges-box">
      <div 
         v-for="(badge, index) in badges"
         :key="index"
         class="badge">
         <span class="material-symbols-rounded icon">{{ badge.icon }}</span>
      </div>
   </div>
</template>

<script setup>
import { defineProps } from "vue"

defineProps([ "badges" ])

</script>

<style scoped>

</style>
