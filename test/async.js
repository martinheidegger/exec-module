'use strict'
var fs = require('fs')
var path = require('path')
var execModule = require('../async.js')
var files = fs.readdirSync(path.join(__dirname, 'async')).reduce(function (files, file) {
  files[file.substr(0, file.length - path.extname(file).length)] = path.resolve(__dirname, 'async', file)
  return files
}, {})

var test = require('tap').test

test('Error due to wrong options type', function (t) {
  try {
    execModule(null, '', function () {
      t.fail('Arrived at unexpected block')
    })
  } catch (e) {
    t.equal(e.message, 'Option needs to be an object.')
    return t.done()
  }
  t.fail('No Error thrown with string as options')
})

test('Error due to file being an empty string', function (t) {
  try {
    execModule(' ', {}, function () {
      t.fail('Arrived at unexpected block')
    })
  } catch (e) {
    t.equal(e.message, 'File needs to be pointing somewhere.')
    return t.done()
  }
  t.fail('No Error thrown with string as options')
})

test('Error due to file not existinng', function (t) {
  execModule(path.join(__dirname, 'async', 'doesnt_exist.js'), function (err) {
    t.equal(err.code, 'ENOENT')
    t.done()
  })
})

test('Error due to file not existinng', function (t) {
  execModule(path.join(__dirname, 'async'), function (err) {
    t.equal(err.code, 'ERR_STAT_NOFILE')
    t.done()
  })
})

test('Error with an empty module', function (t) {
  execModule(files.empty_module, {
    setUp: function () {
      t.fail('Setup may not be called')
    },
    tearDown: function () {
      t.fail('Teardown may not be called')
    }
  }, function (err) {
    t.equal(err.code, 'ERR_FUNCTION_WRONG')
    t.equal(err.path, files.empty_module)
    t.done()
  })
})

test('Error with a string module', function (t) {
  execModule(files.string, {
    setUp: function () {
      t.fail('Setup may not be called')
    },
    tearDown: function () {
      t.fail('Teardown may not be called')
    }
  }, function (err) {
    t.equal(err.code, 'ERR_FUNCTION_WRONG')
    t.equal(err.path, files.string)
    t.done()
  })
})

test('Error with a simple module', function (t) {
  execModule(files.empty_function, {timeout: 10}, function (err) {
    t.equal(err.code, 'ERR_RUN_TIMEOUT')
    t.equal(err.timeout, 10)
    t.done()
  })
})

test('Error while initing module', function (t) {
  execModule(files.init_error, {
    setUp: function () {
      throw String('Setup may not be called')
    },
    tearDown: function () {
      throw String('Teardown may not be called')
    }
  }, function (err) {
    t.equal(err.code, 'ERR_LOAD')
    t.equal(err.message, 'custom error')
    t.done()
  })
})

test('Error while execution', function (t) {
  execModule(files.exec_error, function (err) {
    t.equal(err.code, 'ERR_RUN_UNHANDLED')
    t.equal(err.message, 'exec error')
    t.done()
  })
})

test('Error while exectuion after next tick', function (t) {
  execModule(files.empty_function, {timeout: 10}, function (err) {
    t.equal(err.code, 'ERR_RUN_TIMEOUT')
    t.done()
  })
})

test('Error at callback', function (t) {
  execModule(files.exec_async_error, function (err) {
    t.equal(err.code, 'ERR_RUN_ASYNC')
    t.equal(err.message, 'exec error')
    t.done()
  })
})

test('Successful method', function (t) {
  execModule(files.exec_success, function (err, success) {
    t.equal(err, undefined)
    t.equal(success, 'success')
    t.done()
  })
})

test('Custom exec handler method', function (t) {
  execModule(files.exec_with_arg, {
    exec: function (file, opt, mod, callback) {
      mod('hello', callback)
    }
  }, function (err, success) {
    t.equal(err, undefined)
    t.equal(success, 'hello!')
    t.done()
  })
})

test('Custom setup system handler method', function (t) {
  var calls = []
  var opts = {
    setUp: function (file, opt, callback) {
      t.equal(file, files.exec_success)
      t.equal(opt, opts)
      calls.push('setup')
      callback()
    },
    exec: function (file, opt, mod, callback) {
      calls.push('exec')
      mod(callback)
    }
  }
  execModule(files.exec_success, opts, function (err, success) {
    t.equal(err, undefined)
    t.equal(success, 'success')
    t.deepEqual(calls, ['setup', 'exec'])
    t.done()
  })
})

