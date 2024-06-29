<template>
   <div class="playlist" @click="router.push(`/p/${playlist.uuid}`)">
      <img :src="playlist.cover" class="cover" />
      <p class="title">{{ playlist.name }}</p>
   </div>
</template>

<script setup>
import { defineProps } from "vue"
import router from "../router"

const props = defineProps([ "playlist" ])
</script>

<style scoped>
.playlist {
   width: 200px;
   display: flex;
   flex-direction: column;
   justify-content: center;
   align-items: center;
}

.cover {
   aspect-ratio: 1.0;
   width: 100%;
}
</style>
