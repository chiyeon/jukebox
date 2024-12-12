const multer = require("multer")
const storage = multer.memoryStorage()
const upload = multer({ storage })
const crypto = require("crypto")
const mp3Duration = require("mp3-duration")

const { Storage } = require("@google-cloud/storage")
const gstorage = new Storage({
   keyFilename: process.env.GCLOUD_SERVICE_ACC_KEY 
})

const tracks_bucket_name = "jukebox-tracks"
const albums_bucket_name = "jukebox-albums"
const profiles_bucket_name = "jukebox-profiles"
const playlists_bucket_name = "jukebox-playlist-covers"
const tracks_bucket = gstorage.bucket(tracks_bucket_name)
const albums_bucket = gstorage.bucket(albums_bucket_name)
const profiles_bucket = gstorage.bucket(profiles_bucket_name)
const playlists_bucket = gstorage.bucket(playlists_bucket_name)
const MAX_TRACK_SIZE_KB = 15000
const MAX_ALBUM_SIZE_KB = 400
const MAX_ICON_SIZE_KB = 300
const MIN_FILENAME_LENGTH = 1
const MAX_FILENAME_LENGTH = 100
const FILENAME_REGEX_VALIDATION = /^[a-zA-Z0-9_\-()[\].&]+$/
const MAX_LYRICS_LENGTH = 2000
const MAX_DESCRIPTION_LENGTH = 2000
const MAX_ARTISTS = 7
// given multer file, stream & upload to google cloud storage
const upload_file = async (file, bucket) => {
   const filename = crypto.randomUUID()
   const filecloud = bucket.file(filename)

   await filecloud.save(file.buffer, {
      contentType: file.mimetype
   }, (err) => {
      if (err) console.log("error: " + err)
   })

   return filename
}

const delete_file = async (file, bucket) => {
   try {
      await bucket.file(file).delete() 
   } catch (e) {
      console.log("Failed to delete file: " + e)
   }
}

const get_track_duration = async (file) => {
   const duration = (await mp3Duration(file)) // store in seconds
   return duration > 0 ? duration : 0
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

   if (extensions != undefined) {
      let extension = split[split.length - 1]
      if (!extensions.includes(extension)) return `Extension "${extension}" is invalid`
   }
   // if (!FILENAME_REGEX_VALIDATION.test(filename)) return "Filename contains invalid characters"
   return 0
}

module.exports = {
   upload,
   upload_file,
   delete_file,
   get_gcloud_link,
   get_track_duration,
   tracks_bucket,
   albums_bucket,
   profiles_bucket,
   playlists_bucket,
   tracks_bucket_name,
   albums_bucket_name,
   profiles_bucket_name,
   playlists_bucket_name,
   MAX_TRACK_SIZE_KB,
   MAX_ALBUM_SIZE_KB,
   MAX_ICON_SIZE_KB,
   validate_filename,
   MAX_LYRICS_LENGTH,
   MAX_DESCRIPTION_LENGTH,
   MAX_ARTISTS,
}
