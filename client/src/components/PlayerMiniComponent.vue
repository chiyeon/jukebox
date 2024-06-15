<template>
  <div class="player-mini-box">
    <div class="player-mini">
      <div class="progress-box">
        <p class="duration">{{ get_current_playback_time() }}</p>
        <div class="progress-background">
          <div
            class="progress"
            ref="progress_ref"
            :style="{ width: playback_progress_percent }"
          ></div>
          <input
            @input="set_progress_by_slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="progress-slider"
          />
        </div>
        <p class="duration right">{{ get_song_duration() }}</p>
      </div>
      <div class="track-box">
        <div class="album">
          <div class="album-cover">
            <img
              v-if="current_song && current_song.track.album"
              :src="current_song.track.album"
            />
            <span
              class="material-symbols-rounded album-icon"
              v-else
              :style="{ color: ALBUM_COLOR }"
            >
              album
            </span>
          </div>
          <!-- <img class="album-icon"
                  :src="current_song && current_song.album ? current_song.album : 'https://storage.googleapis.com/jukebox-albums/default.webp'" /> -->
          <div class="track-info">
            <template v-if="current_song && current_song.track">
            <p class="title"><span v-if="current_song.track.winner" class="material-symbols-rounded trophy">trophy</span>{{current_song.track.title}}</p>
                  <template
                     v-for="(artist, index) in current_song.track.artist_display_names"
                     :key="index"
                  >
                  <RouterLink
                     :to="`/u/${current_song.track.artists[index]}`"
                     class="artist"
                  >{{ artist }}</RouterLink>
                  <p v-if="((index == current_song.track.artist_display_names.length - 1) ? '' : ', ') " class="artist-comma">, </p>
               </template>
            </template>
            <p v-else>No track selected</p>
          </div>
        </div>
        <div class="controls">
          <button @click="toggle_shuffle">
            <span
              class="material-symbols-rounded control-icon"
              :style="{ color: CONTROL_COLOR }"
            >
              {{ shuffle ? "shuffle_on" : "shuffle" }}
            </span>
          </button>
          <button class="prev" @click="prev_song">
            <!-- <img width="32" height="32"
                     src="https://img.icons8.com/pixels/32/skip-to-start.png" alt="skip-to-start" /> -->
            <span
              class="material-symbols-rounded control-icon"
              :style="{ color: CONTROL_COLOR }"
            >
              skip_previous
            </span>
          </button>
          <button class="pause" @click="toggle_playback">
            <!-- <img width="32" height="32"
                     :src="`https://img.icons8.com/pixels/32/${audio_ref && !audio_ref.paused ? 'pause' : 'play'}.png`"
                     alt="play" /> -->
            <span
              class="material-symbols-rounded control-icon"
              :style="{ color: CONTROL_COLOR }"
            >
              {{
                audio_ref && !audio_ref.paused ? "pause_circle" : "play_circle"
              }}
            </span>
          </button>
          <button class="next" @click="next_song">
            <!-- <img width="32" height="32"
                     src="https://img.icons8.com/pixels/32/end.png" alt="end" /> -->
            <span
              class="material-symbols-rounded control-icon"
              :style="{ color: CONTROL_COLOR }"
            >
              skip_next
            </span>
          </button>
          <button @click="next_repeat">
            <span
              class="material-symbols-rounded control-icon"
              :style="{ color: CONTROL_COLOR }"
            >
              {{ repeat_modes[repeat_mode] }}
            </span>
          </button>
        </div>
        <div class="controls-right">
          <div class="volume-controls">
            <!-- <img class="volume-icon" width="24" height="24" :src="get_volume_icon()" alt="volume"
                     @click="toggle_mute" /> -->
            <span
              class="material-symbols-rounded volume-icon"
              alt="volume"
              @click="toggle_mute"
              :style="{ color: VOLUME_COLOR, 'user-select': 'none' }"
            >
              {{ get_volume_icon() }}
            </span>
            <div class="volume-box">
              <div class="volume-background">
                <div
                  class="volume"
                  ref="volume_ref"
                  :style="{ width: volume_percent, background: VOLUME_COLOR }"
                ></div>
                <input
                  @input="set_volume_by_slider"
                  ref="volume_slider_ref"
                  type="range"
                  min="0"
                  max="1"
                  value="1"
                  step="0.01"
                  class="volume-slider"
                />
              </div>
            </div>
          </div>
          <span
            class="material-symbols-rounded queue-icon"
            :style="{ color: 'orange' }"
            @click="emit('toggle_queue')"
          >
            queue_music
          </span>
          <!--span class="material-symbols-rounded jam-icon" :style="{ color: JAM_COLOR, 'margin-left': '1em' }">
                  communities
               </span-->
        </div>
      </div>
    </div>

    <audio ref="audio_ref"></audio>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch, onMounted, computed } from "vue";
