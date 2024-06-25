<template>
   <div class="badges-box">
      <div class="badges">
         <div
            v-for="(badge, index) in badges"
            :key="index"
            class="badge"
            :style="{ backgroundColor: badge.color }"
            @mouseover="tooltip = badge"
            @click="tooltip = badge"
            @mouseleave = "tooltip = null"
         >
            <span class="material-symbols-rounded icon">{{ badge.icon }}</span>
         </div>
      </div>
      <div class="tooltip">
         <p class="title">{{ tooltip && (tooltip.name + " badge") }} </p>
         <p>{{ tooltip && tooltip.description }}</p>
      </div>
   </div>
</template>

<script setup>
import { defineProps, ref } from "vue"

const tooltip = ref("")

defineProps(["badges"])
</script>

<style scoped>
.badges {
   display: flex;
   gap: 10px;
   justify-content: center;
   align-items: center;
   height: 64px;

   transition: 0.1s gap ease;
   margin-right: 24px;
}

.badge {
   color: white;
   border-radius: 10px;
   margin-right: -24px;
}

.badge:hover .material-symbols-rounded {
   font-size: 36px;
   padding: 20px 10px;
}

.badge:hover {
   z-index: 2;
}

.badges:hover {
   gap: 40px;
}

.badge .material-symbols-rounded {
   padding: 16px 8px;
   font-size: 24px;
   user-select: none;
   transition: 0.1s font-size ease, 0.1s padding ease;
}

.tooltip {
   height: 30px;
   margin-top: 10px;
   text-align: center;
}

.tooltip p {
   margin: 0;
}

.tooltip .title {
   font-weight: bold;
}
</style>
