const users = require("./users.js")
const files = require("./files.js")
const fs = require("fs")
const express = require("express")
const ejs = require("ejs")
const { print } = require("./utils.js")
const fb = require("./firebase.js")
require("dotenv").config()
const cookieparser = require("cookie-parser")
const cors = require("cors")

const app = express()
const PORT = process.env.PORT | 8080

let current_event = "1717362314700_anothertest"
let events = {}
let events_list = []

app.use(cors({
   credentials: true,
   origin: [ "http://localhost:5173" ]
}))
app.use(express.json())
app.use(cookieparser())
app.use(express.static(__dirname + "/public"))

// app.set("view engine", "ejs")
// app.get("*", (req, res) => {
//    console.log("bruh")
//    res.render("index", { 
//       events: events,
//    })
// })

// app.get("/upload", users.authenticate_token, (req, res) => {
//    res.render("upload")
// })

// app.get("/login", (req, res) => {
//    res.render("login")
// })

app.post("/eventcreate", users.authenticate_token_admin, (req, res) => {
   current_event = `${Date.now()}_${req.body.id}`
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

// requires authenticated user
// takes a payload of at least 1 (track) file, up to 2 (second is album) files
// and a string title
// validates files then uploads to storage & sets in db
app.post("/upload", users.authenticate_token, files.upload.fields([
      { name: "track" },
      { name: "album", maxCount: 1 }
   ]), async (req, res) => {
      // make sure server is pointed at a new event
      if (current_event == undefined || current_event == "") {
         return res.status(400).send({ message: "No event is open" })
      }

      try {
         // first check if we have user perms to upload tracks
         // it is USER_NORMAL
         if (req.username == undefined || req.username == "") {
            return res.status(400).send({ message: "Invalid token" })
         }

         let user_data = await fb.get_doc("users", req.username)
         if (!user_data) return res.status(400).send({ message: "Invalid user" })
         if (user_data.permissions < users.USER_NORMAL) {
            return res.status(400).send({ message: "Invalid user permissions" })
         }

         // get & validate our data
         const artist = user_data.username // important: user USERNAME! this is used to recall a display name later
         const title = req.body.title

         if (artist == undefined || title == undefined || artist.length == 0 || title.length == 0) {
            return res.status(400).send({ message: "Invalid artist/title" })
         }

         const userfiles = req.files
         
         if (!userfiles.track) {
            return res.status(400).send({ message: "Upload a file" })
         }

         // track file is required. album optional
         const trackfile = userfiles.track[0]
         const albumfile = userfiles.album ? userfiles.album[0] : undefined
         if (albumfile && !/\.webp$/i.test(albumfile.originalname)) {
            return res.status(400).send({ message: "Must be a valid webp image" })
         }

         // validate file sizes
         if (trackfile.buffer.length / 1024 > files.MAX_TRACK_SIZE_KB) {
            return res.status(400).send({ message: "Track file is too big (exceeds " + Math.floor(files.MAX_TRACK_SIZE_KB / 1024) + "mb limit)" })
         }
         if (albumfile && albumfile.buffer.length / 1024 > files.MAX_ALBUM_SIZE_KB) {
            return res.status(400).send({ message: "Album file is too big (exceeds " + Math.floor(files.MAX_ALBUM_SIZE_KB)+ "kb limit)" })
         }

         let filename = await files.upload_file(trackfile, files.tracks_bucket)
         let url = files.get_gcloud_link(filename, files.tracks_bucket_name)
         let album
         if (albumfile) album = files.get_gcloud_link(await files.upload_file(albumfile, files.albums_bucket), files.albums_bucket_name)
         else album = files.get_gcloud_link("default.webp", files.albums_bucket_name)

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
            tracks: fb.FieldValue.arrayUnion(filename)
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
      const username = req.body.username 
      const password = req.body.password

      // validate packet
      if (username == undefined || password == undefined || username == "" || password == "") {
         return res.status(400).send({ message: "Invalid request" })
      }
      
      // authenticate user (returns -1 on error)
      const token = await users.login_user(username, password)
      if (token < 0) {
         return res.status(400).send({ message: "Invalid username/password combination" })
      }

      // get user data to return to user
      let userdata = await fb.get_doc("users", username)
      if (userdata == undefined) {
         return res.status(400).send({ message: "Invalid account: user data doesn't exist" })
      }

      // save cookie w client
      res.cookie("authentication_token", token, {
         httpOnly: true,
         secure: true,
         sameSite: "lax",
         maxAge: users.TOKEN_EXPIRATION_TIME,
         overwrite: true
      })
      res.status(200).send({ message: "Login successful", user: userdata })
   } catch (err) {
      res.status(500).send({ message: "Unable to login" })
      print(err)
   }
})

app.post("/signup", async (req, res) => {
   try {
      let username = req.body.username
      let password = req.body.password

      // validate packet
      if (username == undefined || password == undefined || username == "" || password == "") {
         return res.status(400).send({ message: "Invalid request" })
      }

      // check if username exists
      if ((await fb.get_doc("passwords", username)) != undefined) {
         return res.status(400).send({ message: "Username is taken" })
      }

      // get & save token
      const token = await users.create_new_user(username, password, users.USER_NORMAL)
      let newuser = await fb.get_doc("users", username)

      res.cookie("authentication_token", token, {
         httpOnly: true,
         secure: true,
         sameSite: "lax",
         maxAge: users.TOKEN_EXPIRATION_TIME
      })
      res.status(200).json({ message: "Account created successfully!", user: newuser })
   } catch (err) {
      res.status(500).json({ message: "Failed to create account.", error: err })
      print(err)
   }
})

app.post("/logout", (req, res) => {
   const token = req.cookies.authentication_token
   if (!token) {
      return res.status(201).send({ message: "No need to sign out" })
   }
   res.clearCookie("authentication_token")
   res.status(200).send({ message: "Signed out successfully" })
})

app.get("/user", async (req, res) => {
   const token = req.cookies.authentication_token

   if (!token) return res.status(201).send({ message: "no token"})

   if (await users.check_token(token)) {
      let userdata = await fb.get_doc("users", req.username)
      res.status(200).send({ message: "Found user data", user: userdata })
   } else {
      res.status(201).send({ message: "Invalid or unprovided token", user: undefined })
   }
})

app.get("/events", async (req, res) => {
   res.json({
      events: events_list
   })
})

app.listen(8080, () => {
   // listen for updates in collections
   fb.setup_collection_listener("events", async (e) => {
      let keys = Object.keys(e)
      for (let i = 0; i < keys.length; i++) {
         let event = e[keys[i]]
         let track_ids = event.tracks
         event.tracks = []

         for (let j = 0; j < track_ids.length; j++) {
            // events store tracks as a list of ids
            // use IDs to get track data
            // inside each track, use artist USERNAME to get their DISPLAY name
            let track = await fb.get_doc("tracks", track_ids[j])
            track.artist = (await fb.get_doc("users", track.artist)).display_name
            event.tracks.push(track)
         }
         events[keys[i]] = event
      }

      events_list = Array.from(Object.values(events))
      events_list.reverse()
   })

   print("started on port " + PORT)
})
