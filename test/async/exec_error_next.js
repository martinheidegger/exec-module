module.exports = function () {
  setImmediate(function () {
    throw String('exec error')
  })
}
