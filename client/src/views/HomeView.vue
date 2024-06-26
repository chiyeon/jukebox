<template>
   <main>
      <TracksSearchBar
         @onSearch="(tracks) => (filtered_tracks = tracks)"
         :nullOnEmpty="true"
         class="search-bar"
      />
      <div class="tracks">
         <Event
            v-if="filtered_tracks && filtered_tracks.length > 0"
            :event="{ tracks: filtered_tracks }"
            class="filtered-tracks"
         />
         <p v-else-if="filtered_tracks && filtered_tracks.length == 0">
            No tracks match search
         </p>
         <p v-else-if="!events">Loading tracks</p>
         <p v-else-if="events.length == 0">No tracks found</p>
         <template v-else>
            <div class="open-now-box" v-if="events.filter(e => e.featured).length != 0">
               <h2><strong>Active Events</strong></h2>
               <Event
                  v-for="event in events.filter(e => e.featured)"
                  :key="event.date"
                  :event="event"
                  :preview="!event.open"
               />
            </div>
            <Event
               v-for="event in events.filter(e => !e.featured)"
               :key="event.date"
               :event="event"
               :preview="event.featured && !event.open"
            />
         </template>
      </div>
   </main>
</template>

<script setup>
import Event from "../components/EventComponent.vue"
import TracksSearchBar from "../components/TracksSearchBar.vue"
import { onBeforeMount, ref } from "vue"
import { useStore } from "vuex"

const store = useStore()

// we are in either events all or filtered mode. when user is
// typing queries, switch to filtered, otherwise show all events
const events = ref(null)
const filtered_tracks = ref([])

// take events & extract just the tracks, putting in store
const update_tracks = () => {
   let tracks = []
   events.value.forEach((e) => {
      tracks.push(...e.tracks)
   })

   store.dispatch("setTracks", tracks)
}

onBeforeMount(async () => {
   events.value = (
      await (
         await fetch("/api/events", {
            method: "GET",
         })
      ).json()
   ).events

   update_tracks()
})
</script>

<style scoped>
.filtered-tracks {
   margin-top: 30px;
}

.open-now-box {
   background: rgb(255,192,0);
   background: linear-gradient(180deg, rgb(193, 175, 119) 0%, rgb(255, 255, 255) 100%);
   padding: 20px;
   border-radius: 10px;
}

.open-now-box h2 {
   margin: 0;
}
</style>
