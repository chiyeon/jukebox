<template>
   <hr />
   <p v-if="!user">Loading</p>
   <p v-else-if="typeof user === 'string'">{{user}}</p>
   <div class="user-profile" v-else>
      <div class="user">
         <div class="icon-box">
            <div v-if="user && selfuser && user.username == selfuser.username" class="edit-icon" @click="icon_ref.click()">
               <p>edit icon</p>
               <input @input="submit_new_icon" ref="icon_ref" type="file" accepts=".png,.jpeg,.jpg,.gif,.bmp,.tiff,.webp" />
            </div>
            <img class="icon" :src="user.icon" />
         </div>
         <div class="user-info">
            <h2 class="displayname">{{user.display_name}}</h2>
            <p class="edit name" @click="open_edit_displayname" v-if="user && selfuser && user.username == selfuser.username">edit</p>
            <p v-if="user.display_name != user.username" class="username">also known as {{user.username}}</p>
            <p class="date">Joined {{ new Date(user.creation_date._seconds * 1000).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) }}</p>
         </div>
      </div>
      <p class="bio">{{user.bio}}</p>
      <p class="edit" @click="open_edit_bio" v-if="user && selfuser && user.username == selfuser.username">edit</p>
      <hr />
      <p>{{user.display_name}} has listened to {{user.listens}} total tracks and has {{user.streams}} total streams on their music.</p>

      <Event v-if="event && event.tracks.length != 0" :event="event" />
      <p v-else>No published tracks</p>
   </div>

   <div v-if="editing_name" class="editing-name-box" id="background" @click="close_if_background">
      <div class="editing-name">
         <p>Enter a new display name. Will NOT change your username/login name.</p>
         <input ref="newname_ref" type="text" placeholder="New display name!" />
         <span class="buttons">
            <button @click="editing_name = false" class="cancel">Cancel</button>
            <button @click="submit_new_displayname">Submit</button>
         </span>
      </div>
   </div>

   <div v-if="editing_bio" class="editing-name-box" id="background" @click="close_if_background">
      <div class="editing-name bio">
         <p>Enter a new bio.</p>
         <textarea ref="newbio_ref" placeholder="Here is my bio..." />
         <span class="buttons">
            <button @click="editing_bio = false" class="cancel">Cancel</button>
            <button @click="submit_new_bio">Submit</button>
         </span>
      </div>
   </div>
</template>

<script setup>
import { useRoute } from "vue-router"
import { onBeforeMount, watch, ref, computed } from "vue"
import { useStore } from "vuex"
import { compress_image } from "../utils/image.js"
import Event from "../components/EventComponent.vue"

const user = ref(null)
const event = ref(null)
const route = useRoute()
const store = useStore()
const selfuser = computed(() => store.state.user)

const editing_name = ref(false)
const editing_bio = ref(false)
const newname_ref = ref(null)
const newbio_ref = ref(null)
const icon_ref = ref(null)

