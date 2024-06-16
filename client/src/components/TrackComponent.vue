<template>
  <div
    @click="play_track"
    :class="{ track: true, header: header, minimal: minimal }"
  >
    <img v-if="!hide_album_covers" class="album" :src="track.album" />
    <div class="track-info">
      <p class="title">
        {{ track.title
        }}<span v-if="track.winner" class="material-symbols-rounded trophy"
          >trophy</span
        >
      </p>
      <template v-for="(artist, index) in track.artists" :key="index">
        <RouterLink
          @click.stop="prevent_parent_click"
          :to="`/u/${track.artists[index]}`"
          class="artist"
          >{{ artist }}</RouterLink
        >
        <p
          v-if="index == track.artists.length - 1 ? '' : ', '"
          class="artist-comma"
        >
          ,
        </p>
      </template>
    </div>
    <div v-if="!hide_queue" :class="{ controls: true, norender: header }">
      <button @click.stop="add_to_queue">
        <span class="material-symbols-rounded add-to-queue">playlist_add</span>
      </button>
    </div>
    <div v-if="show_remove" class="controls">
      <button @click.stop="remove_from_queue">Remove</button>
    </div>
    <div v-if="allowDelete">
      <button
        class="delete"
        @click.stop="delete_track(track.filename)"
        v-if="!show_delete"
      >
        <span class="material-symbols-rounded">delete</span>
      </button>
      <button class="delete" @click.stop="delete_track(track.filename)" v-else>
        Yes, delete track
      </button>
      <button v-if="show_delete" @click.stop="cancel_delete">Cancel</button>
    </div>
    <div v-else-if="allow_remove_self">
      <button
        class="delete"
        @click.stop="remove_self_from_track(track.filename)"
        v-if="!show_remove_self"
      >
        <span class="material-symbols-rounded">person_remove</span>
      </button>
      <button
        class="delete"
        @click.stop="remove_self_from_track(track.filename)"
        v-else
      >
        Yes, remove me from track
      </button>
      <button v-if="show_remove_self" @click.stop="cancel_remove">
        Cancel
      </button>
    </div>
  </div>

  <LoadingScreen v-if="loading" />
</template>

<script setup>
import { defineProps, ref } from "vue";
import { useStore } from "vuex";
import { RouterLink } from "vue-router";
import LoadingScreen from "./LoadingComponent.vue";

const validated_delete = ref(false);
const show_delete = ref(false);

const validated_remove = ref(false);
const show_remove_self = ref(false);

const loading = ref(false);

const store = useStore();
const props = defineProps({
  track: {
    artist: String,
    title: String,
    url: String,
  },
  header: {
    type: Boolean,
    default: false,
  },
  allowDelete: Boolean, // only if we are the MAIN artist
  allow_remove_self: Boolean, // let us take our name off a track
  hide_queue: Boolean, // show or hide the queue icon
  show_remove: Boolean, // show the remove from queue button
  hide_album_covers: Boolean, // used for when we are in queue. don't render album covers
  queue_track: Object, // if we are a queue track, have this
  minimal: Boolean, // removes some functionality (click etc)
});

const cancel_delete = () => {
  show_delete.value = false;
  validated_delete.value = false;
};

const cancel_remove = () => {
  show_remove_self.value = false;
  validated_remove.value = false;
};

const delete_track = async (track_id) => {
  if (!validated_delete.value) {
    show_delete.value = true;
    validated_delete.value = true;
    return;
  }

  loading.value = true;

  let res = await fetch("/api/deletetrack", {
    method: "post",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ track_id: props.track.uuid }),
  });

  if (res.ok) {
    alert("Deleted track");
    window.location.reload();
  } else {
    let err = (await res.json()).message;
    alert("Error: " + err);
  }

  loading.value = false;

  show_delete.value = false;
  validated_delete.value = false;
};

const remove_self_from_track = async (track_id) => {
  if (!validated_remove.value) {
    show_remove_self.value = true;
    validated_remove.value = true;
    return;
  }

  loading.value = true;

  let res = await fetch("/api/removefromtrack", {
    method: "post",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ track_id: props.track.uuid }),
  });

  if (res.ok) {
    alert("Removed your name from the track");
    window.location.reload();
  } else {
    let err = (await res.json()).message;
    alert("Error: " + err);
  }
  loading.value = false;

  show_remove_self.value = false;
  validated_remove.value = false;
};

const play_track = () => {
  if (props.minimal) return;
  if (props.header) return;
  // for trakcs in the queue, instead of force setting
  // the queue, try to tell the queue to go there
  if (props.queue_track) {
    store.dispatch("skipQueueTo", props.queue_track);
  } else {
    if (props.track) {
      store.dispatch("setQueueToTrack", props.track);
    }
  }
};

const add_to_queue = () => {
  if (props.header) return;
  if (props.track) {
    store.dispatch("addTrack", props.track);
  }
};

const remove_from_queue = () => {
  if (props.queue_track) {
    store.dispatch("removeTrack", props.queue_track);
  }
};

const prevent_parent_click = (e) => {};
</script>

<style scoped>
.track {
  padding: 10px;
  border-radius: 2px;

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

.title {
  font-weight: bold;
  display: flex;
  align-items: center;
}

.title .trophy {
  color: #ffc000;
  background-color: #f08000;
  padding: 0px 8px;
  font-size: 22px;
  border-radius: 100px;
  margin-left: 4px;
}

button {
  background: none;
  border: none;
  cursor: pointer;
}

button:hover {
  opacity: 0.5;
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
  height: 48px;
}

.minimal .album {
  height: 64px;
}

.minimal {
  border-bottom: none;
  flex: 1;
  padding: 0;
  align-self: flex-start;
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-to-queue {
   color: black;
}
</style>
