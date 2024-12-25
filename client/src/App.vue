<template>
   <div class="horizontal-contents">
      <div class="page-contents">
         <Header />
         <main>
            <RouterView />
         </main>
      </div>

      <Transition>
         <Queue v-if="show_queue" />
      </Transition>
   </div>
   <MediaPlayer :queue="queue" :window_state="window_state" />
   <AddToPlaylist v-if="show_add_to_playlist" :track="new_playlist_track" />
   <Notification :hidden="!show_notification_message" :message="notification_message" />
</template>

<script setup>
import { RouterView } from "vue-router"
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useStore } from "vuex"
import eventbus from "./eventbus"
import Header from "./components/HeaderComponent.vue"
import MediaPlayer from "./components/MediaPlayer/MediaPlayer.vue"
import Queue from "./components/QueueComponent.vue"
import AddToPlaylist from "./components/AddToPlaylist.vue"
import Notification from "./components/NotificationComponent.vue"

const store = useStore()

const queue = computed(() => store.state.queue)
const afterQueue = computed(() => store.state.afterQueue)

const show_queue = ref(false)
// main window can be a few things, use an int to keep track
// sent to media player to manage
// can be nothing, lyrics, or song info
const window_state = ref(0)
const WINDOW_NONE = 0
const WINDOW_LYRIC = 1
const WINDOW_INFO = 2
const show_add_to_playlist = ref(false)
const new_playlist_track = ref(null)
const notification_message = ref("")
const show_notification_message = ref(false)

let notification_timeout = null
const notification_duration_ms = 3000

const show_notification = (message) => {
   if (notification_timeout) clearTimeout(notification_timeout)

   show_notification_message.value = true
   notification_message.value = message

   notification_timeout = setTimeout(() => {
      show_notification_message.value = false
   }, notification_duration_ms)
}

const set_queue_visibility = (s) => {
   show_queue.value = s
}
const toggle_queue_visibilty = () => {
   show_queue.value = !show_queue.value
}
const set_lyrics_visibility = (s) => {
   window_state.value = s ? WINDOW_LYRIC : WINDOW_NONE
}
const toggle_lyrics_visibilty = () => {
   window_state.value = window_state.value == WINDOW_LYRIC ? WINDOW_NONE : WINDOW_LYRIC
}
const set_info_visibility = (s) => {
   window_state.value = s ? WINDOW_INFO : WINDOW_NONE
}
const toggle_info_visibility = () => {
   window_state.value = window_state.value == WINDOW_INFO ? WINDOW_NONE : WINDOW_INFO
}
const set_add_to_playlist_visibility = (s) => {
   show_add_to_playlist.value = s
}
const set_new_playlist_track = (track) => {
   new_playlist_track.value = track
}
const clear_all_windows = () => {
   window_state.value = WINDOW_NONE
}

onMounted(() => {
   eventbus.on("set_queue_visibility", set_queue_visibility)
   eventbus.on("toggle_queue_visibility", toggle_queue_visibilty)

   eventbus.on("set_lyrics_visibility", set_lyrics_visibility)
   eventbus.on("toggle_lyrics_visibility", toggle_lyrics_visibilty)

   eventbus.on("set_info_visibility", set_info_visibility)
   eventbus.on("toggle_info_visibility", toggle_info_visibility)

   eventbus.on("set_add_to_playlist_visibility", set_add_to_playlist_visibility)
   eventbus.on("set_new_playlist_track", set_new_playlist_track)

   eventbus.on("show_notification", show_notification)
   eventbus.on("clear_all_windows", clear_all_windows)
})

onUnmounted(() => {
   eventbus.off("set_queue_visibility", set_queue_visibility)
   eventbus.off("toggle_queue_visibility", toggle_queue_visibilty)

   eventbus.off("set_lyrics_visibility", set_lyrics_visibility)
   eventbus.off("toggle_lyrics_visibility", toggle_lyrics_visibilty)

   eventbus.off("set_info_visibility", set_info_visibility)
   eventbus.off("toggle_info_visibility", toggle_info_visibility)

   eventbus.off("set_add_to_playlist_visibility", set_add_to_playlist_visibility)
   eventbus.off("set_new_playlist_track", set_new_playlist_track)

   eventbus.off("show_notification", show_notification)
   eventbus.off("clear_all_windows", clear_all_windows)
})
</script>

<style scoped>
.horizontal-contents {
   display: flex;
   flex-direction: row;
   width: 100%;
   height: 100%;
   overflow-y: hidden;
   overflow-x: hidden;
}

.page-contents {
   width: 100%;
   height: 100%;
   overflow-y: auto;
   overflow-x: hidden;
   padding-right: 20px; /* for the scrollbar */
}

main {
   padding-bottom: 200px;
   padding-top: 10px;
}

.v-enter-active,
.v-leave-active {
   transition:
      width 500ms ease,
      opacity 500ms ease,
      padding-left 500ms ease,
      padding-right 500ms ease;
   overflow-x: hidden;
}

.v-enter-from,
.v-leave-to {
   opacity: 0;
   padding-left: 0;
   padding-right: 0;
   width: 0;
}

@media (max-width: 600px) {
   .horizontal-contents .page-contents {
      padding-right: 0px;
   }
   .v-enter-active,
   .v-leave-active {
      transition:
         opacity 500ms ease,
         transform 500ms ease;
   }

   .v-enter-from,
   .v-leave-to {
      opacity: 0;
      transform: translateX(100%);
      padding-left: inherit !important;
      padding-right: inherit !important;
   }
}
</style>
