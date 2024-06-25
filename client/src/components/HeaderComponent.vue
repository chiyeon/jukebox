<template>
   <div class="header">
      <h1>ThatMyFavorite</h1>
      <div class="nav">
         <RouterLink to="/" title="Listen to tracks" class="link" style="gap: 0">
            <span class="material-symbols-rounded" style="display: flex"
               >music_note</span
            >
            <p>Listen</p>
         </RouterLink>
         <div class="space"></div>
         <RouterLink v-if="user && user.permissions >= 2" to="/s/admin"
            ><span class="material-symbols-rounded" style="display: flex"
               >terminal</span
            ></RouterLink
         >
         <RouterLink v-if="user" title="Upload Tracks" to="/upload"
            ><span class="material-symbols-rounded" style="display: flex"
               >upload</span
            ></RouterLink
         >
         <Dropdown v-if="user">
            <template #trigger>
               <img :src="user.icon" class="user-icon" />
            </template>
            <RouterLink
               :to="`/u/${user.username}`"
               class="dropdown-option"
               v-if="user"
               title="View User Profile"
            >
               <span class="material-symbols-rounded" style="display: flex"
                  >person</span
               >
               <p>View profile</p>
            </RouterLink>
            <hr />
            <a
               class="dropdown-option"
               title="Logout"
               v-if="user"
               @click="logout"
            >
               <span
                  class="material-symbols-rounded"
                  style="display: flex; color: lightcoral"
                  >logout</span
               >
               <p>Logout</p>
            </a>
         </Dropdown>
         <div class="link" v-if="!user">
            <span
               class="material-symbols-rounded"
               style="display: flex;"
               >login</span
            >
            <RouterLink to="/login">Login</RouterLink>
            <p>/</p>
            <RouterLink to="/register">Register</RouterLink>
         </div>
      </div>
   </div>
</template>

<script setup>
import { RouterLink } from "vue-router"
import { onBeforeMount, ref, computed } from "vue"
import { useStore } from "vuex"
import router from "../router"
import Dropdown from "./DropdownComponent.vue"

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
.header {
   padding-top: 20px;
   margin-bottom: 20px;
}

h1 {
   margin-top: 0;
}

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
   text-decoration: none;
   cursor: pointer;
}
a:hover {
   opacity: 0.7;
}

.link {
   display: flex;
   align-items: center;
   gap: 4px;
}

.link .material-symbols-rounded {
   font-size: 24px;
}

.user-icon {
   width: 36px;
   aspect-ratio: 1;
   border-radius: 100px;
   cursor: pointer;
}

.user-icon:hover {
   outline: 4px solid lightpink;
}

.material-symbols-rounded {
   font-size: 30px;
}

.dropdown-option .material-symbols-rounded {
   font-size: 24px;
}
</style>
