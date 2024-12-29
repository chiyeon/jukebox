<template>
   <p v-if="!user">Loading</p>
   <p v-else-if="typeof user === 'string'">{{ user }}</p>
   <div class="user-profile" v-else>
      <div class="upper-box">
         <div class="user">
            <div class="icon-box">
               <div
                  v-if="user && selfuser && user.username == selfuser.username"
                  class="edit-icon"
                  @click="icon_ref.click()"
               >
                  <p>edit icon</p>
                  <input
                     @input="submit_new_icon"
                     ref="icon_ref"
                     type="file"
                     accepts=".png,.jpeg,.jpg,.gif,.bmp,.tiff,.webp"
                  />
               </div>
               <img class="user-icon" :src="user.icon" />
            </div>
            <div class="user-info">
               <!-- <template v-if="!editing_name"> -->
               <h2 class="displayname">{{ user.display_name }}</h2>
               <!-- <p class="edit name" @click="open_edit_displayname" v-if="user && selfuser && user.username == selfuser.username">edit</p> -->
               <!-- </template> -->
               <!-- <template v-else>
               <input type="text" class="displayname input" ref="displayname_input_ref" maxlength="20" @input="autoscale_textinput" /> 
               <p class="edit name" @click="editing_name = false">cancel</p>
               <p class="edit name submit" @click="submit_new_displayname">submit</p>
            </template> -->

               <p v-if="user.display_name != user.username" class="username">
                  also known as {{ user.username }}
               </p>
               <p class="date">
                  Joined
                  {{
                     new Date(
                        user.creation_date._seconds * 1000
                     ).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                     })
                  }}
               </p>
            <ProfileStats
               :username="user.username"
               :stats="{
                  tracks: user.num_tracks,
                  wins: user.num_wins,
                  badges: user.badges.length,
                  playlist_count: user.num_playlists
               }"
            />
            </div>
         </div>
         <div class="info-box">
            <ProfileBadges :badges="user.badges" />
            <!-- stats box also supported here -->
         </div>
      </div>


      <h3>Bio</h3>
      <template v-if="!editing_bio">
         <p class="bio">{{ user.bio }}</p>
         <p
            class="edit"
            @click="open_edit_bio"
            v-if="user && selfuser && user.username == selfuser.username"
         >
            edit
         </p>
      </template>
      <template v-else>
         <textarea
            @input="autoscale_textarea"
            ref="newbio_ref"
            type="text"
            class="bio input"
            maxlength="300"
         />
         <p class="edit" @click="editing_bio = false">cancel</p>
         <p class="edit name submit" @click="submit_new_bio">submit</p>
      </template>
      <button class="link row" @click="router.push(`/u/${user.username}/playlists`)">
         <span class="material-symbols-rounded icon">library_music</span>
         <p>View Playlists</p>
      </button>
      <hr />
      <!--p>{{user.display_name}} has listened to {{user.listens}} total tracks and has {{user.streams}} total streams on their music.</p-->

      <div class="filter-bar">
         <p>Sort by</p>
         <select class="dropdown" v-model="sorting_mode">
            <option :value="SORTING_TIME">Release Date</option>
            <option :value="SORTING_PLAYS">Plays</option>
         </select>
         <select class="dropdown" v-model="sorting_reversed">
            <option :value="false">Descending</option>
            <option :value="true">Ascending</option>
         </select>
         <TracksSearchBar @onSearch="(tracks) => (visible_tracks = tracks)" />
      </div>
      <Event
         v-if="visible_tracks.length != 0"
         :event="{ tracks: visible_tracks }"
         :allowDelete="user && selfuser && user.username == selfuser.username"
         :user="user"
      />
      <p v-else-if="visible_tracks.length == 0">No published tracks</p>
      <p v-else>Loading tracks</p>
   </div>
</template>

<script setup>
import { useRoute } from "vue-router"
import { onBeforeMount, watch, ref, computed } from "vue"
import { useStore } from "vuex"
import { compress_image } from "../utils/image.js"
import Event from "../components/EventComponent.vue"
import ProfileStats from "../components/ProfileStats.vue"
import TracksSearchBar from "../components/TracksSearchBar.vue"
import ProfileBadges from "../components/ProfileBadges.vue"
import eventbus from "../eventbus"
import router from "../router"

