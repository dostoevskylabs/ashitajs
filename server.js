/**
 * ashita/core/server
 *
 * @package    ashita/core
 * @author     Elijah Seymour
 * @email      dostoevsky.random@gmail.com
 */
var os = require('os');
var net = require('net');
var interfaces = os.networkInterfaces();
var args = process.argv.slice(2);
var interface = args[0];
if ( !interfaces[interface] ) {
  console.log("example usage: npm start Wi-Fi");
  process.exit();
}
var ipaddr = require('ipaddr.js');
var nodeIp = interfaces[interface][0].address;
// randomly select a port to use for hosting
var nodePort = Math.floor(Math.random() * (3333 - 2222)) + 2222;
/**
 * Check if nodeIp is in IPv4 Format this allows
 * for the system to be run as IPv4 on different
 * architectures
 */
if ( net.isIPv6(nodeIp) ) {
  nodeIp = interfaces[interface][1].address;
}
var fs = require('fs');
var cluster = require('cluster');
var path = require('path');
var util = require('util');
var validator = require('validator');
var assert = require('assert');
var moment = require('moment');
var crypto = require('crypto');
var SYSCALL = require('./syscalls.js');
console.log("Starting at " + nodeIp +":" + nodePort);
var server=net.createServer({allowHalfOpen:true}, function( socket ) {
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
 * Setup event listener to trigger on new connection
 */
server.on('connection', function( socket ) {
  SYSCALL.activePeers.push(socket.remoteAddress + ":" + socket.remotePort);
  /**
   * Send our MOTD to the client
   */
  fs.readFile("./sysroot/etc/motd", "utf8", function( error, data ) {
    var payload = {
      "TYPE":"SYS.MOTD",
      "STDOUT":data.toString()
    };
    payload = JSON.stringify( payload );
    socket.write( payload );
  });

});
server.on('error', function(){
  console.log("error:server");
});
server.on('exit', function(){
  console.log("exit:server");
});
/**
 * Listen
 */
server.listen(nodePort, nodeIp);
var readline = require('readline');
/**
 * Setup our readline interface for intepreting commands
 */
var STDIN = readline.createInterface({input:process.stdin, output:process.stdout});
try {
  /**
   * Start a new connection to our server
   */
  var peers = new Array();
  peers[nodeIp] = new net.createConnection(nodePort, nodeIp);
  peers[nodeIp].on('data', function( data ) {
    var data = JSON.parse( data );
    /**
     * Setup our signal for retreiving responses
     */
    var signal = {
      /**
       * SYS.MOTD
       */
      "SYS.MOTD":function( data ) {
        console.log(data.STDOUT);
      },
      /**
       * SYS.CONNECT
       */
      "SYS.CONNECT":function( data ) {
        peers[data.peerIp] = new net.createConnection(data.peerPort, data.peerIp);
        console.log("connected  to " + data.peerIp + ":" + data.peerPort);
        peers[data.peerIp].on('data', function ( data ) {
          var data = JSON.parse( data );
          return signal[data.TYPE](data);
        });
        STDIN.prompt();
      },
      /**
       * SYS.ECHO
       */
      "SYS.ECHO":function( data ) {
        console.log(data.STDOUT);
      },
      /**
       * SYS.CMD.SUCCESS
       */
      "SYS.CMD.SUCCESS":function( data ) {
         console.log(data.COMMAND + ": " + data.STDOUT);
      },
      /**
       * SYS.CMD.FAIL
       */
       "SYS.CMD.FAIL":function( data ) {
         console.log(data.COMMAND + ": " + data.STDOUT);
       },
      /**
       * SYS.CMD.UNKNOWN
       */
      "SYS.CMD.UNKNOWN":function( data ) {
         console.log(data.COMMAND + ": " + data.STDOUT);
      }
    };
    if( typeof signal[data.TYPE] !== "function" ) {
      console.log("wut?");
    } else {
      return signal[data.TYPE](data);
    }
    STDIN.prompt();
  });
  peers[nodeIp].on('error', function(){
    console.log("error:client");
  });
  peers[nodeIp].on('exit', function(){
    console.log("exit:client");
  });
  /**
   * Setup event listener to read lines from terminal input
   */
  STDIN.on('line', function( input ) {
    if ( input !== "" ) {
      var input = input.split(" ");
      /**
       * Pass the COMMAND as a string and the ARGUMENTS as an array
       */
      var payload = {
        "COMMAND":input[0],
        "ARGUMENTS":input.slice(1)
      }
      var payload = JSON.stringify( payload );
      /**
       * Send our data to the server
       */
      peers[nodeIp].write(payload, function() {
        // say your name
        // try to speak as clearly as you can
        // you know
        // everything is written down
      });
    }
  });
} catch ( e ) {
  console.log("This is an error");
}
