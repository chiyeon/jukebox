<template>
   <div class="header">
      <h1>jukebox</h1>
      <div class="nav">
         <RouterLink to="/">Listen</RouterLink>
         <div class="space"></div>
         <RouterLink v-if="user" to="/upload">Upload</RouterLink>
         <button v-if="user" @click="logout()">Logout</button>
         <RouterLink v-if="!user" to="/login">Login</RouterLink>
      </div>
   </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { onBeforeMount } from 'vue';
let user = undefined

onBeforeMount(async () => {
   // load from storage if we are there
   user = sessionStorage.getItem("user")
        if (user) user = JSON.parse(user)
        else {
            // otherwise try to retrieve
            let res = await fetch("http://localhost:8080/user", {
                method: "get",
                credentials: "include",
                // mode: "cors"
            })

            if (res.status == 200) {
                user = (await res.json()).user
                sessionStorage.setItem("user", JSON.stringify(user))
            }
        }
    })

    const logout = () => {
        user = undefined
        fetch("http://localhost:8080/logout", {
            credentials: "include",
            method: "post",
            // mode: "cors",
        })
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
</style>