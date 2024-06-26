<template>
   <div class="dropdown-box" @click="toggle">
      <slot name="trigger"></slot>
      <div v-if="open" class="dropdown">
         <slot></slot>
      </div>
   </div>
</template>

<script setup>
import { ref, onMounted } from "vue"

const open = ref(false)

const toggle = (e) => { 
   e.stopPropagation()
   open.value = !open.value
}

onMounted(() => {
   document.addEventListener("click", () => {
      open.value = false
   })
})
</script>

<style scoped>
.dropdown-box {
   position: relative;
   display: flex;
   z-index: 51;
}

.dropdown {
   position: absolute;
   display: block;
   border: 1px solid black;
   padding: 8px;
   right: 0;
   top: calc(100% + 5px);
   background-color: white;
}

.dropdown > * {
   display: flex;
   flex-direction: row;
   align-items: center;
   white-space: nowrap;
   padding-right: 20px;
}

.dropdown > hr {
   border: none;
   height: 1px;
   background-color: black;
   margin: 8px;
}
</style>
