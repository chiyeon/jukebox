<template>
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
</template>

<script setup>
import Event from "../components/EventComponent.vue"
import TracksSearchBar from "../components/TracksSearchBar.vue"
import { onBeforeMount, onMounted, ref, nextTick, computed } from "vue"
import { useStore } from "vuex"
import { useRoute } from "vue-router"
import eventbus from "../eventbus"

const store = useStore()
const route = useRoute()

const user = computed(() => store.state.user)

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
   return tracks
}

onBeforeMount(async () => {
   events.value = (
      await (
         await fetch("/api/events", {
            method: "GET",
         })
      ).json()
   ).events

   let tracks = update_tracks()

   let song_uuid = route.query.song
   if (song_uuid) {
      // O (n)... replace eventually
      let found_tracks = tracks.filter(s => s.uuid == song_uuid)
      if (found_tracks.length > 0) {
         eventbus.emit("playSong", found_tracks[0])
         await nextTick()
         eventbus.emit("set_new_info_track", found_tracks[0])
         document.getElementById(found_tracks[0].event)?.scrollIntoView()
      }
   }

   const nav_to = (id) => {
      document.getElementById(id)?.scrollIntoView()
   }

   eventbus.on("nav_to", nav_to)

   /* if event UUID is in URL, quick nav to there */
   let event_uuid = route.query.event
   if (event_uuid) {
      await nextTick()
      nav_to(event_uuid)
   }
})
</script>

<style scoped>
.filtered-tracks {
   margin-top: 30px;
}

.open-now-box {
   background: var(--accent-background);
   background: linear-gradient(180deg, var(--accent-background) 0px, var(--background-1) 500px);
   padding: 20px;
   border-radius: 10px;
}

.open-now-box h2 {
   margin: 0;
}

.rewind a {
   padding: 10px;
   background-color: var(--background-2);
   border-radius: 4px;
   font-weight: bold;
}

.rewind {
   margin: auto;
   width: fit-content;
}
</style>
