<template>
   <div class="playlist-box" v-if="playlist">
      <div class="info-box">
         <div class="cover">
            <img class="cover" :src="editing ? cover_url : playlist.cover" />
            <template v-if="editing">
               <button class="edit" @click="cover.click()">
                  <span class="material-symbols-rounded icon">edit</span>
               </button>
               <input class="upload-cover-input" type="file" accepts=".png,.jpeg,.jpg,.gif,.bmp,.tiff,.webp" ref="cover" @change="update_cover_preview" />
            </template>
         </div>
         <div class="info">
            <template v-if="!editing">
               <h1 class="name">{{ playlist.name }}</h1>
               <p class="visibility">{{ playlist.visibility == "public" ? "Public" : "Private" }} playlist</p>
               <div class="contributors">
                  <p style="margin-right: 4px">By </p>
                  <template 
                     v-for="(user, index) in playlist.editors"
                     :key="index"
                  >
                     <RouterLink
                        :to="`/u/${user}`"
                     >
                        {{ user }}
                     </RouterLink>
                     <p style="margin-right: 4px">{{(index != playlist.editors.length - 1) ? ", " : ""}}</p>
                  </template>
               </div>
               <p class="description">{{ playlist.description }}</p>
            </template>
            <template v-else>
               <input type="text" ref="name_ref" class="name" :value="playlist.name" />
               <select class="visibility" ref="visibility_ref" :value="playlist.visibility">
                  <option value="solo">Me Only</option>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
               </select>
               <div class="contributors">
                  <p style="margin-right: 4px">By </p>
                  <template 
                     v-for="(user, index) in playlist.editors"
                     :key="index"
                  >
                     <RouterLink
                        :to="`/u/${user}`"
                     >
                        {{ user }}
                     </RouterLink>
                     <p style="margin-right: 4px">{{(index != playlist.editors.length - 1) ? ", " : ""}}</p>
                  </template>
               </div>
               <textarea class="description" :value="playlist.description" ref="description_ref" />
            </template>

            <div class="playlist-controls" v-if="user">
               <template v-if="playlist.owner == user.username">
                  <span class="row" style="margin-right: 20px">
                     <span class="material-symbols-rounded icon nointeract" style="color: red;">favorite</span>
                     <p>{{ playlist.viewers.length - 1 }} {{ playlist.viewers.length == 2 ? "like" : "likes" }}</p>
                  </span>
                  <span class="material-symbols-rounded icon" style="color: goldenrod" v-if="!editing" @click="editing = true;">edit</span>
                  <div class="edit-box" v-else>
                     <span class="material-symbols-rounded icon" style="color: darkseagreen" @click="submit_edit">check_circle</span>
                     <span class="material-symbols-rounded icon" style="color: darkred" @click="cancel_edit">cancel</span>
                  </div>

                  <span class="material-symbols-rounded icon" style="color: green" @click="editing_users = true">manage_accounts</span>
                  <span class="material-symbols-rounded icon" style="color: darkred" @click="show_delete = true">delete</span>
               </template>
               <template v-else>
                  <span class="row">
                     <span :title="is_playlist_viewer ? 'Unsave from Library' : 'Save from Library'" class="material-symbols-rounded icon" :style="{ color: is_playlist_viewer ? 'red' : 'gray' }" @click="toggle_save">favorite</span>

                     <p>{{ playlist.viewers.length - 1 }} {{ playlist.viewers.length == 2 ? "like" : "likes" }}</p>
                  </span>
               </template>
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
   <Loading v-if="loading" message="Updating Playlist" />
   <PlaylistUsersEdit v-if="editing_users" @close="editing_users = false" @reload="update_playlist_data(playlist.uuid)" :editors="playlist.editors" :uuid="playlist.uuid" />
</template>

<script setup>
import Track from "../components/TrackComponent.vue"
import ConfirmDelete from "../components/ConfirmDelete.vue"
import Loading from "../components/LoadingComponent.vue"
import PlaylistUsersEdit from "../components/PlaylistUsersEdit.vue"
import { ref, watch, onBeforeMount, computed } from "vue"
import { useRoute, RouterLink } from "vue-router"
import { useStore } from "vuex"
import { compress_image } from "../utils/image.js"
import router from "../router"

const store = useStore()
const route = useRoute()
const user = computed(() => store.state.user)

