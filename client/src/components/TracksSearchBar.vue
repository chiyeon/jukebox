<template>
   <div class="search-box">
      <input type="text" placeholder="Search tracks" v-model="query" />
   </div>
</template>

<script setup>
import { useStore } from "vuex"
import { computed, defineEmits, defineProps, watch, ref } from "vue"
import Fuse from "fuse.js"

const emit = defineEmits(["onSearch"])
const props = defineProps(["nullOnEmpty"]) // emit null on empty query instead of full list
const store = useStore()

const tracks = computed(() => store.state.tracks)
const query = ref("")
const score_threshold = 0.5
const search_opts = {
   includeScore: true,
   keys: [
      { name: "title", weight: 0.5 },
      { name: "artist", weight: 0.35 },
      { name: "artists", weight: 0.15 },
   ],
}

let fuse = new Fuse(tracks.value, search_opts)

watch(
   [tracks, query],
   () => {
      if (query.value.length <= 0 && props.nullOnEmpty) {
         emit("onSearch", null)
         return
      }

      fuse = new Fuse(tracks.value, search_opts)
      let filtered = query.value
         ? fuse
              .search(query.value)
              .filter((q) => q.score <= score_threshold)
              .map((q) => q.item)
         : tracks.value
      emit("onSearch", filtered)
   },
   { immediate: true }
)
</script>

<style scoped>
input {
   padding: 8px;
   border-radius: 4px;
   border: none;
   font-size: 14px;
}

.search-box {
   margin: 14px 0;
   display: flex;
   justify-content: flex-end;
}
</style>
