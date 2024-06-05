<template>
    <div class="event">
         <template v-if="event.name">
        <hr />
        <h2>{{event.name}}</h2>
        <p class="date">{{new Date(event.date).toLocaleDateString()}}</p>
        <p class="description">{{event.desc}}</p>
         </template>
        <div class="tracks">
            <Track :track="track_header" :header=true />
            <Track 
                v-for="track in event.tracks"
                :key="track.url"
                :track="track"
            />
        </div>
    </div>
</template>

<script setup>
// to make this hold tracks only, we can just only pass tracks

import Track from "./TrackComponent.vue"
import { defineProps } from "vue"

const track_header = {
    artist: "Artist",
    title: "Title"
}

defineProps([
    "event"
])
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
    margin-top: 2px;
}

.tracks {
    display: flex;
    flex-direction: column;
}
</style>
