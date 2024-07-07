<template>
   <div class="full-window" @click="emit('close')">
      <div class="panel" @click.stop="">
         <p>{{ message ? message : "Confirm Delete?" }}</p>
         <span class="row">
            <div class="option cancel" @click="emit('close')">
               <span class="material-symbols-rounded icon">cancel</span>
               <p>{{ cancelText ? cancelText : "Cancel" }}</p>
            </div>
            <div class="option delete" @click="emit('delete'); emit('close')">
               <span class="material-symbols-rounded icon">delete_forever</span>
               <p>{{ deleteText ? deleteText : "Confirm Delete" }}</p>
            </div>
         </span>
      </div>
   </div>
</template>

<script setup>
import { defineEmits, defineProps } from "vue"

const emit = defineEmits([ "close", "delete" ])
defineProps([ "message", "cancelText", "deleteText" ])
</script>

<style scoped>
.full-window {
   position: fixed;
   width: 100vw;
   height: 100vh;
   top: 0;
   left: 0;
   background-color: #303030b0;
   z-index: 303;

   display: flex;
   justify-content: center;
   align-items: center;
}

.panel {
   width: fit-content;
   margin: 20px;
   background-color: #e7e7e7;
   padding: 20px;

   display: flex;
   flex-direction: column;
   gap: 20px;
   align-items: center;
}

.icon {
   user-select: none;
}

.option {
   display: flex;
   flex-direction: row;
   justify-content: center;
   align-items: center;

   gap: 8px;
   cursor: pointer;

   flex: 1;
   min-width: 175px;

   background-color: #b0b0b0;
   border-radius: 10px;

   color: white;
   user-select: none;
}

.row {
   display: flex;
   flex-direction: row;
   gap: 20px;
   flex-wrap: wrap;
}

.cancel:hover {
   background-color: #858585;
}

.delete {
   color: darkred;
}

.delete:hover {
   background-color: darkred;
   color: white;
}
</style>
