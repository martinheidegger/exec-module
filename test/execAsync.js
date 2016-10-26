var execAsync = require('../lib/execAsync.js')
var test = require('tap').test

test('simple execution', function (t) {
  execAsync({
    run: function (cb) {
      cb(null, 'hello')
    },
    name: 'a',
    file: 'z',
    then: function (err, result) {
      t.equal(err, null)
      t.equal(result, 'hello')
      t.done()
    }
  })
})

test('simple err execution', function (t) {
  execAsync({
    run: function (cb) {
      cb('err')
    },
    name: 'b',
    file: 'y',
    then: function (err, result) {
      t.equal(err.code, 'ERR_B_ASYNC')
      t.equal(err.cause, 'err')
      t.equal(err.path, 'y')
      t.equal(result, undefined)
      t.done()
    }
  })
})

test('immediate exception', function (t) {
  execAsync({
    run: function (cb) {
      throw String('err2')
    },
    name: 'c',
    file: 'x',
    then: function (err, result) {
      t.equal(err.code, 'ERR_C_SYNC')
      t.equal(err.cause, 'err2')
      t.equal(err.path, 'x')
      t.done()
    }
  })
})

test('delayed exception', function (t) {
  execAsync({
    run: function (cb) {
      setImmediate(function () {
        throw String('err3')
      })
    },
    name: 'd',
    file: 'w',
    then: function (err, result) {
      t.equal(err.code, 'ERR_D_UNHANDLED')
      t.equal(err.cause, 'err3')
      t.equal(err.path, 'w')
      t.done()
    }
  })
})

test('timeout exception', function (t) {
  execAsync({
    run: function (cb) {
      setTimeout(function () {
        cb(null, 'hello')
      }, 100)
    },
    name: 'e',
    file: 'v',
    timeout: 10,
    then: function (err, result) {
      t.equal(err.code, 'ERR_E_TIMEOUT')
      t.equal(err.cause, undefined)
      t.equal(err.path, 'v')
      t.equal(result, undefined)
      t.done()
    }
  })
})

test('allow exception to contain a coded error', function (t) {
  execAsync({
    run: function () {
      var err = new Error('Hello')
      err.code = 'MY_ERR'
      throw err
    },
    name: 'f',
    file: 'u',
    then: function (err, result) {
      t.equal(err.message, 'Error while running f: Hello')
      t.equal(err.code, 'MY_ERR')
      t.equal(err.path, 'u')
      t.done()
    }
  })
})

test('timeout not occuring', function (t) {
  execAsync({
    run: function (cb) {
      setTimeout(function () {
        cb(null, 'hello')
      }, 10)
    },
    timeout: 100,
    then: function (err, result) {
      t.equal(err, null)
      t.equal(result, 'hello')
      t.done()
    }
  })
})

test('undefined name fallback', function (t) {
  execAsync({
    run: function (cb) {
      cb(true)
    },
    then: function (err, result) {
      t.equal(err.code, 'ERR_UNNAMED_ASYNC')
      t.equal(err.cause, true)
      t.equal(result, undefined)
      t.done()
    }
  })
})
