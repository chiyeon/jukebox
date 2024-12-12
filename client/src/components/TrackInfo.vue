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
            Released {{ get_release_date() }}
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
import { defineProps } from "vue"
import eventbus from "../eventbus"
import Track from "./TrackComponent.vue"

const props = defineProps([
   "track"
])

const get_release_date = () => {
   if (!props.track.release_date) return "No date found"
   else {
      return new Date(props.track.release_date[0]._seconds * 1000).toLocaleDateString()
   }
}

</script>

<style scoped>
@media (max-width: 600px) {
   .track-info-box .album {
      width: 100%;
   }
}
.track-info-box {
   position: fixed;
   top: 0;
   left: 0;
   padding: 0 30px;
   width: 100%;
   height: calc(100% - 128px); /* about the size of the bottom player */

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
