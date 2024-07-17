<template>
   <div :class="{playlist: true, compact: compact }" @click="disable_click ? '' : router.push(`/p/${playlist.uuid}`)">
      <img :src="playlist.cover" class="cover" />
      <p class="title">{{ playlist.name }}</p>
   </div>
</template>

<script setup>
import { defineProps } from "vue"
import router from "../router"

const props = defineProps([ "playlist", "disable_click", "compact" ])
</script>

<style scoped>
@media(max-width: 600px) {
   .playlist:not(.compact) {
      width: 165px !important;
   }
}

.compact.playlist {
   width: 100% !important;
   flex-direction: row !important;
   gap: 10px;

   border-bottom: 1px solid black;
   padding-bottom: 10px;
}

.compact.playlist .title {
   flex: 1;
}

.compact.playlist .cover {
   width: 64px;
}

.playlist {
   width: 200px;
   display: flex;
   flex-direction: column;
   justify-content: center;
   align-items: center;
   cursor: pointer;
}

.cover {
   aspect-ratio: 1.0;
   width: 100%;
}

.playlist:hover {
   opacity: 0.8;
}
</style>
