'use strict'
var domain = require('domain')
var createErrorTemplate = require('./createErrorTemplate')

function noop () {}

module.exports = function (context) {
  var run = context.run
  var file = context.file
  var name = context.name || 'unnamed'
  var nameUC = name.toUpperCase()
  var then = context.then
  var args = context.args

  if (!Array.isArray(args)) {
    args = []
  }

  if (run === undefined || run === null) {
    // Allow a function to be missing, in this case it will
    // just return true
    return setImmediate(then)
  }

  setImmediate(function () {
    var timeout = context.timeout
    var d = domain.create()
    var errorHandler = function (e, code, message, timeout) {
      var _cb = cb
      cb = noop
      setTimeout(function () {
        var err = createErrorTemplate(file, nameUC + '_' + code, message, e)
        if (timeout) {
          err.timeout = timeout
        }
        _cb(err)
      }, 100)
      // In some cases (inconsistently) d.on('error') is not catching the error
      // In those cases the uncaughtException is thrown and then it consistently
      // runs into timeout collisions. With a delay it is possible that the timeout
      // collisions can be worked-around
    }
    var uncaughtHandler = function (err) {
      errorHandler(err, 'UNHANDLED', 'Unexpected error while ' + name)
    }
    var cb = function (err, result) {
      cb = noop
      clearTimeout(timer)
      process.removeListener('uncaughtException', uncaughtHandler)
      try {
        d.destroy()
      } catch (e) {
        // Sniff the error
      }
      setImmediate(function () {
        then(err, result)
      })
    }
    args.unshift(run)
    args.push(function (err, result) {
      setImmediate(function () {
        if (err) {
          return errorHandler(err, 'ASYNC', 'Error returned by ' + name)
        }
        cb(null, result)
      })
    })

    var timer
    if (timeout > 0) {
      timer = setTimeout(function () {
        errorHandler(undefined, 'TIMEOUT', 'Timeout while running ' + name, timeout)
      }, timeout)
    }

    process.on('uncaughtException', uncaughtHandler)

    try {
      d.on('error', uncaughtHandler)
      d.run.apply(d, args)
    } catch (e) {
      errorHandler(e, 'SYNC', 'Error while running ' + name)
    }
  })
}
