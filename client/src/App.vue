<template>
  <div class="horizontal-contents">
    <div class="page-contents">
      <Header />
      <RouterView />
    </div>

    <Transition>
      <Queue v-if="open_queue" />
    </Transition>
  </div>
  <PlayerMini :queue="queue" @toggle_queue="toggle_queue" />
</template>

<script setup>
import { RouterView } from "vue-router";
import { ref, computed } from "vue";
import { useStore } from "vuex";
import Header from "./components/HeaderComponent.vue";
import PlayerMini from "./components/PlayerMiniComponent.vue";
import Queue from "./components/QueueComponent.vue";

const store = useStore();

const queue = computed(() => store.state.queue);
const afterQueue = computed(() => store.state.afterQueue);
const open_queue = ref(false);

const toggle_queue = () => {
  open_queue.value = !open_queue.value;
};
</script>

<style scoped>
.horizontal-contents {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  overflow-y: hidden;
   overflow-x: hidden;
}

.page-contents {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 20px; /* for the scrollbar */
}

main {
  padding-bottom: 200px;
}

.v-enter-active,
.v-leave-active {
   transition: width 500ms ease, opacity 500ms ease, padding-left 500ms ease;
   overflow-x: hidden;
}

.v-enter-from,
.v-leave-to {
   width: 0;
   opacity: 0;
   padding-left: 0;
}

@media (max-width: 550px) {
.horizontal-contents .page-contents {
   padding-right: 0px;
}
}
</style>
