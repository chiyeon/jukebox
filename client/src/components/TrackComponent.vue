<template>
  <div
    @click="play_track"
    :class="{ track: true, minimal: type == 'player', mobile_expanded: type == 'playermobile', queue: is_queue_element() }"
  >
    <img v-if="!is_queue_element()" class="album" :src="track.album" />
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
    <div v-if="!is_hiding_queue_button()" class="controls">
      <button @click.stop="add_to_queue">
        <span class="material-symbols-rounded add-to-queue">playlist_add</span>
      </button>
    </div>
    <div v-if="type == 'allowedit'" class="controls">
      <button @click.stop="remove_from_queue">Remove</button>
    </div>
    <div v-if="type == 'allowedit'">
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
    <div v-else-if="type == 'allowremove'">
      <button
        class="delete"
        @click.stop="remove_self_from_track()"
        v-if="!show_remove_self"
      >
        <span class="material-symbols-rounded">person_remove</span>
      </button>
      <button
        class="delete"
        @click.stop="remove_self_from_track()"
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
import eventbus from "../eventbus"

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
  type: String,
  index: Number,
});
// what is props.type?
// none - default. normal track used in listen page
// queue - queue segment of queue tracks. songs that user has queued up. skips the queue to that point. hides icon.
// afterqueue - up next segment of queue tracks. songs that are generated next. skips up next to that point. hides icon.
// player - display normal, just don't allow it to be pressed
// playermobile - display for mobile, don't allow it to be pressed
// allowedit - allows editing/deleting. for user profiles
// allowremove - lesser version of allowedit. for user profiles

// we should hide the album
const is_queue_element = () => {
  return ["afterqueue", "queue"].includes(props.type)
}

const is_hiding_queue_button = () => {
  return ["queue", "player", "playermobile"].includes(props.type)
}

const cancel_delete = () => {
  show_delete.value = false;
  validated_delete.value = false;
};

const cancel_remove = () => {
  show_remove_self.value = false;
  validated_remove.value = false;
};

const delete_track = async () => {
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

const remove_self_from_track = async () => {
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
  if (props.type && props.type.includes("player")) return
  
  if (props.type == "queue") {
    eventbus.emit("skipQueueTo", props.index)
  } else if (props.type == "afterqueue") {
    eventbus.emit("skipAfterQueueTo", props.index)
  } else {
    eventbus.emit("playSong", props.track)
  }
};

const add_to_queue = () => {
  if (props.header) return;
  if (props.track) {
    store.dispatch("addTrack", props.track);
  }
};

const remove_from_queue = () => {
  if (self.type == "queue") {
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
}

.queue .title {
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue .track-info {
  max-width: 85%;
}

.add-to-queue {
   color: black;
}

.mobile_expanded {
   flex-direction: column;
   width: 100%;
}

.track.mobile_expanded img {
   width: 100%;
   aspect-ratio: 1.0;
   height: auto;
}

.mobile_expanded .track-info {
   align-self: flex-start;
   padding-bottom: 20px;
}

.mobile_expanded .track-info .title {
   font-size: 24px;
}

.mobile_expanded .track-info .artist {
   font-size: 17px;
}
</style>
