var common     = require('../common');
var assert     = require('assert');
var net        = require('net');
var LazySocket = common.LazySocket;
var wasClosed  = false;

var server = net.createServer(function(socket) {
  //  when a connection is received, close it after 1 second as a
  //  cleanup step. our test should have done its thing by then.
  setTimeout(function() {
    socket.end();
    server.close();
  }, 1000);
  socket.once('end', function() {
    wasClosed = true;
  });
});

server.listen(common.port, function() {
  var socket = LazySocket.createConnection(common.port, undefined /* host */, 250 /* timeout */);
  socket._lazyConnect();
  //  socket is now open and should timeout after 250ms of idleness.
  assert.ok(!wasClosed);
  setTimeout(function() {
    //  socket should have timed out after 250ms which was about 250ms ago.
    assert.ok(wasClosed);
    socket.destroy();
  }, 500);
});

