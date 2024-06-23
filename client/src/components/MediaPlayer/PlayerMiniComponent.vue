<template>
  <div class="player-mini-box">
    <div class="player-mini">
      <ProgressSlider 
        :style="{ marginBottom: '20px' }"
         color="coral"
         :progress="audio_progress"
         :disabled="audio_ref && audio_ref.src == ''"
         @setProgress="(p) => audio_ref.src && (audio_ref.currentTime = p * audio_ref.duration)"
         :left_label="get_current_playback_time()"
         :right_label="get_song_duration()"
      />
      <div class="track-box">
        <Track
          v-if="current_song"
          :track="current_song.track"
          :minimal="true"
          :hide_queue="true"
        />
        <div v-else class="not-playing-preview">
          <span class="material-symbols-rounded album-icon"> album </span>
          <p>No track selected</p>
        </div>
        <MediaControls
          :paused="audio_ref && audio_ref.paused"
          :repeat_mode="repeat_mode"
          :shuffle="shuffle"

          @togglePlayback="toggle_playback"
          @cycleRepeatMode="next_repeat"
          @toggleShuffle="toggle_shuffle"
          @nextTrack="next_song"
          @prevTrack="prev_song"
        />
        <div class="controls-right">
          <div class="volume-controls">
            <span class="material-symbols-rounded volume-icon" :style="{ color: 'purple' }" @click="toggle_mute">{{ get_volume_icon() }}</span>
            <ProgressSlider
              color="purple"
              :allow_drag="true"
              :progress="volume_progress"
              :disabled="!audio_ref"
              @setProgress="(p) => audio_ref && (audio_ref.volume = p) && (volume_progress = p)"
            />
          </div>
          <span
            class="material-symbols-rounded queue-icon"
            :style="{ color: 'lightcoral' }"
            @click="emit('toggle_queue')"
          >
            queue_music
          </span>
        </div>
      </div>
    </div>
    <audio ref="audio_ref"></audio>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch, onMounted, computed } from "vue";
import { useStore } from "vuex";
import ProgressSlider from "./ProgressSlider.vue"
import MediaControls from "./MediaControls.vue"
import Track from "../TrackComponent.vue";

const store = useStore();
const emit = defineEmits(["toggle_queue"]);
const props = defineProps(["queue"]);

const audio_ref = ref(null)

const REPEAT_OFF = 0;
const REPEAT_MULTI = 1;
const REPEAT_SINGLE = 2;
const shuffle = ref(false);
const repeat_mode = ref(REPEAT_OFF);
const volume_icons = ["volume_up", "volume_down", "volume_mute", "volume_off"];

// afterqeues are built up of QueueTrack components, which hold teh track & a flag
// on whether or not it was part of the queue or afterqueue
// queued tracks are considered ephemeral, being not recorded in history and
// taking priority
const queue = computed(() => store.state.queue); // user selected songs
const after_queue = ref([]); // tracks to play after user queue ends
const history = ref([]); // stack, LIFO
const current_song = ref(null);
const tracks = computed(() => store.state.tracks); // all tracks user is "pointed at"

const audio_progress = ref(0)
const volume_progress = ref(1)
let last_volume = 0; // last volume before muted. if we aren't muted, its 0

const QueueTrack = (track, is_queue) => {
  return {
    track,
    is_queue,
  };
};

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

// get all the songs in front of us and either shuffle them or set them back to their
// order in tracks.
const toggle_shuffle = () => {
  shuffle.value = !shuffle.value;

  if (!current_song.value) return;

  if (shuffle.value) {
    after_queue.value = shuffle_array(
      tracks.value.map((track) => QueueTrack(track, false)),
    );
  } else {
    after_queue.value = get_following_tracks(current_song.value).map((track) =>
      QueueTrack(track, false),
    );
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
    audio_ref.value.src = track.track.url;
    audio_ref.value.currentTime = 0;
    audio_ref.value.play();

    // update media player stuff
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.track.title,
      artist: track.track.artists.join(", "),
      album: "jukebox",
      artwork: [
        {
          src: track.track.album,
          sizes: "512x512",
          type: "image/webp",
        },
      ],
    });
  } else {
    audio_ref.value.src = "";
    audio_ref.value.currentTime = 0;
    audio_ref.value.pause();
  }
};

