<template>
   <div class="nav">
      <div
         v-for="mode in modes"
         :key="mode.id"
         :class="{ 'nav-button': true, selected: mode.id == current_mode }"
         @click="current_mode = mode.id"
      >
         <span class="material-symbols-rounded icon">{{ mode.icon }}</span>
         <p>{{ mode.title }}</p>
      </div>
   </div>
   <AdminNewEvent v-if="current_mode == 'new-event'" />
   <div v-else-if="current_mode == 'edit-events'">
      <h2>Events</h2>
      <p>View & edit events here. Deleting an event <strong>will delete all track data & album files from storage/db</strong>. Opening/closing events by editing won't affect the dates and can be done freely. To set the final date, use the Close Event button.</p>
      <AdminEvent
         v-for="event in events"
         :key="event.uuid"
         class="event"
         :event="event"
      />
   </div>
</template>

<script setup>
import { ref, onBeforeMount } from "vue"
import AdminEvent from "./AdminComponents/AdminEvent.vue"
import AdminNewEvent from "./AdminComponents/AdminNewEvent.vue"

const modes = [
   { id: "new-event", title: "New Event", icon: "note_add" },
   { id: "edit-events", title: "Edit Events", icon: "edit_note" },
]
const current_mode = ref("new-event")

const events = ref([])

onBeforeMount(async () => {
   let res = await fetch("/api/events", {
      method: "get",
      credentials: "include",
   })

   if (res.ok) {
      events.value = (await res.json()).events
   }
})
</script>

<style scoped>
.nav-button:hover p,
.nav-button.selected p {
   text-decoration: underline;
}

.nav-button.selected {
   color: coral;
}

.nav-button {
   cursor: pointer;
   display: flex;
   align-items: center;
}

.nav-button .icon {
   font-size: 24px;
}

.nav {
   display: flex;
   gap: 10px;
}
</style>
