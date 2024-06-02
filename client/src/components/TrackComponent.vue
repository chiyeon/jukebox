<template>
    <div :class="{'track': true, 'header': header}">
        <p class="artist">{{track.artist}}</p>
        <p class="title">{{track.title}}</p>
    </div>
</template>

<script setup>
import { defineProps } from "vue"

defineProps({
    track: {
        artist: String,
        title: String,
        url: String
    },
    header: {
        type: Boolean,
        default: false
    }
})
</script>

<style scoped>
   .track {
      padding: 10px 0;
      border-radius: 2px;

      border-bottom: 1px solid gray;
      display: flex;
      flex-direction: row;
   }

   .track:not(.header):hover {
      background-color: #f1f1f1;
      cursor: pointer;
   }

   .track p {
      margin: 0;
   }

   .header p {
      font-weight: bold;
   }

   .artist {
      flex: 0.2;
   }

   .title {
      flex: 1;
   }
</style>