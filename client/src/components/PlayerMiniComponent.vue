<template>
   <div class="player-mini-box">
      <div class="player-mini">
         <div class="progress-box">
            <div class="progress-background">
               <div class="progress" ref="progress_ref" :style="{ width: playback_progress_percent }"></div>
               <input @input="set_progress_by_slider" type="range" min="0" max="1" step="0.01" class="progress-slider" />
            </div>
         </div>
         <div class="track-box">
            <div class="album">
               <img class="album-icon" :src="current_song && current_song.album ? current_song.album : 'https://storage.googleapis.com/jukebox-albums/default.webp'" />
               <div class="track-info">
                  <p v-if="current_song"><strong>{{ current_song.title }}</strong></p>
                  <RouterLink v-if="current_song" :to="`/u/${current_song.artist}`">{{ current_song.artist_display_name }}</RouterLink>
                  <p v-else>No track selected</p>
               </div>
            </div>
            <div class="controls">
               <button class="prev" @click="prev_song"><img width="32" height="32" src="https://img.icons8.com/pixels/32/skip-to-start.png" alt="skip-to-start"/></button>
               <button class="pause" @click="toggle_playback"><img width="32" height="32" :src="`https://img.icons8.com/pixels/32/${playing ? 'pause' : 'play'}.png`" alt="play"/></button>
               <button class="next" @click="next_song"><img width="32" height="32" src="https://img.icons8.com/pixels/32/end.png" alt="end"/></button>
            </div>
            <div class="controls-right">
               <div class="volume-controls">
                  <img class="volume-icon" width="24" height="24" :src="get_volume_icon()" alt="volume" @click="toggle_mute" />
                  <div class="volume-box">
                     <div class="volume-background">
                        <div class="volume" ref="volume_ref" :style="{ width: volume_percent }"></div>
                        <input @input="set_volume_by_slider" ref="volume_slider_ref" type="range" min="0" max="1" value="1" step="0.01" class="volume-slider" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <audio ref="audio_ref" ></audio>
   </div>
</template>

<script setup>
import { defineProps, ref, watch, onMounted, computed } from 'vue';
import { useStore } from "vuex"

const store = useStore()

const audio_ref = ref(null)
const progress_ref = ref(null)

const playing = ref(false)
const queue = computed(() => store.state.queue) // user selected songs
const fullqueue = ref([]) // we have props.queue which is passed in queue, and this queue which is 
// props.queue + afterqueue
const queue_index = ref(0)
const after_queue_index = ref(-1)
const playback_progress_percent = ref("0%")
const volume_percent = ref("100%")
const current_song = ref(null)

const tracks = computed(() => store.state.tracks) // all tracks user is "pointed at"
const after_queue = computed(() => store.state.afterQueue) // tracks to play next after queue is over

let is_mouse_down = false
let last_volume = 0 // last volume before muted. if we aren't muted, its 0

const volume_icons = [
   "https://img.icons8.com/material-sharp/24/speaker.png",
   "https://img.icons8.com/material-sharp/24/medium-volume.png",
   "https://img.icons8.com/material-sharp/24/low-volume.png",
   "https://img.icons8.com/material-sharp/24/mute.png"
]

const props = defineProps([
   "queue"
])

const prev_song = () => {
   // rewind if more than 3 seconds over, otherwise previous track
   if (audio_ref.value.currentTime > 3 || queue_index.value == 0) {
      audio_ref.value.currentTime = 0
   } else {
      // 2 cases: we are either playing in queue or in after queue
      queue_index.value--
      if (queue_index.value < 0) queue_index.value = 0
   }
}

const next_song = () => {
   if (queue_index.value < fullqueue.value.length - 1) {
      queue_index.value++
   }
}

const toggle_playback = () => {
   if (audio_ref.value.src == "") return

   playing.value = !playing.value
   if (playing.value) audio_ref.value.play()
   else audio_ref.value.pause()
}

const set_progress = (e) => {
   if (audio_ref.value.src == "") return
   audio_ref.value.currentTime = (e.offsetX / e.currentTarget.clientWidth) * audio_ref.value.duration
   update_progress()
}

const set_progress_by_slider = (e) => {
   if (audio_ref.value.src == "") return
   audio_ref.value.currentTime = e.currentTarget.value * audio_ref.value.duration
   update_progress()
}

const toggle_mute = () => {
   if (last_volume == 0) {
      // mute us
      last_volume = audio_ref.value.volume
      set_volume(0)
   } else {
      // unmute
      set_volume(last_volume)
      last_volume = 0
   }
}

const set_volume_by_click = (e) => {
   last_volume = 0
   let new_vol = Math.max(0, Math.min(1, e.offsetX / e.currentTarget.clientWidth))
   set_volume(new_vol)
}

const set_volume_by_slider = (e) => {
   set_volume(e.currentTarget.value)
}

