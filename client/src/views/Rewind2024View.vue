<template>
   <template v-if="user.tracks != undefined">
      <div class="rewind">
         <div class="gap-small"></div>
         <h1 class="title rainbow" ref="title_ref">YOUR 2024 BEAT BATTLE REWIND</h1>
         <p class="center">Let's run it back.</p>

         <div class="gap"></div>

         <h1>You uploaded <span class="rainbow">{{ user.tracks.length }}</span> tracks this year!</h1>
         <h1>Thats a whopping <span class="rainbow">{{Math.floor(total_length / 60 * 100) / 100}} minutes of music</span>. GYATTTTT!!</h1>
         <h2>You started the year strong with</h2>
         <TrackComponent :track="user.tracks[user.tracks.length - 1]" />
         <h2>And you finished strong (for now) with</h2>
         <TrackComponent :track="user.tracks[0]" />

         <div class="gap-small"></div>
         <h1>You worked on <span class="rainbow">{{ collab_tracks.length }}</span> tracks with <span class="rainbow">other people!</span></h1>
         <h2>Here is just a taste of your hard work!</h2>
         <TrackComponent :track="collab_tracks[0]" v-if="collab_tracks.length > 0" />
         <TrackComponent :track="collab_tracks[1]" v-if="collab_tracks.length > 1" />
         <TrackComponent :track="collab_tracks[2]" v-if="collab_tracks.length > 2" />

         <div class="gap-small"></div>

         <h1>You made all kinds of tracks. At <span class="rainbow">{{ Math.floor(shortest_track.duration) }} seconds</span> long, this was your <span class="rainbow">shortest</span></h1>
         <TrackComponent :track="shortest_track" />
         <h1>And at <span class="rainbow">{{ Math.floor(longest_track.duration) }} seconds</span>, this was your <span class="rainbow">longest!</span></h1>
         <TrackComponent :track="longest_track" />
         <h1 v-if="shortest_track.uuid == longest_track.uuid">And its even funnier because its the same song! ily jubin</h1>

         <div class="gap-small"></div>

         <h1>2024 was an eventful year with a lot of updates.</h1>
         <h2>The beat battle website underwent huge changes, and you joined us on <span class="rainbow">{{ user.creation_date.toLocaleString("default", { month: "long" }) }} {{user.creation_date.getDate()}}</span>!</h2>
         <h1>Since then, you've earned <span class="rainbow">{{ user.badges.length}} badges!</span></h1>
         <div class="badges">
            <h2 v-for="b in user.badges">{{ b.name }}</h2>
         </div>

         <div class="gap-small"></div>

         <h1>Speaking of updates, plays and listen time on tracks are now recorded!</h1>
         <h1>Since the update on Dec 7, 2024, your music has amassed <span class="rainbow">{{ user.plays }} plays</span> and <span class="rainbow">{{ Math.floor(user.listen_time / 60 * 100) / 100 }} minutes</span> of listening time!</h1>
         <h2>The system isn't perfect nor is it 100% accurate, but it should indicate well enough the performance of your tracks!</h2>
         <h2>Go ahead and give your favorite tracks a listen this weekend to boost the numbers!</h2>

         <div class="gap-small"></div>

         <div v-if="user.username == 'waymond'" class="awards">
            <h1>From input on design and architecture to bouncing around implementation ideas to even a Github pull request, you were instrumental in the development of the new website. Thank you for your assistance!</h1>

            <img class="award" src="../assets/awards/award_contributor.png" />
            <h2 class="rainbow">BEST WEBSITE CONTRIBUTOR</h2>
         </div>
         <div v-else-if="user.username == 'Idgaf'" class="awards">
            <h1>justin happy meal mcondalds meal kai centa burger! As a beginner artist, you still let your voice and musical talent shine. Kai Cenat thanks you warmly!</h1>

            <img class="award" src="../assets/awards/award_kaicenat.png" />
            <h2 class="rainbow">KAI CENAT AWARD</h2>
         </div>
         <div v-else-if="user.username == 'twomi'" class="awards">
            <h1>From humble beginnings with the yeat type beat, you've shown the most improvement out of everyone this year, with your new beats and style taking the TMF scene by storm! We look forward to see what you'll come up with next.</h1>

            <img class="award" src="../assets/awards/award_improved.png" />
            <h2 class="rainbow">MOST IMPROVED</h2>
         </div>
         <div v-else-if="user.username == 'izzy'" class="awards">
            <h1>Thanks for always being there for me monkey!</h1>
            
            <img class="award" src="../assets/awards/award_monkey.png" />
            <h2 class="rainbow">MONKEY AWARD</h2>
         </div>
          <div v-else-if="user.username == 'gab'" class="awards">
            <h1>Every track you upload whether it be made in 10 minutes or 10 days exudes personality and style. You were TMF beat's number one artist of the year, with the most iconic sound and production. Your clear style drives your music to great heights in a way everyone can immediately recognize and enjoy. Additionally, thank you for allowing us to host events at your studio!</h1>

            <img class="award" src="../assets/awards/award_sound.png" />
            <h2 class="rainbow">BEST ARTIST</h2>
         </div>
         <div v-else-if="user.username == 'bruh'" class="awards">
            <h1>Despite the limited time on your hands, you still made as many tracks as you could for the beat battle! Additionally, you had a unique sound and style in your synth selection and overall production that made your music stand out.</h1>

            <img class="award" src="../assets/awards/award_iconic.png" />
            <h2 class="rainbow">MOST ICONIC</h2>
         </div>
         <div v-else-if="user.username == 'chi'" class="awards">
            <h1>This is just a test to see if its working. get back to coding buddy</h1>

            <img class="award" src="../assets/awards/award_test.png" />
            <h2 class="rainbow">TEST AWARD</h2>
         </div>
         <div v-else>
            <h1>If you are reading this, something went wrong. Please reach out!!!</h1>
         </div>

         <div class="gap-small"></div>

         <h1>As this year draws to a close we want to thank you all for sharing your music with us!</h1>
         <h1>We hope next year will be even better. See you there!</h1>

         <h2>- chiyeon</h2>
         <div class="gap"></div>

         </div>
   </template>
   <template v-else>
      <p>Loading (make sure you are logged in)</p>
   </template>
