const files = require("./files.js")
const fb = require("./firebase.js")
const short = require("short-uuid")

const translator = short()

const get_timestamp_as_date = (timestamp) => {
   return new Date(timestamp._seconds * 1000)
}

// uploads playlist cover & returns url
// returns object on failure (with error message)
const upload_playlist_cover = async (cover) => {
   // if cover, upload & save link
   const validate = files.validate_filename(cover.originalname)
   if (validate != 0) { return { message: validate } }

   // check size
   if (cover.buffer.length / 1024 > files.MAX_ALBUM_SIZE_KB) {
      return { message: "Playlist cover file is too big (exceeds " + Math.floor(files.MAX_ALBUM_SIZE_KB) + "kb limit)" }
   }
   let filename = await files.upload_file(cover, files.playlists_bucket) 
   return files.get_gcloud_link(filename, files.playlists_bucket_name)
}

const Playlist = (name, artist, description, cover, visibility, uuid) => {
   return {
      name,
      owner: artist,
      editors: [ artist ],
      description,
      visibility,
      viewers: [ artist ],
      tracks: [], /* unlike others, these are uuids. these are objects that contain uuid + some other info */
      cover: cover,
      uuid,
      creation_date: fb.get_timestamp(new Date())
   }
}

const PlaylistTrack = (uuid, uploader) => {
   return {
      uuid,
      uploader
   }
}

const validate_playlist_name = (name) => {
   if (!name || name.length == 0) return "Invalid name"
   if (name.length > 60) return "Playlist name too long (exceeds 60 character limit)"
   return 0
}

