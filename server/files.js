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
const MAX_ICON_SIZE_KB = 20

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
   return `https://storage.googleapis.com/${bucketname}/${filename.split(" ").join("_")}`
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
   MAX_ICON_SIZE_KB
}
