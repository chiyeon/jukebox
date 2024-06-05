<template>
  <Header />
  <RouterView />
  <PlayerMini :queue="queue"/>

  <div class="queue">
    <h2>queue</h2>
    <p
      v-for="track in queue"
      :key="track.url"
    >{{ track.artist_display_name }} - {{ track.title }}</p>
    <hr />
    <h2>Up next</h2>
    <p
      v-for="track in afterQueue"
      :key="track.url"
    >{{ track.artist_display_name }} - {{ track.title }}</p>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import { ref, computed } from "vue"
import { useStore } from "vuex"
import Header from "./components/HeaderComponent.vue"
import PlayerMini from "./components/PlayerMiniComponent.vue"

const store = useStore()

const queue = computed(() => store.state.queue)
const afterQueue = computed(() => store.state.afterQueue)
</script>

<style scoped>
.queue {
   margin-top: auto;
}
</style>
