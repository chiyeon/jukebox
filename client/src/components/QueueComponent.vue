<template>
   <div class="queue-box">
      <div v-if="queue.length != 0" class="queue">
         <h2>Queue</h2>
         <Track
            v-for="track in queue"
            :key="queue.indexOf(track)"
            :track="track"
            :hide_queue="true"
            :show_remove="true"
            :queue_track="track"
            :hide_album_covers="true"
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
               :hide_queue="true"
               :hide_album_covers="true"
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
   width: 400px;
   overflow-y: auto;

   background-color: white;
   border-left: 1px solid black;
   padding-left: 20px;

   white-space: nowrap;
   overflow-x: hidden;

}

</style>
