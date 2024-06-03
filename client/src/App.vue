<template>
  <Header />
  <RouterView />
  <PlayerMini :queue="queue"/>

  <div>
    <h2>queue</h2>
    <p
      v-for="track in queue"
      :key="track.url"
    >{{ track.artist }} - {{ track.title }}</p>
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
</script>

<style scoped>

</style>
