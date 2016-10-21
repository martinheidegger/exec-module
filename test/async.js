var test = require('tap').test
var fs = require('fs')
var path = require('path')
var execAsync = require('../async')
var files = fs.readdirSync(path.join(__dirname, 'async')).reduce(function (files, file) {
  files[file.substr(0, file.length - path.extname(file).length)] = path.resolve(__dirname, 'async', file)
  return files
}, {})

function noop () {}

test('Error due to options as string', function (t) {
  try {
    execAsync(files.exec_async_error, "hi", function () {
      t.fail('Arrived at unexpected block')
    })
  } catch (e) {
    return t.done()
  }
  t.fail('No Error thrown with string as options')
})

test('Error due to file being null', function (t) {
  try {
    execAsync(null, "hi", function () {
      t.fail('Arrived at unexpected block')
    })
  } catch (e) {
    return t.done()
  }
  t.fail('No Error thrown with string as options')
})

test('Error due to file being an empty string', function (t) {
  try {
    execAsync(null, " ", function () {
      t.fail('Arrived at unexpected block')
    })
  } catch (e) {
    return t.done()
  }
  t.fail('No Error thrown with string as options')
})

test('Error with an empty module', function (t) {
  execAsync(files.empty_module, function (err) {
    t.equal(err.code, 'ETYPE')
    t.equal(err.file, files.empty_module)
    t.done()
  })
})

test('Error with a simple module', function (t) {
  execAsync(files.empty_function, {timeout: 10}, function (err) {
    t.equal(err.code, 'ETIMEOUT')
    t.done()
  })
})

test('Error while initing module', function (t) {
  execAsync(files.init_error, function (err) {
    t.equal(err.code, 'ELOAD')
    t.equal(err.cause, 'custom error')
    t.done()
  })
})

test('Error while execution', function (t) {
  execAsync(files.exec_error, function (err) {
    t.equal(err.code, 'EEXECUNHANDLED')
    t.equal(err.cause, 'exec error')
    t.done()
  })
})

test('Error at callback', function (t) {
  execAsync(files.exec_async_error, function (err) {
    t.equal(err.code, 'EEXECASYNC')
    t.equal(err.cause, 'exec error')
    t.done()
  })
})

test('Successful method', function (t) {
  execAsync(files.exec_success, function (err, success) {
    t.equal(err, null)
    t.equal(success, 'success')
    t.done()
  })
})

test('Custom exec handler method', function (t) {
  var setupCalled = false
  execAsync(files.exec_with_arg, {
    exec: function (file, opt, mod, callback) {
      mod('hello', callback)
    }
  }, function (err, success) {
    t.equal(err, null)
    t.equal(success, 'hello!')
    t.done()
  })
})

test('Custom setup system handler method', function (t) {
  var calls = []
  execAsync(files.exec_success, {
    setUp: function (file, opt, callback) {
      calls.push('setup')
      callback()
    },
    exec: function (file, opt, mod, callback) {
      calls.push('exec')
      mod(callback)
    }
  }, function (err, success) {
    t.equal(err, null)
    t.equal(success, 'success')
    t.deepEqual(calls, ['setup', 'exec'])
    t.done()
  })
})

test('Error in setUp', function (t) {
  execAsync(files.exec_success, {
    setUp: function (file, opt, callback) {
      throw String('custom error')
    }
  }, function (err, success) {
    t.equal(err.code, 'ESETUPSYNC')
    t.equal(err.cause, 'custom error')
    t.done()
  })
})

test('Custom teardown system handler method', function (t) {
  var calls = []
  execAsync(files.exec_success, {
    exec: function (file, opt, mod, callback) {
      calls.push('exec')
      mod(callback)
    },
    tearDown: function (file, opt, err, callback) {
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
