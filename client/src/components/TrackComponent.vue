<template>
   <div
      @click="play_track"
      :class="{
         track: true,
         minimal: is_media_player(),
         mobile_expanded: type == 'playermobile',
         queue: is_queue_element(),
      }"
   >
      <img
         v-if="!is_queue_element() && type != 'info'"
         class="album"
         loading="lazy"
         :src="track.album"
         @click="emit('click')"
      />
      <div class="track-info" v-if="type == 'info'">
         <span class="play">
            <span class="material-symbols-rounded"
               >play_circle</span
            >
            <p>Play Song</p>
         </span>
      </div>
      <div class="track-info" v-else>
         <p class="title" @click.stop="eventbus.emit('set_new_info_track', track); emit('clickTitle')">
            {{ track.title
            }}<span v-if="track.winner" class="material-symbols-rounded trophy"
               >trophy</span
            >
         </p>
         <p class="title mobile">
            {{ track.title
            }}<span v-if="track.winner" class="material-symbols-rounded trophy"
               >trophy</span
            >
         </p>
         <template v-for="(artist, index) in track.artists" :key="index">
            <RouterLink
               @click.stop="emit('clickArtist')"
               :to="`/u/${track.artists[index]}`"
               class="artist"
               >{{ artist }}
            </RouterLink>
            <p
               v-if="index == track.artists.length - 1 ? '' : ', '"
               class="artist-comma"
            >
               ,
            </p>
         </template>
      </div>

      <div class="track-plays" v-if="is_user_profile()">
         {{ track.plays }}
      </div>

      <slot name="extra-columns"></slot>

      <div class="controls">
         <Dropdown>
            <template #trigger>
               <button
                  v-if="!is_hiding_queue_button()"
                  class="button-block nobg"
               >
                  <span class="material-symbols-rounded icon nobg" style="font-size: 28px"
                     >more_horiz</span
                  >
               </button>
            </template>
            <div class="dropdown-option" @click.stop="eventbus.emit('playSong', track)">
               <span class="material-symbols-rounded icon">play_arrow</span>
               <p>Play</p>
            </div>
            <div class="dropdown-option" @click.stop="eventbus.emit('set_new_info_track', track)" v-if="type != 'info'">
               <span class="material-symbols-rounded icon">tooltip_2</span>
               <p>View Info</p>
            </div>
            <div class="dropdown-option" @click.stop="add_to_queue">
               <span class="material-symbols-rounded icon">playlist_add</span>
               <p>Add to Queue</p>
            </div>
            <hr />
            <div :class="{ 'dropdown-option': true, disabled: !user }" @click.stop="add_to_playlist">
               <span class="material-symbols-rounded icon">add</span>
               <p>Add to Playlist</p>
            </div>
            <slot name="playlist-dropdown-options"></slot>
            <hr />
            <div :class="{ 'dropdown-option': true }" @click.stop="copy_link">
               <span class="material-symbols-rounded icon">link</span>
               <p>Copy Link</p>
            </div>
            <a :class="{ 'dropdown-option': true }" :href="track.url" target="__blank">
               <span class="material-symbols-rounded icon">download</span>
               <p>Download</p>
            </a>
            <slot name="dropdown-options"></slot>

            <template v-if="type == 'allowedit'">
               <hr />
               <div :class="{ 'dropdown-option': true }" @click.stop="start_editing_track">
                  <span class="material-symbols-rounded icon">edit</span>
                  <p>Edit Track</p>
               </div>
               <div :class="{ 'dropdown-option': true }" @click.stop="delete_track()">
                  <span class="material-symbols-rounded icon delete">delete</span>
                  <p class="delete">Delete Track</p>
               </div>
            </template>

            <template v-if="type == 'allowremove'">
               <hr />
               <div :class="{ 'dropdown-option': true }" @click.stop="remove_self_from_track()">
                  <span class="material-symbols-rounded icon delete">person_remove</span>
                  <p class="delete">Remove name from Track</p>
               </div>
            </template>
         </Dropdown>
         <button
            v-if="type == 'queue'"
            @click.stop="remove_from_queue"
            class="button-block queue nobg"
         >
            <span class="material-symbols-rounded icon nobg"
               >close</span
            >
         </button>
      </div>
   </div>

   <div class="window edit-track" v-if="show_edit">
      <div class="form">
         <h2>Edit Track</h2>
         <EditTrack
            :track="track"
            @selectFile="(file) => (new_album_file = file)"
         />
         <div class="buttons">
            <button @click.stop="submit_edit_track()" class="confirm">Confirm Changes</button>
            <button @click.stop="cancel_editing_track" class="cancel">Cancel</button>
         </div>
      </div>
   </div>

   <div class="window confirm-removal" v-if="show_delete">
      <div class="form">
         <p>Are you sure you want to delete this track?<br />(This action is NOT reversible).</p>
         <div class="buttons">
            <button @click.stop="delete_track()" class="cancel">Confirm Delete</button>
            <button @click.stop="cancel_delete()">Cancel</button>
         </div>
      </div>
   </div>

   <div class="window confirm-removal" v-if="show_remove_self">
      <div class="form">
         <p>Are you sure you want to remove your name from this track?<br />(The owner will have to add you back if you want to return)</p>
         <div class="buttons">
            <button @click.stop="remove_self_from_track()" class="cancel">Remove my Name</button>
            <button @click.stop="cancel_remove()">Cancel</button>
         </div>
      </div>
   </div>
   <LoadingScreen v-if="loading" />
