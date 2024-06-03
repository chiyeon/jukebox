<template>
  <main>
    <div class="tracks">
      <Event
        v-for="event in events"
        :key="event.date"
        :event="event"
      />
    </div>
  </main>
</template>

<script setup>
import Event from "../components/EventComponent.vue"
import { onBeforeMount, ref } from "vue";

const events = ref([])

onBeforeMount(async () => {
  events.value = (await (await fetch("/api/events", {
      method: "GET",
   })).json()).events
})
</script>