const route = useRoute()
const store = useStore()

const user = ref(null) // which user are we looking at
const selfuser = computed(() => store.state.user) // user acc of logged in person viewing
const tracks = computed(() => store.state.tracks) // ref to tracks in store (we calc this)
const visible_tracks = ref([]) // ref to VISIBLE tracks (filtererd)

const editing_name = ref(false)
const editing_bio = ref(false)
const displayname_input_ref = ref(null)
const newbio_ref = ref(null)
const icon_ref = ref(null)

const SORTING_PLAYS = 0
const SORTING_TIME = 1

const sorting_mode = ref(SORTING_TIME)
const sorting_reversed = ref(false)

const autoscale_textarea = (e) => {
   e.currentTarget.style.height = "auto"
   e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"
}

const autoscale_textinput = (e) => {
   let width = e.currentTarget.value.length
   e.currentTarget.style.width = `${width}ch`
}

const update_user_page = async () => {
   let res = await fetch("/api/user", {
      method: "post",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: route.params.username }),
   })

   if (res.ok) {
      user.value = (await res.json()).user

      // try to get the users tracks
      let res_tracks = await fetch("/api/tracks", {
         method: "post",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({ username: route.params.username }),
      })

      if (res_tracks.ok) {
         visible_tracks.value = (await res_tracks.json()).tracks
         sort_by_current_settings()
      }
   } else {
      user.value = `User ${route.params.username} was not found`
   }
}

const sort_by_current_settings = () => {
   const by_plays = sorting_reversed.value ? ((a, b) => a.plays - b.plays) : ((a, b) => b.plays - a.plays)

   const by_time = sorting_reversed.value ? ((a, b) => a.release_date[0]._seconds - b.release_date[0]._seconds) : ((a, b) => b.release_date[0]._seconds - a.release_date[0]._seconds)

   switch(sorting_mode.value) {
      default:
      case SORTING_PLAYS:
         visible_tracks.value.sort(by_plays)
         break
      case SORTING_TIME:
         visible_tracks.value.sort(by_time)
         break
   }

   store.dispatch("setTracks", visible_tracks.value)
}

// const submit_new_displayname = async () => {
//    if (displayname_input_ref.value.value == "") return alert("Field is empty!")
//    if (displayname_input_ref.value.value == user.value.display_name) return

//    let res = await fetch("/api/update_displayname", {
//       method: "post",
//       headers: {
//          'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ display_name: displayname_input_ref.value.value })
//    })

//    if (res.ok) {
//       update_user_page()

//       editing_name.value = false
//    } else {
//       let json = await res.json()
//       editing_name.value = false
//       alert(json.message)
//    }
// }

const submit_new_bio = async () => {
   if (newbio_ref.value.value == user.bio) return

   let res = await fetch("/api/update_bio", {
      method: "post",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({ bio: newbio_ref.value.value }),
   })

   if (res.ok) {
      update_user_page()
      editing_bio.value = false
   } else {
      let json = await res.json()
      editing_bio.value = false
      eventbus.emit("show_notification", "Error: " + json.message)
   }
}

