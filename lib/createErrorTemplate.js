'use strict'

function toErrorString (stack) {
  return function () {
    if (this.extMessage) {
      return this.extMessage + ', cause: \n' + stack
    }
    return this.message
  }
}

module.exports = function createErrorTemplate (path, code, message, cause) {
  var err
  if (cause) {
    if (typeof cause !== 'object') {
      cause = new Error(String(cause))
    }
    err = cause
    err.extMessage = message
    if (!err.code) {
      err.toString = toErrorString('\n' + err.stack)
      err.stack = err.toString()
    } else {
      err.toString = toErrorString('')
    }
  } else {
    err = new Error(message)
    err.toString = toErrorString('')
    err.stack = err.toString()
  }
  if (!err.code) {
    err.code = 'ERR_' + code
  }
  err.path = path
  return err
}
