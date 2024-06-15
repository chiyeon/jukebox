<template>
    <div @click="play_track" :class="{'track': true, 'header': header}">
      <img v-if="!hide_album_covers" class="album" :src="track.album" />
      <div class="track-info">
         <p class="title"><span v-if="track.winner" class="material-symbols-rounded trophy">trophy</span>{{track.title}}</p>
         <template
            v-for="(artist, index) in track.artist_display_names"
            :key="index"
         >
            <RouterLink
               @click.stop="prevent_parent_click"
               :to="`/u/${track.artists[index]}`"
               class="artist"
            >{{ artist }}</RouterLink>
            <p v-if="((index == track.artist_display_names.length - 1) ? '' : ', ') " class="artist-comma">, </p>
         </template>
      </div>
      <div v-if="!hide_queue" :class="{ controls: true, norender: header }">
         <button @click.stop="add_to_queue">Add to Queue</button>
      </div>
      <div v-if="show_remove" class="controls">
         <button @click.stop="remove_from_queue">Remove</button>
      </div>
      <div v-if="allowDelete">
         <button class="delete" @click.stop="delete_track(track.filename)">{{ show_delete ? "Yes, delete this track" : "Delete" }}</button>
         <button v-if="show_delete" @click.stop="cancel_delete">Cancel</button>
      </div>
    </div>
</template>

<script setup>
import { defineProps, ref, } from "vue"
import { useStore } from "vuex"
import { RouterLink } from "vue-router"

const validated_delete = ref(false)
const show_delete = ref(false)

const store = useStore()
const props = defineProps({
    track: {
        artist: String,
        title: String,
        url: String
    },
    header: {
        type: Boolean,
        default: false
    },
   allowDelete: Boolean,
   hide_queue: Boolean,
   show_remove: {
      type: Boolean,
      default: false
   },
   hide_album_covers: Boolean,
   queue_track: Object
})

const cancel_delete = () => {
   show_delete.value = false
   validated_delete.value = false
}

const delete_track = async (track_id) => {
   if (!validated_delete.value) {
      show_delete.value = true
      validated_delete.value = true
      return
   }

   let res = await fetch("/api/deletetrack", {
      method: "post",
      credentials: "include",
      headers: {
         "Content-Type": "application/json" 
      },
      body: JSON.stringify({ track_id: props.track.filename })
   })

   if (res.ok) {
      alert("Deleted track")
      window.location.reload()
   } else {
      let err = (await res.json()).message
      alert("Error: " + err)
   }

   show_delete.value = false
   validated_delete.value = false
}

const play_track = () => {
   if (props.header) return
   // for trakcs in the queue, instead of force setting
   // the queue, try to tell the queue to go there
   if (props.queue_track) {
      store.dispatch("skipQueueTo", props.queue_track)
   } else {
      if (props.track) {
         store.dispatch("setQueueToTrack", props.track)
      }
   }
}

const add_to_queue = () => {
   if (props.header) return
   if (props.track) {
      store.dispatch("addTrack", props.track)
   }
}

const remove_from_queue = () => {
   if (props.queue_track) {
      store.dispatch("removeTrack", props.queue_track)
   }
}

const prevent_parent_click = (e) => {
}
</script>

<style scoped>
.track {
   padding: 10px 0;
   border-radius: 2px;

   border-bottom: 1px solid gray;
   display: flex;
   flex-direction: row;
   align-items: center;
   gap: 10px;

   user-select: none;
}

.track:not(.header):hover {
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

.artist-comma {
   display: inline;
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
   color: #e2b13c;
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
   padding-left: 10px;
}
</style>
