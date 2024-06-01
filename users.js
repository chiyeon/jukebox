const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const fb = require("./firebase.js")

const TOKEN_EXPIRATION_TIME_STR = "400d"
const TOKEN_EXPIRATION_TIME = 400 * 24 * 60 * 60 * 1000
// user permissions
const USER_BASE = 0     // basic account, cannot do anything
const USER_NORMAL = 1   // normal account that can upload to beat battles
const USER_ADMIN = 2    // superuser access

// express middleware fn, check for valid authenticate token or throw error
const authenticate_token = (req, res, next) => {
   let token = req.cookies.authentication_token 

   if (!token) {
      return res.status(400).send({ message: "Authorization failed." })
   }

   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
         console.log(err)
         return res.status(400).send({ message: "Invalid token" })
      }

      req.username = user.username
   })
   next()
}

// express middleware fn, check for valid auth token + permissions (>= USER_ADMIN [val = 2])
const authenticate_token_admin = (req, res, next) => {
   let token = req.cookies.authentication_token 

   if (!token) {
      return res.status(400).send({ message: "Authorization failed." })
   }

   jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
      if (err) {
         console.log(err)
         return res.status(400).send({ message: "Invalid token" })
      }

      let userdata = await fb.get_doc("users", user.username)

      if (userdata < USER_ADMIN) {
         console.log(`User ${user.username} attempted superuser task`)
         return res.status(400).send({ message: "Invalid permissions" })
      }

      req.username = user.username
   })
   next()
}

// log into existing user
// returns auth token on success, -1 on fail
const login_user = async (username, password) => {
   if ((await test_password(username, password)) < 0) {
      return -1
   }

   const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRATION_TIME_STR })
   return token
}

// create new user & return their secure token
const create_new_user = async (username, password, permissions = USER_BASE) => {
   const hashed_password = await bcrypt.hash(password, 10)
   const newuser = {
      username,
      creation_date: new Date(),
      streams: 0,
      listens: 0,
      display_name: username,
      permissions: permissions
   }

   // save hashed password in passwords db
   await fb.set_doc("passwords", username, { password: hashed_password })
   // save (public) user data in users db
   await fb.set_doc("users", username, newuser)

   // get our secure token
   const token = jwt.sign({ username }, process.env.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRATION_TIME 
   })

   return token
}

// checks if username/password combo is valid
// returns -1 on fail/no and 1 on yes
const test_password = async (username, password) => {
   let actual_password = await fb.get_doc("passwords", username)
   if (actual_password == undefined) { return -1 }
   if (!(await bcrypt.compare(password, actual_password.password))) { return -1 }
   return 1
}

module.exports = {
   TOKEN_EXPIRATION_TIME,
   TOKEN_EXPIRATION_TIME_STR,
   USER_BASE,
   USER_NORMAL,
   USER_ADMIN,
   authenticate_token,
   authenticate_token_admin,
   login_user,
   create_new_user,
   test_password,
}
