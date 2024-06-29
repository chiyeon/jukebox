<template>
   <div class="playlist-box" v-if="playlist">
      <div class="info-box">
         <img class="cover" :src="playlist.cover" />
         <div class="info">
            <h1 class="name">{{ playlist.name }}</h1>
            <p class="visibility">{{ playlist.visibility == "public" ? "Public" : "Private" }} playlist</p>
            <div class="contributors">
               <p>By </p>
               <RouterLink
                  v-for="user in playlist.editors"
                  :key="user.uuid"
                  :to="`/u/${user}`"
               >{{ user }}</RouterLink>
            </div>
            <p class="description">{{ playlist.description }}</p>
         </div>
      </div>

      <Event
         :event="{ tracks: playlist.tracks }"
      />
   </div>
   <p v-else>Loading</p>
</template>

<script setup>
import Event from "../components/EventComponent.vue"
import { ref, watch, onBeforeMount } from "vue"
import { useRoute, RouterLink } from "vue-router"
import { useStore } from "vuex"

const store = useStore()
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
      store.dispatch("setTracks", playlist.value.tracks)
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

<style scoped>
.cover {
   width: 256px;
}

.info-box {
   display: flex;
   flex-direction: row;
   gap: 20px;
}

.info > * {
   margin: 0;
}

.info {
   display: flex;
   flex-direction: column;
}

.contributors {
   display: flex;
   flex-direction: row;
   align-items: center;
   gap: 4px;
}

.contributors p {
   margin: 0;
}

.visibility {
   font-style: italic;
}

.description {
   margin-top: 20px;
}
</style>
