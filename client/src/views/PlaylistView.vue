<template>
   <div class="playlist-box" v-if="playlist">
      <img class="cover" :src="playlist.cover" />
      <h1 class="name">{{ playlist.name }}</h1>
      <p class="description">{{ playlist.description }}</p>

      <Event
         :event="{ tracks: playlist.tracks }"
      />
   </div>
   <p v-else>Loading</p>
</template>

<script setup>
import Event from "../components/EventComponent.vue"
import { ref, watch, onBeforeMount } from "vue"
import { useRoute } from "vue-router"

const route = useRoute()

const playlist = ref(null)

const update_playlist_data = async (uuid) => {
   let res = await fetch("/api/playlist", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         uuid
      }),
      credentials: "include"
   })

   if (res.ok) {
      playlist.value = (await res.json()).playlist
   } else {
      alert("Error: " + (await res.json()).message)
   }
}

onBeforeMount(() => {
   update_playlist_data(route.params.playlist)
})

watch(() => route.params.playlist, (newval) => {
   console.log("uh")
   playlist.value = null
   update_playlist_data(newval)
})
</script>