</template>

<script setup>
import { defineProps, ref, defineEmits, computed } from "vue"
import { useStore } from "vuex"
import { RouterLink } from "vue-router"
import LoadingScreen from "./LoadingComponent.vue"
import eventbus from "../eventbus"
import EditTrack from "./EditTrackComponent.vue"
import router from "../router"
import Dropdown from "./DropdownComponent.vue"

const emit = defineEmits(["click", "clickArtist", "clickTitle"])

const validated_delete = ref(false)
const show_delete = ref(false)
const show_edit = ref(false)

const validated_remove = ref(false)
const show_remove_self = ref(false)

const loading = ref(false)

let new_album_file = null // new album file ref

const store = useStore()
const props = defineProps({
   track: {
      artist: String,
      title: String,
      url: String,
   },
   type: String,
   index: Number,
   is_user_profile: Boolean
})
const user = computed(() => store.state.user)
// what is props.type?
// none - default. normal track used in listen page
// queue - queue segment of queue tracks. songs that user has queued up. skips the queue to that point. hides icon.
// afterqueue - up next segment of queue tracks. songs that are generated next. skips up next to that point. hides icon.
// player - display normal, just don't allow it to be pressed
// playermobile - display for mobile, don't allow it to be pressed
// allowedit - allows editing/deleting. for user profiles
// allowremove - lesser version of allowedit. for user profiles
// info - for info pages. removes song info but keeps playability on click and options

// we should hide the album
const is_queue_element = () => {
   return ["afterqueue", "queue"].includes(props.type)
}

const is_hiding_queue_button = () => {
   return ["queue", "player", "playermobile"].includes(props.type)
}

const is_media_player = () => {
   return ["player", "playermobile"].includes(props.type)
}

// is this track apart of  a user profile
const is_user_profile = () => {
   return props.is_user_profile
}

const cancel_delete = () => {
   show_delete.value = false
   validated_delete.value = false
}

const cancel_remove = () => {
   show_remove_self.value = false
   validated_remove.value = false
}

const start_editing_track = () => {
   show_edit.value = true
}

const cancel_editing_track = () => {
   show_edit.value = false
}

