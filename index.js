const fs = require("fs")
const express = require("express")
const multer = require("multer")
const ejs = require("ejs")
const { Dropbox } = require("dropbox")
const { WritableStreamBuffer } = require("stream-buffers")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT | 8080
const storage = multer.memoryStorage()
const upload = multer({ storage })
const dbx = new Dropbox({
   accessToken: process.env.DROPBOX_TOKEN,
   fetch: fetch
})

app.set("view engine", "ejs")

app.get("/", (req, res) => {
   res.render("home", { msg: "hi from ejs" })
})

app.post("/upload", upload.single("file"), async (req, res) => {
   try {
      // get & validate our data
      const artist = req.body.artist
      const title = req.body.title

      if (artist == undefined || title == undefined || artist.length == 0 || title.length == 0) {
         return res.status(500).send("Invalid artist/title")
      }

      // try to stream file to dropbox
      const file = req.file
      const filename = `${Date.now()}_${file.originalname}`
      const filebuffer = file.buffer

      const bufferstream = new WritableStreamBuffer({
         initialSize: (100 * 1024),
         incrementAmount: (10 * 1024)
      })

      bufferstream.end(filebuffer)

      let path = `/tracks/${filename}`
      await dbx.filesUpload({ path: path, contents: bufferstream.getContents() })
      let sharedlink = (await dbx.sharingCreateSharedLinkWithSettings({ path: path })).result.url
      let url = new URL(sharedlink)
      url.searchParams.set("dl", "1")
      sharedlink = url.toString()

      // save entry into database
      const newentry = {
         artist, title, url: sharedlink
      }

      console.log(newentry)

      res.status(200).send("Successfully uploaded")
   } catch (err) {
      console.log("Error uploading file:", err)
      res.status(500).send("Error uploading file")
   }
})

app.listen(8080, () => console.log("started"))
