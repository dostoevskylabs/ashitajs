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
var nodeIp=interfaces[interface][1].address;
var fs=require('fs');
var cluster=require('cluster');
var path=require('path');
var util=require('util');
var validator=require('validator');
var assert=require('assert');
var moment=require('moment');
var crypto=require('crypto');
var API=require('./api.js');
/**
 * Setup our API
 */
API.aclCtl.init();
API.sessionCtl.init();
API.channelCtl.init();
API.peerCtl.init();
API.aclCtl.addEntry("10.0.1.4");
if ( cluster.isMaster ) {
  var forks = os.cpus().length;
  for ( var i = 0; i < forks; ++i ) {
    cluster.fork();
  }
  /**
   * Listening on:
   */
  API.consoleCtl.printMessage("SYSTEM", "Master Process running on", process.pid);
  API.consoleCtl.printMessage("SYSTEM", "Starting Workers", forks);
  cluster.on('online', function(worker){
    API.consoleCtl.printMessage("SYSTEM", "Worker " + worker.process.pid, "Dispatched");
  });
  cluster.on('message', function(worker, message){
    API.consoleCtl.printMessage("Worker", worker.process.pid, message);
  });
  cluster.on('exit', function(worker, code, signal){
    API.consoleCtl.printMessage("SYSTEM", "Worker " + worker.process.pid, "Stopped");
  });
  /*for ( var i = 1; i <= Object.keys(cluster.workers).length; ++i ) {
    cluster.workers[i].process.send("test");
  }*/
} else {
  var WebSocketServer=require('uws').Server;
  var https=require('https');
  var express=require('express');
  var app=express();
  var server=https.createServer({
      key:fs.readFileSync('./ssl/server.key'),
      cert:fs.readFileSync('./ssl/server.crt'),
      ca:fs.readFileSync('./ssl/ca.crt'),
      requestCert: true,
      rejectUnauthorized: false
  }, app);
  var ashita=new WebSocketServer({
    server: server,
    origin:"https://"+nodeIp
  });
  /**
   * Tell Express where our client lives
   */
  app.use(express.static(path.join(__dirname, '/public')));
  server.listen(443);
  process.on('message', function(message){
    API.consoleCtl.printMessage("Master", message);
  });
  process.send("Listening on: " + nodeIp + ":443");
  /**
   * On Connection
   */
  ashita.on('connection', function( socket ) {
    API.consoleCtl.printMessage("SYSTEM", "Using Worker", process.pid);
    /**
     * Get our client's IP address
     */
    socket.ipaddr = socket._socket.remoteAddress.substr(7);
    if ( API.aclCtl.checkEntry(socket.ipaddr) === false ) {
      socket.close();
    }


    /**
     * On Message
     */
  	socket.on('message', function( data ) {
      /**
       * Parse our data
       */
  		var data = JSON.parse( data );
      /**
       * Setup our Signal Object
       */
  		var signal = {
        debug:function( data ) {
          this.controller = data.controller;
          switch ( this.controller ) {
            case "channel":
              var payload = {
                "type":"debug",
                "content":{
                  "object":API.channelCtl.activeChannels
                }
              };
              payload = JSON.stringify( payload );
              socket.send( payload );
            break;
            case "session":
              var payload = {
                "type":"debug",
                "content":{
                  "object":API.sessionCtl.activeSessions
                }
              };
              payload = JSON.stringify( payload );
              socket.send( payload );
            break;
          }
        },
        /**
         * Auth Signal
         */
  			auth:function( data ) {
          this.sessionid      = data.sid ? data.sid : API.sessionCtl.generateId();
          this.nodeIp         = nodeIp;
          this.ipaddr         = socket.ipaddr;
          try {
            if ( API.peerCtl.checkPeer(socket.ipaddr) === false ) {
              var peers = API.peerCtl.getPeers();
              for ( var i = 0; i < peers.length; ++i ) {
                var payload = {
                  "type":"newPeerDiscovered",
                  "content":{
                    "ipaddr": peers[i]
                  }
                };
                payload = JSON.stringify( payload );
                socket.send( payload );
              }
            }
            API.peerCtl.addPeer(socket.ipaddr);
            ashita.clients.forEach(function( client ) {
              if ( socket !== client ) {
                var payload = {
                  "type":"newPeerDiscovered",
                  "content":{
                    "ipaddr": socket.ipaddr
                  }
                };
                payload = JSON.stringify( payload );
                client.send( payload );
              }
            });
            var sessionObject = API.sessionCtl.getObject(this.sessionid);
            /**
             * Session exists
             */
            if ( sessionObject ) {
              API.sessionCtl.setObject({
                sessionid:this.sessionid,
                ipaddr:this.ipaddr,
                channels:sessionObject.channels,
              });
              API.consoleCtl.printMessage("SYSTEM", "New Authenticated Connection", this.sessionid);
              var payload = {
                "type":"newAuthedConnection",
                "content":{
                  "sid":this.sessionid,
                  "channels":sessionObject.channels
                }
              };
              payload = JSON.stringify( payload );
              socket.send( payload );
            /**
             * Session doesn't exist
             */
            } else {
              API.sessionCtl.setObject({
                sessionid:this.sessionid,
                ipaddr:this.ipaddr,
                channels:[],
              });
              API.consoleCtl.printMessage("SYSTEM", "New Anonymous Connection", this.sessionid);
              var payload = {
                "type":"newAnonymousConnection",
                "content":{
                  "sid":this.sessionid,
                  "channels":['System']
                }
              };
              payload = JSON.stringify( payload );
              socket.send( payload );
            }
          } catch ( e ) {
            API.consoleCtl.printError( e );
          }
  			},
        /**
         * Subscribe Signal
         */
  			channelJoin:function( data ) {
          this.sessionid  = data.sid;
          this.ipaddr     = socket.ipaddr;
          this.channel    = data.channel.name;
          try {
            API.consoleCtl.printMessage("SYSTEM", this.ipaddr + " subscribing to", this.channel);
            var channelObject = API.channelCtl.getObject(this.channel);
            if ( channelObject ) {
              var activeChannels = API.sessionCtl.getValue(this.sessionid, "channels");
              activeChannels.push(this.channel);
              API.sessionCtl.setValue(this.sessionid, "channels", activeChannels );
              var userList = API.channelCtl.getValue(this.channel, "userlist");
              userList.push(this.ipaddr);
              API.channelCtl.setValue(this.channel, "userlist", userList);
              var payload = {
                "type":"subscribeSuccessful",
                "content":{
                  "channel":{
                    "name":this.channel
                  }
                }
              };
              payload = JSON.stringify( payload );
              socket.send( payload );
              for ( var i = 0; i < channelObject['messages'].length ; ++i ) {
                var payload = {
                  "type":"messageSuccessful",
                  "content":{
                    "channel":{
                      "name":channelObject['messages'][i].channel,
                      "ipaddr":this.ipaddr,
                      "message":channelObject['messages'][i].message
                    }
                  }
                };
                payload = JSON.stringify( payload );
                socket.send( payload );
              }
            } else {
              API.channelCtl.setObject({
                "name":this.channel,
                "userlist":[this.ipaddr],
                "owner":this.ipaddr,
                "groups":[this.ipaddr],
                "messages":[]
              });
              var activeChannels = API.sessionCtl.getValue(this.sessionid, "channels");
              activeChannels.push(this.channel);
              API.sessionCtl.setValue(this.sessionid, "channels", activeChannels );
              var payload = {
                "type":"subscribeNewSuccessful",
                "content":{
                  "channel":{
                    "name":this.channel,
                    "ipaddr":this.ipaddr
                  }
                }
              };
              payload = JSON.stringify( payload );
              socket.send( payload );
            }
            var channelObject = API.channelCtl.getObject(this.channel);
      			if ( channelObject ) {
      				var activeUsers = new Object();
      				for ( session in API.sessionCtl.activeSessions ) {
      					var usr = API.sessionCtl.getValue(session, "username");
      					if ( channelObject.userlist.indexOf(usr) !== -1 ) {
      						activeUsers[usr] = API.sessionCtl.getValue(session, "ipaddr");
      					}
      				}
      				var payload = {
      					"type":"userList",
      					"content":{
      							"channel" : this.channel,
      							"users" : channelObject.userlist
      					}
      				};
      				payload = JSON.stringify( payload );
      				socket.send( payload );
      			}
      		} catch ( e ) {
      			API.consoleCtl.printError( e );
      		}
  			},
        /**
         * Unsubscribe Signal
         */
  			channelPart:function( data ) {
          // pass
  			},
        /**
         * Message Signal
         */
  			channelMessage:function( data ) {
  				data.sid = data.sid ? data.sid : API.sessionCtl.generateId();
          this.sessionid = data.sid;
          this.channel = data.channel.name;
          this.ipaddr = socket.ipaddr;
          this.message = data.channel.message;
          try {
           API.channelCtl.message({
           	"name":this.channel,
           	"ipaddr":this.ipaddr,
           	"timestamp":0,
           	"message":this.message
           });
           var payload = {
          	"type":"messageSuccessful",
          	"content":{
              "sid":this.sessionid,
          		"channel":{
                "name":this.channel,
                "ipaddr":this.ipaddr,
                "message":this.message
              }
          	}
          };
          payload = JSON.stringify( payload );
          API.consoleCtl.printMessage(this.channel, this.ipaddr, this.message);
          ashita.clients.forEach(function( client )	{
          	client.send( payload );
          });
     		 } catch ( e ) {
     			 API.consoleCtl.printError( e );
     		 }
     	 },
        /**
         * Private Signal
         */
  			private:function( data ) {
  				// pass
  			},
        /**
         * PrivateMessage Signal
         */
  			privateMessage:function( data ) {
  				// pass
  			}
  		};
  		if ( typeof signal[data.type] !== "function" ) {
  			API.consoleCtl.printError("SIGFAULT");
  		}
  		return signal[data.type](data.content);
  	});
    /**
     * On Error
     */
  	socket.on('error', function( e ) {
  		// pass
  	});
    /**
     * On Close
     */
  	socket.on('close', function() {
      /**
       * Get Rid of our defunct peers
       */
  		API.peerCtl.removePeer(socket.ipaddr);
  	});
  });
}
