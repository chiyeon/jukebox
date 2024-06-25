<template>
   <div class="player-mini-box">
      <div class="player-mini">
         <ProgressSlider
            :style="{ marginBottom: '20px' }"
            color="coral"
            :progress="controls.audio_progress"
            :disabled="audio_ref && audio_ref.src == ''"
            @setProgress="(p) => emit('setAudioProgress', p)"
            :left_label="current_playback_time"
            :right_label="song_duration"
         />
         <div class="track-box">
            <Track
               v-if="current_song"
               :track="current_song"
               type="player"
               @click="() => emit('showAlbum')"
            />
            <div
               v-else
               class="not-playing-preview"
               @click="() => emit('showAlbum')"
            >
               <span class="material-symbols-rounded album-icon">album</span>
               <p>No track selected</p>
            </div>
            <MediaControls
               :paused="audio_ref && audio_ref.paused"
               :repeat_mode="controls.repeat_mode"
               :shuffle="controls.shuffle"
               @togglePlayback="emit('togglePlayback')"
               @cycleRepeatMode="emit('cycleRepeatMode')"
               @toggleShuffle="emit('toggleShuffle')"
               @nextTrack="emit('nextTrack')"
               @prevTrack="emit('prevTrack')"
            />
            <div class="controls-right">
               <div class="volume-controls">
                  <span
                     class="material-symbols-rounded volume-icon"
                     :style="{ color: 'purple' }"
                     @click="emit('toggleMute')"
                     >{{ get_volume_icon() }}</span
                  >
                  <ProgressSlider
                     color="purple"
                     :allow_drag="true"
                     :progress="controls.volume_progress"
                     :disabled="!audio_ref"
                     @setProgress="(p) => emit('setVolumeProgress', p)"
                  />
               </div>
               <span
                  class="material-symbols-rounded icon"
                  :style="{ color: 'green' }"
                  @click="eventbus.emit('toggle_lyrics_visibility')"
                  v-if="current_song && current_song.lyrics != ''"
               >
                  mic_external_on
               </span>
               <span
                  class="material-symbols-rounded icon"
                  :style="{ color: 'lightcoral' }"
                  @click="eventbus.emit('toggle_queue_visibility')"
               >
                  queue_music
               </span>
            </div>
         </div>
      </div>
   </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue"
import eventbus from "../../eventbus"
import ProgressSlider from "./ProgressSlider.vue"
import MediaControls from "./MediaControls.vue"
import Track from "../TrackComponent.vue"

const props = defineProps([
   "current_song",
   "audio_ref",
   "controls",
   "current_playback_time",
   "song_duration",
])
const emit = defineEmits([
   "setAudioProgress",
   "setVolumeProgress",
   "togglePlayback",
   "cycleRepeatMode",
   "toggleShuffle",
   "nextTrack",
   "prevTrack",
   "toggleMute",
   "showAlbum",
])

const volume_icons = ["volume_up", "volume_down", "volume_mute", "volume_off"]

const get_volume_icon = () => {
   let vol = props.controls.volume_progress

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
</script>

<style scoped>
.jam-icon {
   font-size: 32px;
   width: 32px;
   height: 32px;
   text-align: center;
   line-height: 32px;
}

.player-mini-box {
   width: 100%;

   background-color: white;
   border-top: 1px solid black;
   box-sizing: border-box;
}

.player-mini {
   margin: auto;
   padding: 20px 0;
   max-width: 1000px;
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

.album-cover {
   width: 64px;
   height: 64px;
   cursor: pointer;
   overflow: hidden;
}

.album-cover img {
   width: 100%;
   height: 100%;
   object-fit: cover;
}

.album-icon {
   font-size: 64px;
   color: black;
}

.artist-comma {
   display: inline;
}

.track-info {
   flex: 1;
}

.track-info p {
   margin: 0;
}

.controls-right {
   flex: 1;

   display: flex;
   justify-content: flex-end;
}

.volume-controls {
   width: 90px;
   display: flex;
   flex-direction: row;
   align-items: center;
   gap: 4px;
}

.volume-icon,
.jam-icon {
   cursor: pointer;
}

.icon {
   margin-left: 8px;
   cursor: pointer;
}

.icon:hover {
   opacity: 0.6;
}

.material-symbols-rounded {
   user-select: none;
}

.not-playing-preview {
   display: flex;
   flex-direction: row;
   gap: 10px;
   align-items: center;

   flex: 1;
}

.not-playing-preview p {
   margin: 0;
}
</style>