test('Async Error in setUp', function (t) {
  execModule(files.exec_success, {
    setUp: function (file, opt, callback) {
      callback('custom error2')
    }
  }, function (err, success) {
    t.equal(err.code, 'ERR_SETUP_ASYNC')
    t.equal(err.message, 'custom error2')
    t.done()
  })
})

test('Custom teardown system handler method', function (t) {
  var calls = []
  var opts = {
    exec: function (file, opt, mod, callback) {
      calls.push('exec')
      mod(callback)
    },
    tearDown: function (file, opt, err, data, callback) {
      t.equal(file, files.exec_success)
      t.equal(opt, opts)
      t.equal(err, null)
      t.equal(data, 'success')
      calls.push('tearDown')
      callback()
    }
  }
  execModule(files.exec_success, opts, function (err, success) {
    t.equal(err, null)
    t.equal(success, 'success')
    t.deepEqual(calls, ['exec', 'tearDown'])
    t.done()
  })
})

test('Custom teardown called after error', function (t) {
  var calls = []
  execModule(files.exec_error, {
    exec: function (file, opt, mod, callback) {
      calls.push('exec')
      mod(callback)
    },
    tearDown: function (file, opt, err, data, callback) {
      t.equal(file, files.exec_error)
      t.equal(err.code, 'ERR_RUN_UNHANDLED')
      calls.push('tearDown')
      callback()
    }
  }, function (err, data) {
    t.equal(err.code, 'ERR_RUN_UNHANDLED')
    t.equal(data, undefined)
    t.deepEqual(calls, ['exec', 'tearDown'])
    t.done()
  })
})

test('Error in setUp', function (t) {
  execModule(files.exec_success, {
    setUp: function (file, opt, callback) {
      throw String('custom error')
    }
  }, function (err, success) {
    t.equal(err.code, 'ERR_SETUP_SYNC')
    t.equal(err.message, 'custom error')
    t.done()
  })
})

test('Next Error in setUp', function (t) {
  execModule(files.exec_success, {
    setUp: function (file, opt, callback) {
      setImmediate(function () {
        throw String('custom error3')
      })
    }
  }, function (err, success) {
    t.equal(err.code, 'ERR_SETUP_UNHANDLED')
    t.equal(err.message, 'custom error3')
    t.done()
  })
})

test('Error in tearDown', function (t) {
  execModule(files.exec_success, {
    tearDown: function (file, opt, err, data, callback) {
      throw String('custom tear error')
    }
  }, function (err, success) {
    t.equal(err.code, 'ERR_TEARDOWN_SYNC')
    t.equal(err.message, 'custom tear error')
    t.done()
  })
})

test('Error after immediate call while execution', function (t) {
  execModule(files.exec_error_next, function (err) {
    t.equal(err.code, 'ERR_RUN_UNHANDLED')
    t.equal(err.message, 'exec error')
    t.done()
  })
})

test('Error due to options as string', function (t) {
  try {
    execModule(files.exec_async_error, 'hi', function () {
      t.fail('Arrived at unexpected block')
    })
  } catch (e) {
    return t.done()
  }
  t.fail('No Error thrown with string as options')
})

test('Optional argument count', function (t) {
  execModule(files.exec_success, {
    argCount: 2,
    setUp: function () {
      t.fail('Setup may not be called')
    },
    tearDown: function () {
      t.fail('Teardown may not be called')
    }
  }, function (err, success) {
    t.equal(err.code, 'ERR_FUNCTION_ARG_WRONG')
    t.equal(err.expected, 2)
    t.equal(err.actual, 1)
    t.done()
  })
})

test('Next Error in setUp', function (t) {
  execModule(files.exec_success, {
    setUp: function (file, opt, callback) {
      setImmediate(function () {
        throw String('custom error3')
      })
    }
  }, function (err, success) {
    t.equal(err.code, 'ERR_SETUP_UNHANDLED')
    t.equal(err.message, 'custom error3')
    t.done()
  })
})

test('unreadable file', function (t) {
  var stat = fs.statSync(files.cant_access)
  fs.chmodSync(files.cant_access, 0)
  execModule(files.cant_access, function (err, success) {
    fs.chmodSync(files.cant_access, stat.mode)
    t.equal(err.code, 'EACCES')
    t.done()
  })
})
