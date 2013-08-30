var net = require('net');

module.exports = LazySocket;
function LazySocket(properties) {
  properties = properties || {};

  this.port = properties.port;
  this.host = properties.host;
  this.timeout = properties.timeout || 0;

  this._socket    = null;
  this._callbacks = [];
}

LazySocket.createConnection = function(port, host, timeout) {
  var socket = new this({port: port, host: host, timeout: timeout});
  return socket;
};

LazySocket.prototype._cleanupIfError = function(err) {
  var callbacksCopy;
  
  console.log('LazySocket.prototype._cleanupIfError err=' + err);
  
  if (!err) {
    return;
  }
  
  //  just to be sure
  if (this._socket) {
    this._socket.destroy();
    this._socket = null;
  }
  
  //  use a copy of the callback queue so that if a callback calls write() again
  //  it will be added to the new callback queue. meantime we'll be informing all
  //  the other callbacks that their write failed because the socket is dead.
  callbacksCopy = this._callbacks;
  this._callbacks = [];
  
  console.log('LazySocket.prototype._cleanupIfError calling ' + callbacksCopy.length + ' callbacks');
  
  callbacksCopy.forEach(function(cb) {
    cb(err);
  });
};

LazySocket.prototype.write = function(data, encoding, cb) {
  var self = this;
  var cbProxy;
  
  console.log('LazySocket.prototype.write data=' + data);
  
  if (arguments.length === 1) {
    //  write(data)
    encoding = 'utf8';
  } else if (arguments.length === 2) {
    if (typeof encoding === 'function') {
      //  write(data, cb)
      cb = encoding;
      encoding = 'utf8';
    } else {
      //  write(data, encoding)
    }
  }
  
  if (cb) {
    //  wrap passed-in callback in our proxy to handle cleanups
    cbProxy = function(err) {
      //  remove our callback
      var index = self._callbacks.indexOf(cbProxy);
      self._callbacks.splice(index, 1);
      
      console.log('LazySocket.prototype.write index=' + index + ', err=' + err);

      //  cleanup the socket after the error.
      //  this will also inform any callbacks which may in-turn
      //  call our write() method
      self._cleanupIfError(err);
      
      //  callback this handler passing in the error if there was one
      cb(err);
    }
  } else {
    //  no custom callback...use our cleanup function
    cbProxy = this._cleanupIfError;
  }
  
  this._callbacks.push(cbProxy);

  this._lazyConnect();

  try {
    console.log('LazySocket.prototype.write doing write...');
    this._socket.write(data, encoding, cbProxy);
  } catch (err) {
    console.log('LazySocket.prototype.write threw error ' + err);
    cbProxy(err);
  }
};

LazySocket.prototype._lazyConnect = function() {
  var self = this;
  
  console.log('LazySocket.prototype._lazyConnect socket=' + this._socket);
  
  if (this._socket) {
    return;
  }
  
  console.log('LazySocket.prototype._lazyConnect.createConnection');
  this._socket = net.createConnection(this.port, this.host, function() {
    console.log('LazySocket.prototype._lazyConnect.createConnection completed');
  }).once('error', function(err) {
    console.log('LazySocket.prototype._lazyConnect.error socket=' + self._socket.localAddress + ' / ' + self._socket.remoteAddress);
    console.log('LazySocket.prototype._lazyConnect.socket.error ' + err);
    self._cleanupIfError(err);
  });
  console.log('LazySocket.prototype._lazyConnect.createConnection socket=' + self._socket.localAddress + ' / ' + self._socket.remoteAddress);
  
  if (this.timeout) {
    this._socket.setTimeout(this.timeout, function() {
      console.log('LazySocket.prototype._lazyConnect.socket.timeout');
      self._socket.end();
      self._cleanupIfError('timeout');
    });
  }
};

LazySocket.prototype.end = function() {
  console.log('LazySocket.prototype.end');
  if (this._socket) {
    this._socket.end();
  }
};

LazySocket.prototype.destroy = function() {
  console.log('LazySocket.prototype.destroy');
  if (this._socket) {
    this._socket.destroy();
  }
};
