<template>
   <div class="header">
      <h1>jukebox</h1>
      <div class="nav">
         <RouterLink to="/">Listen</RouterLink>
         <div class="space"></div>
         <RouterLink v-if="user" to="/upload">Upload</RouterLink>
         <a v-if="user" @click="logout()">Logout</a>
         <RouterLink v-if="!user" to="/login">Login</RouterLink>
      </div>
   </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { onBeforeMount, ref } from 'vue';
const user = ref(null)

onBeforeMount(async () => {
   // load from storage if we are there
   user.value = sessionStorage.getItem("user")
   if (user.value) user.value = JSON.parse(user.value)
   else {
      // otherwise try to retrieve
      let res = await fetch("/api/user", {
         method: "get",
         credentials: "include",
         // mode: "cors"
      })

      if (res.status == 200) {
         user.value = (await res.json()).user
         sessionStorage.setItem("user", JSON.stringify(user.value))
      }
   }
})

const logout = async () => {
   user.value = null
   sessionStorage.removeItem("user")
   await fetch("/api/logout", {
      credentials: "include",
      method: "post",
   }),
   window.location = "/"
}
</script>

<style scoped>
.nav {
   display: flex;
   flex-direction: row;
   gap: 20px;
}

.space {
   flex: 1;
}

button {
   outline: none;
}

a {
   color: black;
   text-decoration: none;
   cursor: pointer;
}
a:hover {
   opacity: 0.7;
}
</style>