</template>

<script setup>
import { onBeforeMount, ref } from "vue"
import TrackComponent from "../components/TrackComponent.vue"

const user = ref({})
const title_ref = ref()

let colors = [ "#293462", "#F24C4C", "#EC9B3B", "#F7D716" ]
let curr_color = 0

// use for data
let rand_track = 0
let rand_track2 = 0

let collab_tracks = []

let total_length = 0

let shortest_track = {}
let longest_track = {}

onBeforeMount(async () => {
   let res = await (await fetch("/api/rewind", {
      method: "GET"
   })).json()
   if (!res) return
   res.user.creation_date = new Date(res.user.creation_date)
   user.value = res.user

   rand_track = Math.floor(Math.random() * (res.user.tracks.length - 1))

   total_length = res.user.tracks.reduce((sum, o) => sum + o.duration, 0)

   if (res.user.tracks.length > 1) {
      while (rand_track2 == rand_track) {
         rand_track2 = Math.floor(Math.random() * (res.user.tracks.length - 1))
      }
   }

   collab_tracks = res.user.tracks.filter(a => a.artists.length > 1)

   shortest_track = res.user.tracks.reduce((min, obj) => obj.duration < min.duration ? obj : min)
   longest_track = res.user.tracks.reduce((max, obj) => obj.duration > max.duration ? obj : max)

   cycle_title_color()
   setInterval(cycle_title_color, 2000)
})

const cycle_title_color = () => {
   curr_color++ 
   if (curr_color >= colors.length) curr_color = 0

   let rainbows = document.querySelectorAll(".rainbow")
   rainbows.forEach(r => {
      r.style.color = colors[curr_color]
   })
}
</script>

<style scoped>
.gap-small {
   height: 23vh;
}
.gap {
   height: 40vh;
}

.rainbow {
   color: "#293462";
   transition: 2000ms color linear;
}
.title.rainbow {
   font-size: 42px;
   padding-top: 10vh;
}

.rewind {
   display: flex;
   flex-direction: column;
   max-width: 800px;
   margin: auto;
}

.rewind > * {
}

.badges {
   display: flex;
   flex-direction: column;
   gap: 10px;
}

.badges h2 {
   margin: 0;
}

.rewind > *:not(.artist) {
}

.awards {
   display: flex;
   flex-direction: column;
   align-items: center;
}

.award {
   width: 256px;
   image-rendering: crisp-edges;
}
</style>
