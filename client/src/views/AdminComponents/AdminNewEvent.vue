<template>
   <div class="new-event">
      <h2>New Event</h2>
      <p>By default, events open in preview mode, with submissions closed. They will be highlighted at the top of the page but won't allow uploads until opened.</p>
      <p>Descriptions <strong>support HTML</strong>, but be warned! EVERYTHING must be in HTML if one thing is. (wrap everything in a p tag if needed)</p>

      <hr />

      <div class="form">
         <input
            class="title"
            v-model="event_title"
            type="text"
            placeholder="Title"
            required
         />

         <textarea
            v-model="event_description"
            placeholder="Description"
            required
         />

         <input
            v-model="event_tags"
            type="text"
            placeholder="list,of,tags"
         />

         <span class="row">
            <input type="checkbox" v-model="event_open" />
            <p>{{ event_open ? "Open" : "Closed"}} Event</p>
         </span>

         <span class="row">
            <input type="checkbox" v-model="event_featured" />
            <p>{{ event_featured ? "Featured" : "Not featured"}} Event</p>
         </span>

         <button @click="submit_new_event">Submit</button>
      </div>
   </div>
</template>

<script setup>
import { ref, onBeforeMount } from "vue"

const event_title = ref("")
const event_description = ref("")
const event_tags = ref("")
const event_open = ref(false)
const event_featured = ref(false)

const mode = ref("events")

const events = ref([])

const submit_new_event = async () => {
   let newevent = {
      name: event_title.value,
      desc: event_description.value,
      tags: event_tags.value
         ? event_tags.value.split(",")
         : [],
      open: event_open.value,
      featured: event_featured.value
   }

   let res = await fetch("/api/eventcreate", {
      method: "post",
      credentials: "include",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify(newevent),
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
   align-items: baseline;
}

input[type="text"],
textarea {
   margin-bottom: 10px;
   width: 100%;
   padding: 0;
   border: none;
   font-size: 16px;
}

textarea {
   height: calc(24px * 5);
}

input.title {
   font-size: 28px;
   font-weight: bold;
}

hr {
   margin-top: 40px;
}

.row {
   display: flex;
   flex-direction: row;
}

.row p {
   margin: 0;
}
</style>
