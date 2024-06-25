<template>
   <div class="stats-box">
      <div
         v-for="(stat, index) in stats"
         :key="index"
         class="stat"
         :style="{ backgroundColor: stat.bg_color }"
         @mouseover="tooltip = stat.tooltip"
         @click="tooltip = stat.tooltip"
         @mouseleave="tooltip = ''"
      >
         <span
            class="material-symbols-rounded icon"
            :style="{ color: stat.fg_color }"
            >{{ stat.icon }}</span
         >
         <p class="label">{{ stat.label }}</p>
      </div>
   </div>
   <p class="tooltip">{{ tooltip }}</p>
</template>

<script setup>
import { defineProps, computed, ref } from "vue"
const props = defineProps(["username", "numTracks", "numWins"])

// endtip = "ending" of the tooltip
// ie ...total tracks uploaded
const Stat = (icon, label, bg_color, fg_color, endtip) => {
   return {
      icon,
      label,
      bg_color,
      fg_color,
      tooltip: `${props.username} has ${label} ${endtip}`,
   }
}

const tooltip = ref("")

const stats = computed(() => [
   Stat("music_note", props.numTracks, "teal", "white", "total tracks"),
   Stat("trophy", props.numWins, "#f08000", "#ffc000", "total wins"),
])
</script>

<style scoped>
.stats-box {
   display: flex;
   flex-direction: row;
   margin-top: 20px;
}

.stats-box .stat:first-child {
   border-radius: 10px 0 0 10px;
}
.stats-box .stat:last-child {
   border-radius: 0 10px 10px 0;
}

.stat {
   display: flex;
   justify-content: center;
   align-items: center;
   gap: 4px;
   height: 42px;
   padding: 0 10px;
   cursor: default;
}

.stat .label {
   margin: 0;
   color: white;
}

.tooltip {
   height: 15px;
   margin: 0;
   margin-top: 4px;
}
</style>
