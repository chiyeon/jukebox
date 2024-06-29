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

      <Track
         v-for="track in playlist.tracks"
         :key="track.uuid"
         :track="track"
      >
         <template #extra-columns>
            <p class="uploader">Added by {{ track.uploader }}</p>
         </template>
         <template #dropdown-options>
            <div class="dropdown-option" @click.stop="remove_from_playlist(track)">
               <span class="material-symbols-rounded icon">delete</span>
               <p>Remove from Playlist</p>
            </div>
         </template>
      </Track>
   </div>
   <p v-else>Loading</p>
</template>

<script setup>
import Track from "../components/TrackComponent.vue"
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

const remove_from_playlist = async (track) => {
   // remember, we must match the server request... it takes a PlaylistTrack, containing
   // uploader & uuid
   let res = await fetch("/api/playlist_remove_tracks", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         tracks: [
            {
               "uploader": track.uploader,
               "uuid": track.uuid
            }
         ],
         uuid: playlist.value.uuid
      }),
      credentials: "include"
   })

   if (res.ok) {
      alert("Removed tracks")
   } else {
      alert("Error: " + (await res.json()).message)
   }
}

onBeforeMount(() => {
   update_playlist_data(route.params.playlist)
})

watch(() => route.params.playlist, (newval) => {
   playlist.value = null
   update_playlist_data(newval)
})
</script>

<style scoped>
.playlist-box {
   padding-bottom: 300px;
}
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

.dropdown-option p {
   margin: 0;
}
</style>
