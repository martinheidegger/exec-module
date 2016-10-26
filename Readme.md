# exec-module
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/martinheidegger/exec-module.svg?branch=master)](https://travis-ci.org/martinheidegger/exec-module)
[![Coverage Status](https://coveralls.io/repos/github/martinheidegger/exec-module/badge.svg?branch=master)](https://coveralls.io/github/martinheidegger/exec-module?branch=master)

> Run any module and know what happened

Sometimes you want to run code and it would be simply good to know if the execution went correctly. This module allows you to run an javascript file
just by its path and offers diverse ways to deal with errors.

## Install

This is a [Node.js](https://nodejs.com) package. You can install it using

```
$ npm i exec-module
```

## Usage

### Domains warning

[Domains](https://nodejs.org/api/domain.html) are deprecated in Node.js but 
since there is no alternative API available yet this project uses domains. It 
will be updated to whatever alternative will be given by the Node.js project.

There will be a warning shown by Node.js unless you call it with the
`--no-deprecation` flag.

### `execModule(filePath, [opts], callback)`

`filePath` needs to point to a javascript file. `callback` receives the error and or result.

```javascript
var execModule = require('exec-module')
execModule('./some_path.js', function (err, data) {
  // your code
})
```

### Custom module execution

By default the module will be called only with a `callback` handler. You can 
override this default behavior to pass-in additional arguments.

```javascript
execModule('./some_path.js', {
  exec: function (file, options, mod, callback) {
    // file ... input path
    // options ... input options
    // mod ... the module's function
    // callback ... callback to be called with the result
    mod('hello world', callback)
  }
}, function (err, data) {
  // your code
})
```

### Using `setUp` and `tearDown`

You can execute code before and after the method is run by specifying a `setUp`
and/or `tearDown` function in the options.

```javascript
execModule('./some_path.js', {
  setUp: function (file, options, callback) {
     // file ... input path
     // options ... input options
     callback()
  },
  tearDown: function (file, options, err, data, callback) {
     // file ... input path
     // options ... input options
     // err ... error that was returned by the module
     // data ... data that was returned by the module
     callback()
  }
}, function (err, result) {
  // Now: error can also contain setUp or tearDown errors!
})
```

### Checking for a `timeout`

When you pass-in a `timeout` option it will throw a timeout error if the 
module doesn't respond within the given time in milliseconds.

```javascript
execModule('./some_path.js', {timeout: 100}, function (err, data) {
  // Now err.code can become `ERR_RUN_TIMEOUT`
})
```

### Checking for a number of arguments

In JavaScript it is possible to inspect the number of arguments specified by a 
method. (see: [MDN](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Function/length)) With `argCount` you can also check
wether or not the method does has a specific amount of arguments.

```javascript
execModule('./some_path.js', {argCount: 2}, function (err, data) {
  // Now err.code can become `FUNCTION_ARG_WRONG`
})
```

### Advanced Error Handling

This module returns with errors that are coded. Every error a set of 
properties that can be useful when printing the error:

```javascript
error.message // A default - developer readable - error message
error.code // Code to deal with the error
error.path // File in which the error occurred
error.cause // Cause of the error (if it was the result of a exception)
```

| Code | Occurs     |
|------|------------|
| ENOENT | When there is no file system object at the given path |
| EACCESS | When the file is not readable by the process |
| ERR_STAT_NOFILE | When the path points to something else but a file |
| ERR_LOAD | When an exception is thrown during loading of the file |
| ERR_FUNCTION_WRONG | When the module exports something else but a function |
| FUNCTION_ARG_WRONG | When the method contains arguments that are not of the requested amount (Note: error contains additional properties: `expected` and `actual`) |
| ERR_RUN_SYNC | When an exception was thrown in the module directly in the default scope |
| ERR_RUN_ASYNC | When the module's method returned with an error value |
| ERR_RUN_UNHANDLED | When the module's method throws an error outside of the default scope |
| ERR_RUN_TIMEOUT | When the method didn't return before a specified timeout. (Note: error contains additional property `timeout`) |
| ERR_SETUP_SYNC | When an exception was thrown in `setUp` directly in the default scope |
| ERR_SETUP_ASYNC | When the `setUp` returned with an error value |
| ERR_SETUP_UNHANDLED | When the `setUp` throws an error outside of the default scope |
| ERR_TEARDOWN_SYNC | When an exception was thrown in `tearDown` directly in the default scope |
| ERR_TEARDOWN_ASYNC | When the `tearDown` returned with an error value |
| ERR_TEARDOWN_UNHANDLED | When the `tearDown` throws an error outside of the default scope |

_Note: If an error is thrown with a `code` property, then it will be 
re-thrown as-is._

## Contribute

Bug reports and Feature requests welcome! ❤️ for Pull Requests. 

## License

ISC
