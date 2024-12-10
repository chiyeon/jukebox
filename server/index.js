const users = require("./users.js")
const files = require("./files.js")
const fs = require("fs")
const express = require("express")
const { print } = require("./utils.js")
const fb = require("./firebase.js")
const path = require("path")
require("dotenv").config()
const cookieparser = require("cookie-parser")
const crypto = require("crypto")
const { badges } = require("./badges.js")
// const cors = require("cors")

const playlists = require("./playlists.js")

const app = express()
const PORT = process.env.PORT || 3000
const cookie_settings = {
   httpOnly: true,
   secure: true, // prod change to true
   sameSite: "Strict",
   maxAge: users.TOKEN_EXPIRATION_TIME,
}

let tracks = {}
let events = {}
let events_list = []
let playlists_cache = {}

const stats_collection = "stats-2025"

app.use(express.json())
app.use(cookieparser())

app.post("/api/eventcreate", users.authenticate_token_admin, async (req, res) => {
   const uuid = crypto.randomUUID()
   const date = new Date()
   const name = req.body.name
   const desc = req.body.desc
   const tags = req.body.tags
   const newevent = {
      date: [ date ],
      name,
      desc,
      tags,
      uuid,
      tracks: [],
      open: req.body.open ? req.body.open : false,
      featured: req.body.featured ? req.body.featured : false
   }
   await fb.set_doc("events", uuid, newevent)
   return res.status(200).send({ message: "yay" })
})

app.post("/api/eventdelete", users.authenticate_token_admin, async (req, res) => {
   const uuid = req.body.uuid
   if (!uuid || uuid == "") return res.status(400).send({ message: "Invalid/empty UUID" })
   let event = await fb.get_doc("events", uuid)
   if (!event) return res.status(400).send({ message: "Invalid event UUID" })

   // delete tracks inside event
   for (let i = 0; i < event.tracks.length; i++) {
      let track = tracks[event.tracks[i]]
      if (!track) continue

      await delete_track(track)
   }

   await fb.delete_doc("events", uuid)

   return res.status(200).send()
})

app.post("/api/eventupdate", users.authenticate_token_admin, async (req, res) => {
   const uuid = req.body.uuid
   const changes = req.body.changes
   if (!uuid || uuid == "") return res.status(400).send({ message: "Invalid/empty UUID" })
   let event = await fb.get_doc("events", uuid)
   if (!event) return res.status(400).send({ message: "Invalid event UUID" })

   await fb.update_doc("events", uuid, changes)

   return res.status(200).send()
})

app.post("/api/eventclose", users.authenticate_token_admin, async (req, res) => {
   const uuid = req.body.uuid
   if (!uuid || uuid == "") return res.status(400).send({ message: "Invalid/empty UUID" })
   let event = await fb.get_doc("events", uuid)
   if (!event) return res.status(400).send({ message: "Invalid event UUID" })
   let date = event.date

   if (date.length >= 2) date[1] = fb.get_timestamp(new Date())
   else date.push(fb.get_timestamp(new Date()))

   await fb.update_doc("events", uuid, { 
      open: false,
      date
   })

   await res.status(200).send()
})

// update user name
// app.post("/api/update_displayname", users.authenticate_token, async (req, res) => {
//    const newname = req.body.display_name

//    const validation = users.validate_displayname(newname)
//    if (validation != 0) {
//       return res.status(400).send({ message: validation })
//    }

//    await fb.update_doc("users", req.username, { display_name: newname })

//    res.status(200).send({ message: "Updated display name" })
// })

app.post("/api/update_bio", users.authenticate_token, async (req, res) => {
   let bio = req.body.bio

   if (!bio || bio.length == 0) bio = users.DEFAULT_BIO

   const validation = users.validate_bio(bio)
   if (validation != 0) {
      return res.status(400).send({ message: validation })
   }

   await fb.update_doc("users", req.username, { bio: bio })

   res.status(200).send({ message: "Updated biography" })
})

