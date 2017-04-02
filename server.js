/**
 * ashita/core
 *
 * @package    ashita/server
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
var ipaddr=require('ipaddr.js');
var nodeIp=interfaces[interface][0].address;
/**
 * Check if nodeIp is in IPv4 Format by counting the
 * number of parts and making sure they are 4, otherwise
 * switch to a different reading of the interface
 * this allows for the system to be run as IPv4 on
 * different architectures
 */
if ( ipaddr.parse(nodeIp).octets ===  undefined ) {
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
var net=require('net');
var API=require('./api.js');
var SYSCALL=require('./syscalls.js');
/**
 * Initialize our API
 */
API.aclCtl.init();
/**
 * Add entries to our ACL for the IP addresses allowed
 */
API.aclCtl.addEntry("IP", "10.0.1.7");
API.aclCtl.addEntry("IP", "10.0.1.4");
API.aclCtl.addEntry("IP", "10.0.1.2");
/**
 * If this is the master process
 */
if ( cluster.isMaster ) {
  /**
   * Counts the number of CPUs available and forks a
   * worker process for each core
   */
  var forks = os.cpus().length;
  for ( var i = 0; i < forks; ++i ) {
    cluster.fork();
  }
  API.consoleCtl.printMessage("SYSTEM", "Master Process running on", process.pid);
  API.consoleCtl.printMessage("SYSTEM", "Starting Workers", forks);
  /**
   * Setup event listener to trigger when a worker comes online
   */
  cluster.on('online', function( worker ) {
    API.consoleCtl.printMessage("SYSTEM", "Worker " + worker.process.pid, "Dispatched");
  });
  /**
   * Setup event listener to trigger when data is received from a worker
   */
  cluster.on('message', function( worker, message ) {
    API.consoleCtl.printMessage("Worker", worker.process.pid, message);
  });
  /**
   * Setup event listener to trigger when a worker exits
   */
  cluster.on('exit', function( worker, code, signal ) {
    API.consoleCtl.printMessage("SYSTEM", "Worker " + worker.process.pid, "Exited");
  });
/**
 * If is worker process
 */
} else if ( cluster.isWorker ) {
  /**
   * Setup event listener to trigger when data is received from the master
   */
  process.on('message', function( message ) {
    API.consoleCtl.printMessage("Master", message);
  });
  /**
   * Send a message to the master to let it know we are listening
   */
  process.send("Listening on: " + nodeIp + ":8000");
  /**
   * Create an instance of our server within the worker process
   * and listen for connections
   */
  var server=net.createServer({allowHalfOpen:true}, function( socket ) {
    var PEER = {};
    PEER.ipAddress = socket.server._connectionKey.split(":")[1];
    /**
     * Setup event listener to trigger when data is received from a socket
     */
    socket.on('data', function( data ) {
      if ( data !== "" ) {
        /**
         * Parse our data and build our PEER object
         */
        var data = JSON.parse( data );
        /**
         * If none of the commands passed through to our signal were found
         */
        if( typeof SYSCALL[data.COMMAND] !== "function" ) {
          /**
           * send unknown command payload
           */
          var payload = {
            "TYPE":"SYS.CMD.UNKNOWN",
            "STDOUT":data.COMMAND
          };
          payload = JSON.stringify( payload );
    			socket.write( payload );
    		} else {
          /**
           * trigger our signal passed by the socket
           */
          return SYSCALL[data.COMMAND](socket, data.ARGUMENTS);
        }
      }
    });
  });
  /**
   * Setup event listener to trigge ron new connection
   */
  server.on('connection', function( socket ) {
    var PEER = {};
    PEER.ipAddress = socket.server._connectionKey.split(":")[1];
    /**
     * Check our ACL for the client's IP address
     */
    if ( API.aclCtl.checkEntry("IP", PEER.ipAddress) === false ) {
      socket.close();
    }
    API.consoleCtl.printMessage("SYSTEM", "Using Worker", process.pid);
    /**
     * Send our MOTD to the client
     */
    var payload = {
      "TYPE":"SYS.MOTD",
      "STDOUT":"Information is power. But like all power, there are those who want to keep it for themselves."
    };
    payload = JSON.stringify( payload );
    socket.write( payload );
  });
  /**
   * Listen
   */
  server.listen(8000, nodeIp);
}
