const fs = require("fs")
const express = require("express")
const multer = require("multer")
const ejs = require("ejs")
const { print } = require("./utils.js")
const fb = require("./firebase.js")
require("dotenv").config()
const jwt = require("jsonwebtoken")
const { Storage } = require("@google-cloud/storage")

const app = express()
const PORT = process.env.PORT | 8080
const storage = multer.memoryStorage()
const upload = multer({ storage })
const gstorage = new Storage({
   keyFilename: "./keys/tmf-beat-8d14f249b137.json"
})
const tracks_bucket_name = "jukebox-tracks"
const albums_bucket_name = "jukebox-albums"
const tracks_bucket = gstorage.bucket(tracks_bucket_name)
const albums_bucket = gstorage.bucket(albums_bucket_name)

const MAX_TRACK_SIZE_KB = 6500
const MAX_ALBUM_SIZE_KB = 10
let current_event = "05312024_testid"
let events = []

const authenticate_token = (req, res, next) => {
   let authheader = req.headers["authorization"]
   let token = authheader && authheader.split(" ")[1]

   if (!token) {
      return res.status(400).send({ message: "Authorization failed." })
   }

   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
         console.log(err)
         return res.status(400).send({ message: "Invalid token" })
      }

      req.user = user
   })
   next()
}

app.set("view engine", "ejs")
app.use(express.json())
app.use(express.static(__dirname + "/public"))
app.get("/", (req, res) => {
   res.render("home", { events })
})

app.get("/upload", (req, res) => {
   res.render("upload")
})

app.get("/login", (req, res) => {
   res.render("login")
})

fb.setup_collection_listener("events", async (e) => {
   events = []

   let keys = Object.keys(e)
   for (let i = 0; i < keys.length; i++) {
      let event = e[keys[i]]
      let track_ids = event.tracks
      event.tracks = []

      for (let j = 0; j < track_ids.length; j++) {
         event.tracks.push(await fb.get_doc("tracks", track_ids[j]))
      }

      events.push(event)
   }

})

// given multer file, stream & upload to google cloud storage
const upload_file = async (file, bucket) => {
   const filename = `${Date.now()}_${file.originalname}`
   const filecloud = bucket.file(filename)

   await filecloud.save(file.buffer, {
      contentType: file.mimetype
   }, (err) => {
      if (err) console.log("error")
   })

   return filename
}

const get_gcloud_link = (filename, bucketname) => {
   return `https://storage.googleapis.com/${bucketname}/${filename}`
}

app.post("/eventcreate", (req, res) => {
   current_event = `${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '')}_${req.body.id}`
   const date = Date.now()
   const name = req.body.name
   const desc = req.body.desc
   fb.set_doc("events", current_event, {
      date,
      name,
      desc,
      tracks: []
   })
   return res.status(200)
})

app.post("/upload", upload.fields([
      { name: "track" },
      { name: "album", maxCount: 1 }
   ]), async (req, res) => {
      if (current_event == undefined || current_event == "") {
         return res.status(400).send("No event is open")
      }

      try {
         // get & validate our data
         const artist = req.body.artist
         const title = req.body.title

         if (artist == undefined || title == undefined || artist.length == 0 || title.length == 0) {
            return res.status(400).send("Invalid artist/title")
         }

         const files = req.files
         
         if (!files.track) {
            return res.status(400).send("Upload a file")
         }

         const trackfile = files.track[0]
         const albumfile = files.album ? files.album[0] : undefined
         if (albumfile && !/\.webp$/i.test(albumfile.originalname)) {
            console.log(albumfile.originalname)
            return res.status(400).send("Must be a valid webp image")
         }

         // validate file sizes
         if (trackfile.buffer.length / 1024 > MAX_TRACK_SIZE_KB) {
            return res.status(400).send("Track file is too big (exceeds " + Math.floor(MAX_TRACK_SIZE_KB / 1024) + "mb limit)")
         }
         if (albumfile && albumfile.buffer.length / 1024 > MAX_ALBUM_SIZE_KB) {
            return res.status(400).send("Album file is too big (exceeds " + MAX_ALBUM_SIZE_KB + "kb limit)")
         }

         let filename = await upload_file(trackfile, tracks_bucket)
         let url = get_gcloud_link(filename, tracks_bucket_name)
         let album
         if (albumfile) album = get_gcloud_link(await upload_file(albumfile, albums_bucket), albums_bucket_name)
         else album = get_gcloud_link("default.webp", albums_bucket_name)

         // save entry into database
         const newentry = {
            artist,
            title,
            filename,
            url,
            album,
            plays: 0,
            winner: false
         }

         // save track to db
         fb.set_doc("tracks", filename, newentry)
         // save track to current event
         fb.update_doc("events", current_event, {
            tracks: fb.arrayUnion(filename)
         })

         res.status(200).send("Successfully uploaded")
      } catch (err) {
         throw err
         print("Error uploading file: " + err)
         res.status(400).send("Error uploading file")
      }
   })

// TEMPORARY
let users = {
   "capybara": "passw0rd"
}

app.post("/login", (req, res) => {
   let user = req.body.username 
   let password = req.body.password

   if (user == undefined || password == undefined || user == "" || password == "") {
      return res.status(400).send({ message: "Invalid request" })
   }
   
   // authenticate user
   if (users[user] != password) {
      return res.status(400).send({ message: "Invalid username/password combination"})
   }

   // create our access token
   let token = jwt.sign({user}, process.env.JWT_SECRET, { expiresIn: "60s" })

   return res.status(200).send({ message: "Login successful", token })
})

app.get("/test", authenticate_token, (req, res) => {
   res.send({ message: "User authorized" })
})

app.listen(8080, () => {
   print("started on port " + PORT)
})
