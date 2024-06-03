<template>
   <div class="player-mini-box">
      <div class="player-mini">
         <div class="progress-box">
            <div class="progress" ref="progress_ref"></div>
         </div>
         <div class="track-box">
            <img class="album" src="https://storage.googleapis.com/jukebox-albums/default.webp" />
            <div class="content">
               <div class="track-info">
                  <p v-if="queue && queue[queue_index]">{{ queue[queue_index].artist }}</p>
                  <p v-if="queue && queue[queue_index]"><strong>{{ queue[queue_index].title }}</strong></p>
                  <p v-else>No track selected</p>
               </div>
               <div class="controls">
                  <button class="prev" @click="prev_song"><img width="32" height="32" src="https://img.icons8.com/pixels/32/skip-to-start.png" alt="skip-to-start"/></button>
                  <button class="pause" @click="toggle_playback"><img width="32" height="32" :src="`https://img.icons8.com/pixels/32/${playing ? 'pause' : 'play'}.png`" alt="play"/></button>
                  <button class="next" @click="next_song"><img width="32" height="32" src="https://img.icons8.com/pixels/32/end.png" alt="end"/></button>
               </div>
            </div>
         </div>
      </div>

      <audio ref="audio_ref" ></audio>
   </div>
</template>

<script setup>
import { defineProps, ref, watch } from 'vue';

const audio_ref = ref(null)
const progress_ref = ref(null)

const playing = ref(false)
const queue_index = ref(0)

const props = defineProps([
   "queue"
])

const prev_song = () => {
   if (!audio_ref.value) return

   queue_index.value--
   if (queue_index.value < 0) queue_index.value = 0
}

const next_song = () => {
   if (!audio_ref.value) return

   queue_index.value++
   if (queue_index.value >= props.queue.length) queue_index.value = props.queue.length - 1
}

const toggle_playback = () => {
   if (!audio_ref.value) return

   playing.value = !playing.value
   if (playing.value) audio_ref.value.play()
   else audio_ref.value.pause()
}

watch(() => props.queue[queue_index.value], (newval, oldval) => {
   audio_ref.value.src = newval.url
   audio_ref.value.play()
   playing.value = true
})
</script>

<style scoped>
.player-mini-box {
   position: fixed;
   bottom: 0;
   left: 0;
   width: 100%;

   border-top: 1px solid black;
}

.player-mini {
   max-width: 800px;
   margin: auto;
   padding: 20px;
   padding-top: 0;
}

.track-box {
   display: flex;
   flex-direction: row;
   align-items: center;
   gap: 60px;
}

.album {
   width: 64px;
}

.track-info {
   flex: 1;
}

.track-info p {
   margin: 0;
}

.content {
   flex: 1;
   display: flex;
   flex-direction: row;
}

.controls {
   flex: 1;
   display: flex;
   flex-direction: row;
   gap: 10px;
   justify-content: flex-end;
}

.controls button {
   background: none;
   border: none;
   cursor: pointer
}

.controls button:hover {
   opacity: 0.4;
}

.progress-box {
   width: 100%;
   height: 4px;
   padding-bottom: 20px;
}

.progress {
   background-color: orange;
   border-radius: 100px;
   width: 0%;
   height: 100%;
}
</style>