import { useStore } from "vuex";

const store = useStore();
const emit = defineEmits(["toggle_queue"]);

const audio_ref = ref(null);
const progress_ref = ref(null);

const REPEAT_OFF = 0;
const REPEAT_MULTI = 1;
const REPEAT_SINGLE = 2;
const shuffle = ref(false);
const repeat_mode = ref(REPEAT_OFF);
const repeat_modes = ["repeat", "repeat_on", "repeat_one_on"];
const CONTROL_COLOR = "#EC5800";
const VOLUME_COLOR = "#9272ED";
const JAM_COLOR = "#76B731";
const ALBUM_COLOR = "#1B1B1B";

// afterqeues are built up of QueueTrack components, which hold teh track & a flag
// on whether or not it was part of the queue or afterqueue
// queued tracks are considered ephemeral, being not recorded in history and
// taking priority
const queue = computed(() => store.state.queue); // user selected songs
const after_queue = ref([]); // tracks to play after user queue ends
const history = ref([]); // stack, LIFO

const playback_progress_percent = ref("0%");
const volume_percent = ref("100%");
const current_song = ref(null);

const tracks = computed(() => store.state.tracks); // all tracks user is "pointed at"

let last_volume = 0; // last volume before muted. if we aren't muted, its 0

const volume_icons = ["volume_up", "volume_down", "volume_mute", "volume_off"];

const props = defineProps(["queue"]);

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
      artist:
        track.track.artist_display_names &&
        track.track.artist_display_names.length != 0
          ? track.track.artist_display_names.join(", ")
          : track.track.artists.join(", "),
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

const set_progress = (e) => {
  if (audio_ref.value.src == "") return;
  audio_ref.value.currentTime =
    (e.offsetX / e.currentTarget.clientWidth) * audio_ref.value.duration;
  update_progress();
};

const set_progress_by_slider = (e) => {
  if (audio_ref.value.src == "") return;
  audio_ref.value.currentTime =
    e.currentTarget.value * audio_ref.value.duration;
  update_progress();
};

const toggle_mute = () => {
  if (last_volume == 0) {
    // mute us
    last_volume = audio_ref.value.volume;
    set_volume(0);
  } else {
    // unmute
    set_volume(last_volume);
    last_volume = 0;
  }
};

const set_volume_by_click = (e) => {
  last_volume = 0;
  let new_vol = Math.max(
    0,
    Math.min(1, e.offsetX / e.currentTarget.clientWidth),
  );
  set_volume(new_vol);
};

const set_volume_by_slider = (e) => {
  set_volume(e.currentTarget.value);
};

const set_volume = (volume) => {
  audio_ref.value.volume = volume;
  volume_percent.value = volume * 100 + "%";
};

const get_volume_icon = () => {
  if (!audio_ref.value) return volume_icons[3];

  let vol = audio_ref.value.volume;

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
    if (oldval.includes(newval[0])) {
      // this occurs if we skipped to a track in queue. just play top
      set_current_song(newval[0]);
      store.dispatch("popTrack");
    } else if (newval.length == 1) {
      // this is when we click on a track in the listen page
      // to start a new playback session
      set_current_song(newval[0]);
      // lets populate the afterqueue
      if (!shuffle.value)
        after_queue.value = get_following_tracks(newval[0].track).map((track) =>
          QueueTrack(track, false),
        );
      else
        after_queue.value = shuffle_array(
          tracks.value.map((track) => QueueTrack(track, false)),
        );
      store.dispatch("popTrack");
    }
  },
);

