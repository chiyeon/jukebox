<template>
    <div class="controls">
        <button @click="emit('toggleShuffle')" class="shuffle">
            <span
            class="material-symbols-rounded control-icon"
            >
            {{ shuffle ? "shuffle_on" : "shuffle" }}
            </span>
        </button>
        <button class="prev" @click="emit('prevTrack')">
            <span
            class="material-symbols-rounded control-icon"
            >
            skip_previous
            </span>
        </button>
        <button class="pause" @click="emit('togglePlayback')">
            <span
            class="material-symbols-rounded control-icon"
            >
            {{
                paused
                ? "play_circle"
                : "pause_circle"
            }}
            </span>
        </button>
        <button class="next" @click="emit('nextTrack')">
            <span
            class="material-symbols-rounded control-icon"
            >
            skip_next
            </span>
        </button>
        <button @click="emit('cycleRepeatMode')" class="repeat">
            <span
            class="material-symbols-rounded control-icon"
            >
            {{ repeat_modes[repeat_mode] }}
            </span>
        </button>
    </div>
</template>

<script setup>
import { defineProps, defineEmits, } from "vue"

const props = defineProps([ "paused", "repeat_mode", "shuffle" ])
const emit = defineEmits([ "togglePlayback", "cycleRepeatMode", "toggleShuffle", "nextTrack", "prevTrack" ])

const repeat_modes = ["repeat", "repeat_on", "repeat_one_on"];

</script>

<style scoped>
.controls {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: center;
}

.controls button {
  background: none;
  border: none;
  cursor: pointer;
}

.controls button:hover {
  opacity: 0.8;
}

.control-icon {
  text-align: center;
  display: block;
  color: coral;
}

.prev .control-icon,
.pause .control-icon,
.next .control-icon {
  --size: 40px;
  display: block;
  font-size: var(--size);
  width: var(--size);
  height: var(--size);
  text-align: center;
  line-height: var(--size);
}
</style>
