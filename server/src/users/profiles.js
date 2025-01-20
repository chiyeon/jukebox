/*
 * Contains functions for endpoints concerning user profile edits (change bio, profile pic, etc)
 */
const users = require("users.js")
const fb = require("../db/firebase.js")

module.exports = {
   update_bio: async (req, res) => {
      let bio = req.body.bio

      if (!bio || bio.length == 0) bio = users.DEFAULT_BIO

      const validation = users.validate_bio(bio)
      if (validation != 0) {
         return res.status(400).send({ message: validation })
      }

      await fb.update_doc("users", req.username, { bio: bio })

      res.status(200).send({ message: "Updated biography" })
   },

   update_icon: async (req, res) => {
      /* requires auth. requires file upload 'icon'*/
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
      let iconlink = files.get_static_link(iconfile, files.profiles_bucket_name)

      await fb.update_doc("users", req.username, { icon: iconlink })

      res.status(200).send({ message: "Updated icon" })
   },


}
