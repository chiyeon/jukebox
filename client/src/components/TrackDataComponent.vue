<template>
   <div v-if="show_page" class="upload-box">
      <form @submit="stop_page_refresh">
         <label for="event">Event</label>
         <select name="event" ref="event_ref">
            <option
               v-for="event in open_events"
               :key="event.id"
               :value="event.id"
            >
               {{ event.name }}
            </option>
         </select>

         <div class="album">
            <img class="album" :src="cover_url" />
            <div class="album-edit" @click="album_ref.click()">
               <span class="material-symbols-rounded icon">edit</span>
            </div>
            <input
               ref="album_ref"
               class="album-input"
               type="file"
               accept=".png,.jpeg,.jpg,.gif,.bmp,.tiff,.webp"
               @change="update_cover_url"
            />
         </div>
         <input
            ref="title_ref"
            type="text"
            placeholder="Track Title"
            class="title"
            style="margin-top: 20px"
            maxlength="50"
            required
         />

         <div class="artists-box">
            <label for="artists"
               >Artists
               <p class="tag">(optional)</p></label
            >
            <input type="text" class="artist" value="You" disabled />
            <span
               class="artist-entry"
               v-for="(artist, index) in artists"
               :key="index"
            >
               <input
                  class="artist"
                  type="text"
                  v-model="artists[index]"
                  placeholder="Artist"
                  maxlength="20"
               />
               <span
                  class="material-symbols-rounded remove-artist"
                  @click="remove_artist(index)"
                  >cancel</span
               >
            </span>
            <span
               class="new-artist-box"
               @click="add_artist"
               v-if="artists.length < 8"
            >
               <span class="material-symbols-rounded">person_add</span>
               <p>Add Artist</p>
            </span>
         </div>

         <label for="lyrics"
            >lyrics
            <p class="tag">(optional)</p></label
         >
         <textarea
            ref="lyrics_ref"
            placeholder="there's a light over the ocean
 ..."
            maxlength="2000"
            rows="5"
         ></textarea>

         <label for="description"
            >description
            <p class="tag">(optional)</p></label
         >
         <textarea
            ref="description_ref"
            placeholder="a very cool story..."
            maxlength="2000"
            rows="5"
         ></textarea>

         <span class="row">
            <button class="upload" @click="track_ref.click()">
               Upload Audio
            </button>
            <input
               ref="track_ref"
               type="file"
               accept=".mp3,"
               style="display: none"
               @change="update_current_file"
               required
            />
            <p class="filename">
               {{ current_file ? current_file : "No file chosen" }}
            </p>
         </span>

         <button
            class="submit"
            ref="submit_button_ref"
            type="submit"
            @click="upload"
         >
            Submit
         </button>
      </form>
   </div>
   <div v-else>
      <p>No events are open</p>
   </div>

   <LoadingScreen message="Uploading" v-if="uploading" />
</template>

<script setup>
import { ref, onBeforeMount, computed } from "vue"
import { compress_image } from "../utils/image.js"
import { useStore } from "vuex"
import router from "../router"
import eventbus from "../eventbus"
import LoadingScreen from "../components/LoadingComponent.vue"

const store = useStore()

const user = computed(() => store.state.user)

const event_ref = ref(null)
const title_ref = ref(null)
const lyrics_ref = ref(null)
const track_ref = ref(null)
const album_ref = ref(null)
const description_ref = ref(null)

const open_events = ref([])
const uploading = ref(false)
const show_page = ref(false)
const artists = ref([])

const current_file = ref("")
const cover_url = ref(
   "https://storage.googleapis.com/jukebox-albums/default.webp"
)

const add_artist = () => {
   if (artists.value.length >= 7)
      return eventbus.emit(
         "show_notification",
         "Maximum number of artists reached"
      )
   artists.value.push("")
}

const remove_artist = (index) => {
   artists.value.splice(index, 1)
}

const stop_page_refresh = (e) => {
   e.preventDefault()
}

