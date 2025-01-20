/*
 * Simple Helper Functions
 */

/**
 * Prints formatted message to console
 * @param {String} message Message to put to console
 */
const print = (message) => {
   let now = new Date()
   console.log(`[${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}]: ${message}`)
}

module.exports = {
   print
}
