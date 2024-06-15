<template>
   <h1>Admin Page</h1>

   <div v-if="mode == 'events'">
      <hr />
      <h2>New Event</h2>

      <div class="form">
         <label>Title</label>
         <input ref="event_title_ref" type="text" placeholder="The Month of May 3" required />

         <label>Description</label>
         <textarea ref="event_description_ref" placeholder="Its the month of may..." required />

         <label>Tags</label>
         <input ref="event_tags_ref" type="text" placeholder="24 hours,Collaborative" />

         <button @click="submit_new_event">Submit</button>
      </div>
   </div>
</template>

<script setup>
import { ref } from "vue"

const event_title_ref = ref(null)
const event_description_ref = ref(null)
const event_tags_ref = ref(null)

const mode = ref("events")

const submit_new_event = async () => {
   let newevent = {
      name: event_title_ref.value.value,
      desc: event_description_ref.value.value,
      tags: event_tags_ref.value.value ? event_tags_ref.value.value.split(",") : [],
   }

   let res = await fetch("/api/eventcreate", {
      method: "post",
      credentials: "include",
      headers: {
         "Content-Type": "application/json"
      },
      body: JSON.stringify(newevent)
   })

   if (res.ok) {
      return alert("Uploaded successfully")
   }
   alert("Failed to upload")
}
</script>

<style scoped>
.form {
   display: flex;
   flex-direction: column;
}

input, textarea {
   margin-bottom: 10px;
}
</style>
