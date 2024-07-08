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
const props = defineProps(["username", "stats"])

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
   Stat("music_note", props.stats.tracks | 0, "teal", "white", "tracks"),
   Stat("trophy", props.stats.wins | 0, "#f08000", "#ffc000", "wins"),
   Stat("playing_cards", props.stats.badges | 0, "darkseagreen", "white", "badges"),
   Stat("library_music", props.stats.playlist_count | 0, "firebrick", "white", "playlists")
])
</script>

<style scoped>
@media (max-width: 600px) {
   .stats-box {
      justify-content: center !important;
   }

   .tooltip {
      text-align: center;
   }
}

.stats-box {
   display: flex;
   flex-direction: row;
   justify-content: flex-start;
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
   gap: 2px;
   height: 36px;
   cursor: default;
   width: 56px;
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

.icon {
   font-size: 22px;
}
</style>
