<template>
    <div @click="play_track" :class="{'track': true, 'header': header}">
      <RouterLink @click="prevent_parent_click" :to="`/u/${track.artist}`" class="artist">{{track.artist_display_name}}</RouterLink>
      <p class="title">{{track.title}}</p>
      <div :class="{ controls: true, norender: header }">
         <button @click.stop="add_to_queue">Add to Queue</button>
      </div>
    </div>
</template>

<script setup>
import { defineProps } from "vue"
import { useStore } from "vuex"
import { RouterLink } from "vue-router"

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
    }
})

const play_track = () => {
   if (props.track) {
      store.dispatch("setQueue", [ props.track ])
   }
}

const add_to_queue = () => {
   if (props.track) {
      store.dispatch("addTrack", props.track)
   }
}

const prevent_parent_click = (e) => {
   e.stopPropogation()
}
</script>

<style scoped>
.track {
   padding: 10px 0;
   border-radius: 2px;

   border-bottom: 1px solid gray;
   display: flex;
   flex-direction: row;
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

.title {
   flex: 1;
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

a {
   color: black;
   text-decoration: none;
}

a:hover {
   text-decoration: underline;
}
</style>
