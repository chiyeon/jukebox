<template>
   <div class="lyrics-box">
      <span
         class="material-symbols-rounded exit"
         @click="eventbus.emit('set_lyrics_visibility', false)"
         >keyboard_arrow_down</span
      >
      <p class="lyrics">
         {{ lyrics }}
      </p>
   </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue"
import eventbus from "../../eventbus"

defineProps(["lyrics"])
</script>

<style scoped>
@media (max-width: 600px) {
   .lyrics-box .lyrics {
      font-size: 20px;
   }
}
.lyrics-box {
   overflow-y: auto;

   position: fixed;
   bottom: 0;
   left: 0;
   padding: 0 30px;
   width: 100%;

   height: 100vh;
   height: 100dvh;

   padding-bottom: 300px;

   background-color: white;
   box-sizing: border-box;
}
.lyrics {
   white-space: pre-line;
   font-size: 32px;
   font-weight: bold;
   color: cadetblue;
}

.exit {
   color: white;
   font-size: 48px;
   background-color: lightcoral;
   cursor: pointer;
   margin-top: 30px;
}

.exit:hover {
   background-color: pink;
}
</style>