const submit_edit_track = async () => {
   if (loading.value) return
   loading.value = true

   if (props.track.title == "" || props.track.title == undefined) {
      loading.value = false
      return eventbus.emit("show_notification", "Invalid title")
   }

   let formdata = new FormData()
   formdata.append("uuid", props.track.uuid)
   formdata.append("title", props.track.title)
   formdata.append("artists", JSON.stringify(props.track.artists.slice(1))),
   formdata.append("lyrics", props.track.lyrics)
   formdata.append("description", props.track.description ? props.track.description : "")

   if (new_album_file) formdata.append("album", new_album_file)

   let res = await fetch("/api/edittrack", {
      method: "POST",
      credentials: "include",
      body: formdata,
   })

   if (!res.ok) {
      let msg = (await res.json()).message
      eventbus.emit("show_notification", "Error: " + msg)
   } else {
      eventbus.emit("show_notification", "Edited track successfully")
      window.location.reload()

      show_edit.value = false
   }

   loading.value = false
}

const delete_track = async () => {
   if (!validated_delete.value) {
      show_delete.value = true
      validated_delete.value = true
      return
   }

   loading.value = true

   let res = await fetch("/api/deletetrack", {
      method: "post",
      credentials: "include",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({ track_id: props.track.uuid }),
   })

   if (res.ok) {
      eventbus.emit("show_notification", "Deleted track successfully")
      window.location.reload()
   } else {
      let err = (await res.json()).message
      eventbus.emit("show_notification", "Error: " + err)
   }

   loading.value = false

   show_delete.value = false
   validated_delete.value = false
}

const remove_self_from_track = async () => {
   if (!validated_remove.value) {
      show_remove_self.value = true
      validated_remove.value = true
      return
   }

   loading.value = true

   let res = await fetch("/api/removefromtrack", {
      method: "post",
      credentials: "include",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({ track_id: props.track.uuid }),
   })

   if (res.ok) {
      eventbus.show_notification("show_notification", "Removed your name from the track")
      window.location.reload()
   } else {
      let err = (await res.json()).message
      eventbus.show_notification("show_notification", "Error: " + err)
   }
   loading.value = false

   show_remove_self.value = false
   validated_remove.value = false
}

const play_track = () => {
   if (props.type && props.type.includes("player")) return

   if (props.type == "queue") {
      eventbus.emit("skipQueueTo", props.index)
   } else if (props.type == "afterqueue") {
      eventbus.emit("skipAfterQueueTo", props.index)
   } else {
      eventbus.emit("playSong", props.track)
   }
}

const add_to_queue = () => {
   if (props.track) {
      store.dispatch("addTrack", props.track)
   }
}

const add_to_playlist = () => {
   if (!user.value) return
   eventbus.emit('set_add_to_playlist_visibility', true);
   eventbus.emit('set_new_playlist_track', props.track)
}

const remove_from_queue = () => {
   store.dispatch("removeTrack", props.index)
}

const copy_link = () => {
   navigator.clipboard.writeText(window.location.origin + `?song=${props.track.uuid}`)
   eventbus.emit("show_notification", "Track URL copied to clipboard")
}

const prevent_parent_click = (e) => {}
</script>

<style scoped>
@media (max-width: 600px) {
   .title.mobile {
      display: block !important;
   }

   .title:not(.mobile) {
      display: none;
   }
}

@media (hover: none) {
   .track:hover {
      background-color: inherit !important;
   }
   .track:not(.header, .minimal):active {
      background-color: #f1f1f1;
   }

   .track button:hover {
      opacity: 1;
   }

   .track button:active {
      opacity: 0.6 !important;
   }
}
.track {
   --track-height: 72px;

   padding: 8px;
   /* height: var(--track-height); */

   border-bottom: 1px solid gray;
   display: flex;
   flex-direction: row;
   align-items: center;
   gap: 10px;

   user-select: none;
}

.track:not(.header, .minimal):hover {
   background-color: #f1f1f1;
   cursor: pointer;
}

.track p {
   margin: 0;
}

.header p {
   font-weight: bold;
}

.artist {
   flex: 0.2;
   min-width: 100px;
}

.track .track-info .artist-comma {
   display: inline;
   margin-left: -0.25em;
}

.track-info {
   flex: 1;
}

.track:hover .play p {
   text-decoration: underline;
}

.track-info .play {
   display: flex;
   flex-direction: row;
   gap: 10px;
   align-items: center;
}

.track-info .play .material-symbols-rounded {
   font-size: 30px;
}

