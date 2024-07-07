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
            <div class="playlist-controls" v-if="user && playlist.owner == user.username">
               <span class="material-symbols-rounded icon" style="color: goldenrod">edit</span>
               <span class="material-symbols-rounded icon" style="color: darkred" @click="show_delete = true">delete</span>
            </div>
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
   <ConfirmDelete v-if="show_delete" @close="show_delete=false" message="Delete Playlist?" @delete="delete_playlist" />
</template>

<script setup>
import Track from "../components/TrackComponent.vue"
import ConfirmDelete from "../components/ConfirmDelete.vue"
import { ref, watch, onBeforeMount, computed } from "vue"
import { useRoute, RouterLink } from "vue-router"
import { useStore } from "vuex"
import router from "../router"

const store = useStore()
const route = useRoute()
const user = computed(() => store.state.user)

const playlist = ref(null)

const show_delete = ref(false)

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
      await update_playlist_data(route.params.playlist)
   } else {
      alert("Error: " + (await res.json()).message)
   }
}

const delete_playlist = async () => {
   let res = await fetch("/api/playlist_delete", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         uuid: playlist.value.uuid
      }),
      credentials: "include"
   })

   if (res.ok) {
      if (!user.value) return router.push("/")

      router.push(`/u/${user.value.username}/playlists`)
   } else {
      alert("Failed to delete playlist: " + (await res.json()).message)
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
@media (max-width: 600px) {
   .playlist-box .cover {
      width: 128px;
   }
}

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

.playlist-controls {
   margin-top: auto; 
   margin-bottom: 8px;
   display: flex;
   gap: 8px;
}

.playlist-controls .icon {
   font-size: 28px;
   user-select: none;
   cursor: pointer;
}

.playlist-controls .icon:hover {
   opacity: 0.7;
}


</style>
