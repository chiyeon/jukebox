<template>
   <div class="track-info-box">
         <span
            class="material-symbols-rounded exit"
            @click="eventbus.emit('set_info_visibility', false)"
            >keyboard_arrow_down</span
         >

         
      <div class="track-info">
         <div class="header">
         <img class="album" :src="track.album" alt="The album cover"/>

         <h1>{{ track.title }}</h1>
         <div class="artists">
            <p>By</p>
            <template v-for="(artist, index) in track.artists" :key="index">
               <RouterLink
                  @click.stop="eventbus.emit('set_info_visibility', false)"
                  :to="`/u/${track.artists[index]}`"
                  class="artist"
                  >{{ artist }}
               </RouterLink>
               <p
                  v-if="index == track.artists.length - 1 ? '' : ', '"
                  class="artist-comma"
               >
                  ,
               </p>
            </template>
         </div>
            </div>

         <Track :track="track" type="info" />

         <p class="release-date">
            Released <b>{{ get_release_date() }}</b>
         </p>

         <p class="event">
            Part of the <b><RouterLink @click="eventbus.emit('set_info_visibility', false); eventbus.emit('nav_to', event_info.uuid)" :to="'/?event=' + event_info.uuid">{{ event_info ? event_info.name : "Loading..." }}</RouterLink></b> event
         </p>

         <p class="description">
            {{ track.description ? (track.description.length == 0 ? "No description available" : track.description) : "No description available" }}
         </p>

         <hr />

         <p class="stats">
            {{ track.plays }} plays
         </p>
      </div>
   </div>
</template>

<script setup>
import { defineProps, ref, onBeforeMount } from "vue"
import eventbus from "../eventbus"
import Track from "./TrackComponent.vue"
import { RouterLink } from "vue-router"

const props = defineProps([
   "track"
])
const event_info = ref(null)

const get_release_date = () => {
   if (!props.track.release_date) return "No date found"
   else {
      return new Date(props.track.release_date[0]._seconds * 1000).toLocaleDateString()
   }
}

onBeforeMount(async () => {
   const res = await fetch("/api/event", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         uuid: props.track.event
      })
   })

   if (res.ok) {
      event_info.value = (await res.json()).event
   } else {
      event_info.value = {
         name: "No event found."
      }
   }
})

</script>

<style scoped>
@media (max-width: 600px) {
   .track-info-box .album {
      width: 100%;
   }

   .track-info-box {
      height: calc(100% - 128px) !important;
      top: 0px !important;
   }
}

@media (max-height: 675px) {
   .track-info-box {
      height: calc(100% - 128px) !important;
      top: 0px !important;
   }
}

.track-info-box {
   position: fixed;
   top: 130px;
   left: 0;
   padding: 0 30px;
   width: 100%;
   height: calc(100% - 128px - 130px); /* - about the size of the bottom player - top header */

   background-color: white;
   box-sizing: border-box;

   overflow-y: auto;
}

.track-info {
   height: fit-content;
   margin-bottom: 256px;
   margin-top: 80px;
}

.header {
   display: flex;
   flex-direction: column;
   align-items: center;
}

.exit {
   position: fixed;
   color: white;
   font-size: 48px;
   background-color: lightcoral;
   cursor: pointer;
   margin-top: 30px;
   border-radius: 4px;
}

.exit:hover {
   background-color: pink;
}

.album {
   margin-top: 20px;
   width: 400px;
}

.artists {
   display: flex;
   margin-bottom: 20px;
}

.artists > p, .artists > a {
   margin: 0;
   font-weight: bold;
   font-size: 24px;
}

.artists > *:not(.artist-comma):not(:first-child) {
   margin-left: 6px;
}

.artist-comma {
   display: inline;
}
</style>
