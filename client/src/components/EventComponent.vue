<template>
   <div class="event" :id="event.uuid">
      <template v-if="event.name">
         <hr />
         <p class="date">{{ get_event_date() }}</p>
         <h2>{{ event.name }}</h2>
         <div class="tags-box">
            <p class="tag" v-for="tag in event.tags" :key="tag">{{ tag }}</p>
         </div>
         <div class="description" v-html="event.desc"></div>
      </template>
      <div class="tracks" v-if="event.tracks.length != 0">
         <!--Track :track="track_header" :header=true /-->
         <Track
            v-for="track in event.tracks"
            :key="track.url"
            :track="track"
            :type="get_type(track)"
         />
      </div>
      <p class="hint" v-else-if="!event.open && event.featured">Track submissions will open soon.</p>
      <p v-else-if="event.tracks.length == 0"><i>No tracks found</i></p>
   </div>
</template>

<script setup>
// to make this hold tracks only, we can just only pass tracks

import Track from "./TrackComponent.vue"
import { defineProps } from "vue"

const props = defineProps(["event", "allowDelete", "user", "preview"])

const get_type = (track) => {
   if (props.allowDelete) {
      if (track.artist == props.user.username) {
         return "allowedit"
      } else if (track.artists.includes(props.user.username)) {
         return "allowremove"
      } else {
         return undefined
      }
   }
}

const get_event_date = () => {
   if (!props.event.date) return "No date"
   if (props.event.date.length == 1) {
      return new Date(props.event.date[0]._seconds * 1000).toLocaleDateString()
   } else {
      return `${new Date(
         props.event.date[0]._seconds * 1000
      ).toLocaleDateString()} - ${new Date(
         props.event.date[1]._seconds * 1000
      ).toLocaleDateString()}`
   }
}
</script>

<style scoped>
hr {
   margin-top: 30px;
}

h2 {
   margin: 0;
}

.date {
   font-style: italic;
   margin: 0 2px;
}

.tracks {
   display: flex;
   flex-direction: column;
}

.tags-box {
   display: flex;
   flex-direction: row;
   gap: 4px;
   margin: 10px 0;
   flex-wrap: wrap;
}

.tag {
   margin: 0;
   background-color: #e0e0e0;
   padding: 4px 6px;
   border-radius: 100px;
   white-space: nowrap;
}

.description {
   margin: 20px 0;
}

.description p {
   margin: 0;
   white-space: break-spaces;
}

.hint {
   font-style: italic;
   margin-left: 10px;
}
</style>
