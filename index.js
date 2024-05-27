const fs = require("fs")
const express = require("express")
const multer = require("multer")
const ejs = require("ejs")
const { Dropbox } = require("dropbox")
const { WritableStreamBuffer } = require("stream-buffers")
const { print } = require("./utils.js")
const fb = require("./firebase.js")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT | 8080
const storage = multer.memoryStorage()
const upload = multer({ storage })
const dbx = new Dropbox({
   accessToken: process.env.DROPBOX_TOKEN,
   fetch: fetch
})

let current_event = ""
let events = []

app.set("view engine", "ejs")
app.use(express.json())
app.get("/", (req, res) => {
   res.render("home", { events })
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

   console.log(events)
})

// given a multer file obj, try to stream the 
// data to dropbox, on /targetpath/file
// returns [the filename, link to file]
const stream_file_to_dropbox = async (file, targetpath) => {
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

         // try to stream file to dropbox
         let track_out = await stream_file_to_dropbox(trackfile, "tracks")
         let filename = track_out[0]
         let url = track_out[1]
         let album = albumfile ? 
            (await stream_file_to_dropbox(albumfile, "covers"))[1] :
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
         print("Error uploading file: " + err)
         res.status(400).send("Error uploading file")
      }
   })

app.listen(8080, () => print("started"))
