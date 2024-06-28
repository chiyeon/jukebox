const crypto = require("crypto")
const files = require("./files.js")
const fb = require("./firebase.js")

const Playlist = (name, artist, description, cover, visibility, uuid) => {
   return {
      name,
      owner: artist,
      editors: [ artist ],
      description,
      visibility,
      viewers: [ artist ],
      tracks: [],
      cover: cover,
      uuid
   }
}

module.exports = {
   Playlist: Playlist,
   create_new_playlist: async (req, res) => {
      // validate user
      if (req.username == undefined || req.username == "") return res.status(400).send({ message: "Invalid token" })

      // ensure user exists
      const userdata = await fb.get_doc("users", req.username)
      if (!userdata) return res.status(400).send({ message: "Invalid user" })

      // validate packet. should be:
      // name, description, visibility [ 'public', 'private' ], and album image
      if (req.body.name == undefined) return res.status(400).send({ message: "Missing playlist name" })
      if (req.body.visibility && !["public", "private"].includes(req.body.visibility)) return res.status(400).send({ message: "Invalid playlist invisibility" })
      if (req.body.cover) {
         // if cover, upload & save link
         const validate = files.validate_filename(req.body.album.originalname)
         if (validate != 0) { return res.status(400).send({ message: validate }) }

         // check size
         if (req.body.album.buffer.length / 1024 > files.MAX_ALBUM_SIZE_KB) {
            return res.status(400).send({ message: "Playlist cover file is too big (exceeds " + Math.floor(files.MAX_ALBUM_SIZE_KB / 1024) + "mb limit" })
         }
         
         let filename = await files.upload_file(req.body.album, files.playlists_bucket) 
         req.body.cover_url = files.get_gcloud_link(filename, files.playlists_bucket_name)
      } else {
         req.body.cover_url = files.get_gcloud_link("default.webp", files.playlists_bucket_name)
      }

      const uuid = crypto.randomUUID()

      const playlist = Playlist(
         req.body.name,
         req.username,
         req.body.description ? req.body.description : "",
         req.body.cover_url,
         req.body.visibility ? req.body.visibility : "private",
         uuid
      )

      // update user & playlist dbs
      await fb.set_doc("playlists", uuid, playlist)
      await fb.update_doc("users", req.username, { playlists: fb.FieldValue.arrayUnion(uuid) })

      return res.status(200).send({ message: "Playlist created successfully" })
   }
}
