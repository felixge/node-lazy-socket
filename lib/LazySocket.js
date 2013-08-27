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

LazySocket.prototype.write = function(/* data, encoding, cb */) {
  var self = this;
  var args = Array.prototype.slice.call(arguments);
  var cb   = args[args.length - 1];

  if (typeof cb === 'function') {
    var cbProxy = function() {
      var index = self._callbacks.indexOf(cbProxy);
      
      if (index < 0) {
        //  callback has already been called and removed from the
        //  callback list
        return;
      }
      
      self._callbacks.splice(index, 1);

      return cb.apply(this, arguments);
    };

    args[args.length - 1] = cbProxy;
    this._callbacks.push(cbProxy);
  }

  this._lazyConnect();

  try {
    this._socket.write.apply(this._socket, args);
  } catch (err) {
    if (cbProxy) cbProxy(err);

    this._socket.destroy();
    this._socket = null;
  }
};

LazySocket.prototype._lazyConnect = function() {
  if (this._socket) return;

  var self = this;
  var onerror = function(err) {
    self._socket = null;
    self._callbacks.forEach(function(cb) {
      cb(err);
    });
  };
  
  this._socket = net
    .createConnection(this.port, this.host)
    .once('error', onerror);
  
  if (this.timeout) {
    this._socket.setTimeout(this.timeout, function() {
      self._socket.end();
      onerror('timeout');
    });
  }
};

LazySocket.prototype.end = function() {
  if (this._socket) this._socket.end();
};

LazySocket.prototype.destroy = function() {
  if (this._socket) this._socket.destroy();
};