const validate_playlist_description = (desc) => {
   if (desc.length > 300) return "Playlist description is too long (exceeds 300 character limit)"
   return 0
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
      let validate_name = validate_playlist_name(req.body.name)
      if (validate_name != 0) return res.status(400).send({ message: validate_name })

      if (req.body.description) {
         let validate_desc = validate_playlist_description(req.body.description)
         if (validate_desc != 0) {
            return res.status(400).send({ message: validate_desc })
         }
      }

      if (req.body.visibility && !["public", "private"].includes(req.body.visibility)) return res.status(400).send({ message: "Invalid playlist invisibility" })
      if (req.file) {
         let url = await upload_playlist_cover(req.file)
         if (typeof url !== "string") {
            // we found an error
            return res.status(400).send(url)
         } else {
            req.body.cover_url = url
         }
      } else {
         req.body.cover_url = files.get_gcloud_link("default.webp", files.playlists_bucket_name)
      }


      const uuid = translator.new()

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
   },

   get_playlists_from_user: async (req, res) => {
      if (!req.body.username) return res.status(400).send({ message: "Missing username" })
      const userdata = await fb.get_doc("users", req.body.username)

      if (!userdata) return res.status(400).send({ message: "Invalid user" })

      let playlists = []
      
      if (!userdata.playlists || userdata.playlists.length == 0) return res.status(200).send({ playlists })

      for (let i = 0; i < userdata.playlists.length; i++) {
         let data = await fb.get_doc("playlists", userdata.playlists[i])
         if (!data) console.log("Found invalid playlist: " + userdata.playlists[i])
         else {
            // only push private playlists if we are the user in question
            if (data.visibility === "public") playlists.push(data)
            else if (data.visibility === "private" && (data.editors.includes(req.username) || data.viewers.includes(req.username))) {
               playlists.push(data)
            }
         }
      }


      playlists.sort((a, b) => get_timestamp_as_date(b.creation_date) - get_timestamp_as_date(a.creation_date))
      
      return res.status(200).send({ playlists })
   },

   // for OWNERS only.
   // change playlist metadata
   edit_playlist: async (req, res) => {
      const userdata = await fb.get_doc("users", req.username)
      if (!userdata) return res.status(400).send({ message: "Invalid user" })

      if (!req.body.uuid) return res.status(400).send({ message: "Invalid playlist UUID" })
      if (!userdata.playlists.includes(req.body.uuid)) return res.status(400).send({ message: "Playlist not registered to user" })

      let playlistdata = await fb.get_doc("playlists", req.body.uuid)
      if (!playlistdata) return res.status(400).send({ message: "Playlist not found" })
      if (playlistdata.owner != req.username) return res.status(400).send({ message: "You cannot edit this playlist" })

      let changes = {}

      if (req.body.name) {
         let validate = validate_playlist_name(req.body.name)
         if (validate != 0) return res.status(400).send({ message: validate })
         changes.name = req.body.name
      }

      if (req.body.description) {
         let validate = validate_playlist_description(req.body.description)
         if (validate != 0) return res.status(400).send({ message: validate })
         changes.description = req.body.description
      }

      if (req.body.editors) {
         if (!changes.editors.includes(req.username)) return res.status(400).send({ message: "You cannot remove yoursel from the playlist!" })
         changes.editors = req.body.editors
      }

      if (req.body.viewers) {
         if (!changes.viewers.includes(req.username)) return res.status(400).send({ message: "You cannot remove yoursel from the playlist!" })
         changes.viewers = req.body.viewers
      }

      // at this point, we are set on changing db and stuff
      if (req.file) {
         // try to upload first
         let url = await upload_playlist_cover(req.file)
         if (typeof url !== "string") {
            return res.status(400).send(url)
         }

         changes.cover = url

         // delete original cover if NOT default
         let split_names = playlistdata.cover.split("/")
         let old_cover = split_names[split_names.length - 1]

         if (old_cover != "default.webp") await files.delete_file(old_cover, files.playlists_bucket)
      }

      // update in db
      await fb.update_doc("playlists", req.body.uuid, changes)
      return res.status(200).send({ message: "Playlist updated successfully" })
   },

   get_playlist_data: async (req, res) => {
      if (!req.body.uuid) return res.status(400).send({ message: "Invalid/missing UUID" }) 

      let playlistdata = await fb.get_doc("playlists", req.body.uuid)

      if (!playlistdata) return res.status(400).send({ message: "Invalid playlist UUID" })

      if (playlistdata.visibility != "public" && !playlistdata.viewers.includes(req.username)) {
         return res.status(400).send({ message: "You do not have permission to view this playlist" })
      }

      let tracks = []
      for (let i = 0; i < playlistdata.tracks.length; i++) {
         let track = await fb.get_doc("tracks", playlistdata.tracks[i].uuid)
         if (track) {
            track.uploaded = playlistdata.tracks[i].uploaded
            tracks.push(track)
         }
      }

      playlistdata.tracks = tracks

      return res.status(200).send({ playlist: playlistdata })
   },

   /* body takes NORMAL TRACK UUIDS!! */
   add_to_playlist: async (req, res) => {
      if (!req.body.uuid) return res.status(400).send({ message: "Invalid UUID" })

      let playlistdata = await fb.get_doc("playlists", req.body.uuid)

      if (!playlistdata) return res.status(400).send({ message: "Invalid UUID" })

      if (!playlistdata.editors.includes(req.username)) return res.status(400).send({ message: "You cannot edit this playlist" })

      if (!req.body.tracks || req.body.tracks.length == 0) return res.status(400).send({ message: "Invalid or missing tracks" })

      let tracks = []
      // valdiate all tracks
      for (let i = 0; i < req.body.tracks.length; i++) {
         if (!(await fb.get_doc("tracks", req.body.tracks[i]))) {
            return res.status(400).send({ message: "Invalid track included: UUID " + req.body.tracks[i] + " isn't valid" })
         }

         tracks.push(PlaylistTrack(req.body.tracks[i], req.username))
      }

      // update tracks
      await fb.update_doc("playlists", req.body.uuid, {
         tracks: fb.FieldValue.arrayUnion(...tracks)
      })

      return res.status(200).send({ message: "updated successfully" })
   },

   /* BODY TAKES PLAYLIST TRACKS */
   remove_from_playlist: async (req, res) => {
      if (!req.body.uuid) return res.status(400).send({ message: "Invalid UUID" })

      let playlistdata = await fb.get_doc("playlists", req.body.uuid)

      if (!playlistdata) return res.status(400).send({ message: "Invalid UUID" })

      if (!playlistdata.editors.includes(req.username)) return res.status(400).send({ message: "You cannot edit this playlist" })

      if (!req.body.tracks || req.body.tracks.length == 0) return res.status(400).send({ message: "Invalid or missing tracks" })

      // valdiate all tracks, make sure they are in there
      for (let i = 0; i < req.body.tracks.length; i++) {
         if (!(await fb.get_doc("tracks", req.body.tracks[i]))) {
            return res.status(400).send({ message: "Invalid track included: UUID " + req.body.tracks[i] + " isn't valid" })
         }

         if (!playlistdata.tracks.includes(req.body.tracks[i])) {
            return res.status(400).send({ message: "Attempted to remove track not in playlist" })
         }
      }

      // update tracks
      await fb.update_doc("playlists", req.body.uuid, {
         tracks: fb.FieldValue.arrayRemove(...req.body.tracks)
      })

      return res.status(200).send({ message: "updated successfully" })
   }
}
