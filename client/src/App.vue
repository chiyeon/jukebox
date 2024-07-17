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
   <MediaPlayer :queue="queue" :show_lyrics="show_lyrics" />
   <AddToPlaylist v-if="show_add_to_playlist" :track="new_playlist_track" />
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

const store = useStore()

const queue = computed(() => store.state.queue)
const afterQueue = computed(() => store.state.afterQueue)

const show_queue = ref(false)
const show_lyrics = ref(false)
const show_add_to_playlist = ref(false)
const new_playlist_track = ref(null)

const set_queue_visibility = (s) => {
   show_queue.value = s
}
const toggle_queue_visibilty = () => {
   show_queue.value = !show_queue.value
}
const set_lyrics_visibility = (s) => {
   show_lyrics.value = s
}
const toggle_lyrics_visibilty = () => {
   show_lyrics.value = !show_lyrics.value
}
const set_add_to_playlist_visibility = (s) => {
   show_add_to_playlist.value = s
}
const set_new_playlist_track = (track) => {
   new_playlist_track.value = track
}

onMounted(() => {
   eventbus.on("set_queue_visibility", set_queue_visibility)
   eventbus.on("toggle_queue_visibility", toggle_queue_visibilty)

   eventbus.on("set_lyrics_visibility", set_lyrics_visibility)
   eventbus.on("toggle_lyrics_visibility", toggle_lyrics_visibilty)

   eventbus.on("set_add_to_playlist_visibility", set_add_to_playlist_visibility)
   eventbus.on("set_new_playlist_track", set_new_playlist_track)
})

onUnmounted(() => {
   eventbus.off("set_queue_visibility", set_queue_visibility)
   eventbus.off("toggle_queue_visibility", toggle_queue_visibilty)

   eventbus.off("set_lyrics_visibility", set_lyrics_visibility)
   eventbus.off("toggle_lyrics_visibility", toggle_lyrics_visibilty)

   eventbus.off("set_add_to_playlist_visibility", set_add_to_playlist_visibility)
   eventbus.off("set_new_playlist_track", set_new_playlist_track)
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
