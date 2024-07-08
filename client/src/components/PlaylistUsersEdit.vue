<template>
   <div class="full-window" @click="emit('close')">
      <div class="edit-users" @click.stop="undefined">
         <span class="material-symbols-rounded icon close" @click.stop="emit('close')">close</span>
         <p>Add users to add/remove tracks</p>  

         <div class="users-box">
            <div class="user">
               <span class="row">
                  <span class="material-symbols-rounded icon">person</span>
                  <p class="header">Username</p>
               </span>
               <p class="header">Remove</p>
            </div>
            <hr />
            <template
               v-for="(user, index) in users.slice(1)"
               :key="index"
            >
               <div class="user">
                  <input type="text" class="username" placeholder="Artist name" v-model="users[index+1]" />
                  <span class="material-symbols-rounded icon delete" @click="users.splice(index+1, 1)">delete</span>
               </div>
            </template>
         </div>
         <button class="add-user" @click="users.length < 7 && users.push('')">
            <span class="material-symbols-rounded icon">person_add</span>
            <p>Add Listener</p>
         </button>

         <button class="submit" @click="save_edited_users">Save Changes</button>
      </div>
   </div>
   <Loading v-if="loading" />
</template>

<script setup>
import Loading from "./LoadingComponent.vue"
import { defineEmits, defineProps, onMounted, ref, computed } from "vue"
import { useStore } from "vuex"

const store = useStore()

const emit = defineEmits([ "close", "reload" ])
const props = defineProps([ "editors", "viewers", "uuid" ])

const user = computed(() => store.state.user) 
const users = ref([])

const loading = ref(false)

const save_edited_users = async () => {
   loading.value = true
   // basic checks
   if (users.value.length > 8) {
      loading.value = false
      return alert("Too many editors")
   }

   for (let i = 0; i < users.value.length; i++) {
      if (users.value[i].length == 0) return alert("Invalid name")
   }

   let res = await fetch("/api/playlist_edit", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({ uuid: props.uuid, editors: users.value }),
      credentials: "include",
   })

   if (res.ok) {
      emit('close')
      emit('reload')
   } else {
      alert((await res.json()).message)
   }

   loading.value = false
}

onMounted(() => {
   users.value = props.editors
})
</script>

<style scoped>
.full-window {
   position: fixed;
   width: 100vw;
   height: 100vh;
   left: 0;
   top: 0;
   display: flex;
   justify-content: center;
   align-items: center;
   background-color: #30303090;  
   z-index: 303;
}

.edit-users {
   padding: 20px;
   margin: 20px;
   background-color: #e7e7e7;
   width: 300px;
}

.icon {
   user-select: none;
   cursor: pointer;
}

.close:hover {
   color: darkred;
}

.users-box {
   display: flex;
   flex-direction: column;
}

.row {
   display: flex;
   flex-direction: row;
   align-items: center;
}

.header {
   font-weight: bold;
}

.user {
   display: flex;
   flex-direction: row;
   align-items: center;
}

.username {
   margin: 0;
   width: 80%;
   border: none;
   background: none;
   padding: 4px;
   font-size: 16px;
   margin-right: 10px;
}

.user > *:first-child {
   flex: 1;
}

.delete {
   color: darkred;
}

.delete:hover {
   color: coral;
}

.add-user {
   background: none;
   border: none;
   display: flex;
   flex-direction: row;
   justify-content: start;
   align-items: center;
   gap: 8px;
   width: 128px;
   margin-top: 10px;
   cursor: pointer;
}

.add-user:hover > * {
   color: coral;
}

.add-user p {
   margin: 0;
}

.submit {
   margin-top: 10px;
   padding: 10px;
   border-radius: 8px;
   border: none;
   background-color: #d0d0d0;
   cursor: pointer;
}
.submit:hover {
   background-color: coral;
}
</style>
