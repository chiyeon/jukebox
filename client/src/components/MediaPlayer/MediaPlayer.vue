<template>
   <div class="media-player-box">
      <PlayerDesktop
         v-if="!mobile_player"
         :current_song="current_song"
         :audio_ref="audio_ref"
         :controls="{
            repeat_mode: repeat_mode,
            shuffle: shuffle,
            audio_progress: audio_progress,
            volume_progress: volume_progress,
         }"
         :current_playback_time="get_current_playback_time()"
         :song_duration="get_song_duration()"
         @setAudioProgress="set_audio_progress"
         @setVolumeProgress="set_volume_progress"
         @toggleMute="toggle_mute"
         @togglePlayback="toggle_playback"
         @cycleRepeatMode="next_repeat"
         @toggleShuffle="toggle_shuffle"
         @nextTrack="next_song"
         @prevTrack="prev_song"
         @showAlbum="show_album = true"
      />
      <PlayerMobile
         v-else
         :current_song="current_song"
         :audio_ref="audio_ref"
         :controls="{
            repeat_mode: repeat_mode,
            shuffle: shuffle,
            audio_progress: audio_progress,
         }"
         :current_playback_time="get_current_playback_time()"
         :song_duration="get_song_duration()"
         @setAudioProgress="set_audio_progress"
         @togglePlayback="toggle_playback"
         @cycleRepeatMode="next_repeat"
         @toggleShuffle="toggle_shuffle"
         @nextTrack="next_song"
         @prevTrack="prev_song"
      />
      <audio ref="audio_ref" preload="auto"></audio>
   </div>
   <Transition name="lyrics">
      <Lyrics
         v-if="window_state == 1"
         :lyrics="current_song && current_song.lyrics"
      />
      <TrackInfo
         v-else-if="window_state == 2 && info_song"
         :track="info_song"
      />
   </Transition>

   <div class="album-preview" v-if="show_album" @click="show_album = false">
      <template v-if="current_song">
         <div
            class="big-background"
            :style="
               current_song
                  ? { backgroundImage: `url(${current_song.album}` }
                  : {}
            "
         ></div>
         <img :src="current_song.album" class="big-album" @click.stop="" />
         <p class="big-label" @click.stop="">{{ current_song.title }}</p>
         <p class="big-label artists" @click.stop="">
            {{ current_song.artists.join(", ") }}
         </p>
      </template>
      <template v-else>
         <span class="material-symbols-rounded big-album">album</span>
         <p class="big-label">No track selected</p>
      </template>
   </div>
</template>

<script setup>
import {
   defineProps,
   defineEmits,
   ref,
   watch,
   onMounted,
   computed,
   onUnmounted,
   onBeforeMount
} from "vue"
import { useStore } from "vuex"
import { useRoute } from "vue-router"
import eventbus from "../../eventbus"
import PlayerDesktop from "./PlayerDesktop.vue"
import PlayerMobile from "./PlayerMobile.vue"
import Lyrics from "./LyricsComponent.vue"
import TrackInfo from "../TrackInfo.vue"

const store = useStore()
const route = useRoute()
const emit = defineEmits(["toggle_queue"])
const props = defineProps(["queue", "window_state" ])
const show_album = ref(false)
const info_song = ref(null)

const audio_ref = ref(null)
const audio_source_ref = ref(null)

const REPEAT_OFF = 0
const REPEAT_MULTI = 1
const REPEAT_SINGLE = 2
const shuffle = ref(false)
const repeat_mode = ref(REPEAT_OFF)
const mobile_size = 600
const mobile_player = ref(window.innerWidth < mobile_size)

// afterqeues are built up of QueueTrack components, which hold teh track & a flag
// on whether or not it was part of the queue or afterqueue
// queued tracks are considered ephemeral, being not recorded in history and
// taking priority
const queue = computed(() => store.state.queue) // user selected songs
const after_queue = computed(() => store.state.afterQueue) // tracks to play after user queue ends
const history = ref([]) // stack, LIFO
const current_song = ref(null)
const tracks = computed(() => store.state.tracks) // all tracks user is "pointed at"

var can_increment_track = true
var can_update_listen_time = true

const audio_progress = ref(0)
const volume_progress = ref(1)
let last_volume = 0 // last volume before muted. if we aren't muted, its 0

const next_repeat = () => {
   repeat_mode.value++
   if (repeat_mode.value >= 3) repeat_mode.value = 0
}

const shuffle_array = (array) => {
   let arr = array.slice(0)
   for (let i = 0; i < arr.length; i++) {
      let t = Math.floor(Math.random() * (i + 1))
      let temp = arr[i]
      arr[i] = arr[t]
      arr[t] = temp
   }

   return arr
}

const set_audio_progress = (progress) => {
   if (audio_ref.value.src) {
      audio_ref.value.currentTime = progress * current_song.value.duration
      audio_progress.value = progress
   }
}

