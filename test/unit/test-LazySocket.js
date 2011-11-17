var common     = require('../common');
var test       = require('utest');
var assert     = require('assert');
var LazySocket = common.LazySocket;
var net        = require('net');

test('LazySocket#createConnection', {
  'returns a new LazySocket': function() {
    var socket = LazySocket.createConnection();
    assert.ok(socket instanceof LazySocket);
  },

  'sets the passed host / port': function() {
    var socket = LazySocket.createConnection(8080, 'example.org');
    assert.equal(socket.port, 8080);
    assert.equal(socket.host, 'example.org');
  },
});
