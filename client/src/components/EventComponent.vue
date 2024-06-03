<template>
    <div class="event">
        <hr />
        <h2>{{event.name}}</h2>
        <p class="date">{{new Date(event.date).toLocaleDateString()}}</p>
        <p class="description">{{event.desc}}</p>

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