const set_volume_progress = (progress) => {
   if (audio_ref.value) {
      audio_ref.value.volume = progress
      volume_progress.value = progress
   }
}

// get all the songs in front of us and either shuffle them or set them back to their
// order in tracks.
const toggle_shuffle = () => {
   shuffle.value = !shuffle.value

   if (!current_song.value) return

   if (shuffle.value) {
      // shuffle ALL tracks except the current one (if we are listening)
      let remaining_tracks = current_song.value
         ? tracks.value.filter((t) => t.title != current_song.value.title)
         : tracks.value
      store.dispatch("setAfterQueue", shuffle_array(remaining_tracks))
   } else {
      store.dispatch("setAfterQueue", get_following_tracks(current_song.value))
   }
}

const get_as_time = (time) => {
   if (isNaN(time)) return "0:00"
   let minutes = Math.floor(time / 60)
   let seconds = Math.floor(time % 60)
   return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`
}

const get_current_playback_time = () => {
   if (!audio_ref.value || audio_ref.value.src == "") {
      return "0:00"
   }
   return get_as_time(audio_ref.value.currentTime)
}

const get_song_duration = () => {
   if (!audio_ref.value || audio_ref.value.src == "") {
      return "0:00"
   }
   return get_as_time(current_song.value.duration ? current_song.value.duration : 0)
}

// tell server we clicked on this track
const increment_plays = async (track) => {
   if (!can_increment_track) return

   can_increment_track = false
   setTimeout(() => {
      can_increment_track = true
   }, 1000)

   // increment listens by 1
   let res = await fetch("/api/track_listen", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({ uuid: track.uuid }),
      credentials: "include",
   })
}

const update_listen_time = async (track) => {
   if (!can_update_listen_time) return 
   if (!audio_ref.value || !track) return

   can_update_listen_time = false
   setTimeout(() => {
      can_update_listen_time = true
   }, 1000)

   // increment listening time of given track by CURRENT TIME LISTENINING in audio ref
   let res = await fetch("/api/track_finished", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({ uuid: track.uuid, listen_time: Math.floor(audio_ref.value.currentTime) }),
      credentials: "include",
   })
}

const set_current_song = async (track) => {
   // update streams for new track
   // if old track exists, update listen time
   if (track) {
      increment_plays(track)
      if (current_song.value) {
         update_listen_time(current_song.value)
      }
   }
   current_song.value = track

   if (track) {

      audio_ref.value.src = track.url
      audio_ref.value.currentTime = 0
      audio_ref.value.play()
      audio_progress.value = 0
      if (track.lyrics == "") {
         eventbus.emit("set_lyrics_visibility", false)
      }

      // update media player stuff
      navigator.mediaSession.metadata = new MediaMetadata({
         title: track.title,
         artist: track.artists.join(", "),
         album: "jukebox",
         artwork: [
            {
               src: track.album,
               sizes: "512x512",
               type: "image/webp",
            },
         ],
      })

   } else {
      audio_ref.value.src = ""
      audio_ref.value.currentTime = 0
      audio_ref.value.pause()
      audio_progress.value = 0
      eventbus.emit("set_lyrics_visibility", false)
   }
}

const prev_song = () => {
   // rewind if more than 3 seconds over, otherwise previous track
   if (audio_ref.value.currentTime > 3 || history.value.length <= 0) {
      audio_ref.value.currentTime = 0
   } else {
      // put current track at head of after queue if not from queue
      if (current_song.value && !current_song.value.is_queue)
         store.dispatch("addTrackToAfterQueueHead", current_song.value)
      // pop previous track from history. history is inserted at tail
      set_current_song(history.value.pop())
   }
}

const next_song = async () => {
   // replay song if set
   if (repeat_mode.value == REPEAT_SINGLE) {
      // special case, also increment listens by 1
      increment_plays(current_song.value)
      update_listen_time(current_song.value)

      audio_ref.value.currentTime = 0
      audio_ref.value.play()
      return
   } else {
      // push the previous song into history if not from queue
      if (current_song.value && !current_song.value.is_queue)
         history.value.push(current_song.value)
      // if queue is not empty, pop & play the first element
      if (queue.value.length > 0) {
         set_current_song(queue.value[0])
         store.dispatch("popTrack")
      } else {
         // otherwise try to move up in after queue
         // if we reach the end, stop playback or cancel depending on repeat mode
         if (after_queue.value.length == 0) {
            if (repeat_mode.value == REPEAT_MULTI) {
               // repeat entire listening history
               let track = history.value.shift()
               store.dispatch("setAfterQueue", history.value)
               history.value = []
               set_current_song(track)
            } else {
               set_current_song(null)
            }
         } else {
            // DEFAULT CASE: just play the next song
            set_current_song(after_queue.value[0])
            store.dispatch("shiftAfterQueue")
         }
      }
   }
}

const toggle_playback = () => {
   if (audio_ref.value.src == "") return

   if (audio_ref.value.paused) audio_ref.value.play()
   else audio_ref.value.pause()
}

const toggle_mute = () => {
   if (last_volume == 0) {
      // mute us
      last_volume = audio_ref.value.volume
      volume_progress.value = 0
      audio_ref.value.volume = 0
   } else {
      // unmute
      volume_progress.value = last_volume
      audio_ref.value.volume = last_volume
      last_volume = 0
   }
}

// given a track object, return a list of the tracks that follow it in order
// takes a queue track or track, returns a list normal tracks
const get_following_tracks = (track) => {
   let target = track.track ? track.track : track
   let index = tracks.value.findIndex((t) => t.filename == target.filename)
   let following_tracks = tracks.value.slice(index + 1)
   return following_tracks
}

// when user clicks a new song (mostly anywhere)
// play and ALWAYS REPOPULATE!
const handle_play_song = (track) => {
   set_current_song(track)

   // populate next tracks
   if (!shuffle.value)
      store.dispatch("setAfterQueue", get_following_tracks(track))
   else {
      // shuffle ALL tracks except the current one (if we are listening)
      let remaining_tracks = current_song.value
         ? tracks.value.filter((t) => t.title != current_song.title)
         : tracks.value
      store.dispatch("setAfterQueue", shuffle_array(remaining_tracks))
   }
}

// when user clicks a song FROM the queue IN the queue (they are skipping to it)
const handle_skip_queue_to = (index) => {
   set_current_song(queue.value[index])

   store.dispatch("skipQueueTo", index)
}

// when user clicks a song FROM the after queue (up next) IN the queue (they are skipping to it)
const handle_skip_afterqueue_to = (index) => {
   set_current_song(after_queue.value[index])

   store.dispatch("skipAfterQueueTo", index)
}

watch(store.state.queue, (newval) => {
   if (!current_song.value && newval.length >= 1) {
      set_current_song(newval[0])
      store.dispatch("popTrack")
   }
})

onMounted(() => {
   eventbus.on("set_new_info_track", (s) => {
      info_song.value = s
      eventbus.emit("set_info_visibility", true)
   })
   // on playing a new song
   eventbus.on("playSong", handle_play_song)
   // on skipping to a song in the after queue or queue
   eventbus.on("skipQueueTo", handle_skip_queue_to)
   eventbus.on("skipAfterQueueTo", handle_skip_afterqueue_to)

   audio_ref.value.addEventListener("ended", () => {
      next_song()
   })

   audio_ref.value.addEventListener("timeupdate", (e) => {
      audio_progress.value =
         e.currentTarget.currentTime / current_song.value.duration
   })

   audio_ref.value.addEventListener("playing", () => {
      navigator.mediaSession.setActionHandler("play", () =>
         audio_ref.value.play()
      )
      navigator.mediaSession.setActionHandler("pause", () =>
         audio_ref.value.pause()
      )
      navigator.mediaSession.setActionHandler("seekto", (details) => {
         if (details.fastSeek && "fastSeek" in audio_ref.value) {
            audio_ref.value.fastSeek(details.seekTime)
         } else {
            audio_ref.value.currentTime = details.seekTime
         }
      })
      navigator.mediaSession.setActionHandler("previoustrack", () =>
         prev_song()
      )
      navigator.mediaSession.setActionHandler("nexttrack", () => next_song())
   })

   window.addEventListener("resize", () => {
      mobile_player.value = window.innerWidth <= mobile_size
      if (mobile_player.value) show_album.value = false
   })
})

onUnmounted(() => {
   eventbus.off("playSong", handle_play_song)
   eventbus.off("skipQueueTo", handle_skip_queue_to)
   eventbus.off("skipAfterQueueTo", handle_skip_afterqueue_to)
   eventbus.off("set_new_info_track", () => {})
})
</script>

<style scoped>
.media-player-box {
   z-index: 50;
   overflow-y: hidden;
}

.lyrics-enter-active,
.lyrics-leave-active {
   transition: transform 0.5s ease;
}

.lyrics-enter-from,
.lyrics-leave-to {
   transform: translateY(110%);
}

.album-preview {
   position: fixed;
   left: 0;
   top: 0;
   width: 100vw;
   height: 100vh;
   background-color: var(--background-transparent);
   z-index: 200;

   display: flex;
   justify-content: center;
   align-items: center;
   flex-direction: column;
}

.big-album {
   width: 512px;
   margin-bottom: 20px;
   z-index: 1;
}

span.big-album {
   font-size: 512px;
   color: var(--foreground-3);
   background-color: var(--background-2);
}

.big-label {
   font-size: 48px;
   font-weight: bold;
   color: var(--foreground-1);
   margin: 0;
   z-index: 1;
}

.big-label.artists {
   font-size: 32px;
   font-weight: normal;
}

.big-background {
   position: fixed;
   width: 200%;
   height: 200%;
   filter: blur(100px) contrast(0.75) saturate(0.9) brightness(0.5);
   background-size: cover;
   background-position: center;
   user-select: none;
}
</style>
