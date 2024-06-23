<template>
  <div class="player-mini-box">
    <PlayerDesktop
      :current_song="current_song"
      :audio_ref="audio_ref"
      :controls="{
        repeat_mode: repeat_mode,
        shuffle: shuffle,
        audio_progress: audio_progress,
        volume_progress: volume_progress
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
      @toggleQueue="emit('toggle_queue')"
    />
    <audio ref="audio_ref"></audio>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch, onMounted, computed, onUnmounted } from "vue";
import { useStore } from "vuex";
import eventbus from "../../eventbus"
import PlayerDesktop from "./PlayerDesktop.vue"

const store = useStore();
const emit = defineEmits(["toggle_queue"]);
const props = defineProps(["queue"]);

const audio_ref = ref(null)

const REPEAT_OFF = 0;
const REPEAT_MULTI = 1;
const REPEAT_SINGLE = 2;
const shuffle = ref(false);
const repeat_mode = ref(REPEAT_OFF);

// afterqeues are built up of QueueTrack components, which hold teh track & a flag
// on whether or not it was part of the queue or afterqueue
// queued tracks are considered ephemeral, being not recorded in history and
// taking priority
const queue = computed(() => store.state.queue); // user selected songs
const after_queue = computed(() => store.state.afterQueue); // tracks to play after user queue ends
const history = ref([]); // stack, LIFO
const current_song = ref(null);
const tracks = computed(() => store.state.tracks); // all tracks user is "pointed at"

const audio_progress = ref(0)
const volume_progress = ref(1)
let last_volume = 0; // last volume before muted. if we aren't muted, its 0

const next_repeat = () => {
  repeat_mode.value++;
  if (repeat_mode.value >= 3) repeat_mode.value = 0;
};

const shuffle_array = (array) => {
  let arr = array.slice(0);
  for (let i = 0; i < arr.length; i++) {
    let t = Math.floor(Math.random() * (i + 1));
    let temp = arr[i];
    arr[i] = arr[t];
    arr[t] = temp;
  }

  return arr;
};

const set_audio_progress = (progress) => {
  if (audio_ref.value.src) {
    audio_ref.value.currentTime = progress * audio_ref.value.duration
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
  shuffle.value = !shuffle.value;

  if (!current_song.value) return;

  if (shuffle.value) {
    // shuffle ALL tracks except the current one (if we are listening)
    let remaining_tracks = current_song.value ? 
      tracks.value.filter(t => t.title != current_song.value.title) :
      tracks.value
    store.dispatch("setAfterQueue", shuffle_array(remaining_tracks))
  } else {
    store.dispatch("setAfterQueue", get_following_tracks(current_song.value))
  }
};

const get_as_time = (time) => {
  if (isNaN(time)) return "0:00";
  let minutes = Math.floor(time / 60);
  let seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
};

const get_current_playback_time = () => {
  if (!audio_ref.value || audio_ref.value.src == "") {
    return "0:00";
  }
  return get_as_time(audio_ref.value.currentTime);
};

const get_song_duration = () => {
  if (!audio_ref.value || audio_ref.value.src == "") {
    return "0:00";
  }
  return get_as_time(audio_ref.value.duration);
};

const set_current_song = (track) => {
  current_song.value = track;

  if (track) {
    audio_ref.value.src = track.url;
    audio_ref.value.currentTime = 0;
    audio_ref.value.play();

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
    });
  } else {
    audio_ref.value.src = "";
    audio_ref.value.currentTime = 0;
    audio_ref.value.pause();
    audio_progress.value = 0
  }
};

const prev_song = () => {
  // rewind if more than 3 seconds over, otherwise previous track
  if (audio_ref.value.currentTime > 3 || history.value.length <= 0) {
    audio_ref.value.currentTime = 0;
  } else {
    // put current track at head of after queue if not from queue
    if (current_song.value && !current_song.value.is_queue)
      store.dispatch("addTrackToAfterQueueHead", current_song.value)
    // pop previous track from history. history is inserted at tail
    set_current_song(history.value.pop());
  }
};

const next_song = () => {
  // replay song if set
  if (repeat_mode.value == REPEAT_SINGLE) {
    audio_ref.value.currentTime = 0;
    audio_ref.value.play();
    return;
  } else {
    // push the previous song into history if not from queue
    if (current_song.value && !current_song.value.is_queue)
      history.value.push(current_song.value);
    // if queue is not empty, pop & play the first element
    if (queue.value.length > 0) {
      set_current_song(queue.value[0]);
      store.dispatch("popTrack");
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
          set_current_song(null);
        }
      } else {
        // DEFAULT CASE: just play the next song
        set_current_song(after_queue.value[0])
        store.dispatch("shiftAfterQueue")
      }
    }
  }
};

const toggle_playback = () => {
  if (audio_ref.value.src == "") return;

  if (audio_ref.value.paused) audio_ref.value.play();
  else audio_ref.value.pause();
};

const toggle_mute = () => {
  if (last_volume == 0) {
    // mute us
    last_volume = audio_ref.value.volume;
    volume_progress.value = 0
    audio_ref.value.volume = 0
  } else {
    // unmute
    volume_progress.value = last_volume
    audio_ref.value.volume = last_volume
    last_volume = 0;
  }
};

// given a track object, return a list of the tracks that follow it in order
// takes a queue track or track, returns a list normal tracks
const get_following_tracks = (track) => {
  let target = track.track ? track.track : track;
  let index = tracks.value.findIndex((t) => t.filename == target.filename);
  let following_tracks = tracks.value.slice(index + 1);
  return following_tracks;
};

// when user clicks a new song (mostly anywhere)
// play and ALWAYS REPOPULATE!
const handle_play_song = (track) => {
  set_current_song(track)

  // populate next tracks
  if (!shuffle.value)
    store.dispatch("setAfterQueue", get_following_tracks(track))
  else {
    // shuffle ALL tracks except the current one (if we are listening)
    let remaining_tracks = current_song.value ? 
      tracks.value.filter(t => t.title != current_song.title) :
      tracks.value
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

onMounted(() => {
  // on playing a new song
  eventbus.on("playSong", handle_play_song)
  // on skipping to a song in the after queue or queue
  eventbus.on("skipQueueTo", handle_skip_queue_to)
  eventbus.on("skipAfterQueueTo", handle_skip_afterqueue_to)

  audio_ref.value.addEventListener("ended", () => {
    next_song();
  });

  audio_ref.value.addEventListener("timeupdate", (e) => {
    audio_progress.value = e.currentTarget.currentTime / e.currentTarget.duration
  })

  audio_ref.value.addEventListener("playing", () => {
    navigator.mediaSession.setActionHandler("play", () =>
      audio_ref.value.play(),
    );
    navigator.mediaSession.setActionHandler("pause", () =>
      audio_ref.value.pause(),
    );
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.fastSeek && "fastSeek" in audio_ref.value) {
        audio_ref.value.fastSeek(details.seekTime);
      } else {
        audio_ref.value.currentTime = details.seekTime;
      }
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => prev_song());
    navigator.mediaSession.setActionHandler("nexttrack", () => next_song());
  })
})

onUnmounted(() => {
  eventbus.off("playSong", handle_play_song)
  eventbus.off("skipQueueTo", handle_skip_queue_to)
  eventbus.off("skipAfterQueueTo", handle_skip_afterqueue_to)
})
</script>

<style scoped>
</style>