watch(
  () => after_queue.value,
  (newval, oldval) => {
    store.dispatch("setAfterQueue", after_queue.value);
  },
);

const update_progress = () => {
  if (audio_ref.value) playback_progress_percent.value =
    (audio_ref.value.currentTime / audio_ref.value.duration) * 100 + "%";
};

onMounted(() => {
  audio_ref.value.addEventListener("ended", () => {
    next_song();
  });

  audio_ref.value.addEventListener("timeupdate", () => {
    progress_ref.value.value =
      audio_ref.value.currentTime / audio_ref.value.duration;
    update_progress();
  });

  navigator.mediaSession.setActionHandler("play", () => audio_ref.value.play());
  navigator.mediaSession.setActionHandler("pause", () =>
    audio_ref.value.pause(),
  );
  navigator.mediaSession.setActionHandler("seekto", ({ seekTime }) => {
    audio_ref.value.currentTime = seekTime;
  });
  navigator.mediaSession.setActionHandler("previoustrack", () => prev_song());
  navigator.mediaSession.setActionHandler("nexttrack", () => next_song());
});
</script>

<style scoped>
@media (max-width: 550px) {
  .volume-controls {
    display: none !important;
  }

  .track-box {
    flex-direction: column !important;
  }

  .album {
    align-self: flex-start;
  }
  .player-mini-box {
      left: 0;
   }
}

/* size and align control icons */
.control-icon {
  text-align: center;
  display: block;
}

.prev .control-icon,
.pause .control-icon,
.next .control-icon {
  --size: 40px;
  display: block;
  font-size: var(--size);
  width: var(--size);
  height: var(--size);
  text-align: center;
  line-height: var(--size);
}

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
}

.player-mini {
  max-width: 800px;
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
  width: 64px;
  height: 64px;
  text-align: center;
  line-height: 64px;
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

.controls {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: center;
  flex: 0.3;
}

.controls button {
  background: none;
  border: none;
  cursor: pointer;
}

.controls button:hover {
  opacity: 0.8;
}

.controls-right {
  flex: 0.35;

  display: flex;
  justify-content: flex-end;
}

.volume-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.volume-box {
  width: 64px;
  height: 16px;
  cursor: pointer;

  display: flex;
  align-items: center;
}

.volume-box:hover .volume-background {
  height: 8px;
}

.volume-background {
  width: 100%;
  height: 6px;
  background-color: #e4e4e4;
  border-radius: 100px;

  transition: height 300ms cubic-bezier(0, 0.74, 0.04, 1);
}

.volume-icon,
.jam-icon {
  cursor: pointer;
}

.volume {
  height: 100%;
  border-radius: 100px;
}

.progress-box {
  width: 100%;
  height: 12px;
  margin-bottom: 20px;
  cursor: pointer;

  display: flex;
  align-items: center;
}

.progress-background {
  width: 100%;
  height: 6px;
  border-radius: 100px;
  background-color: #e4e4e4;

  transition: height 300ms cubic-bezier(0, 0.74, 0.04, 1);
}

.progress {
  background-color: orange;
  border-radius: 100px;
  height: 100%;
  width: 0%;
}

.progress-box:hover .progress-background {
  height: 8px;
}

.progress-background,
.volume-background {
  position: relative;
}

.volume-slider,
.progress-slider {
  appearance: none;
  -webkit-appearance: none;
  outline: none;
  width: 100%;

  position: absolute;
  top: 0;
  transform: translateY(-25%);

  margin: 0;
  opacity: 0;
  padding: 0;

  cursor: pointer;

  background-color: #e4e4e4;
}

.progress-background {
}

.duration {
  font-size: 13px;
  width: 50px;
}
.duration.right {
  text-align: right;
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

.title {
   font-weight: bold;
   display: flex;
   align-items: center;
}

.title .trophy {
   color: #e2b13c;
}
</style>
