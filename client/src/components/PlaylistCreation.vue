<template>
   <div class="playlist-creation-box" @click="emit('close')">
      <div class="panel" @click.stop="null">
         <div class="info-box">
            <div class="info">
               <span class="row">
                  <p style="margin: 0">Cover Picture</p>
                  <input type="file" accepts=".png,.jpeg,.jpg,.gif,.bmp,.tiff,.webp" ref="cover" />
               </span>
               <span class="row">
                  <p style="margin: 0">Visibility</p>
                  <select class="dropdown" v-model="visibility">
                     <option value="private">Private</option>
                     <option value="public">Public</option>
                  </select>
               </span>
               <input type="text" class="name" placeholder="New Playlist" v-model="name" maxlength="60" />
               <textarea class="description" placeholder="Description" v-model="description" maxlength="300" />
            </div>
            <button class="button" @click="new_playlist">Create Playlist</button>
         </div>
      </div>
   </div>
   <Loading v-if="loading" message="Creating new playlist" />
</template>

<script setup>
import { defineProps, computed, onBeforeMount, ref, defineEmits } from "vue"
import eventbus from "../eventbus"
import { useStore } from "vuex"
import { compress_image } from "../utils/image.js"

import Playlist from "./PlaylistComponent.vue"
import Loading from "./LoadingComponent.vue"

const store = useStore()

const emit = defineEmits([ "close" ])

const loading = ref(false)

const cover = ref(null)
const name = ref(null)
const description = ref(null)
const visibility = ref("private")

const new_playlist = async () => {
   if (!name.value) return alert("Playlist needs a name")
   if (loading.value) return

   loading.value = true

   let formdata = new FormData()
   formdata.append("name", name.value)
   if (description.value) formdata.append("description", description.value)
   formdata.append("visibility", visibility.value)
   if (cover.value.files[0]) {
      let compressed = await compress_image(cover.value.files[0], 512, 0.3)
      console.log(
         `Compressed cover from ${cover.value.files[0].size / 1024}kb to ${compressed.size / 1024}kb.`
      )
      formdata.append("cover", compressed)
   }

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

   loading.value = false
   emit("close")
}
</script>

<style scoped>
.playlist-creation-box {
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
   max-width: 600px;
   box-sizing: border-box;
   z-index: 1;
}

.info {
   display: flex;
   flex-direction: column;
   gap: 10px;
}

.name {
   font-weight: bold;
   font-size: 28px;
}

input[type="text"],
textarea {
   background: none;
   border: none;
   padding: 0;
}

textarea {
   resize: vertical;
   height: 110px;
}

.dropdown {
   width: 100px;
   background-color: #d7d7d7;
   border: none;
   padding: 8px 16px;
}

.row {
   display: flex;
   flex-direction: row;
   gap: 10px;
   align-items: center;
}

.button {
   margin-top: 10px;
   background-color: #e7e7e7;
   border: none;
   padding: 10px 20px;
   cursor: pointer;
}

.button:hover {
   background-color: lightsalmon;
}

</style>
