<template>
   <hr />
   <h3>{{event.name}}</h3>
   <p>Date: {{new Date(event.date[0]._seconds * 1000).toLocaleString()}}</p>
   <p>Tags: {{event.tags.join(", ")}}</p>
   <p>Description: {{event.desc}}</p>
   <div class="tracks">
      <p>Tracks:</p>
      <p
         v-for="track in event.tracks"
         :key="track.uuid"
      >{{track.title}} by {{track.artists.join(", ")}}</p>
   </div>

   <button @click="deleting = false" class="delete" style="color: black" v-if="deleting">Cancelll!!!!</button>
   <button @click="delete_event(event.uuid)" class="delete">{{ deleting ? "Confirm Delete" : "Delete Event" }}</button>
</template>

<script setup>
import { defineProps, ref } from "vue"

const deleting = ref(false)
const props = defineProps([ "event" ])

const delete_event = async (uuid) => {
   if (!deleting.value) {
      deleting.value = true
      return
   }

   let res = await fetch("/api/eventdelete", {
      method: "post",
      credentials: "include",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify({ uuid: props.event.uuid })
   })

   if (res.ok) {
      return alert("Deleted successfully")
   }

   deleting.value = false
}

</script>

<style scoped>

 p {
   margin: 0;
}

 h3 {
   margin: 0;
}

.tracks p:not(:first-child) {
   display: inline-block;
   margin-right: 10px;
   margin-bottom: 4px;

   background-color: darkgray;
   border-radius: 100px;
   padding: 2px 8px;
   color: white;
}

.delete {
   background: none;
   border: none;
   color: darkred;
   cursor: pointer;
}
</style>
