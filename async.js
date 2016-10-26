'use strict'
var execAsync = require('./lib/execAsync')
var createErrorTemplate = require('./lib/createErrorTemplate')
var fs = require('fs')

module.exports = function (file, opt, callback) {
  if (callback === undefined && typeof opt === 'function') {
    callback = opt
    opt = {}
  }
  if (typeof opt !== 'object') {
    throw new Error('Option needs to be an object.')
  }
  if (typeof file !== 'string' || /^\s*$/.test(file)) {
    throw new Error('File needs to be pointing somewhere.')
  }
  var tearDown = function (err, data) {
    execAsync({
      name: 'tearDown',
      run: opt.tearDown,
      allowEmpty: true,
      args: [file, opt, err, data],
      file: file,
      then: function (err2) {
        callback(err || err2, data)
      }
    })
  }

  fs.stat(file, function (statErr, stat) {
    if (statErr) {
      return callback(createErrorTemplate(file, 'STAT_ERR', 'Error while looking for stat of file', statErr))
    }
    if (stat && !stat.isFile()) {
      return callback(createErrorTemplate(file, 'STAT_NOFILE', 'Path is not a file'))
    }
    fs.access(file, fs.constants ? fs.constants.R_OK : fs.R_OK, function (accessErr) {
      if (accessErr) {
        return callback(createErrorTemplate(file, 'EACCES', 'File is not readable', accessErr))
      }
      try {
        var mod = require(file)
      } catch (reqErr) {
        return callback(createErrorTemplate(file, 'LOAD', 'Error while loading file', reqErr))
      }
      if (typeof mod !== 'function') {
        return callback(createErrorTemplate(file, 'FUNCTION_WRONG', 'Function needs to be a function.'))
      }
      if (opt.argCount !== undefined && mod.length !== opt.argCount) {
        var argErr = createErrorTemplate(file, 'FUNCTION_ARG_WRONG', 'Function argument count mismatch.')
        argErr.expected = opt.argCount
        argErr.actual = mod.length
        return callback(argErr)
      }
      var run = function (err, result) {
        if (err) {
          return callback(err)
        }
        execAsync({
          name: 'run',
          run: opt.exec || function (file, opt, mod, callback) {
            mod(callback)
          },
          args: [file, opt, mod],
          file: file,
          timeout: opt.timeout,
          then: tearDown
        })
      }

      execAsync({
        name: 'setUp',
        run: opt.setUp,
        allowEmpty: true,
        args: [file, opt],
        file: file,
        then: run
      })
    })
  })
}
