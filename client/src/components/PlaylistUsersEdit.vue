<template>
   <div class="full-window" @click="emit('close')">
      <div class="edit-users" @click.stop="undefined">
         <span class="material-symbols-rounded icon close" @click.stop="emit('close')">close</span>
         <p>Add users to view this playlist. With <span class="material-symbols-rounded" style="font-size: 20px">edit_note</span> Edit permissions they can also add/delete tracks.</p>  

         <div class="users-box">
            <span class="row">
               <span class="material-symbols-rounded icon">person</span>
               <p class="header">Username</p>
            </span>
            <span class="row">
               <span class="material-symbols-rounded icon">edit_note</span>
               <p class="header">Can Edit</p>
            </span>
            <p class="header">Remove</p>
            <template
               v-for="(user, index) in users"
               :key="index"
            >
               <input type="text" class="username" placeholder="Artist name" v-model="users[index].username" />
               <input class="edit" type="checkbox" v-model="users[index].edit" />
               <span class="material-symbols-rounded icon delete" @click="users.splice(index, 1)">delete</span>
            </template>
         </div>
         <button class="add-user" @click="users.length < 7 && users.push(User('', 1, 0))">
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

const User = (username, view, edit) => {
   return {
      username, view, edit
   }
}

const save_edited_users = async () => {
   loading.value = true
   // turn back into editors and viewers lists
   let editors = []
   let viewers = []

   // push original back first
   editors.push(user.value.username)
   viewers.push(user.value.username)

   // parse list
   for (let i = 0; i < users.value.length; i++) {
      let user = users.value[i] 
      if (user.username.length == 0) {
         loading.value = false
         return alert("Invalid username")
      }
      // all are viewers
      viewers.push(user.username)
      // not all are editors
      if (user.edit) {
         editors.push(user.username)
      }
   }

   // basic checks
   if (editors.length > 8) {
      loading.value = false
      return alert("Too many editors")
   }

   let res = await fetch("/api/playlist_edit", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({ uuid: props.uuid, editors, viewers }),
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
   // ignore first one (owner)
   for (let i = 1; i < props.editors.length; i++) {
      users.value.push(User(props.editors[i], 1, 1))
   }

   for (let i = 1; i < props.viewers.length; i++) {
      if (!props.editors.includes(props.viewers[i])) {
         // only add viewers that werent already included in editors list
         users.value.push(User(props.viewers[i], 1, 0))
      }
   }
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
   width: 600px;
}

.icon {
   user-select: none;
   cursor: pointer;
}

.close:hover {
   color: darkred;
}

.users-box {
   display: grid;
   grid-template-columns: 2fr 1fr 1fr;
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

.edit {
   width: 16px;
   height: 16px;
   margin: 0;
   margin-top: 4px;
   cursor: pointer;
}

.username {
   margin: 0;
   width: 80%;
   border: none;
   background: none;
   padding: 0;
   font-size: 14px;
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
