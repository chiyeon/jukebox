<template>
   <div class="header">
      <h1>jukebox</h1>
      <div class="nav">
         <RouterLink to="/">Listen</RouterLink>
         <div class="space"></div>
         <RouterLink v-if="user" to="/upload">Upload</RouterLink>
         <a v-if="user" @click="logout()">Logout</a>
         <RouterLink :to="`/u/${user.username}`" class="user-info" v-if="user">
            <p>{{user.username}}</p>
            <img :src="user.icon" />
         </RouterLink>
         <RouterLink v-if="!user" to="/login">Login</RouterLink>
      </div>
   </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { onBeforeMount, ref, computed } from 'vue';
import { useStore } from "vuex"
import router from "../router"

const store = useStore()

const user = computed(() => store.state.user)

onBeforeMount(async () => {
   if (!user.value) {
      // try to see if we have a key, new session but saved login
      let res = await fetch("/api/userbytoken", {
         method: "get",
         credentials: "include",
      })

      if (res.status == 200) {
         store.dispatch("setUser", (await res.json()).user)
      }
   }
})

const logout = async () => {
   let res = await fetch("/api/logout", {
      credentials: "include",
      method: "post",
   })

   if (res.ok) {
      store.dispatch("setUser", null)
      router.push("/")
   }

}
</script>

<style scoped>
.nav {
   display: flex;
   flex-direction: row;
   gap: 20px;
   align-items: center;
}

.space {
   flex: 1;
}

button {
   outline: none;
}

p {
   margin: 0;
}

a {
   color: black;
   text-decoration: none;
   cursor: pointer;
}
a:hover {
   opacity: 0.7;
}

.user-info {
   display: flex;
   align-items: center;
   cursor: pointer;
}

.user-info:hover {
   opacity: 0.7;
}

.user-info img {
   width: 32px;
   aspect-ratio: 1.0;
   margin-left: 10px;
   border-radius: 100px
}
</style>
