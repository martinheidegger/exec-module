'use strict'

function toErrorString () {
  if (this.cause) {
    return this.message + ', cause: \n' + this.cause.stack
  }
  return this.message
}

module.exports = function createErrorTemplate (path, code, message, cause) {
  var err
  if (cause && cause.code) {
    err = cause
    err.raw = err.message
    err.message = message + ': ' + err.message
  } else {
    err = new Error(message)
    err.cause = cause
    err.code = 'ERR_' + code
    err.toString = toErrorString
  }
  err.path = path
  return err
}
