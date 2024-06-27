<template>
   <div :class="{ 'progress-box': true, disabled: disabled }">
      <span
         v-if="left_icon"
         class="material-symbols-rounded"
         :style="{ color: left_icon.color }"
         >{{ left_icon.icon }}</span
      >
      <p v-if="left_label" class="label">{{ left_label }}</p>
      <div class="progress-background">
         <div
            class="progress"
            ref="progress_ref"
            :style="{
               width: current_progress * 100 + '%',
               backgroundColor: color,
            }"
         ></div>
         <input
            @input="drag_slider"
            @change="set_progress"
            type="range"
            min="0"
            max="1"
            step="0.001"
            class="progress-slider"
            :value="current_progress"
         />
      </div>
      <p v-if="right_label" class="label right">{{ right_label }}</p>
      <span
         v-if="right_icon"
         class="material-symbols-rounded right"
         :style="{ color: right_icon.color }"
         >{{ right_icon.icon }}</span
      >
   </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed, watch } from "vue"

const props = defineProps([
   "color",
   "progress",
   "disabled",
   "left_label",
   "right_label",
   "left_icon",
   "right_icon",
   "allow_drag",
])
// setProgress - whenever the user lets go of the mouse after dragging. change progress to that value
// returns a value between 0 and 1
const emit = defineEmits(["setProgress"])

const progress_ref = ref()
const progress = ref(props.progress)

let dragging = false

const current_progress = computed(() => {
   return progress.value
})

watch(
   () => props.progress,
   (newval, oldval) => {
      // only change the value if we arent dragging!
      if (!dragging) progress.value = newval
   }
)

const drag_slider = (e) => {
   progress.value = e.currentTarget.value
   if (props.allow_drag) {
      emit("setProgress", e.currentTarget.value)
   } else {
      dragging = true
   }
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

.progress-box {
   width: 100%;
   height: 12px;
   cursor: pointer;

   display: flex;
   align-items: center;
}

.progress-background:hover,
.progress-box:hover .progress-background {
   height: 8px;
}

.progress-background {
   position: relative;
}

.progress-slider {
   -webkit-appearance: none;
   appearance: none;
   outline: none;
   width: 100%;
   background: none;

   position: absolute;
   top: 0;
   transform: translateY(-25%);

   margin: 0;
   padding: 0;

   cursor: pointer;
}

.progress-background:hover .progress-slider::-webkit-slider-thumb {
   opacity: 1;
}
.progress-background:hover .progress-slider::-moz-range-thumb {
   opacity: 1;
}

.progress-slider::-webkit-slider-thumb {
   -webkit-appearance: none;
   appearance: none;  
   opacity: 0;
   border: none;
   width: 16px;
   height: 16px;
   border-radius: 100px;
   background-color: darkseagreen;
}

.progress-slider::-moz-range-thumb {
   opacity: 0;
   border: none;
   width: 16px;
   height: 16px;
   border-radius: 100px;
   background-color: darkseagreen;
}

.label {
   font-size: 13px;
   width: 50px;
}
.label.right {
   text-align: right;
}

.disabled {
   pointer-events: none;
}
</style>
