<template>
   <div class="add-to-playlist-box" @click="eventbus.emit('set_add_to_playlist_visibility', false)" v-if="track && user">
      <div class="panel" @click.stop="null">
         <p class="hint">Add <strong>{{ track.title }} by {{ track.artist }}</strong> to:</p>

         <div class="playlists" v-if="playlists">
            <Playlist
               v-for="playlist in playlists"
               :key="playlist.uuid"
               :disable_click="true"
               :playlist="playlist"
               @click.stop="add_to_playlist(playlist.uuid)"
            />
         </div>
      </div>
   </div>
</template>

<script setup>
import { defineProps, computed, onBeforeMount, ref } from "vue"
import eventbus from "../eventbus"
import { useStore } from "vuex"

import Playlist from "./PlaylistComponent.vue"

const store = useStore()

const props = defineProps([ "track" ])

const user = computed(() => store.state.user)
const playlists = ref(null)

const fetch_playlists = async () => {
   if (!user) return
   let res = await fetch("/api/playlists", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: user.value.username }),
      credentials: "include",
   })

   if (res.ok) {
      playlists.value = (await res.json()).playlists
   } else {
      alert((await res.json()).message)
   }
}

const add_to_playlist = async (playlist_uuid) => {
   if (!playlist_uuid || !props.track) return

   let res = await fetch("/api/playlist_add_tracks", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({ uuid: playlist_uuid, tracks: [ props.track.uuid ] }),
      credentials: "include",
   })

   if (res.ok) {
      alert("Added to playlist")
   } else {
      alert((await res.json()).message)
   }

   eventbus.emit("set_add_to_playlist_visibility", false)
}

onBeforeMount(() => {
   fetch_playlists() 
})
</script>

<style scoped>
.add-to-playlist-box {
   position: fixed;
   left: 0;
   top: 0;
   z-index: 202;
   background-color: #30303090;
   width: 100vw;
   height: 100vh;

   display: flex;
   justify-content: center;
   align-items: center;
}

.panel {
   background-color: #f7f7f7;
   padding: 20px;
   margin: 20px;
   width: 100%;
   max-width: 1000px;
   box-sizing: border-box;
   z-index: 1;
}

.hint {

}

.playlists {
   display: flex;
   flex-direction: row;
   flex-wrap: wrap;
   gap: 20px;
}
</style>