const playlist = ref(null)
const is_playlist_viewer = ref(false)
let debounce = false
let debounce_interval = undefined

const show_delete = ref(false)
const editing = ref(false)
const loading = ref(false)
const editing_users = ref(false)

const name_ref = ref(null)
const description_ref = ref(null)
const visibility_ref = ref(null)
const image_ref = ref(null)
const cover = ref(null)
const cover_url = ref("")

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
      cover_url.value = playlist.value.cover
      is_playlist_viewer.value = playlist.value.viewers.includes(user.value.username)
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

const unsave_from_library = async () => {
   let res = await fetch("/api/playlist_unsave", {
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
      update_playlist_data(playlist.value.uuid)
   } else {
      alert((await res.json()).message)
   }
}

const save_to_library = async () => {
   let res = await fetch("/api/playlist_save", {
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
      update_playlist_data(playlist.value.uuid)
   } else {
      alert((await res.json()).message)
   }
}

const cancel_edit = () => {
   cover_url.value = playlist.value.cover
   editing.value = false
}

const update_cover_preview = () => {
   if (!cover.value.files[0]) return
   cover_url.value = URL.createObjectURL(cover.value.files[0])
}

const submit_edit = async () => {
   if (name_ref.value.length == 0) {
      return alert("Playlist must have a name")
   }

   loading.value = true
   
   let formdata = new FormData()
   formdata.append("name", name_ref.value.value)
   if (description_ref.value.value) formdata.append("description", description_ref.value.value)
   formdata.append("visibility", visibility_ref.value.value)
   formdata.append("uuid", playlist.value.uuid)
   if (cover.value.files[0]) {
      let compressed = await compress_image(cover.value.files[0], 512, 0.3)
      console.log(
         `Compressed cover from ${cover.value.files[0].size / 1024}kb to ${compressed.size / 1024}kb.`
      )
      formdata.append("cover", compressed)
   }

   let res = await fetch("/api/playlist_edit", {
      method: "POST",
      credentials: "include",
      body: formdata,
   })

   if (res.ok) {
      update_playlist_data(route.params.playlist)
      editing.value = false
   } else {
      alert((await res.json()).message)
   }

   loading.value = false
}

const toggle_save = () => {
   // debounce
   if (debounce) return

   if (debounce_interval) {
      clearTimeout(debounce_interval)
   }

   debounce = true
   debounce_interval = setTimeout(() => debounce = false, 500)

   if (is_playlist_viewer.value) {
      unsave_from_library()
   } else {
      save_to_library()
   }

   is_playlist_viewer.value = !is_playlist_viewer.value
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
   .playlist-box .info-box {
      flex-direction: column;
      gap: 0px;
   }

   .playlist-box .info-box .cover {
      margin: auto;
   }
}

.playlist-box {
   padding-bottom: 300px;
}
.cover {
   width: 256px;
   height: 256px;
   aspect-ratio: 1.0;
   position: relative;
   object-fit: cover;
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
   flex-wrap: wrap;
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

   display: flex;
   align-items: center;
   height: 40px;
}

.playlist-controls .icon {
   font-size: 28px;
   user-select: none;
   cursor: pointer;
}

.playlist-controls .icon:hover {
   opacity: 0.7;
}

.edit-box {
   background-color: #d2d2d2;   
   padding: 6px;

   display: flex;
   justify-content: center;
   align-items: center;
   gap: 4px;
   border-radius: 10px;
}

input[type="text"],
textarea {
   padding: 0;
   border: none;
   color: #606060;
}

.name {
   font-size: 42px;
   font-weight: 900;
}

.visibility {
   max-width: fit-content;
}

select.visibility {
   margin-top: 4px;
}

textarea.description {
   resize: vertical;
}

.upload-cover-input {
   display: none;
}

.edit {
   border: none;
   position: absolute;
   width: 100%;
   height: 100%;
   left: 0;
   top: 0;
   background-color: #30303090;
   cursor: pointer;
}

.edit .icon {
   font-size: 48px;
   color: white;
}

.edit:hover .icon {
   color: goldenrod;
}

.icon.nointeract:hover {
   opacity: initial;
}
.nointeract {
   cursor: default !important;
}

.row {
   display: flex;
   flex-direction: row;
   align-items: center;
   gap: 6px;
}

</style>
