/**
 * ashita/core
 *
 * @package    ashita/core
 * @author     evolretsinis
 */
var os=require('os');
var interfaces=os.networkInterfaces();
var args=process.argv.slice(2);
var interface=args[0];
if ( !interfaces[interface] ) {
  console.log("example usage: npm start Wi-Fi");
  process.exit();
}
var nodeIp=interfaces[interface][0].address;
if ( nodeIp.length > 24 ) {
  nodeIp=interfaces[interface][1].address;
}
var fs=require('fs');
var cluster=require('cluster');
var path=require('path');
var util=require('util');
var validator=require('validator');
var assert=require('assert');
var moment=require('moment');
var crypto=require('crypto');
var API=require('./api.js');
API.aclCtl.init();
API.sessionCtl.init();
API.peerCtl.init();
API.aclCtl.addEntry("IP", "10.0.1.4");
API.aclCtl.addEntry("IP", "10.0.1.2");
if ( cluster.isMaster ) {
  var forks = os.cpus().length;
  for ( var i = 0; i < forks; ++i ) {
    cluster.fork();
  }
  API.consoleCtl.printMessage("SYSTEM", "Master Process running on", process.pid);
  API.consoleCtl.printMessage("SYSTEM", "Starting Workers", forks);
  cluster.on('online', function(worker){
    API.consoleCtl.printMessage("SYSTEM", "Worker " + worker.process.pid, "Dispatched");
  });
  cluster.on('message', function(worker, message){
    API.consoleCtl.printMessage("Worker", worker.process.pid, message);
  });
  cluster.on('exit', function(worker, code, signal){
    API.consoleCtl.printMessage("SYSTEM", "Worker " + worker.process.pid, "Exited");
  });
} else if ( cluster.isWorker ) {
  process.on('message', function(message){
    API.consoleCtl.printMessage("Master", message);
  });
  process.send("Listening on: " + nodeIp + ":8000");
  var net=require('net');
  var server=net.createServer({allowHalfOpen:true}, function(socket){
    socket.on('data', function(data){
      var PEER = {};
      PEER.sessionid = data.sessionid ? data.sessionid : API.sessionCtl.generateId();
      PEER.ipAddress = socket.server._connectionKey.split(":")[1];
      if(data !== ""){
        var data=JSON.parse(data);
        signal={
          auth:function( data ) {
            try {
              if ( API.peerCtl.checkPeer(PEER.ipAddress) === false ) {
                var peers = API.peerCtl.getPeers();
                for ( var i = 0; i < peers.length; ++i ) {
                  var payload = {
                    "type":"newPeerDiscovered",
                    "content":{
                      "ipaddr": peers[i]
                    }
                  };
                  payload = JSON.stringify( payload );
                  socket.write( payload );
                }
              }
              API.peerCtl.addPeer(PEER.ipAddress);
              var sessionObject = API.sessionCtl.getObject(PEER.sessionid);
              if ( sessionObject ) {
                API.sessionCtl.setObject({
                  sessionid:PEER.sessionid,
                  ipaddr:PEER.ipAddress
                });
                API.consoleCtl.printMessage("SYSTEM", "New Authenticated Connection", PEER.sessionid);
                var payload = {
                  "type":"newAuthedConnection",
                  "content":{
                    "sid":PEER.sessionid
                  }
                };
                payload = JSON.stringify( payload );
                socket.write( payload );
              } else {
                API.sessionCtl.setObject({
                  sessionid:PEER.sessionid,
                  ipaddr:PEER.ipAddress
                });
                API.consoleCtl.printMessage("SYSTEM", "New Anonymous Connection", PEER.sessionid);
                var payload = {
                  "type":"newAnonymousConnection",
                  "content":{
                    "sid":PEER.sessionid
                  }
                };
                payload = JSON.stringify( payload );
                socket.write( payload );
              }
            } catch ( e ) {
              API.consoleCtl.printError( e );
            }
          }
        };
        if(typeof signal[data.COMMAND] !== "function"){
          var payload = {
            "type":"SIGFAULT"
          };
          payload = JSON.stringify(payload);
    			socket.write(payload);
    		} else {
          return signal[data.COMMAND](data.ARGUMENTS);
        }
      }
    });
  });
  server.on('connection', function(socket){
    var PEER = {};
    PEER.ipAddress = socket.server._connectionKey.split(":")[1];
    if ( API.aclCtl.checkEntry("IP", PEER.ipAddress) === false ) {
      socket.close();
    }
    API.consoleCtl.printMessage("SYSTEM", "Using Worker", process.pid);
    /**
     * NewPeerConnected
     *
     * Sending Banner
     */
    var payload = {
      "type":"newConnection",
      "content":"Welcome"
    };
    payload = JSON.stringify(payload);
    socket.write(payload);
  });
  server.on('error', function(){
    console.log("CONNECTION.ERROR");
  });
  server.on('close', function(){
    console.log("CONNECTION.CLOSED");
  });
  server.on('listening', function(){
  });
  server.listen(8000, nodeIp);
}