onBeforeMount(async () => {
   // check if there are any open events
   let res = await fetch("/api/openevents", {
      method: "get",
      credentials: "include",
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
            if (mp3buf.length > 0) {
               mp3data.push(mp3buf)
            }
         }

         let mp3buf = mp3encoder.flush()
         if (mp3buflength > 0) {
            mp3data.push(mp3buf)
         }

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
      return eventbus.emit("show_notification", "Select file to upload")
   }

   if (title == "" || title == undefined) {
      uploading.value = false
      return eventbus.emit("show_notification", "Invalid title")
   }

   console.log("Loading & compressing files")
   let url = "/api/upload"
   let formdata = new FormData()
   let track = track_ref.value.files[0]
   let album =
      album_ref.value.files.length != 0
         ? await compress_image(album_ref.value.files[0], 512, 0.39)
         : undefined

   if (album)
      console.log(
         `Compressed album from ${album_ref.value.files[0].size / 1024}kb to ${album.size / 1024}kb.`
      )

   formdata.append("track", track)
   if (album) formdata.append("album", album)
   formdata.append("title", title)
   if (lyrics_ref.value.value) formdata.append("lyrics", lyrics_ref.value.value)
   if (description_ref.value.value) formdata.append("description", description_ref.value.value)
   formdata.append("event", event_ref.value.value)
   if (artists.value.length != 0)
      formdata.append("artists", JSON.stringify(artists.value))

   console.log("Submitting files")
   try {
      let res = await fetch(url, {
         method: "POST",
         credentials: "include",
         body: formdata,
      })

      if (res.status == 200) {
         router.push("/")
      } else {
         throw (await res.json()).message
      }
   } catch (e) {
      eventbus.emit("show_notification", "Error: " + e)
   }
   uploading.value = false
}

const update_cover_url = () => {
   if (!album_ref.value.files[0]) return
   cover_url.value = URL.createObjectURL(album_ref.value.files[0])
}

const update_current_file = () => {
   if (!track_ref.value.files[0]) return
   current_file.value = track_ref.value.files[0].name
}
</script>

<style scoped>
.upload-box {
   max-width: 600px;
   margin: auto;
   margin-top: 100px;

   margin-bottom: 300px;
}

.album {
   width: 225px;
   height: 225px;
   margin: auto;
   position: relative;
   object-fit: cover;
}

.album-edit {
   position: absolute;
   width: 100%;
   height: 100%;
   top: 0;
   left: 0;
   background-color: #30303090;
   display: flex;
   justify-content: center;
   align-items: center;
   cursor: pointer;
   opacity: 0;
}

.album-edit:hover {
   opacity: 1;
}

.album-edit span {
   font-size: 48px;
   color: white;
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

input,
textarea,
select {
   padding: 6px 4px;
   margin-bottom: 20px;
}

input,
label,
textarea,
select {
   font-size: 14px;
}

input[type="text"],
textarea {
   border: none;
   font-size: 16px;
}

.title {
   font-size: 24px !important;
   font-weight: bold;
   text-align: center;
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

.new-artist-box {
   display: flex;
   flex-direction: row;
   gap: 4px;
   align-items: center;
   margin-top: 4px;

   cursor: pointer;
}

.new-artist-box:hover {
   opacity: 0.6;
}

.new-artist-box p {
   margin: 0;
   font-size: 14px;
}

input.artist {
   margin: 0;
   flex: 1;
}

.artist-entry {
   display: flex;
   flex-direction: row;
   align-items: center;
   margin-bottom: 4px;
}

.remove-artist {
   color: darkred;
   cursor: pointer;
}

.remove-artist:hover {
   opacity: 0.6;
}

.album-input {
   display: none;
}

.artist,
.artist-entry {
   background: none;
}

.artists-box {
   display: flex;
   flex-direction: column;
   background-color: #e7e7e7;
   padding: 10px;
   border-radius: 10px;
   margin-bottom: 20px;
}

.upload {
   margin: 0;
   width: 150px;
}

button {
   border: none;
   border-radius: 10px;
}

.row {
   display: flex;
   flex-direction: row;
   align-items: center;
   gap: 10px;
}

.filename {
   margin: 0;
   white-space: nowrap;
   overflow: hidden;
   text-overflow: ellipsis;
}

.submit {
   width: 175px;
   margin: auto;
   font-weight: bold;
   margin-top: 40px;
   font-size: 16px !important;
   background-color: darkseagreen;
   color: white;
}

.submit:hover {
   background-color: seagreen;
}
</style>
