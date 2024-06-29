<template>
   <div class="playlists-box">
      <div
         class="new-playlist"
         @click="new_playlist"
         v-if="user && user.username == route.params.username"
      >
         <div class="cover">
            <span class="material-symbols-rounded icon">add_circle</span>
         </div>
         <p>New Playlist</p>
      </div>
      <template v-if="playlists && playlists.length != 0">
         <Playlist
            v-for="(playlist, index) in playlists"
            :key="index"
            :playlist="playlist"
         />
      </template>
      <p
         v-if="
            user &&
            user.username != route.params.username &&
            playlists &&
            playlists.length == 0
         "
      >
         No playlists found
      </p>
   </div>
</template>

<script setup>
import Playlist from "../components/PlaylistComponent.vue"
import { onMounted, ref, defineProps, computed, watch } from "vue"
import { useStore } from "vuex"
import { useRoute } from "vue-router"

const store = useStore()
const route = useRoute()

const user = computed(() => store.state.user)
const playlists = ref(null)

const new_playlist = async () => {
   let formdata = new FormData()
   formdata.append("name", "Test Playlist")
   formdata.append("visibility", "private")

   let res = await fetch("/api/playlist_create", {
      method: "POST",
      credentials: "include",
      body: formdata,
   })

   if (res.ok) {
      alert("Success")
   } else {
      alert((await res.json()).message)
   }
}

const fetch_playlists = async () => {
   if (!route.params.username || route.params.username == "") return
   let res = await fetch("/api/playlists", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: route.params.username }),
      credentials: "include",
   })

   if (res.ok) {
      playlists.value = (await res.json()).playlists
   } else {
      alert((await res.json()).message)
   }
}

onMounted(() => { fetch_playlists() })

watch(
   () => route.params.username,
   () => { playlists.value = []; fetch_playlists() }
)
</script>

<style scoped>
.playlists-box {
   display: flex;
   gap: 20px;
   flex-direction: row;
   flex-wrap: wrap;
}

.new-playlist {
   width: 200px;
   display: flex;
   justify-content: center;
   align-items: center;
   flex-direction: column;

   cursor: pointer;
}

.new-playlist:hover .cover {
   filter: invert(1);
}

.cover {
   width: 100%;
   aspect-ratio: 1;
   background-color: #303030;

   display: flex;
   justify-content: center;
   align-items: center;
}

.cover .icon {
   color: #e7e7e7;
   font-size: 64px;
}
</style>
