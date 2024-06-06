<template>
  <div class="event">
    <template v-if="event.name">
      <hr />
      <h2>{{ event.name }}</h2>
      <div class="tags-box">
        <p class="tag" v-for="tag in event.tags" :key="tag">{{ tag }}</p>
      </div>
      <p class="date">{{ new Date(event.date).toLocaleDateString() }}</p>
      <p class="description">{{ event.desc }}</p>
    </template>
    <div class="tracks">
      <!--Track :track="track_header" :header=true /-->
      <Track
        v-for="track in event.tracks"
        :key="track.url"
        :track="track"
        :allowDelete="allowDelete"
      />
    </div>
  </div>
</template>

<script setup>
// to make this hold tracks only, we can just only pass tracks

import Track from "./TrackComponent.vue";
import { defineProps } from "vue";

const track_header = {
  artist: "Artist",
  title: "Title",
};

defineProps(["event", "allowDelete"]);
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

.tags-box {
   display: flex;
   flex-direction: row;
   gap: 4px;
   margin: 10px 0;
}

.tag {
   margin: 0;
   background-color: #e0e0e0;
   padding: 4px 8px;
   border-radius: 100px;
}
</style>
