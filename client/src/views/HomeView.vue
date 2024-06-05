<template>
  <main>
    <div class="tracks">
      <Event
        v-for="event in events"
        :key="event.date"
        :event="event"
      />
    </div>
  </main>
</template>

<script setup>
import Event from "../components/EventComponent.vue"
import { onBeforeMount, ref } from "vue"
import { useStore } from "vuex"

const store = useStore()
const events = ref([])

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
