<template>
    <div class="edit-box">
        <form>
            <label for="title">Title</label>
            <input ref="title_ref" type="text" placeholder="The_NewStuff" v-model="track.title" required>

            <label for="artists">Artists<p class="tag">(optional)</p></label>
            <input type="text" class="artist" value="You" disabled>
            <p class="tag" v-if="track.artists.length != 0" style="margin-top: 6px; margin-bottom: 4px;">Enter artist
                USERNAME</p>
            <span class="artist-entry" v-for="(artist, index) in track.artists.slice(1)" :key="index">
                <input class="artist" type="text" v-model="track.artists[index+1]" placeholder="a very cool person" />
                <span class="material-symbols-rounded remove-artist" @click="remove_artist(index + 1)">cancel</span>
            </span>
            <span class="new-artist-box" @click="add_artist" v-if="track.artists.length < 8">
                <span class="material-symbols-rounded">person_add</span>
                <p>Add Artist</p>
            </span>

            <label for="lyrics">lyrics<p class="tag">(optional)</p></label>
            <textarea ref="lyrics_ref" placeholder="there's a light over the ocean
 ..." v-model="track.lyrics"></textarea>

            <label for="album">Album Cover<p class="tag">(optional)</p></label>
            <input @input="emit_album_cover" type="file" accept=".png,.jpeg,.jpg,.gif,.bmp,.tiff,.webp">
        </form>
    </div>
</template>
 
<script setup>
import { ref, defineProps, onBeforeUnmount, defineEmits } from "vue"
import { compress_image } from "../utils/image.js"

const emit = defineEmits([ "selectFile" ])
const props = defineProps([ "track" ])
const track = ref(props.track)
const old_track = { 
    title: props.track.title,
    lyrics: props.track.lyrics,
    artists: [ ...props.track.artists ]
}

onBeforeUnmount(() => {
    // must be manual
    track.value.title = old_track.title
    track.value.lyrics = old_track.lyrics
    track.value.artists = old_track.artists
})

const add_artist = () => {
    if (track.value.artists.length >= 7) return alert("Maximum number of artists reached!")
    track.value.artists.push("")
}

const remove_artist = (index) => {
    track.value.artists.splice(index, 1)
}

const emit_album_cover = async (e) => {
   let orig = e.currentTarget.files[0]
   let album = await compress_image(orig, 512, 0.39)
   console.log(`Compressed album from ${orig.size / 1024}kb to ${album.size / 1024}kb.`)
   emit("selectFile", album)
}

</script>
 
<style scoped>
.edit-box {
}

form {
    display: flex;
    flex-direction: column;
    padding: 20px;
}

input,
textarea,
select {
    padding: 6px 4px;
    margin-bottom: 20px;
}

input,
label,
textarea,
select {
    font-size: 14px;
}

textarea {
    resize: vertical;
}

form button {
    padding: 12px 0;
    margin-top: 8px;
    cursor: pointer;
}

input[type="file"] {
    cursor: pointer;
}

.tag {
    margin: 0;
    float: right;
    font-size: 12px;
    color: gray;
}

.new-artist-box {
    display: flex;
    flex-direction: row;
    gap: 4px;
    align-items: center;
    margin-top: 4px;
    margin-bottom: 20px;

    cursor: pointer;
}

.new-artist-box:hover {
    opacity: 0.6;
}

.new-artist-box p {
    margin: 0;
    font-size: 14px;
}

input.artist {
    margin: 0;
    flex: 1;
}

.artist-entry {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 4px;
}

.remove-artist {
    color: darkred;
    cursor: pointer;
}

.remove-artist:hover {
    opacity: 0.6;
}
</style>
 
