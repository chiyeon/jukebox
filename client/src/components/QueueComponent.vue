<template>
   <div class="queue-box">
      <div class="close-box">
         <span class="material-symbols-rounded close" @click="emit('close')">close</span>
      </div>
      
      <div class="tracks">
         <div v-if="queue.length != 0" class="queue">
            <span class="queue-title">
               <h2>Queue</h2>
               <p class="button" @click="store.dispatch('setQueue', [])">Clear queue</p>
            </span>
            <Track
               v-for="(track, index) in queue"
               :key="index"
               :track="track"
               :index="index"
               type="queue"
            />
         </div>

         <div class="up-next">
            <h2>Up Next</h2>
            <p v-if="after_queue.length == 0">No songs up next</p>
            <template v-else>
               <Track
                  v-for="(track, index) in after_queue"
                  :key="index"
                  :track="track"
                  :index="index"
                  type="afterqueue"
               />
            </template>
         </div>
      </div>
   </div>
</template>

<script setup>
import Track from "./TrackComponent.vue"
import { useStore } from "vuex"
import { computed, defineEmits } from "vue"

const emit = defineEmits([ "close" ])

const store = useStore()

const queue = computed(() => store.state.queue)
const after_queue = computed(() => store.state.afterQueue)


</script>

<style scoped>
@media (max-width: 600px) {
   .queue-box .close-box {
      justify-content: flex-start;
   }
}
.queue-box {
   height: 100%;
   width: 500px;
   overflow-y: hidden;
   overflow-x: hidden;

   background-color: white;
   border-left: 1px solid black;
   padding-left: 20px;
   padding-top: 30px;
   z-index: 100;

   display: flex;
   flex-direction: column;
}

.tracks {
   overflow-y: auto;
   overflow-x: hidden;
   flex: 1;
   padding-right: 12px;
}

.queue-title {
   display: flex;
   flex-direction: row;
   align-items: center;

   margin: 20px 0;
}

.queue-title > * {
   margin: 0;
   flex: 1;
}
.button {
   text-align: right;
   cursor: pointer;
   user-select: none;
}

.button:hover {
   opacity: 0.7;
}

.close {
   cursor: pointer;
}

.close:hover {
   opacity: 0.5;
}

.close-box {
   display: flex;
   justify-content: flex-end;
   height: 40px;
}

.close {
   font-size: 32px;
}

</style>
