<template>
   <div v-if="show_page" class="upload-box">
      <div class="header"><p>TRACK UPLOAD</p></div>
      <form>
         <label for="event">Event</label>
         <select name="event" ref="event_ref">
            <option
               v-for="event in open_events"
               :key="event.id"
               :value="event.id"
            >{{ event.name }}</option>
         </select>

         <label for="title">Title</label>
         <input ref="title_ref" type="text" placeholder="The_NewStuff" required>

         <label for="lyrics">lyrics<p class="tag">(optional)</p></label>
         <textarea ref="lyrics_ref" placeholder="there's a light over the ocean
..."></textarea>

         <label for="track">Audio File</label>
         <input ref="track_ref" type="file" accept=".mp3," required>

         <label for="album">Album Cover<p class="tag">(optional)</p></label>
         <input ref="album_ref" type="file" accept=".png,.jpeg,.jpg,.gif,.bmp,.tiff,.webp">
         
         <button ref="submit_button_ref" type="submit" @click="upload">UPLOAD</button>
        </form>
   </div>
   <div v-else>
      <p>No events are open</p>
   </div>
   <div class="upload-cover" v-if="uploading">
      <p>Uploading</p>
   </div>
</template>

<script setup>

import { ref, onBeforeMount } from "vue"
import { compress_image } from "../utils/image.js"
import router from "../router"

const event_ref = ref(null)
const title_ref = ref(null)
const lyrics_ref = ref(null)
const track_ref = ref(null)
const album_ref = ref(null)

const open_events = ref([])
const uploading = ref(false)
const show_page = ref(false)

onBeforeMount(async () => {
   // check if there are any open events
   let res = await fetch("/api/openevents", {
      method: "get",
      credentials: "include"
   })

   if (res.ok) {
      let events = (await res.json()).events
      if (events.length != 0) {
         open_events.value = events
         show_page.value = true
      }
   }
})

const convert_wav_to_mp3 = (file) => {
   return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
         let wavdata = e.target.result
         let mp3encoder = lamejs.Mp3Encoder(2, 48000, 320)

         let samples = new Int16Array(wavdata)
         let sampleblocksize = 1152
         let mp3data = []

         for (let i = 0; i < samples.length; i += sampleblocksize) {
            let samplechunk = samples.subarray(i, i + sampleblocksize)
            let mp3buf = mp3encoder.encodeBuffer(samplechunk)
            if (mp3buf.length > 0) { mp3data.push(mp3buf) }
         }

         let mp3buf = mp3encoder.flush()
         if (mp3buflength > 0) { mp3data.push(mp3buf) }

         let blob = new Blob(mp3data, { type: "audio/mp3" })
         let filename = file.name.replace(/\.wav$/, ".mp3")
         let convertedfile = new File([blob], filename, { type: "audio/mp3" })

         resolve(convertedfile)
      }
      reader.onerror = (error) => {
         reject(error)
      }

      reader.readAsArrayBuffer(file)
   })
}

const upload = async (e) => {
   e.preventDefault()
   if (uploading.value) return
   uploading.value = true

   console.log("Attempting upload")
   const title = title_ref.value.value

   if (track_ref.value.files.length == 0) {
      uploading.value = false
      return alert("Select a file to upload")
   }

   if (title == "" || title == undefined) {
      uploading.value = false
      return alert("Invalid title")
   }

   console.log("Loading & compressing files")
   let url = "/api/upload"
   let formdata = new FormData()
   let track = track_ref.value.files[0]
   let album = album_ref.value.files.length != 0 ? await compress_image(album_ref.value.files[0], 512, 0.7) : undefined

   if (album) console.log(`Compressed album from ${album_ref.value.files[0].size / 1024}kb to ${album.size / 1024}kb.`)

   formdata.append("track", track)
   if (album) formdata.append("album", album)
   formdata.append("title", title)
   if (lyrics_ref.value.value) formdata.append("lyrics", lyrics_ref.value.value)
   formdata.append("event", event_ref.value.value)

   console.log("Submitting files")
   try {
      let res = await fetch(url, {
         method: "POST",
         credentials: "include",
         body: formdata
      })

      if (res.status == 200) {
         alert("Successfully uploaded!")
         router.push("/")
      } else {
         throw (await res.json()).message 
      }
   } catch (e) {
      alert("Error: " + e)
   }
   uploading.value = false
}

</script>

<style scoped>
.upload-box {
   max-width: 300px;
   margin: auto;
   margin-top: 100px;
   background-color: #e4e4e4;
}

.header {
   height: 10px;
   padding-top: 30px;
   display: flex;
   align-items: center;
   justify-content: center;
}

form {
   display: flex;
   flex-direction: column;
   padding: 20px;
}

input, textarea, select {
  padding: 6px 4px;
  margin-bottom: 20px;
}

input, label, textarea, select {
  font-size: 14px;
}

textarea {
   resize: vertical;
}

form button {
  padding: 12px 0;
  margin-top: 8px;
  cursor: pointer;
}

input[type="file"] {
   cursor: pointer;
}

.tag {
   margin: 0;
   float: right;
   font-size: 12px;
   color: gray;
}

.upload-cover {
   position: fixed;
   width: 100%;
   height: 100%;
   background-color: #30303080;
   top: 0;
   left: 0;

   display: flex;
   justify-content: center;
   align-items: center;

   z-index: 2;
}

.upload-cover p {
   color: white;
   font-size: 24px;
   font-weight: bold;
}
</style>
