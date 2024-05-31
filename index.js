const fs = require("fs")
const express = require("express")
const multer = require("multer")
const ejs = require("ejs")
const { Dropbox } = require("dropbox")
const { WritableStreamBuffer } = require("stream-buffers")
const { print } = require("./utils.js")
const fb = require("./firebase.js")
require("dotenv").config()
const jwt = require("jsonwebtoken")

const app = express()
const PORT = process.env.PORT | 8080
const storage = multer.memoryStorage()
const upload = multer({ storage })
let dbx

const MAX_TRACK_SIZE_KB = 6500
const MAX_ALBUM_SIZE_KB = 10
let current_event = "05302024_testid"
let events = []

const update_dropbox_instance = async () => {
   dbx = new Dropbox({
      fetch: fetch,
      clientId: process.env.DROPBOX_ID,
      clientSecret: process.env.DROPBOX_SECRET,
      accessToken: await get_dropbox_access_token()
   })
}

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

const get_dropbox_access_token = async () => {
   const res = await (await fetch("https://api.dropbox.com/oauth2/token", {
      method: "POST",
      body: new URLSearchParams({
         "refresh_token": process.env.DROPBOX_REFRESH_TOKEN,
         "client_id": process.env.DROPBOX_ID,
         "client_secret": process.env.DROPBOX_SECRET,
         "grant_type": "refresh_token"
      })
   })).json()

   return res.access_token
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

// given a multer file obj, try to stream the 
// data to dropbox, on /targetpath/file
// returns [the filename, link to file]
const stream_upload_file = async (file, targetpath) => {
   const filename = `${Date.now()}_${file.originalname}`
   const filebuffer = file.buffer

   const bufferstream = new WritableStreamBuffer({
      initialSize: (100 * 1024),
      incrementAmount: (10 * 1024)
   })

   bufferstream.end(filebuffer)

   let path = `/${targetpath}/${filename}`
   await dbx.filesUpload({ path: path, contents: bufferstream.getContents() })

   let sharedlink = (await dbx.sharingCreateSharedLinkWithSettings({ path: path })).result.url
   let url = new URL(sharedlink)
   url.searchParams.set("dl", "1")
   return [filename, url.toString()]
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
         if (trackfile.buffer.length > MAX_TRACK_SIZE_KB) {
            //return res.status(400).send("Track file is too big (exceeds " + Math.floor(MAX_TRACK_SIZE_KB / 1024) + "mb limit)")
         }
         if (albumfile && albumfile.buffer.length > MAX_ALBUM_SIZE_KB) {
            //return res.status(400).send("Album file is too big (exceeds " + MAX_ALBUM_SIZE_KB + "kb limit)")
         }

         /*
         console.log("track is of size " + trackfile.buffer.length / 1024)
         if (albumfile) console.log("album is of size " + albumfile.buffer.length / 1024)
         else console.log("no albumfile")
         */

         // try to stream file to dropbox
         await update_dropbox_instance()

         let track_out = await stream_upload_file(trackfile, "tracks")
         let filename = track_out[0]
         let url = track_out[1]
         let album = albumfile ? 
            (await stream_upload_file(albumfile, "covers"))[1] :
            "todo link to default file"
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
   get_dropbox_access_token()
})
