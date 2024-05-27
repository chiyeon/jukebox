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
      const file = req.file
      const filename = file.originalname
      const filebuffer = file.buffer

      const bufferstream = new WritableStreamBuffer({
         initialSize: (100 * 1024),
         incrementAmount: (10 * 1024)
      })

      bufferstream.end(filebuffer)

      await dbx.filesUpload({ path: `/${filename}`, contents: bufferstream.getContents() })

      res.status(200).send("Successfully uploaded")
   } catch (err) {
      console.log("Error uploading file:", err)
      res.status(500).send("Error uploading file")
   }
})

app.listen(8080, () => console.log("started"))
