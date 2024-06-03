<template>
   <hr />
   <p v-if="!user">Loading</p>
   <p v-else-if="typeof user === 'string'">{{user}}</p>
   <div class="user-profile" v-else>
      <h2>{{user.display_name}}</h2>
      <p v-if="user.display_name != user.username" class="username">also known as {{user.username}}</p>
      <p class="date">Joined {{ new Date(user.creation_date._seconds * 1000).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) }}</p>
      <p>{{user.display_name}} has listened to {{user.listens}} total tracks and has {{user.streams}} total streams on their music.</p>
   </div>
</template>

<script setup>
import { useRoute } from "vue-router"
import { onBeforeMount, ref } from "vue"

const user = ref(null)
const route = useRoute()

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
      console.log(user.value)
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