const prev_song = () => {
  // rewind if more than 3 seconds over, otherwise previous track
  if (audio_ref.value.currentTime > 3 || history.value.length <= 0) {
    audio_ref.value.currentTime = 0;
  } else {
    // put current track at head of after queue if not from queue
    if (current_song.value && !current_song.value.is_queue)
      after_queue.value.unshift(current_song.value);
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
          after_queue.value = history.value;
          history.value = [];

          // play song
          set_current_song(after_queue.value.shift());
        } else {
          set_current_song(null);
        }
      } else {
        // DEFAULT CASE: just play the next song
        set_current_song(after_queue.value.shift());
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

const get_volume_icon = () => {
  if (!audio_ref.value) return volume_icons[3];

  let vol = volume_progress.value

  if (vol <= 0) {
    return volume_icons[3];
  } else if (vol <= 0.34) {
    return volume_icons[2];
  } else if (vol <= 0.67) {
    return volume_icons[1];
  } else {
    return volume_icons[0];
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

// this only reacts to changes from outside (ie someone clicking a track or adding a track to queue)
watch(
  () => queue.value,
  (newval, oldval) => {
    if (!newval || newval.length == 0) return;

    // first check if we are trying to play a song in our queue currently
    // also make sure its actually PART of the queue
    if (newval[0].is_queue && oldval.includes(newval[0])) {
      // this occurs if we skipped to a track in queue. just play top
      set_current_song(newval[0]);
      store.dispatch("popTrack");
    } else if (newval.length == 1) {
      store.dispatch("setQueue", oldval);
      // this is when we click on a track in the listen page
      // to start a new playback session
      set_current_song(newval[0]);
      // lets populate the afterqueue IF ITS NOT PART OF TEH QUEUE
      // when its part of the queue, we're just trying to skip!
      if (!shuffle.value)
        after_queue.value = get_following_tracks(newval[0].track).map((track) =>
          QueueTrack(track, false),
        );
      else if (after_queue.value.length == 0) {
        after_queue.value = shuffle_array(
          tracks.value.map((track) => QueueTrack(track, false)),
        );
      } else {
        // user is skipping, just goto that track
        after_queue.value = after_queue.value.slice(
          after_queue.value.findIndex(
            (t) => t.track.uuid == newval[0].track.uuid,
          ) + 1,
        );
      }
    }
  },
);

watch(
  () => after_queue.value,
  (newval, oldval) => {
    store.dispatch("setAfterQueue", after_queue.value);
  },
);

onMounted(() => {
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
  });
});
</script>

<style scoped>
.jam-icon {
  font-size: 32px;
  width: 32px;
  height: 32px;
  text-align: center;
  line-height: 32px;
}

.player-mini-box {
  width: 100%;

  background-color: white;
  border-top: 1px solid black;
  box-sizing: border-box;
}

.player-mini {
  margin: auto;
  padding: 20px;
  padding-top: 20;
}

.track-box {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.album {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 15px;

  flex: 0.35;
}

.album-cover {
  width: 64px;
  height: 64px;
  cursor: pointer;
  overflow: hidden;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-icon {
  font-size: 64px;
  color: black;
}

.artist-comma {
  display: inline;
}

.track-info {
  flex: 1;
}

.track-info p {
  margin: 0;
}

.controls-right {
  flex: 1;

  display: flex;
  justify-content: flex-end;
}

.volume-controls {
  width: 100px;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.volume-icon,
.jam-icon {
  cursor: pointer;
}

.queue-icon {
  margin-left: 8px;
  cursor: pointer;
}

.queue-icon:hover {
  opacity: 0.6;
}

.material-symbols-rounded {
  user-select: none;
}

.not-playing-preview {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;

  flex: 1;
}

.not-playing-preview p {
  margin: 0;
}
</style>
