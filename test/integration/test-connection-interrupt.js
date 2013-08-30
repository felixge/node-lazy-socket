var common     = require('../common');
var assert     = require('assert');
var net        = require('net');
var LazySocket = common.LazySocket;
var data       = '';

var num = 0;
var server = net.createServer(function(socket) {
  console.log('net.createServer got socket');
  socket
    .on('data', function(chunk) {
      console.log('socket.data = ' + chunk);
      data += chunk;
    });

  num++;
  if (num === 1) {
    socket.on('end', function() {
      console.log('socket.end.1');
      sendSecondMessage();
    })
    .end();

    console.log('server.close.1...');
    server.close(function() {
      console.log('server.close.1 complete');
    });
  }

  if (num === 2) {
    socket.on('end', function() {
      console.log('socket.end.2');
      console.log('server.close.2...');
      server.close(function() {
        console.log('server.close.2 complete');
      });
    });
  }
});

server.listen(common.port, function() {
  console.log('server.listen');
  sendFirstMessage();
});

var socket = LazySocket.createConnection(common.port);

function sendFirstMessage() {
  console.log('sendFirstMessage');
  server.removeAllListeners('listening')
  socket.write('first', 'utf-8', function(err) {
    console.log('sendFirstMessage.socket.write err=' + err);
    assert.ok(!err);
  });
}

function sendSecondMessage() {
  console.log('sendSecondMessage');
  socket.write('second ', 'utf-8', function(err) {
    console.log('sendSecondMessage.socket.write err=' + err);
    assert.ok(err);
    server.listen(common.port, function() {
      console.log('sendSecondMessage.server.listen');
      sendThirdMessage();
    });
  });
}

function sendThirdMessage() {
  console.log('sendThirdMessage');
  socket.write('third', 'utf-8', function(err) {
    console.log('sendThirdMessage.socket.write err=' + err);
    assert.ok(!err);
    socket.end();
  });
}

process.on('exit', function() {
  assert.equal(data, 'firstthird');
});
