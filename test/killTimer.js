var test = require('tap').test
var killTimer = require('../lib/killTimer')

test('regular execution', function (t) {
  killTimer(function () {
    t.done()
  }, 10)()
})

test('passing arguments', function (t) {
  killTimer(function (a, b, c) {
    t.equal(a, 1)
    t.equal(b, 2)
    t.equal(c, 3)
    t.done()
  })(1, 2, 3)
})

test('receiving response', function (t) {
  t.equal(killTimer(function () {
    return 1
  })(), 1)
  t.done()
})

test('simple timeout', function (t) {
  var timer = killTimer(function (err) {
    t.equal(err, 'error')
    t.done()
  }, 5, 'error')
  timer.initTimeout()
  setTimeout(function () {
    timer('hello')
  }, 50)
})

test('repeated init', function (t) {
  var timer = killTimer(function (err) {
    t.equal(err, 'hello')
    t.done()
  }, 50, 'error')
  timer.initTimeout()
  setTimeout(function () {
    timer.initTimeout()
    setTimeout(function () {
      timer('hello')
    }, 40)
  }, 40)
})

test('cancel timeout', function (t) {
  var reach = 0
  var timer = killTimer(function (err) {
    t.equal(err, 'error')
    t.equal(reach, 2)
    t.done()
  }, 20, 'error')
  timer.initTimeout()
  setTimeout(function () {
    reach = 1
    timer.cancelTimeout()
    setTimeout(function () {
      reach = 2
      timer.initTimeout()
    }, 30)
  }, 10)
})
