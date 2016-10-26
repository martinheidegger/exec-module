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
    var cb = function (err, result) {
      cb = noop
      clearTimeout(timer)
      try {
        d.destroy()
      } catch (e) {
        // Sniff the error
      }
      then(err, result)
    }
    args.unshift(run)
    args.push(function (err, result) {
      setImmediate(function () {
        if (err) {
          return cb(createErrorTemplate(file, nameUC + '_ASYNC', 'Error returned by ' + name, err))
        }
        cb(null, result)
      })
    })

    var timer
    if (timeout > 0) {
      timer = setTimeout(function () {
        var err = createErrorTemplate(file, nameUC + '_TIMEOUT', 'Timeout while running ' + name)
        err.timeout = timeout
        cb(err)
      }, timeout)
    }

    try {
      d.on('error', function (e) {
        cb(createErrorTemplate(file, nameUC + '_UNHANDLED', 'Unexpected error while ' + name, e))
      })
      d.run.apply(d, args)
    } catch (e) {
      cb(createErrorTemplate(file, nameUC + '_SYNC', 'Error while running ' + name, e))
    }
  })
}
