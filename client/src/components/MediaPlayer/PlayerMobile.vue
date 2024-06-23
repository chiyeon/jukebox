<template>
    <div class="mini-player" v-if="show_mini_player" @click="show_mini_player = false">
        <ProgressSlider 
            :style="{ marginBottom: '10px' }"
            color="coral"
            :progress="controls.audio_progress"
            :disabled="audio_ref && audio_ref.src == ''"
            @setProgress="(p) => emit('setAudioProgress', p)"
            :left_label="current_playback_time"
            :right_label="song_duration"
            @click.stop="null"
        />
        <div class="track-box">
            <Track
                v-if="current_song"
                :track="current_song"
                type="player"
            />
            <div v-else class="not-playing-preview">
                <span class="material-symbols-rounded album-icon"> album </span>
                <p>No track selected</p>
            </div>
            <button class="pause" @click.stop="emit('togglePlayback')">
                <span
                class="material-symbols-rounded control-icon"
                >
                {{
                    audio_ref && audio_ref.paused
                    ? "play_circle"
                    : "pause_circle"
                }}
            </span>
        </button>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue"
import Track from "../TrackComponent.vue"
import ProgressSlider from "./ProgressSlider.vue"

const props = defineProps([ "current_song", "audio_ref", "controls", "current_playback_time", "song_duration" ])
const emit = defineEmits([ "setAudioProgress", "togglePlayback", "cycleRepeatMode", "toggleShuffle", "nextTrack", "prevTrack", "toggleQueue", ])

const show_mini_player = ref(true)
</script>

<style scoped>
/* mini player start */
.mini-player {
    width: 100%;
    position: fixed;
    bottom: 0;
    left: 0;
    padding: 10px 10px;

    box-sizing: border-box;
    border-top: 1px solid black;
    background-color: white;

    display: flex;
    flex-direction: column;
}

.track-box {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}
/* 
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
} */

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-icon {
  font-size: 64px;
  color: black;
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

button {
  background: none;
  border: none;
  cursor: pointer;
}


.control-icon {
  text-align: center;
  display: block;
  color: coral;
  --size: 40px;
  display: block;
  font-size: var(--size);
  width: var(--size);
  height: var(--size);
  text-align: center;
  line-height: var(--size);
}
</style>