<template>
   <div class="dropdown-box" @click.stop="toggle">
      <slot name="trigger"></slot>
      <div v-if="open" class="dropdown">
         <slot></slot>
      </div>
   </div>
</template>

<script setup>
import { ref, onMounted } from "vue"

const open = ref(false)
let closing = false

const toggle = (e) => { 
   if (closing) {
      closing = false
      return
   }
   e.stopPropagation()
   open.value = !open.value
}

onMounted(() => {
   document.addEventListener("click", (e) => {
      if (!open.value) return
      open.value = false
      closing = true
   }, true)
})
</script>

<style scoped>
.dropdown-box {
   position: relative;
   display: flex;
}

.dropdown {
   position: absolute;
   display: block;
   border: 1px solid var(--background-3);
   padding: 8px;
   right: 0;
   top: calc(100% + 5px);
   background-color: var(--background-2);
   z-index: 51;
}

.dropdown > * {
   display: flex;
   flex-direction: row;
   align-items: center;
   white-space: nowrap;
   padding-right: 20px;
   gap: 4px;
}

.dropdown > hr {
   border: none;
   height: 1px;
   background-color: var(--background-3);
   margin: 8px;
}

.dropdown > *:hover {
   opacity: 0.7;
}
</style>
