var domain = require('domain')

function noop () {}

function asyncNoop () {
  setImmediate(arguments[arguments.length - 1])
}

function createErrorTemplate (file, code, message, cause) {
  var err
  if (cause && cause.code) {
    err = cause
    err.raw = err.message
    err.message = message + ': ' + err.message
  } else {
    err = new Error(message)
    err.cause = cause
    err.code = code
  }
  err.file = file
  return err
}

var killTimer = require('./lib/killTimer')

module.exports = function execAsync (file, opt, callback) {
  if (callback === undefined && typeof opt === 'function') {
    callback = opt
    opt = {}
  } else if (typeof opt !== 'object') {
    throw new Error('Option needs to be an object.')
  }
  if (typeof file !== 'string' && !/^\s*$/.test(file)) {
    throw new Error('File needs to be pointing somewhere.')
  }

  var setUp = (typeof opt.setUp === 'function') ? opt.setUp : asyncNoop
  var tearDown = (typeof opt.tearDown === 'function') ? opt.tearDown : asyncNoop
  var exec = (typeof opt.exec === 'function') ? opt.exec : function (file, opt, mod, callback) {
    mod(callback)
  }
  var finalCleanup = (typeof opt.cleanup === 'function') ? opt.cleanup : asyncNoop
  var state = {
    code: 'ESETUP'
  }
  var handler = function (err) {
    cleanup(createError(state.code + 'UNHANDLED', 'Unhandled error occurred.', err))
  }
  var createError = createErrorTemplate.bind(null, file)
  var lock = false
  var cleanup = function (err, data) {
    if (lock) {
      return
    }
    lock = true
    cleanup = noop

    finalCleanup(opt, file, err, function (err2) {
      if (err2 && !err) {
        err = createError('ECLEANUP', 'Error while cleaning up.', err2)
      }
      callback(err, data)
      try {
        d.dispose()
      } catch (e) {
        // Smoking this error
      }
    })
  }
  if (opt.timeout) {
    var err = createError('ETIMEOUT', 'Timeout while executing module.')
    err.timeout = opt.timeout
    cleanup = killTimer(cleanup, opt.timeout, err)
  } else {
    cleanup.initTimeout = noop
    cleanup.cancelTimeout = noop
  }

  var d = domain.create()
  d.on('error', handler)
  d.run(function () {
    d.add(opt)
    d.add(state)
    try {
      d.run(setUp, opt, file, function (err) {
        if (err) {
          return cleanup(createError(state.code + 'ASYNC', 'Error returned from setting up the module', err))
        }
        cleanup.initTimeout()
        state.code = 'ELOAD'
        try {
          mod = require(file)
        } catch (err) {
          return cleanup(createError(state.code, 'Error while loading the module.', err))
        }
        if (typeof mod !== 'function') {
          return cleanup(createError('ETYPE', 'Module doesn\'t return function.', err))
        }
        cleanup.initTimeout()
        state.code = 'EEXEC'
        d.run(exec, file, opt, mod, function (err, data) {
          cleanup.cancelTimeout()
          if (err) {
            err = createError(state.code + 'ASYNC', 'Error returned from the module.', err)
          }
          state.code = 'ETEARDOWN'
          try {
            d.run(tearDown, opt, file, err, function (err2) {
              if (err2 && !err) {
                err = createError(state.code + 'ASYNC', 'Error returned from tearing down the module.', err2)
              }
              cleanup(err, data)
            })
          } catch (err) {
            cleanup(createError(state.code + 'SYNC', 'Error thrown during tearDown of the module', err))
          }
        })
      })
    } catch (err) {
      return cleanup(createError(state.code + 'SYNC', 'Error thrown during setup of the module', err))
    }
  })
}
