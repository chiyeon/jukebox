<template>
  <main>
    <TracksSearchBar @onSearch="(tracks) => filtered_tracks = tracks" :nullOnEmpty="true" class="search-bar" />
    <div class="tracks">
      <Event
         v-if="filtered_tracks && filtered_tracks.length > 0"
         :event="{ tracks: filtered_tracks }"
         class="filtered-tracks"
      />
      <p v-else-if="filtered_tracks && filtered_tracks.length == 0">No tracks match search</p>
      <p v-else-if="!events">Loading tracks</p>
      <p v-else-if="events.length == 0">No tracks found</p>
      <Event
        v-else
        v-for="event in events"
        :key="event.date"
        :event="event"
      />
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
   events.value.forEach(e => {
      tracks.push(...e.tracks)
   })

   store.dispatch("setTracks", tracks)
}

onBeforeMount(async () => {
  events.value = (await (await fetch("/api/events", {
      method: "GET",
   })).json()).events

   update_tracks()
})
</script>

<style scoped>
.filtered-tracks {
   margin-top: 30px;
}
</style>
