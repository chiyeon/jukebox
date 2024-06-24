<template>
  <div @click="play_track"
    :class="{ track: true, minimal: is_media_player(), mobile_expanded: type == 'playermobile', queue: is_queue_element() }">
    <img v-if="!is_queue_element()" class="album" :src="track.album" />
    <div class="track-info">
      <p class="title">
        {{ track.title
        }}<span v-if="track.winner" class="material-symbols-rounded trophy">trophy</span>
      </p>
      <template v-for="(artist, index) in track.artists" :key="index">
        <RouterLink @click.stop="prevent_parent_click" :to="`/u/${track.artists[index]}`" class="artist">{{ artist }}
        </RouterLink>
        <p v-if="index == track.artists.length - 1 ? '' : ', '" class="artist-comma">
          ,
        </p>
      </template>
    </div>

    <div class="controls" v-if="show_edit">
      <div class="button-block label">
        <span class="material-symbols-rounded">edit</span>
      </div>
      <button class="button-block edit" title="Edit track" @click.stop="submit_edit_track()">
        <span class="material-symbols-rounded">check</span>
      </button>
      <button class="button-block cancel" title="Cancel edit track" @click.stop="cancel_editing_track">
        <span class="material-symbols-rounded">cancel</span>
      </button>
    </div>

    <div class="controls">
      <template v-if="type == 'allowedit'">
        <button class="button-block edit" title="Edit track" @click.stop="start_editing_track" v-if="!show_edit">
          <span class="material-symbols-rounded">edit</span>
        </button>

        <button class="button-block delete" title="Delete track" @click.stop="delete_track()" v-if="!show_delete">
          <span class="material-symbols-rounded">delete</span>
        </button>
      </template>
      <template v-else-if="type == 'allowremove'">
        <button class="button-block delete" title="Remove self from Track" @click.stop="remove_self_from_track()"
          v-if="!show_remove_self">
          <span class="material-symbols-rounded">person_remove</span>
        </button>
        <button class="button-block delete" title="Confirm Removal" @click.stop="remove_self_from_track()" v-else>
          <span class="material-symbols-rounded">person_remove</span>
        </button>
        <button v-if="show_remove_self" title="Cancel Removal" @click.stop="cancel_remove" class="button-block cancel">
          <span class="material-symbols-rounded">cancel</span>
        </button>
      </template>
    </div>

    <div class="controls" v-if="show_delete">
      <button @click.stop="delete_track()" title="Confirm Delete" class="button-block delete">
        <span class="material-symbols-rounded">delete_forever</span>
      </button>
      <button v-if="show_delete" @click.stop="cancel_delete" title="Cancel Delete" class="button-block cancel">
        <span class="material-symbols-rounded">cancel</span>
      </button>
    </div>

    <div class="controls">
      <button v-if="!is_hiding_queue_button()" @click.stop="add_to_queue" class="button-block">
        <span class="material-symbols-rounded add-to-queue">playlist_add</span>
      </button>
      <button v-if="type == 'queue'" @click.stop="remove_from_queue" class="button-block queue">
        <span class="material-symbols-rounded add-to-queue">close</span>
      </button>
    </div>

  </div>
  <div class="edit-track" v-if="show_edit">
    <EditTrack :track="track" />
  </div>
  <LoadingScreen v-if="loading" />
</template>

<script setup>
import { defineProps, ref } from "vue";
import { useStore } from "vuex";
import { RouterLink } from "vue-router";
import LoadingScreen from "./LoadingComponent.vue";
import eventbus from "../eventbus"
import EditTrack from "./EditTrackComponent.vue"
import router from "../router"

const validated_delete = ref(false);
const show_delete = ref(false);
const show_edit = ref(false)

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

const is_media_player = () => {
  return ["player", "playermobile"].includes(props.type)
}

const cancel_delete = () => {
  show_delete.value = false;
  validated_delete.value = false;
}

const cancel_remove = () => {
  show_remove_self.value = false;
  validated_remove.value = false;
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
    return alert("Invalid title")
  }

  let res = await fetch("/api/edittrack", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uuid: props.track.uuid,
      title: props.track.title,
      artists: JSON.stringify(props.track.artists.slice(1)),
      lyrics: props.track.lyrics
    })
  })

  if (!res.ok) {
    let msg = (await res.json()).message
    alert("Error: " + msg)
  } else {
    alert("Edited track successfully")
    window.location.reload()

    show_edit.value = false
  }

  loading.value = false

}

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
  if (props.track) {
    store.dispatch("addTrack", props.track);
  }
};

const remove_from_queue = () => {
  console.log("hmm")
  store.dispatch("removeTrack", props.index);
};

const prevent_parent_click = (e) => { };
</script>

<style scoped>

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
  height: 56px;
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

.controls>.button-block:first-child {
  border-radius: 10px 0 0 10px;
}

.controls>.button-block:last-child {
  border-radius: 0 10px 10px 0;
}

.controls>.button-block:first-child:last-child {
  border-radius: 10px;
}

.button-block {
  width: 42px;
  aspect-ratio: 1.0;
  background-color: rgb(183, 183, 183);

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

.cancel span {
  color: white;
}

.edit {
  background-color: goldenrod;
}
</style>
