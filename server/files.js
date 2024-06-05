const multer = require("multer")
const storage = multer.memoryStorage()
const upload = multer({ storage })

const { Storage } = require("@google-cloud/storage")
const gstorage = new Storage({
   keyFilename: process.env.GCLOUD_SERVICE_ACC_KEY 
})

const tracks_bucket_name = "jukebox-tracks"
const albums_bucket_name = "jukebox-albums"
const profiles_bucket_name = "jukebox-profiles"
const tracks_bucket = gstorage.bucket(tracks_bucket_name)
const albums_bucket = gstorage.bucket(albums_bucket_name)
const profiles_bucket = gstorage.bucket(profiles_bucket_name)
const MAX_TRACK_SIZE_KB = 15000
const MAX_ALBUM_SIZE_KB = 70 
const MAX_ICON_SIZE_KB = 30
const MIN_FILENAME_LENGTH = 5
const MAX_FILENAME_LENGTH = 50
const FILENAME_REGEX_VALIDATION = /^[a-zA-Z0-9_\-()[\].&]+$/
// given multer file, stream & upload to google cloud storage
const upload_file = async (file, bucket) => {
   const filename = `${Date.now()}_${file.originalname.replace(/\#/g, "").split(" ").join("_")}`
   const filecloud = bucket.file(filename)

   await filecloud.save(file.buffer, {
      contentType: file.mimetype
   }, (err) => {
      if (err) console.log("error: " + err)
   })

   return filename
}

const delete_file = async (file, bucket) => {
   await bucket.file(file).delete() 
}

// formulate a link to a file in a bucket
const get_gcloud_link = (filename, bucketname) => {
   return `https://storage.googleapis.com/${bucketname}/${filename}`
}

// validates a filename. takes extensions  as a string: ".mp3,.webp"
const validate_filename = (filename, extensions) => {
   if (!filename || typeof filename != "string") return "Invalid filename"

   // ensure has ONE period (one file extension allowed)
   let split = filename.split(".")
   if (split.length < 2) return "Filename doesn't have file extension"
   if (filename.length < MIN_FILENAME_LENGTH || filename > MAX_FILENAME_LENGTH) return `Filename must be between ${MIN_FILENAME_LENGTH} and ${MAX_FILENAME_LENGTH} characters`

   let extension = split[split.length - 1]
   if (!extensions.includes(extension)) return `Extension "${extension}" is invalid`
   console.log(filename)
   if (!FILENAME_REGEX_VALIDATION.test(filename)) return "Filename contains invalid characters"
   return 0
}

module.exports = {
   upload,
   upload_file,
   delete_file,
   get_gcloud_link,
   tracks_bucket,
   albums_bucket,
   profiles_bucket,
   tracks_bucket_name,
   albums_bucket_name,
   profiles_bucket_name,
   MAX_TRACK_SIZE_KB,
   MAX_ALBUM_SIZE_KB,
   MAX_ICON_SIZE_KB,
   validate_filename,
}
