const fs = require("fs")
const express = require("express")
const multer = require("multer")
const ejs = require("ejs")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT | 8080
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, "tracks/")
   },
   filename: (req, file, cb) => {
      console.log(file)
      cb(null, Date.now() + "_" + file.originalname)
   }
})

app.set("view engine", "ejs")

app.get("/", (req, res) => {
   res.render("home", { msg: "hi from ejs" })
})

app.post("/upload", multer({ storage }).single("file"), (req, res, next) => {
   console.log("Recieved file")
   res.sendStatus(200)
})

app.listen(8080, () => console.log("started"))
