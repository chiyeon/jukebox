<template>
   <div class="playlist" @click="disable_click ? '' : router.push(`/p/${playlist.uuid}`)">
      <img :src="playlist.cover" class="cover" />
      <p class="title">{{ playlist.name }}</p>
   </div>
</template>

<script setup>
import { defineProps } from "vue"
import router from "../router"

const props = defineProps([ "playlist", "disable_click" ])
</script>

<style scoped>
@media (max-width: 600px) {
   .playlist {
      width: 165px !important;
   }
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
