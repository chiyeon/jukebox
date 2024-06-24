<template>
    <div class="lyrics-box">
        <p class="lyrics">
            {{ lyrics }}
        </p>
    </div>
</template>

<script setup>
import { defineProps } from "vue"

defineProps([ "lyrics" ])
</script>

<style scoped>
@media (max-width: 600px) {
    .lyrics-box .lyrics {
        font-size: 20px;
    }
}
.lyrics-box {
    overflow-y: auto;

    position: fixed;
    bottom: 0;
    left: 0;
    padding: 0 30px;
    width: 100%;

    height: 100vh;
    height: 100dvh;

    padding-bottom: 300px;

    background-color: white;
    box-sizing: border-box;
}
.lyrics {
    white-space: pre-line;
    font-size: 32px;
    font-weight: bold;
    color: cadetblue;
}
</style>