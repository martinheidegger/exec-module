module.exports = function createErrorTemplate (file, code, message, cause) {
  var err
  if (cause && cause.code) {
    err = cause
    err.raw = err.message
    err.message = message + ': ' + err.message
  } else {
    err = new Error(message)
    err.cause = cause
    err.code = 'ERR_' + code
  }
  err.file = file
  return err
}
