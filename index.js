const fs = require("fs")
const express = require("express")
const multer = require("multer")
const ejs = require("ejs")
const { print } = require("./utils.js")
const fb = require("./firebase.js")
require("dotenv").config()
const jwt = require("jsonwebtoken")
const { Storage } = require("@google-cloud/storage")
const bcrypt = require("bcrypt")
const cookieparser = require("cookie-parser")

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

const token_expiration_time = "400d"
const MAX_TRACK_SIZE_KB = 15000
const MAX_ALBUM_SIZE_KB = 20
// user permissions
const USER_BASE = 0     // basic account, cannot do anything
const USER_NORMAL = 1   // normal account that can upload to beat battles
const USER_ADMIN = 2    // superuser access
let current_event = "05312024_testid"
let events = []

const authenticate_token = (req, res, next) => {
   let token = req.cookies.authentication_token 

   if (!token) {
      return res.status(400).send({ message: "Authorization failed." })
   }

   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
         console.log(err)
         return res.status(400).send({ message: "Invalid token" })
      }

      req.user = user.username
   })
   next()
}

app.set("view engine", "ejs")
app.use(express.json())
app.use(cookieparser())
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

app.post("/upload", authenticate_token, upload.fields([
      { name: "track" },
      { name: "album", maxCount: 1 }
   ]), async (req, res) => {
      if (current_event == undefined || current_event == "") {
         return res.status(400).send({ message: "No event is open" })
      }

      try {
         // first check if we have user perms to upload tracks
         // it is USER_NORMAL
         let user_data = await fb.get_doc("users", req.user)
         if (!user_data) return res.status(400).send({ message: "Invalid user" })
         if (user_data.permissions < USER_NORMAL) {
            return res.status(400).send({ message: "Invalid user permissions" })
         }

         // get & validate our data
         const artist = user_data.username
         const title = req.body.title

         if (artist == undefined || title == undefined || artist.length == 0 || title.length == 0) {
            return res.status(400).send({ message: "Invalid artist/title" })
         }

         const files = req.files
         
         if (!files.track) {
            return res.status(400).send({ message: "Upload a file" })
         }

         const trackfile = files.track[0]
         const albumfile = files.album ? files.album[0] : undefined
         if (albumfile && !/\.webp$/i.test(albumfile.originalname)) {
            console.log(albumfile.originalname)
            return res.status(400).send({ message: "Must be a valid webp image" })
         }

         // validate file sizes
         if (trackfile.buffer.length / 1024 > MAX_TRACK_SIZE_KB) {
            return res.status(400).send({ message: "Track file is too big (exceeds " + Math.floor(MAX_TRACK_SIZE_KB / 1024 / 1024) + "mb limit)" })
         }
         if (albumfile && albumfile.buffer.length / 1024 > MAX_ALBUM_SIZE_KB) {
            return res.status(400).send({ message: "Album file is too big (exceeds " + Math.floor(MAX_ALBUM_SIZE_KB / 1024)+ "kb limit)" })
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

         res.status(200).send({ message: "Successfully uploaded" })
      } catch (err) {
         throw err
         print("Error uploading file: " + err)
         res.status(400).send({ message: "Error uploading file" })
      }
   })

app.post("/login", async (req, res) => {
   try {
      let username = req.body.username 
      let password = req.body.password

      // validate packet
      if (username == undefined || password == undefined || username == "" || password == "") {
         return res.status(400).send({ message: "Invalid request" })
      }
      
      // authenticate user
      let user_data = await fb.get_doc("passwords", username)
      if (user_data == undefined) {
         return res.status(400).send({ message: "Invalid username/password combination" })
      }

      if (!(await bcrypt.compare(password, user_data.password))) {
         return res.status(400).send({ message: "Invalid username/password combination" })
      }

      // create our access token
      let token = jwt.sign({username}, process.env.JWT_SECRET, { expiresIn: token_expiration_time })

      res.cookie("authentication_token", token, {
         httpOnly: true,
         secure: true,
         sameSite: "Strict",
         maxAge: 400 * 24 * 60 * 60 * 1000
      })
      res.status(200).send({ message: "Login successful" })
   } catch (err) {
      res.status(500).send({ message: "Unable to login" })
      console.log(err)
   }
})

app.post("/signup", async (req, res) => {
   try {
      let user = req.body.username
      let password = req.body.password

      // validate packet
      if (user == undefined || password == undefined || user == "" || password == "") {
         return res.status(400).send({ message: "Invalid request" })
      }

      // check if username exists
      if ((await fb.get_doc("passwords", user)) != undefined) {
         return res.status(400).send({ message: "Username is taken" })
      }

      // create our user, save to db (with hashed password)
      const hashed_password = await bcrypt.hash(password, 10)

      const newuser = {
         password: hashed_password,
      }

      await fb.set_doc("passwords", user, newuser)

      await fb.set_doc("users", user, {
         username: user,
         creation_date: new Date(),
         streams: 0,
         listens: 0,
         display_name: user,
         permissions: USER_NORMAL
      })

      const token = jwt.sign({ user }, process.env.JWT_SECRET, {
         expiresIn: token_expiration_time
      })

      res.cookie("authentication_token", token, {
         httpOnly: true,
         secure: true,
         sameSite: "Strict",
         maxAge: 400 * 24 * 60 * 60 * 1000
      })
      res.status(200).json({ message: "Account created successfully!" })
   } catch (err) {
      res.status(500).json({ message: "Failed to create account.", error: err })
      console.log(err)
   }
})

app.post("/logout", (req, res) => {
   const token = req.cookies.authToken
   if (!token) {
      res.status(200).send({ message: "No need to sign out" })
   }
   res.clearCookie("authentication_token")
   res.status(200).send({ message: "Signed out successfully" })
})

app.listen(8080, () => {
   print("started on port " + PORT)
})
