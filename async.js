'use strict'
var execAsync = require('./lib/execAsync')
var createErrorTemplate = require('./lib/createErrorTemplate')

module.exports = function (file, opt, callback) {
  if (callback === undefined && typeof opt === 'function') {
    callback = opt
    opt = {}
  }
  if (typeof opt !== 'object') {
    throw new Error('Option needs to be an object.')
  }
  if (typeof file !== 'string' && !/^\s*$/.test(file)) {
    throw new Error('File needs to be pointing somewhere.')
  }
  var tearDown = function (err, data) {
    execAsync({
      name: 'tearDown',
      run: opt.tearDown,
      allowEmpty: true,
      args: [opt, file, err, data],
      file: file,
      then: function (err2) {
        callback(err || err2, data)
      }
    })
  }
  var run = function (err, result) {
    if (err) {
      return callback(err)
    }
    try {
      var mod = require(file)
    } catch (reqErr) {
      return callback(createErrorTemplate(file, 'LOAD', 'Error while loading file', reqErr))
    }
    if (mod === null || mod === undefined) {
      return tearDown(createErrorTemplate(file, 'FUNCTION_MISSING', 'Function required.'))
    }
    if (typeof mod !== 'function') {
      return tearDown(createErrorTemplate(file, 'FUNCTION_WRONG', 'Function needs to be a function.'))
    }
    if (opt.argCount !== undefined && mod.length !== opt.argCount) {
      var argErr = createErrorTemplate(file, 'FUNCTION_ARG_WRONG', 'Function argument count mismatch.')
      argErr.expected = opt.argCount
      argErr.actual = mod.length
      return tearDown(argErr)
    }
    try {
      execAsync({
        name: 'run',
        run: opt.exec || function (opt, file, mod, callback) {
          mod(callback)
        },
        args: [opt, file, mod],
        file: file,
        timeout: opt.timeout,
        then: tearDown
      })
    } catch (e) {
      tearDown(e)
    }
  }

  execAsync({
    name: 'setUp',
    run: opt.setUp,
    allowEmpty: true,
    args: [opt, file],
    file: file,
    then: run
  })
}
