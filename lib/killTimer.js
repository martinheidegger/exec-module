module.exports = function killTimer (fn, timeout, error) {
  var timer = null
  var killed = false
  var stop = function () {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  var kill = function () {
    stop()
    killed = true
    fn(error)
  }
  var result = function () {
    if (!killed) {
      stop()
      return fn.apply(null, arguments)
    }
  }
  result.initTimeout = function () {
    stop()
    if (!killed) {
      timer = setTimeout(kill, timeout)
    }
  }
  result.cancelTimeout = stop
  return result
}
