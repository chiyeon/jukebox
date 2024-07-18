<template>
   <div class="lyrics-box">
      <span
         class="material-symbols-rounded exit"
         @click="eventbus.emit('set_lyrics_visibility', false)"
         >keyboard_arrow_down</span
      >
      <div class="lyrics-scroll">
         <p class="lyrics">
            {{ lyrics }}
         </p>
      </div>
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
   position: fixed;
   bottom: 0;
   left: 0;
   padding: 0 30px;
   width: 100%;

   height: 100vh;
   height: 100dvh;

   background-color: white;
   box-sizing: border-box;
}

.lyrics-scroll {
   position: relative;
   height: calc(100% - 265px); /* about the size of the bottom player */
}

.lyrics-scroll::before,
.lyrics-scroll::after {
   content: '';
   position: absolute;
   left: 0;
   right: 0;
   height: 50px;
   pointer-events: none;
   z-index: 1;
}

.lyrics-scroll::before {
   top: 0;
   background: none;
   background: linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0));
}

.lyrics-scroll::after {
   bottom: 0;
   background: none;
   background: linear-gradient(to top, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0));
}

.lyrics {
   white-space: pre-line;
   font-size: 32px;
   font-weight: bold;
   color: cadetblue;
   overflow-y: auto;
   height: 100%;
}

.lyrics::before {
   content: "";
   display: block;
   padding-top: 28px;
}

.lyrics::after {
   content: "";
   display: block;
   padding-bottom: 300px;
}

.exit {
   color: white;
   font-size: 48px;
   background-color: lightcoral;
   cursor: pointer;
   margin-top: 30px;
   border-radius: 4px;
}

.exit:hover {
   background-color: pink;
}
</style>
