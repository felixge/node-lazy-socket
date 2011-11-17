# lazy-socket

[![Build Status](https://secure.travis-ci.org/felixge/node-lazy-socket.png)](http://travis-ci.org/felixge/node-lazy-socket)

A stateless socket that always lets you write().

If there is an error, `write()` guarantees that you will be provided with a
callback.

## Install

Not ready for you yet.

## Usage

```js
var LazySocket = require('lazy-socket');
var socket = LazySocket.createConnection(80, 'example.org');
socket.write('something', 'utf-8', function(err) {
  // Even if example.org is down, this callback is guaranteed to fire, and
  // there is no more error handling to do on your end.
});
```

## License

This module is licensed under the MIT license.
