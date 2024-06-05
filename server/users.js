const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const fb = require("./firebase.js")

const TOKEN_EXPIRATION_TIME_STR = "400d"
const TOKEN_EXPIRATION_TIME = 400 * 24 * 60 * 60 * 1000
// user permissions
const USER_BASE = 0     // basic account, cannot do anything
const USER_NORMAL = 1   // normal account that can upload to beat battles
const USER_ADMIN = 2    // superuser access

// these rules are for display names & usernames
const MIN_USERNAME_LENGTH = 3
const MAX_USERNAME_LENGTH = 20
const MIN_BIO_LENGTH = 0
const MAX_BIO_LENGTH = 300
const USERNAME_REGEX_VALIDATION = /^[a-zA-Z0-9_.-]+$/
const MIN_PASSWORD_LENGTH = 3
const MAX_PASSWORD_LENGTH = 50
const PASSWORD_REGEX_VALIDATION = /^[A-Za-z\d@$!%*?&_\-.^#]+$/
const MIN_EMAIL_LENGTH = 6
const MAX_EMAIL_LENGTH = 40
const MIN_TITLE_LENGTH = 1
const MAX_TITLE_LENGTH = 50

const DEFAULT_BIO = "This user has no bio."

const validate_tracktitle = (title) => {
   if (!title || typeof title != "string") return "Invalid title"
   if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) return `Title must be between ${MIN_TITLE_LENGTH} and ${MAX_TITLE_LENGTH} characters`
   return 0
}

const validate_displayname = (displayname) => {
   if (!displayname || typeof displayname != "string") return "Invalid display name"
   if (displayname.length < MIN_USERNAME_LENGTH || displayname.length > MAX_USERNAME_LENGTH) return `Displayname must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`
   return 0 
}

const validate_username = (username) => {
   if (!username || typeof username != "string") return "Invalid username"
   if (username.length < MIN_USERNAME_LENGTH || username.length > MAX_USERNAME_LENGTH) return `Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`
   if (!USERNAME_REGEX_VALIDATION.test(username)) return "Username contains invalid characters (Must be A-z 0-9 - _ .)"
   return 0
}

const validate_bio = (bio) => {
   if (!bio || typeof bio != "string") return "Invalid bio"
   if (bio.length < MIN_BIO_LENGTH || bio.length > MAX_BIO_LENGTH) return `Bio must be between ${MIN_BIO_LENGTH} and ${MAX_BIO_LENGTH} characters`
   return 0
}

const validate_password = (password) => {
   if (!password || typeof password != "string") return "Invalid password"
   if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) return `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`
   if (!PASSWORD_REGEX_VALIDATION.test(password)) return "Password contains invalid characters (Must be A-z 0-9 !@#$%^&*_-)"
   return 0
}

const validate_email = (email) => {
   if (!email || typeof email != "string") return "Invalid email"
   if (!email.includes("@") || !email.includes(".")) return "Invalid email"
   if (email.length < MIN_EMAIL_LENGTH || email.length > MAX_EMAIL_LENGTH) return "Invalid email size"
   return 0
}

const check_token = (token) => {
   return new Promise((resolve, reject) => {
      if (!token) {
         return resolve(false)
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
         if (err) {
            console.log(err)
            resolve(false)
         } else {
            resolve(user)
         }
      })
   })
}

// express middleware fn, check for valid authenticate token or throw error
const authenticate_token = (req, res, next) => {
   let token = req.cookies.authentication_token

   if (!token) {
      return res.status(400).send({ message: "No token provided." })
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
      return res.status(400).send({ message: "No token provided." })
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
const create_new_user = async (user, permissions = USER_BASE) => {
   const hashed_password = await bcrypt.hash(user.password, 10)
   const newuser = {
      username: user.username,
      creation_date: new Date(),
      streams: 0,
      listens: 0,
      display_name: user.username,
      permissions: permissions,
      bio: user.bio,
      icon: user.icon,
   }

   // save hashed password & user email in passwords db
   await fb.set_doc("passwords", user.username, { 
      password: hashed_password,
      email: user.email
   })
   // save (public) user data in users db
   await fb.set_doc("users", user.username, newuser)

   // get our secure token
   const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
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
   check_token,
   validate_username,
   validate_bio,
   validate_password,
   validate_email,
   validate_displayname,
   validate_tracktitle,
   DEFAULT_BIO,
}