app.post("/api/update_icon", users.authenticate_token, files.upload.single("icon"), async (req, res) => {
   if (!req.file) return res.status(400).send({ message: "Submit an icon" })
   let icon = req.file
   icon.originalname = icon.originalname.replace(/ /g, "_")

   let validation = files.validate_filename(icon.originalname)
   if (validation != 0) {
      return res.status(400).send({ message: validation })
   }

   // validate picture size
   if (icon.buffer.length / 1024 > files.MAX_ICON_SIZE_KB) {
      return res.status(400).send({ message: "Profile icon file is too big (exceeds " + Math.floor(files.MAX_ICON_SIZE_KB)+ "kb limit)" })
   }

   // delete old icon
   let split_names = (await fb.get_doc("users", req.username)).icon.split("/")
   let old_icon_name = split_names[split_names.length - 1]
   if (old_icon_name != "default_icon.webp") await files.delete_file(old_icon_name, files.profiles_bucket) 

   const iconfile = await files.upload_file(icon, files.profiles_bucket)
   let iconlink = files.get_gcloud_link(iconfile, files.profiles_bucket_name)

   await fb.update_doc("users", req.username, { icon: iconlink })

   res.status(200).send({ message: "Updated icon" })
})

// requires authenticated user
// takes a payload of at least 1 (track) file, up to 2 (second is album) files
// and a string title
// validates files then uploads to storage & sets in db
app.post("/api/upload", users.authenticate_token, files.upload.fields([
      { name: "track" },
      { name: "album", maxCount: 1 }
   ]), async (req, res) => {
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

         if (lyrics.length > files.MAX_LYRICS_LENGTH) return res.status(400).send({ message: "Exceeds maximum lyrics length" })

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
         let url = files.get_gcloud_link(filename, files.tracks_bucket_name)
         let album
         if (albumfile) album = files.get_gcloud_link(await files.upload_file(albumfile, files.albums_bucket), files.albums_bucket_name)
         else album = files.get_gcloud_link("default.webp", files.albums_bucket_name)

         const uuid = crypto.randomUUID()

         // save entry into database
         const newentry = {
            artist,
            artists,
            title,
            lyrics,
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
   })

const delete_album = async (trackdata) => {
   let albumfile = trackdata.album.split("/")
   albumfile = albumfile[albumfile.length - 1]
   if (albumfile != "default.webp" && albumfile != "tmf_album.webp") await files.delete_file(albumfile, files.albums_bucket)
}

const delete_track = async (trackdata) => {
   let trackfile = trackdata.filename
   await files.delete_file(trackfile, files.tracks_bucket)

   // then delete data from track & events db
   await fb.delete_doc("tracks", trackdata.uuid) 
   await fb.update_doc("events", trackdata.event, {
      tracks: fb.FieldValue.arrayRemove(trackdata.uuid)
   })
}

app.post("/api/deletetrack", users.authenticate_token, async (req, res) => {
   const track_id = req.body.track_id
   if (!track_id) return res.status(400).send({ message: "Invalid track" })

   // try to find our track
   const trackdata = tracks[track_id]
   if (!trackdata) return res.status(400).send({ message: "Invalid track" })
   if (trackdata.artist != req.username) return res.status(400).send({ message: "You cannot delete this track" })

   // delete the track :c

   // start with deleting track and album ONLY IF NOT DEFAULT !!!
   await delete_album(trackdata)
   await delete_track(trackdata)
   return res.status(200).send({ message: "Deleted track" })
})

app.post("/api/edittrack", users.authenticate_token, files.upload.single("album"), async (req, res) => {
   const uuid = req.body.uuid
   if (!uuid) return res.status(400).send({ message: "No UUID provided" })

   const album = req.file ? req.file : null

   // get our copy
   const trackdata = await tracks[uuid]
   if (!trackdata) return res.status(400).send({ message: "Invalid UUID" })
   if (trackdata.artist != req.username) return res.status(400).send({ message: "You cannot edit this track" })

   // validate our stuff
   let pulled_artists = req.body.artists ? JSON.parse(req.body.artists) : [ ]
   if (req.body.artists && pulled_artists.length > 0) {
      if (pulled_artists.length > files.MAX_ARTISTS) return res.status(400).send({ message: "Surpassed artist limit" })
      if (pulled_artists.includes(trackdata.artist)) return res.status(400).send({ message: "You are already apart of this track" })

      for (let i = 0; i < pulled_artists.length; i++) {
         if (users.validate_displayname(pulled_artists[i]) != 0) {
            return res.status(400).send({ message: pulled_artists[i] + " is an invalid name"})
         }
      }
   }

   pulled_artists.unshift(trackdata.artist)

   const validate_title = users.validate_tracktitle(req.body.title)
   if (validate_title != 0) {
      return res.status(400).send({ message: validate_title })
   }

   // validate album
   if (album) {
      const validation = files.validate_filename(album.originalname)
      if (validation != 0) return res.status(400).send({ message: validation })

      if (album.buffer.length / 1024 > files.MAX_ALBUM_SIZE_KB) {
         return res.status(400).send({ message: "Album file is too big (exceeds " + Math.floor(files.MAX_ALBUM_SIZE_KB)+ "kb limit)" })
      }
   }
   
   let updated_track = {
      title: req.body.title,
      lyrics: req.body.lyrics ? req.body.lyrics : "",
      artists: pulled_artists
   }

   // why is there another if? idk
   if (album) {
      // delete old album & upload
      await delete_album(trackdata)
      let album_link = files.get_gcloud_link(await files.upload_file(album, files.albums_bucket), files.albums_bucket_name)
      updated_track.album = album_link
   }

   // update server db
   await fb.update_doc("tracks", uuid, updated_track)

   return res.status(200).send({ message: "Track updated successfully" })
})

app.post("/api/removefromtrack", users.authenticate_token, async (req, res) => {
   const track_id = req.body.track_id
   if (!track_id) return res.status(400).send({ message: "Invalid track" })

   const trackdata = tracks[track_id]
   if (!trackdata) return res.status(400).send({ message: "Invalid track" })
   if (trackdata.artist == req.username) return res.status(400).send({message: "You own this track" })
   if (!trackdata.artists.includes(req.username)) return res.status(400).send({ message: "You are not part of this track" })

   await fb.update_doc("tracks", track_id, {
      artists: fb.FieldValue.arrayRemove(req.username)
   })

   return res.status(200).send({ message: "Removed you from track" })
})

app.post("/api/login", files.upload.none(), async (req, res) => {
   try {
      const username = req.body.username 
      const password = req.body.password

      // validate packet
      if (username == undefined || password == undefined || username == "" || password == "") {
         return res.status(400).send({ message: "Invalid request" })
      }
      
      // authenticate user (returns -1 on error)
      const token = await users.login_user(username, password)
      if (token < 0) {
         return res.status(400).send({ message: "Invalid username/password combination" })
      }

      // get user data to return to user
      let userdata = await fb.get_doc("users", username)
      if (userdata == undefined) {
         return res.status(400).send({ message: "Invalid account: user data doesn't exist" })
      }

      // save cookie w client
      res.cookie("authentication_token", token, cookie_settings)
      res.status(200).send({ message: "Login successful", user: userdata })
   } catch (err) {
      res.status(500).send({ message: "Unable to login" })
      print(err)
   }
})

app.post("/api/signup", files.upload.fields([
      { name: "icon", maxCount: 1 }
   ]), async (req, res) => {
   try {
      const user = {
         username: req.body.username,
         password: req.body.password,
         email: req.body.email,
         bio: req.body.bio ? req.body.bio : users.DEFAULT_BIO,
      }

      // run validations
      const validate_username = users.validate_username(user.username)
      if (validate_username != 0) return res.status(400).send({ message: validate_username })

      const validate_bio = users.validate_bio(user.bio)
      if (validate_bio != 0) return res.status(400).send({ message: validate_bio })

      const validate_password = users.validate_password(user.password)
      if (validate_password != 0) return res.status(400).send({ message: validate_password })

      const validate_email = users.validate_email(user.email)
      if (validate_email != 0) return res.status(400).send({ message: validate_email })

      // check if username exists
      if ((await fb.get_doc("passwords", user.username)) != undefined) {
         return res.status(400).send({ message: "Username is taken" })
      }

      // upload profile picture if there
      const icon = req.files.icon ? req.files.icon[0] : undefined
      if (icon) {
         icon.originalname = icon.originalname.replace(/ /g, "_")
         const validate_iconname = files.validate_filename(icon.originalname)
         if (validate_iconname != 0) {
            return res.status(400).send({ message: validate_iconname })
         }
         // validate picture size
         if (icon.buffer.length / 1024 > files.MAX_ICON_SIZE_KB) {
            return res.status(400).send({ message: "Profile icon file is too big (exceeds " + Math.floor(files.MAX_ICON_SIZE_KB)+ "kb limit)" })
         }

         const iconfile = await files.upload_file(icon, files.profiles_bucket)
         user.icon = files.get_gcloud_link(iconfile, files.profiles_bucket_name)
      } else {
         user.icon = files.get_gcloud_link("default_icon.webp", files.profiles_bucket_name)
      }

      // get & save token
      const token = await users.create_new_user(user)
      let newuser = await fb.get_doc("users", user.username)

      res.cookie("authentication_token", token, cookie_settings)
      res.status(200).json({ message: "Account created successfully!", user: newuser })
   } catch (err) {
      res.status(500).json({ message: "Failed to create account.", error: err })
      print(err)
   }
})

app.post("/api/logout", (req, res) => {
   const token = req.cookies.authentication_token
   if (!token) {
      return res.status(201).send({ message: "No need to sign out" })
   }
   res.clearCookie("authentication_token")
   res.status(200).send({ message: "Signed out successfully" })
})

const get_full_user_data = async(username) => {
   let userdata = await fb.get_doc("users", username)
   if (userdata) {
      // put total num tracks & wins in data. this is for user profile. copy as needed
      let tracks = await fb.get_docs_by_query("tracks", [ "artists", "array-contains", username ])
      userdata.num_tracks = tracks.length
      userdata.tracks = tracks
      userdata.plays = tracks.reduce((sum, o) => sum + (o.plays ? o.plays : 0), 0);
      userdata.listen_time = tracks.reduce((sum, o) => sum + (o.listen_time ? o.listen_time : 0), 0);
      userdata.num_wins = tracks.filter(t => t.winner).length
      // lets censor their playlists, it may be "private"
      userdata.num_playlists = userdata.playlists ? userdata.playlists.length : 0
      // also replace their badge ids with the badge data. see statement above
      let user_badges = userdata.badges ? userdata.badges.map(badge => badges[badge]) : []
      userdata.badges = user_badges
      delete userdata.playlists
   }
   return userdata
}

app.post("/api/user", async (req, res) => {

   if (req.body.username == undefined) {
      return res.status(400).send({ message: "Requires 'username' in request body" })
   }

   const data = await get_full_user_data(req.body.username)
   if (data)
      res.status(200).send({ message: "Found user data", user: data })
   else
      res.status(400).send({ message: "Invalid username", user: undefined })
})

app.get("/api/userbytoken", async (req, res) => {
   const token = req.cookies.authentication_token

   if (!token) return res.status(201).send({ message: "no token"})
   const user = await users.check_token(token) // returns false on invalid, userdata on valid

   if (user) {
      let userdata = await fb.get_doc("users", user.username)
      res.status(200).send({ message: "Found user data", user: userdata })
   } else {
      res.status(201).send({ message: "Invalid or unprovided token", user: undefined })
   }
})

app.get("/api/events", async (req, res) => {
   res.json({
      events: events_list
   })
})

app.post("/api/tracks", async (req, res) => {
   if (req.body.username == undefined) {
      return res.status(400).send({ message: "Invalid username" })
   }

   let tracks = await fb.get_docs_by_query("tracks", [ "artists", "array-contains", req.body.username ])
   for (let i = 0; i < tracks.length; i++) {
      tracks[i].artist_display_names = await get_display_names(tracks[i])
   }

   tracks.sort((a, b) => get_timestamp_as_date(b.release_date) - get_timestamp_as_date(a.release_date))

   res.status(200).send({ message: "Found user tracks", tracks: tracks })
})

app.get("/api/openevents", users.authenticate_token, async (req, res) => {
   let open_events = []

   Object.keys(events).forEach(key => {
      if (events[key].open) {
         open_events.push({
            id: key,
            name: events[key].name
         })
      }
   })

   open_events.reverse()

   res.status(200).send({ events: open_events })
})

const add_playlist_cache = (req, res, next) => {
   req.playlists = playlists_cache
   next()
}

app.post("/api/playlist_create", users.authenticate_token, add_playlist_cache, files.upload.single("cover"), playlists.create_new_playlist)
app.post("/api/playlist_delete", users.authenticate_token, add_playlist_cache, playlists.delete_playlist)
app.post("/api/playlist_edit", users.authenticate_token, add_playlist_cache, files.upload.single("cover"), playlists.edit_playlist)
app.post("/api/playlist_add_tracks", users.authenticate_token, add_playlist_cache, playlists.add_to_playlist)
app.post("/api/playlist_remove_tracks", users.authenticate_token, add_playlist_cache, playlists.remove_from_playlist)
app.post("/api/playlists", users.authenticate_optional_token, add_playlist_cache, playlists.get_playlists_from_user)
app.post("/api/playlist", users.authenticate_optional_token, add_playlist_cache, (req, res) => {
   // pass our tracks cache
   req.tracks = tracks
   playlists.get_playlist_data(req, res)
})
app.post("/api/playlist_save", users.authenticate_token, add_playlist_cache, playlists.save_to_library)
app.post("/api/playlist_unsave", users.authenticate_token, add_playlist_cache, playlists.remove_from_library)

/*
 * Runs when any client clicks on a track. Increment listens (obviously not secure. but also issues as a ton of people click?
 *
 * optional token. if token is presented, update stats
 */
app.post("/api/track_listen", users.authenticate_optional_token, async (req, res) => {
   const uuid = req.body.uuid 
   let track

   // checks
   if (!uuid) return res.status(400).send({ message: "No track ID" })
   track = tracks[uuid]
   if (!track) return res.status(400).send({ message: "Invalid track ID" })

   if (!track.plays) track.plays = 1
   else track.plays += 1

   await fb.update_doc("tracks", uuid, {
      plays: track.plays
   })

   // update presonal stats if there
   if (req.username && req.username.length != 0) {
      let data = await fb.get_doc(stats_collection, req.username)
      if (!data) {
         await fb.set_doc(stats_collection, req.username, {
            total_plays: 1,
            tracks: {
               [uuid]: 1
            }
         })
      } else {
         await fb.update_doc(stats_collection, req.username, {
            total_plays: fb.FieldValue.increment(1),
            [`tracks.${uuid}`]: fb.FieldValue.increment(1)
         })
      }
   }

   return res.status(200).send({ message: "Track plays updated" })
})

/*
 * Run when a client "moves on" from a track, sends the track that got left behind. used for
 * record keeping listening time. NOT that accurate. tries to get these scenarios:
 *  - skips song
 *  - song finishes playing and goes to next
 *  - clicks a different song, skipping current
 */
app.post("/api/track_finished", async (req, res) => {
   const uuid = req.body.uuid
   const listen_time = req.body.listen_time // in seconds
   let track

   if (!uuid) return res.status(400).send({ message: "No track ID" })
   track = tracks[uuid]
   if (!track) return res.status(400).send({ message: "Invalid track ID" })
   if (listen_time - 1 > track.duration * 1.05) return res.status(400).send({ message: "Invalid listen time: exceeds song duration" })
   
   if (!track.listen_time) track.listen_time = listen_time
   else track.listen_time += listen_time

   await fb.update_doc("tracks", uuid, {
      listen_time: track.listen_time
   })

   return res.status(200).send({ message: "Track listen time updated" })
})

app.get("/api/rewind", users.authenticate_token, async (req, res) => {
   const user = await get_full_user_data(req.username)

   let filter = (track) => {
      return get_timestamp_as_date(track.release_date).getFullYear() == 2024
   }

   user.tracks = user.tracks.filter(filter)
   user.tracks.sort((a, b) => get_timestamp_as_date(b.release_date) - get_timestamp_as_date(a.release_date))
   user.creation_date = get_timestamp_as_date([user.creation_date])

   return res.status(200).send({ user: user })
})
   
const get_display_names = async (track) => {
   return track.artists
   let display_names = []
   for (let i = 0; i < track.artists.length; i++) {
      let user = await fb.get_doc("users", track.artists[i])
      display_names.push(user > 0 ? user[0].display_name : track.artists[i])
   }

   return display_names
}

// returns a firebase timestamp as a single date
// gets the latest date if a range
const get_timestamp_as_date = (timestamp) => {
   return new Date(timestamp[timestamp.length - 1]._seconds * 1000)
}

const init_events = async () => {
   events = await fb.get_collection("events")
   tracks = await fb.get_collection("tracks")

   // set display names
   for (let key in events) {
      events[key].tracks = get_tracks_as_objects(events[key].tracks)
   }

   events_list = Array.from(Object.values(events))
   events_list.sort((a, b) => get_timestamp_as_date(b.date) - get_timestamp_as_date(a.date))
}

// given a tracks array of UUIDs, return an array of their corresponding data objects
const get_tracks_as_objects = (uuids) => {
   let out = []
   for (let i = 0; i < uuids.length; i++) {
      out.push(tracks[uuids[i]])
   }
   return out
}

// run whenever an event is created/updated. simply set the tracks,
// then replace it in our events & repopulate events list
const update_events = async (new_events) => {
   let anything_updated = false

   for (let key in new_events) {
      switch (new_events[key].type) {
         case "added":
         case "modified":
            anything_updated = true
            new_events[key].tracks = get_tracks_as_objects(new_events[key].tracks)   

            // remove old & add to list
            if (events.hasOwnProperty(key)) {
               // updating an existing event: remove it!
               events_list = events_list.filter(e => e.uuid != key)
            }

            events_list.push(new_events[key])

            events[key] = new_events[key]
            break
         case "removed":
            events_list = events_list.filter(e => e.uuid != key)
            delete events[key]
            break
      }
   } 

   // resort array if added/updated
   if (anything_updated) {
      events_list.sort((a, b) => get_timestamp_as_date(b.date) - get_timestamp_as_date(a.date))
   }
}

const update_tracks = async (new_tracks) => {
   // add first
   for (let uuid in new_tracks) {
      tracks[uuid] = new_tracks[uuid]
   }

   for (let uuid in new_tracks) {
      // do this check early to cutoff
      let event = new_tracks[uuid].event
      if (!events.hasOwnProperty(event)) continue
      let i = events_list.findIndex(e => e.uuid == events[event].uuid)
      if (i < 0) continue
      // update our events list
      events[event].tracks 
      for (let j = 0; j < events[event].tracks.length; j++) {
         if (events[event].tracks[j].uuid == uuid) {
            events[event].tracks[j] = new_tracks[uuid]
         }
      }
      events_list[i] = events[event]
   }

   // theoretically events_list is still sorted here
}

const update_playlists = async (new_playlists) => {
   for (let key in new_playlists) {
      switch (new_playlists[key].type) {
         case "added":
         case "modified":
            playlists_cache[key] = new_playlists[key]
            break
         case "removed":
            delete playlists_cache[key]
            break
      }
   } 
}

const http = require("https")
const temp_fix = async () => {
   /*
   let b = 0
   for (uuid in tracks) {
      if (!b) {
         let track = tracks[uuid]
         
         //console.log(track)
         const f = fs.createWriteStream("p/" + uuid)

         await http.get(track.url, (res) => {
            if (res.statusCode != 200) return "bruh"
            res.pipe(f)
         })

         f.on("finish", async () => {
            await f.close(async () => {
               track.duration = await files.get_track_duration("p/" + uuid)
               console.log(track.title + ": " + track.duration)
               console.log(track.uuid)
               await fb.update_doc("tracks", track.uuid, track)
            })
         })
         track.duration = await files.get_track_duration("p/" + uuid)
         console.log(track.title + ": " + track.duration)
         await fb.update_doc("tracks", track.uuid, track)
      }
   }
   
         */
}

app.use(express.static(path.join(__dirname, "dist")))
app.get("*", (req, res) => {
   res.sendFile(path.join(__dirname, "/dist/index.html"))
})

app.listen(PORT, async () => {
   await init_events()

   fb.setup_collection_listener("events", update_events)
   fb.setup_collection_listener("tracks", update_tracks)
   fb.setup_collection_listener("playlists", update_playlists)

   print("started on port " + PORT)
})

