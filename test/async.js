var fs = require('fs')
var path = require('path')
var execModule = require('../async.js')
var files = fs.readdirSync(path.join(__dirname, 'async')).reduce(function (files, file) {
  files[file.substr(0, file.length - path.extname(file).length)] = path.resolve(__dirname, 'async', file)
  return files
}, {})

var test = require('tap').test

test('Error due to file being null', function (t) {
  try {
    execModule(null, 'hi', function () {
      t.fail('Arrived at unexpected block')
    })
  } catch (e) {
    return t.done()
  }
  t.fail('No Error thrown with string as options')
})

test('Error due to file being an empty string', function (t) {
  try {
    execModule(null, ' ', function () {
      t.fail('Arrived at unexpected block')
    })
  } catch (e) {
    return t.done()
  }
  t.fail('No Error thrown with string as options')
})

test('Error with an empty module', function (t) {
  execModule(files.empty_module, function (err) {
    t.equal(err.code, 'ERR_FUNCTION_WRONG')
    t.equal(err.file, files.empty_module)
    t.done()
  })
})

test('Error with a simple module', function (t) {
  execModule(files.empty_function, {timeout: 10}, function (err) {
    t.equal(err.code, 'ERR_RUN_TIMEOUT')
    t.done()
  })
})

test('Error while initing module', function (t) {
  execModule(files.init_error, function (err) {
    t.equal(err.code, 'ERR_LOAD')
    t.equal(err.cause, 'custom error')
    t.done()
  })
})

test('Error while execution', function (t) {
  execModule(files.exec_error, function (err) {
    t.equal(err.code, 'ERR_RUN_UNHANDLED')
    t.equal(err.cause, 'exec error')
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
    t.equal(err.cause, 'exec error')
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
  execModule(files.exec_success, {
    setUp: function (file, opt, callback) {
      calls.push('setup')
      callback()
    },
    exec: function (file, opt, mod, callback) {
      calls.push('exec')
      mod(callback)
    }
  }, function (err, success) {
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
    t.equal(err.cause, 'custom error2')
    t.done()
  })
})

test('Custom teardown system handler method', function (t) {
  var calls = []
  execModule(files.exec_success, {
    exec: function (file, opt, mod, callback) {
      calls.push('exec')
      mod(callback)
    },
    tearDown: function (file, opt, err, data, callback) {
      calls.push('tearDown')
      callback()
    }
  }, function (err, success) {
    t.equal(err, null)
    t.equal(success, 'success')
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
    t.equal(err.cause, 'custom error')
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
    t.equal(err.cause, 'custom error3')
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
    t.equal(err.cause, 'custom tear error')
    t.done()
  })
})

test('Error after immediate call while execution', function (t) {
  execModule(files.exec_error_next, function (err) {
    t.equal(err.code, 'ERR_RUN_UNHANDLED')
    t.equal(err.cause, 'exec error')
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

test('Next Error in setUp', function (t) {
  execModule(files.exec_success, {
    setUp: function (file, opt, callback) {
      setImmediate(function () {
        throw String('custom error3')
      })
    }
  }, function (err, success) {
    t.equal(err.code, 'ERR_SETUP_UNHANDLED')
    t.equal(err.cause, 'custom error3')
    t.done()
  })
})
