<template>
   <div class="event">
      <hr />
      <template v-if="!editing">
         <h3 class="title">{{ event.name }}</h3>
         <p>{{ event.uuid }}</p>
         <p>{{ event.open ? "Open" : "Closed" }} Event</p>
         <p>{{ event.featured ? "Featured" : "Not featured" }} Event</p>
         <p>{{ new Date(event.date[0]._seconds * 1000).toLocaleString() }}</p>
         <p>{{ event.tags.join(", ") }}</p>
         <p class="description">{{ event.desc }}</p>
         <div class="tracks">
            <div v-for="track in event.tracks" :key="track.uuid" class="track" v-if="event.tracks.length != 0">
               <p class="uuid">{{ track.uuid }}</p>
               <p><strong>{{ track.title }}</strong> {{ track.artists.join(", ") }}</p>
            </div>
            <p v-else>No tracks</p>
         </div>
      </template>
      <template v-else>
         <input class="title" type="text" v-model="event.name" />
         <p>{{ event.uuid }}</p>
         <span class="row">
            <input type="checkbox" v-model="event.open" />
            <p>{{ event.open ? "Open" : "Closed" }} Event</p>
         </span>
         <span class="row">
            <input type="checkbox" v-model="event.featured" />
            <p>{{ event.featured ? "Featured" : "Not Featured" }} Event</p>
         </span>
         <p>{{ new Date(event.date[0]._seconds * 1000).toLocaleString() }}</p>
         <input type="text" v-model="event.new_tags" />
         <textarea class="description" v-model="event.desc" />
         <div class="tracks">
            <p>Tracks:</p>
            <div v-for="track in event.tracks" :key="track.uuid" class="track">
               <p class="uuid">{{ track.uuid }}</p>
               <p><strong>{{ track.title }}</strong> {{ track.artists.join(", ") }}</p>
            </div>
         </div>
      </template>

      <span class="buttons">
         <button @click="editing = true" class="button" v-if="!editing">
            <span class="material-symbols-rounded icon">edit</span>
            <p>Edit</p>
         </button>
         <button @click="editing = false" class="button" v-if="editing">
            <span class="material-symbols-rounded icon" style="color: darkred">cancel</span>
            <p style="color: darkred">Cancel Edit</p>
         </button>
         <button @click="edit_event" class="button" v-if="editing" style="background-color: darkseagreen">
            <span style="color: white" class="material-symbols-rounded icon">check_circle</span>
            <p style="color: white">Submit Edits</p>
         </button>

         <button @click="close_event" class="button">
            <span class="material-symbols-rounded icon">calendar_clock</span>
            <p>Close Event</p>
         </button>

         <button
            @click="deleting = false"
            class="delete button"
            style="color: black"
            v-if="deleting"
         >
            <span class="material-symbols-rounded icon">cancel</span>
            <p>Cancel Delete</p>
         </button>
         <button @click="delete_event" class="button" :style="deleting ? { backgroundColor: 'darkred' } : {}">
            <template v-if="!deleting">
               <span class="material-symbols-rounded icon" style="color: darkred">delete</span>
               <p style="color: darkred">Delete Event</p>
            </template>

            <template v-else>
               <span class="material-symbols-rounded icon" style="color: white">delete_forever</span>
               <p style="color: white">Delete Forever</p>
            </template> 
         </button>
      </span>
   </div>
</template>

<script setup>
import { defineProps, ref, onMounted } from "vue"

const deleting = ref(false)
const props = defineProps(["event"])
const editing = ref(false)

const delete_event = async () => {
   if (!deleting.value) {
      deleting.value = true
      return
   }

   let res = await fetch("/api/eventdelete", {
      method: "post",
      credentials: "include",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({ uuid: props.event.uuid }),
   })

   if (res.ok) {
      return alert("Deleted successfully")
   }

   deleting.value = false
}

const edit_event = async (uuid) => {
   // first set tags & remove new_tags
   let updated_event = { name: props.event.name, open: props.event.open, featured: props.event.featured, desc: props.event.desc, date: props.event.date }
   updated_event.tags = props.event.new_tags.split(",")

   let res = await fetch("/api/eventupdate", {
      method: "post",
      credentials: "include",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         changes: updated_event,
         uuid: props.event.uuid
      })
   })

   if (res.ok) {
      alert("Updated successfully")
   } else {
      let msg = (await res.json()).message
      alert("Error: " + msg)
   }

   editing.value = false
}

const close_event = async () => {
   let res = await fetch("/api/eventclose", {
      method: "post",
      credentials: "include",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({ uuid: props.event.uuid })
   })

   if (res.ok) {
      return alert("Closed successfully")
   } else {
      return alert("Error: " + (await res.json()).message)
   }
}

onMounted(() => {
   props.event.new_tags = props.event.tags.join(",")
})
</script>

<style scoped>
.buttons {
   display: flex;
   flex-direction: row;
   gap: 10px;
}

.event {
   display: flex;
   gap: 10px;
   flex-direction: column;
   margin-bottom: 40px;
}

p {
   margin: 0;
}

h3 {
   margin: 0;
}

.tracks {
   display: flex;
   flex-direction: column;
   gap: 4px;
   justify-content: center;
   align-items: baseline;
}

.track {
   background-color: #e7e7e7;
   border-radius: 10px;
   padding: 6px 12px;
   display: flex;
   flex-direction: row;
   gap: 10px;
   align-items: center;
}

.uuid {
   font-family: monospace;
   font-size: 16px;
}

.button {
   border: none;
   cursor: pointer;

   display: flex;
   justify-content: center;
   align-items: center;
   gap: 4px;
   padding: 6px 12px;
   border-radius: 10px;
}


.title {
   font-weight: bold;
   font-size: 24px !important;
}

input[type="text"],
textarea {
   padding: 0;
   border: none;
   width: 100%;
   color: teal;
   resize: vertical;
   font-size: 16px;
}

.description {
   white-space: preserve; 
   max-height: 300px;
}

.row {
   display: flex;
   flex-direction: row;
}
</style>
