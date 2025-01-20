module.exports = {
   upload_track: async (req, res) => {
      try {
         // first check if we have user perms to upload tracks
         // it is USER_NORMAL
         if (req.username == undefined || req.username == "") {
            return res.status(400).send({ message: "Invalid token" })
         }

         // ensure target event exists & is open
         let current_event = req.body.event
         if (!current_event || current_event.length == 0) return res.status(400).send({ message: "Invalid event" })
         const event = await fb.get_doc("events", current_event)

         if (!event) return res.status(400).send({ message: "Event doesn't exist" })
         if (!event.open) return res.status(400).send({ message: "Event is not open" })

         let user_data = await fb.get_doc("users", req.username)
         if (!user_data) return res.status(400).send({ message: "Invalid user" })
         if (user_data.permissions < users.USER_NORMAL) {
            return res.status(400).send({ message: "Invalid user permissions" })
         }

         // get & validate our data
         const artist = user_data.username // important: user USERNAME! this is used to recall a display name later
         const title = req.body.title
         const lyrics = req.body.lyrics ? req.body.lyrics : ""
         const description = req.body.description ? req.body.description : ""

         if (lyrics.length > files.MAX_LYRICS_LENGTH) return res.status(400).send({ message: "Exceeds maximum lyrics length" })
         if (description.length > files.MAX_DESCRIPTION_LENGTH) return res.status(400).send({ message: "Exceeds maximum description length" })

         let pulled_artists = req.body.artists ? JSON.parse(req.body.artists) : []
         let artists = [ artist ]
         if (req.body.artists && pulled_artists.length > 0) {
            if (pulled_artists.length > files.MAX_ARTISTS) return res.status(400).send({ message: "Surpassed artist limit" })
            if (pulled_artists.includes(user_data.username)) return res.status(400).send({ message: "You are already apart of this track" })

            for (let i = 0; i < pulled_artists.length; i++) {
               if (users.validate_displayname(pulled_artists[i]) != 0) {
                  return res.status(400).send({ message: pulled_artists[i] + " is an invalid name"})
               }
            }

            artists = [ artist, ...pulled_artists ]
         }

         if (artist == undefined || title == undefined || artist.length == 0 || title.length == 0) {
            return res.status(400).send({ message: "Invalid artist/title" })
         }

         const validate_title = users.validate_tracktitle(title)
         if (validate_title != 0) {
            return res.status(400).send({ message: validate_title })
         }

         const userfiles = req.files
         
         if (!userfiles.track) {
            return res.status(400).send({ message: "Upload a file" })
         }

         // track file is required. album optional
         const trackfile = userfiles.track[0]
         trackfile.originalname = trackfile.originalname.replace(/ /g, "_")
         const trackfile_validation = files.validate_filename(trackfile.originalname, ".mp3")
         if (trackfile_validation != 0) {
            return res.status(400).send({ message: trackfile_validation })
         }

         const albumfile = userfiles.album ? userfiles.album[0] : undefined
         if (albumfile) {
            albumfile.originalname = albumfile.originalname.replace(/ /g, "_")
            const albumfile_validation = files.validate_filename(albumfile.originalname)
            if (albumfile_validation != 0) {
               return res.status(400).send({ message: albumfile_validation })
            }
         }

         // validate file sizes
         if (trackfile.buffer.length / 1024 > files.MAX_TRACK_SIZE_KB) {
            return res.status(400).send({ message: "Track file is too big (exceeds " + Math.floor(files.MAX_TRACK_SIZE_KB / 1024) + "mb limit)" })
         }
         if (albumfile && albumfile.buffer.length / 1024 > files.MAX_ALBUM_SIZE_KB) {
            return res.status(400).send({ message: "Album file is too big (exceeds " + Math.floor(files.MAX_ALBUM_SIZE_KB)+ "kb limit)" })
         }

         let filename = await files.upload_file(trackfile, files.tracks_bucket)
         let url = files.get_static_link(filename, files.tracks_bucket_name)
         let album
         if (albumfile) album = files.get_static_link(await files.upload_file(albumfile, files.albums_bucket), files.albums_bucket_name)
         else album = files.get_static_link("default.webp", files.albums_bucket_name)

         const uuid = crypto.randomUUID()

         // save entry into database
         const newentry = {
            artist,
            artists,
            title,
            lyrics,
            description,
            filename,
            originalfilename: trackfile.originalname,
            url,
            album,
            duration: await files.get_track_duration(trackfile.buffer),
            plays: 0, // in clicks
            listen_time: 0.0, // in seconds
            likes: 0,
            winner: false,
            event: current_event,
            release_date: [ new Date() ],
            uuid
         }

         // save track to db
         await fb.set_doc("tracks", uuid, newentry)
         // save track to current event
         await fb.update_doc("events", current_event, {
            tracks: fb.FieldValue.arrayUnion(uuid)
         })

         res.status(200).send({ message: "Successfully uploaded" })
      } catch (err) {
         throw err
         print("Error uploading file: " + err)
         res.status(400).send({ message: "Error uploading file" })
      }
   }
}