const submit_new_icon = async () => {
   if (icon_ref.value.files.length == 0) return eventbus.emit("show_notification", "No icon selected")
   let formdata = new FormData()
   formdata.append(
      "icon",
      await compress_image(icon_ref.value.files[0], 512, 0.29)
   )

   let res = await fetch("/api/update_icon", {
      method: "POST",
      body: formdata,
   })
   if (res.ok) {
      update_user_page()
      editing_bio.value = false
   } else {
      let json = await res.json()
      editing_bio.value = false
      eventbus.emit("show_notification", "Error: " + json.message)
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

onBeforeMount(() => {
   update_user_page()

   eventbus.on("update_user_page", update_user_page)
})

watch([sorting_mode, sorting_reversed], ([_, __]) => {
   sort_by_current_settings()
})

watch(
   () => route.params.username,
   () => {
      update_user_page()
   }
)

watch(displayname_input_ref, (newval) => {
   if (newval) {
      displayname_input_ref.value.value = user.value.display_name
      displayname_input_ref.value.focus()
      autoscale_textinput({ currentTarget: displayname_input_ref.value })
   }
})

watch(newbio_ref, (newval) => {
   if (newval) {
      newbio_ref.value.value = user.value.bio
      newbio_ref.value.focus()
      autoscale_textarea({ currentTarget: newbio_ref.value })
   }
})
</script>

<style scoped>
@media (max-width: 600px) {
   .upper-box {
      flex-direction: column !important;
   }
}

.filter-bar {
   display: flex;
   flex-direction: row;
   justify-content: flex-end;
   align-items: center;
   flex-wrap: wrap;
   gap: 10px;
}

.filter-bar > * {
   padding: 8px;
   border-radius: 4px;
   margin: 0;
}

h2 {
   margin: 0;
   font-size: 32px;
   font-weight: 900;
}

hr {
   margin-top: 20px;
}

.row {
   display: flex;
   flex-direction: row;
   align-items: center;
   gap: 4px;
}

.link {
   background: none;
   border: none;
   cursor: pointer;
   text-decoration: none;
}

.link:hover p {
   text-decoration: underline;
}

.link p {
   font-size: 16px;
   margin: 0;
}

.link .icon {
   display: inline-block;
}

.date {
   margin-bottom: 10px !important;
}

.user-profile {
   padding-bottom: 300px;
}

.upper-box {
   display: flex;
   flex-direction: row;
   width: 100%;
   gap: 10px;
}

.upper-box > * {
   flex: 1;
}

.info-box {
   display: flex;
   align-items: center;
   flex-direction: column;
}

.username {
   margin: 0;
   font-style: italic;
}

.user {
   display: flex;
   flex-direction: row;
   gap: 20px;
   flex: 3;
}

.user-info > * {
   margin: 0;
}

.displayname {
   font-size: 32px;
   font-weight: 900;
}

.displayname.input {
   font-size: 32px;
   padding: 0;
   border: none;
   cursor: text;
   color: var(--foreground-1);
   outline: none;
}

.displayname.edit:hover {
   text-decoration: none;
}

.displayname,
.edit {
   display: inline-block;
}


.icon-box {
   width: 128px;
   aspect-ratio: 1;

   position: relative;
}

.user-icon {
   border-radius: 200px;
   width: 100%;
   aspect-ratio: 1;
}

.edit-icon {
   border-radius: 200px;
   aspect-ratio: 1;

   position: absolute;
   width: 100%;
   top: 0;
   left: 0;

   background-color: var(--background-transparent);

   opacity: 0;

   display: flex;
   justify-content: center;
   align-items: center;

   transition: 100ms opacity;

   cursor: pointer;
}

.edit-icon p {
   color: var(--foreground-2);
}

.edit-icon:hover {
   opacity: 1;
}

.edit {
   display: inline-block;
   margin: 0;
   margin-bottom: 10px;
   color: var(--foreground-3);
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

   background-color: var(--background-transparent);

   display: flex;
   justify-content: center;
   align-items: center;
}

input[type="text"],
textarea {
   padding: 4px 6px;
   font-size: 14px;
   background: none;
}

textarea {
   resize: vertical;
}

.editing-name {
   padding: 20px;
   background-color: var(--background-2);
   max-width: 250px;

   display: flex;
   flex-direction: column;
   gap: 20px;
}

h3 {
   margin-bottom: 4px;
}

.bio {
   margin-top: 0;
   width: 100%;
   font-size: 16px;
   white-space: break-spaces;

   max-height: 240px;
   overflow-y: auto;
}

.bio.input {
   padding: 0;
   border: none;
   outline: none;
   height: max-content;
}

.editing-name .buttons {
   width: 100%;
   display: flex;
}

.editing-name .buttons > button {
   flex: 1;
   border: none;
   padding: 12px;
   background-color: var(--background-3);
   cursor: pointer;
}

.editing-name .buttons > button:hover {
   background-color: var(--background-2);
}

.buttons .cancel {
   color: var(--accent-cancel);
}

.edit-icon input {
   display: none;
}

.submit {
   color: var(--accent-confirm);
}
</style>
