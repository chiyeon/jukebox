<template>
    <div class="player mini" v-if="show_mini_player" @click="show_mini_player = false">
        <ProgressSlider 
            color="coral"
            :progress="controls.audio_progress"
            :disabled="audio_ref && audio_ref.src == ''"
            @setProgress="(p) => emit('setAudioProgress', p)"
            @click.stop="undefined"
        />
        <div class="progress-labels">
            <p class="left">{{ current_playback_time }}</p>
            <p class="right">{{ song_duration }}</p>
        </div>
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
            <button class="queue-button" @click.stop="emit('toggleQueue')">
                <span class="material-symbols-rounded">queue_music</span>
            </button>
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
    
    <div class="player big" v-else>
        <button class="close">
            <span @click="show_mini_player=true" class="material-symbols-rounded">keyboard_arrow_down</span>
        </button>
        <div class="track-box">
            <Track
                v-if="current_song"
                :track="current_song"
                type="playermobile"
            />
            <div v-else class="not-playing-preview mobile_expanded">
                <span class="material-symbols-rounded album-icon"> album </span>
                <p>No track selected</p>
            </div>
        </div>
        <ProgressSlider 
            color="coral"
            :progress="controls.audio_progress"
            :disabled="audio_ref && audio_ref.src == ''"
            @setProgress="(p) => emit('setAudioProgress', p)"
            @click.stop="undefined"
        />
        <div class="progress-labels">
            <p class="left">{{ current_playback_time }}</p>
            <p class="right">{{ song_duration }}</p>
        </div>
        <MediaControls
          :paused="audio_ref && audio_ref.paused"
          :repeat_mode="controls.repeat_mode"
          :shuffle="controls.shuffle"
          :mobile="true"

          @togglePlayback="emit('togglePlayback')"
          @cycleRepeatMode="emit('cycleRepeatMode')"
          @toggleShuffle="emit('toggleShuffle')"
          @nextTrack="emit('nextTrack')"
          @prevTrack="emit('prevTrack')"
        />
        <div class="other-controls">
            <button class="queue-button" @click.stop="emit('toggleQueue')">
                <span class="material-symbols-rounded album-icon">queue_music</span>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue"
import Track from "../TrackComponent.vue"
import ProgressSlider from "./ProgressSlider.vue"
import MediaControls from "./MediaControls.vue"

const props = defineProps([ "current_song", "audio_ref", "controls", "current_playback_time", "song_duration" ])
const emit = defineEmits([ "setAudioProgress", "togglePlayback", "cycleRepeatMode", "toggleShuffle", "nextTrack", "prevTrack", "toggleQueue", ])

const show_mini_player = ref(true)
</script>

<style scoped>
/* both */
.progress-labels {
    display: flex;
    align-items: center;
}

.progress-labels p {
    flex: 1;
    font-size: 12px;
    margin-top: 0;
}

.progress-labels .right {
    text-align: right;
}

/* mini player start */
.player {
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

.pause .control-icon {
    --size: 48px;
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
  padding: 0;
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

/* bigt player */
.big {
    --padding: 40px;
    padding: 10px var(--padding) var(--padding) var(--padding);
    height: 90vh;
    height: 90vdh;
}

.mobile_expanded span {
    font-size: calc(100vw - calc(var(--padding) * 2)); /* for padding */
    color: white;
    background-color: black;
}

.big .not-playing-preview {
    flex-direction: column;
    align-items: flex-start;
}
.big .not-playing-preview p {
    font-size: 28px;
    font-weight: bold;
    padding-bottom: 30px;
}

.close {
    /* align-self: flex-end; */
    margin-bottom: 10px;
    padding: 0;
    transform: translateX(-12px);
}

.close span {
    font-size: 48px;
    text-align: left;
    width: 100%;
    user-select: none;
}

.close:hover span {
    color: coral;
}

.other-controls {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    padding-top: 10px;
}

.queue-button {
    padding: 0;
}

.queue-button span {
    font-size: 28px;
    color: purple;
}
</style>