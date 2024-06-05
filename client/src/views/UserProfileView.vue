<template>
   <hr />
   <p v-if="!user">Loading</p>
   <p v-else-if="typeof user === 'string'">{{user}}</p>
   <div class="user-profile" v-else>
      <h2>{{user.display_name}}</h2>
      <p v-if="user.display_name != user.username" class="username">also known as {{user.username}}</p>
      <p class="date">Joined {{ new Date(user.creation_date._seconds * 1000).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) }}</p>
      <p>{{user.display_name}} has listened to {{user.listens}} total tracks and has {{user.streams}} total streams on their music.</p>

      <Event v-if="event && event.tracks.length != 0" :event="event" />
      <p v-else>No published tracks</p>
   </div>
</template>

<script setup>
import { useRoute } from "vue-router"
import { onBeforeMount, ref } from "vue"
import { useStore } from "vuex"
import Event from "../components/EventComponent.vue"

const user = ref(null)
const event = ref(null)
const route = useRoute()
const store = useStore()

onBeforeMount(async () => {
   let res = await fetch("/api/user", {
      method: "post",
      headers: {
         'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: route.params.username })
   })

   if (res.ok) {
      user.value = (await res.json()).user

      // try to get the users tracks
      let res_tracks = await fetch("/api/tracks", {
         method: "post",
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({ username: route.params.username })
      })

      if (res_tracks.ok) {
         let tracks = (await res_tracks.json()).tracks
         event.value = {
            title: `${user.value.display_name}'s Tracks`,
            date: new Date(),
            desc: "",
            tracks: tracks
         }
         store.dispatch("setTracks", tracks)
      }
   } else {
      user.value = `User ${route.params.username} was not found`
   }
})
</script>

<style scoped>
h2 {
   margin: 0;
   font-size: 32px;
   font-weight: 900;
}
.date {
}

.username {
   margin: 0;
   font-style: italic;
}
</style>