.track-plays {
   flex: 0.25;

   text-align: center;
}

.title {
   font-weight: bold;
   display: flex;
   align-items: center;
   width: fit-content;
}

.title.mobile {
   display: none;
}

.title:not(.mobile):hover {
   text-decoration: underline;
   cursor: pointer;
}

.title .trophy {
   color: #ffc000;
   background-color: #f08000;
   padding: 0px 8px;
   font-size: 22px;
   border-radius: 100px;
   margin-left: 4px;
}

.button-block:not(.label) {
   cursor: pointer;
}

.button-block.label {
   cursor: default;
}

.button-block {
   background: none;
   border: none;
}

.norender {
   opacity: 0;
   user-select: none;
   pointer-events: none;
}

.delete {
   color: darkred;
}

.album {
   height: 56px;
   cursor: pointer;
}

.minimal .album {
   height: 64px;
}

.minimal {
   border-bottom: none;
   flex: 1;
   padding: 0;
   align-self: flex-start;
   user-select: inherit;
}

.title {
   word-break: break-word;
}

.queue .title {
   /* overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; */
}

.queue .track-info {
   max-width: 85%;
}

.mobile_expanded {
   flex-direction: column;
   width: 100%;
}

.track.mobile_expanded img {
   width: 100%;
   aspect-ratio: 1;
   height: auto;
}

.mobile_expanded .track-info {
   align-self: flex-start;
   width: 100%;
}

.mobile_expanded .track-info .title {
   font-size: 24px;
   overflow: hidden;
   display: block;
   text-overflow: ellipsis;
   white-space: nowrap;
}

.mobile_expanded .track-info .artist {
   font-size: 18px;
}

.controls {
   display: flex;
   flex-direction: row;
}

.controls > .button-block:first-child {
   border-radius: 10px 0 0 10px;
}

.controls > .button-block:last-child {
   border-radius: 0 10px 10px 0;
}

.controls > .button-block:first-child:last-child {
   border-radius: 10px;
}

.button-block {
   width: 42px;
   aspect-ratio: 1;
   background-color: #d4d4d4;

   display: flex;
   justify-content: center;
   align-items: center;
}

.button-block span {
   color: white;
}

.delete-box {
   display: flex;
   flex-direction: row;
}

.button-block.delete {
   background-color: darkred;
}

.delete span {
   color: white;
}

.button-block.cancel {
   background-color: rgb(60, 148, 163);
}

.button-block .queue {
   color: black;
}
.button-block:not(.label):hover span {
   filter: invert(0.2);
   /* opacity: 0.5; */
}
.button-block:not(.label):active {
   background-color: lightblue;
}

.cancel span {
   color: white;
}

.edit {
   background-color: goldenrod;
}

a.dropdown-option {
   text-decoration: none;
}

.dropdown-option:not(:last-child) {
   margin-bottom: 8px;
}

.dropdown-option:hover {
   opacity: 0.5;
}

.dropdown-option.disabled {
   opacity: 0.2 !important;
   cursor: default;
}

.button-block.nobg {
   background: none !important;
   border-radius: 10px;
}

.icon.nobg {
   color: black;
}

.icon.nobg:hover {
   color: lightcoral;
}

.window {
   position: fixed;
   left: 0;
   top: 0;
   width: 100vw;
   height: 100vh;
   background-color: #30303090;
   z-index: 100;

   display: flex;
   justify-content: center;
   align-items: center;
}

.edit-track {
}

.edit-track h2 {
   margin: 0;
}

.form {
   max-width: 700px;
   width: 100%;
   background-color: #f0f0f0;
   border-radius: 4px;

   display: flex;
   flex-direction: column;

   padding: 20px;
   margin: 20px;

   max-height: 75%;
   overflow-y: auto;
}

.buttons {
   display: flex;
   gap: 10px;
}

.buttons button {
   color: white;
   background-color: #909090;
}

.buttons .confirm {
   background-color: darkseagreen;
}

.buttons .cancel {
   background-color: darkred;
}

.confirm-removal .form {
    max-width: 450px;
    width: fit-content;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}
</style>