const set_volume = (volume) => {
   audio_ref.value.volume = volume
   volume_percent.value = (volume * 100) + "%"
}

const get_volume_icon = () => {
   if (!audio_ref.value) return volume_icons[3]

   let vol = audio_ref.value.volume

   if (vol <= 0) {
      return volume_icons[3]
   } else if (vol <= 0.34) {
      return volume_icons[2]
   } else if (vol <= 0.67) {
      return volume_icons[1]
   } else {
      return volume_icons[0]
   }
}

const update_audio_ref = (track) => {
   audio_ref.value.src = track.url
   audio_ref.value.play()
   playing.value = true
}

// update our current song when queue or after queue cahnges
watch(() => fullqueue.value[queue_index.value], (newval, oldval) => {
   if (!newval) return

   current_song.value = newval
   // the watch for current song doesnt update from this. we'll have to do it manually
   update_audio_ref(newval)
})

// update audio ref to play new songs when current song changes
watch(current_song.value, (newval, oldval) => {
   if (!newval) return
   update_audio_ref(newval)
})

watch(() => queue.value, (newval, oldval) => {
   // if queue is empty or being reset (we clicked on a new song to play)
   // fill teh after queue with stuff below
   if (!newval || newval.length == 0) return;
   if (newval.length == 1) {
      // again in this case, we reset the queue and are clicking on a new song to play
      queue_index.value = 0 // reset queue to 0
      let track_index = tracks.value.findIndex(track => track.filename == queue.value[queue_index.value].filename)
      if (track_index < 0) return;

      store.dispatch("setAfterQueue", tracks.value.slice(track_index + 1))

      // append after queue to queue
      fullqueue.value = queue.value.concat(after_queue.value)
   } else {
      // if we aren't though, we need to insert new songs into the queue BEFORE afterqueue
      fullqueue.value = queue.value.concat(after_queue.value)
   }
})

const update_progress = () => {
   playback_progress_percent.value = (audio_ref.value.currentTime / audio_ref.value.duration * 100) + "%"
}

onMounted(() => {
   audio_ref.value.addEventListener("ended", () => {
      next_song()
   })

   audio_ref.value.addEventListener("timeupdate", () => {
      progress_ref.value.value = (audio_ref.value.currentTime / audio_ref.value.duration)
      update_progress()
   })
})
</script>

<style scoped>
.player-mini-box {
   position: fixed;
   bottom: 0;
   left: 0;
   width: 100%;

   background-color: white;
   border-top: 1px solid black;
}

.player-mini {
   max-width: 800px;
   margin: auto;
   padding: 20px;
   padding-top: 20;
}

.track-box {
   display: flex;
   flex-direction: row;
   align-items: center;
   gap: 10px;
}

.album {
   display: flex;
   flex-direction: row;
   align-items: center;
   gap: 15px;

   flex: 0.35;
}

.album-icon {
   width: 64px;
}

.track-info {
   flex: 1;
}

.track-info p {
   margin: 0;
}

.controls {
   flex: 1;
   display: flex;
   flex-direction: row;
   gap: 10px;
   justify-content: center;
   flex: 0.3;
}

.controls button {
   background: none;
   border: none;
   cursor: pointer
}

.controls button:hover {
   opacity: 0.4;
}

.controls-right {
   flex: 0.35;

   display: flex;
   justify-content: flex-end;
}

.volume-controls {
   display: flex;
   align-items: center;
   gap: 4px;
}

.volume-box {
   width: 64px;
   height: 16px;
   cursor: pointer;

   display: flex;
   align-items: center;
}

.volume-box:hover .volume-background {
   height: 8px;
}

.volume-background {
   width: 100%;
   height: 6px;
   background-color: #e4e4e4;
   border-radius: 100px;

   transition: height 300ms cubic-bezier(0,.74,.04,1);
}

.volume-icon {
   cursor: pointer;
}

.volume {
   background-color: lightseagreen;
   height: 100%;
   border-radius: 100px;
}

.progress-box {
   width: 100%;
   height: 12px;
   margin-bottom: 20px;
   cursor: pointer;

   display: flex;
   align-items: center
}

.progress-background {
   width: 100%;
   height: 6px;
   border-radius: 100px;
   background-color: #e4e4e4;

   transition: height 300ms cubic-bezier(0,.74,.04,1);
}

.progress {
   background-color: orange;
   border-radius: 100px;
   height: 100%;
   width: 0%;
}

.progress-box:hover .progress-background {
   height: 8px; 
}

.progress-background,
.volume-background {
   position: relative;
}

.volume-slider,
.progress-slider {
   appearance: none;
   -webkit-appearance: none;
   outline: none;
   width: 100%;

   position: absolute;
   top: 0;
   transform: translateY(-25%);

   margin: 0;
   opacity: 0;
   padding: 0;

   cursor: pointer;

   background-color: #e4e4e4;
}
</style>
