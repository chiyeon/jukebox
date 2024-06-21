<template>
  <div :class="{ 'progress-box': true, disabled: disabled }">
    <div class="progress-background">
      <div
        class="progress"
        ref="progress_ref"
        :style="{ width: ((current_progress * 100) + '%'), backgroundColor: color }"
      ></div>
      <input
        @input="drag_slider"
        @mouseup="set_progress"
        type="range"
        min="0"
        max="1"
        step="0.01"
        class="progress-slider"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed, watch } from "vue";

const props = defineProps([ "color", "progress", "disabled" ])
// setProgress - whenever the user lets go of the mouse after dragging. change progress to that value
// returns a value between 0 and 1
const emit = defineEmits([ "setProgress" ])

const progress_ref = ref();
const progress = ref(props.progress);

let dragging = false

const current_progress = computed(() => {
   return progress.value
})

watch(() => props.progress, (newval, oldval) => {
  // only change the value if we arent dragging!
  if (!dragging) progress.value = newval
})

const drag_slider = (e) => {
  dragging = true
  progress.value = e.currentTarget.value
}

const set_progress = () => {
  dragging = false
  emit("setProgress", progress.value)
}

</script>

<style scoped>
.progress-background {
  width: 100%;
  height: 6px;
  border-radius: 100px;
  background-color: #e4e4e4;

  transition: height 300ms cubic-bezier(0, 0.74, 0.04, 1);
}

.progress {
  border-radius: 100px;
  height: 100%;
  width: 0%;
}

.progress-background:hover,
.progress-box:hover .progress-background {
  height: 8px;
}

.progress-background,
.volume-background {
  position: relative;
}

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
