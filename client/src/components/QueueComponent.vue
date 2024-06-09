<template>
   <div class="queue-box">
      <div v-if="queue.length != 0" class="queue">
         <h2>Queue</h2>
         <Track
            v-for="track in queue"
            :key="queue.indexOf(track)"
            :track="track.track"
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
               v-for="track in after_queue"
               :key="track.track.filename"
               :track="track.track"
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
   max-height: 60vh;
   width: 300px;
   overflow-y: auto;
   padding: 20px;

   position: fixed;
   right: 0;
   top: 0;

   background-color: white;
   border: 1px solid black;
}

</style>
