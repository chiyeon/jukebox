<template>
   <div class="queue-box">
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
</template>

<script setup>
import Track from "./TrackComponent.vue"
import { useStore } from "vuex"
import { computed } from "vue"

const store = useStore()

const queue = computed(() => store.state.queue)
const after_queue = computed(() => store.state.afterQueue)
</script>

<style scoped>
.queue-box {
   height: 100%;
   width: 500px;
   overflow-y: auto;

   background-color: white;
   border-left: 1px solid black;
   padding: 0 20px;
}

.queue-title {
   display: flex;
   flex-direction: row;
   align-items: flex-end;

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

</style>
