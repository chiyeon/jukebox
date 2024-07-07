<template>
   <div class="add-to-playlist-box" @click="eventbus.emit('set_add_to_playlist_visibility', false)" v-if="track && user">
      <div class="panel" @click.stop="null">
         <span class="material-symbols-rounded icon close" @click.stop="eventbus.emit('set_add_to_playlist_visibility', false)">close</span>
         <p class="hint">Add <strong>{{ track.title }} by {{ track.artist }}</strong> to:</p>

         <div class="playlists" v-if="playlists">
            <div
               class="new-playlist"
               @click="show_new_playlist = true"
            >
               <div class="cover">
                  <span class="material-symbols-rounded icon">add_circle</span>
               </div>
               <p>New Playlist</p>
            </div>
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
   <PlaylistCreation v-if="show_new_playlist" @close="show_new_playlist = false" />
</template>

<script setup>
import { defineProps, computed, onBeforeMount, ref } from "vue"
import eventbus from "../eventbus"
import { useStore } from "vuex"

import Playlist from "./PlaylistComponent.vue"
import PlaylistCreation from "./PlaylistCreation.vue"

const store = useStore()

const props = defineProps([ "track" ])

const user = computed(() => store.state.user)
const playlists = ref(null)

const show_new_playlist = ref(false)

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

.close {
   font-size: 32px;
   cursor: pointer;
}
.close:hover {
   color: darkred;
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