const update_user_page = async () => {
   let res = await fetch("/api/user", {
      method: "post",
      headers: {
         'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: route.params.username })
   })

   if (res.ok) {
      user.value = (await res.json()).user

      // try to get the users tracks
      let res_tracks = await fetch("/api/tracks", {
         method: "post",
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({ username: route.params.username })
      })

      if (res_tracks.ok) {
         let tracks = (await res_tracks.json()).tracks
         event.value = {
            title: `${user.value.display_name}'s Tracks`,
            date: new Date(),
            desc: "",
            tracks: tracks
         }
         store.dispatch("setTracks", tracks)
      }
   } else {
      user.value = `User ${route.params.username} was not found`
   }
}

const submit_new_displayname = async () => {
   if (newname_ref.value.value == "") return alert("Field is empty!")
   if (newname_ref.value.value == user.display_name) return

   let res = await fetch("/api/update_displayname", {
      method: "post",
      headers: {
         'Content-Type': 'application/json'
      },
      body: JSON.stringify({ display_name: newname_ref.value.value })
   })

   if (res.ok) {
      update_user_page()
      editing_name.value = false 
   } else {
      let json = await res.json()
      editing_name.value = false
      alert(json.message)
   }
}

const submit_new_bio = async () => {
   if (newbio_ref.value.value == "") return alert("Field is empty!")
   if (newbio_ref.value.value == user.bio) return 

   let res = await fetch("/api/update_bio", {
      method: "post",
      headers: {
         'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bio: newbio_ref.value.value })
   })

   if (res.ok) {
      update_user_page()
      editing_bio.value = false 
   } else {
      let json = await res.json()
      editing_bio.value = false
      alert(json.message)
   }
}

const submit_new_icon = async () => {
   if (icon_ref.value.files.length == 0) return alert("select a file!")
   let formdata = new FormData()
   formdata.append("icon", await compress_image(icon_ref.value.files[0], 128, 0.9))

   let res = await fetch("/api/update_icon", {
       method: "POST",
        body: formdata
   })
   if (res.ok) {
      update_user_page()
      editing_bio.value = false 
   } else {
      let json = await res.json()
      editing_bio.value = false
      alert(json.message)
   }
}

const open_edit_displayname = () => {
   editing_bio.value = false
   editing_name.value = true
}

const open_edit_bio = () => {
   editing_bio.value = true
   editing_name.value = false
}

const close_if_background = (e) => {
   if (e.target.id == "background") {
      editing_name.value = false
      editing_bio.value = false
   }
}

onBeforeMount(() => {
   update_user_page()
})

watch(() => route.params.username, () => {
   update_user_page()
})

watch(newname_ref, (newval) => {
   if (newval)
      newname_ref.value.value = user.value.display_name
})

watch(newbio_ref, (newval) => {
   if (newval)
      newbio_ref.value.value = user.value.bio
})
</script>

<style scoped>
h2 {
   margin: 0;
   font-size: 32px;
   font-weight: 900;
}
.date {
}

.username {
   margin: 0;
   font-style: italic;
}

.user {
   display: flex;
   flex-direction: row;
   align-items: center;
   gap: 20px;
}

.user-info > * {
   margin: 0;
}

.displayname, .edit {
   display: inline;
}

.icon-box {
   width: 128px;
   aspect-ratio: 1.0;

   position: relative;
}

.icon {
   border-radius: 200px;
   width: 100%;
   aspect-ratio: 1.0;
}

.edit-icon {
   border-radius: 200px;
   aspect-ratio: 1.0;

   position: absolute;
   width: 100%;
   top: 0;
   left: 0;

   background-color: #30303060;

   opacity: 0;

   display: flex;
   justify-content: center;
   align-items: center;

   transition: 100ms opacity;

   cursor: pointer;
}

.edit-icon p {
   color: lightgray;
}

.edit-icon:hover {
   opacity: 1;
}

.edit {
   margin: 0;
   color: gray;
   cursor: pointer;
}

.edit.name {
   padding-left: 6px;
}

.edit:hover {
   text-decoration: underline;
}

.editing-name-box {
   position: fixed;
   z-index: 2;
   top: 0;
   left: 0;
   width: 100vw;
   height: 100vh;

   background-color: #30303080;

   display: flex;
   justify-content: center;
   align-items: center;
}

input[type="text"],
textarea {
   padding: 4px 6px;
   font-size: 14px;
}

textarea {
   resize: vertical; 
}

.editing-name {
   padding: 20px;
   background-color: #e4e4e4;
   max-width: 250px;

   display: flex;
   flex-direction: column;
   gap: 20px;
}

.editing-name.bio {
   max-width: 350px;
   width: 100%;
}

.editing-name .buttons {
   width: 100%;
   display: flex;
}

.editing-name .buttons > button {
   flex: 1;
   border: none;
   padding: 12px;
   background-color: #e4e4e4;
   cursor: pointer;
}

.editing-name .buttons > button:hover {
   background-color: #d4d4d4;
}

.buttons .cancel {
   color: red;
}

.edit-icon input {
   display: none;
}
</style>
