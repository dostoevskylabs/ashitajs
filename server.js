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
    if ( API.peerCtl.checkPeer(socket.ipaddr) ) {
      socket.close();
    } else {
      API.peerCtl.addPeer(socket.ipaddr);
      ashita.clients.forEach(function( client ) {
        var payload = {
          "type":"newPeerDiscovered",
          "content":{
            "ipaddr": socket.ipaddr
          }
        };
        payload = JSON.stringify( payload );
        client.send( payload );
      });
    }
    /**
     * Loop Through Nodes
     */
    for ( var peer in API.peerCtl.getPeers() ) {
      var payload = {
        "type":"newPeerDiscovered",
        "content":{
          "ipaddr": peer
        }
      };
      payload = JSON.stringify( payload );
      socket.send( payload );
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
        /**
         * Auth Signal
         */
  			auth:function( data ) {
          this.sessionid      = data.sid ? data.sid : API.sessionCtl.generateId();
          this.nodeIp         = nodeIp;
          this.ipaddr         = socket.ipaddr;
          try {
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
                  "sid":this.sessionid
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
          var channel = data.channel.name ? data.channel.name : "";
          assert.equal(validator.isEmpty(channel), false);
          try {
            this.sessionid = data.sid;
            this.ipaddr = socket.ipaddr;
            this.channel = channel;
            var channelObject = API.channelCtl.getObject(this.channel);
            if ( channelObject ) {
              var activeChannels = API.sessionCtl.getValue(this.sessionid, "channels");
              activeChannels.push(this.channel);
              API.sessionCtl.setValue(this.sessionid, "channels", activeChannels );
              API.consoleCtl.printMessage("SYSTEM", this.ipaddr + " subscribing to", this.channel);
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
              for ( var j = 0; j < channelObject['messages'].length ; ++j ) {
                var payload = {
                  "type":"messageSuccessful",
                  "content":{
                    "nodeIpaddr":nodeIp,
                    "ipaddr":this.ipaddr,
                    "channel":channelObject['messages'][j].channel,
                    "text":channelObject['messages'][j].text
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
                    "name":this.channel
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
      							"channel" : channel,
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
  				var channel = data.channel.name ? data.channel.name : "";
  				var message = data.channel.message ? data.channel.message : "";
  				assert.equal( validator.isEmpty( channel ), false );
  				assert.equal( validator.isEmpty( message ), false );
  				assert.equal( validator.isAscii( message ), true );
          try {
     			 this.sessionid = data.sid;
     			 this.channel = channel;
     			 this.ipaddr = socket.ipaddr;
     			 this.message = message;
     			 if ( this.channel !== "System" ) {
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
            API.channelCtl.message({
            	"name":this.channel,
            	"type":"channelMessage",
            	"ipaddr":this.ipaddr,
            	"timestamp":0,
            	"message":this.message
            });
            payload = JSON.stringify( payload );
            API.consoleCtl.printMessage(this.channel, this.ipaddr, this.message);
            ashita.clients.forEach(function( client )	{
            	client.send( payload );
            });
     			 } else if ( this.channel === 'System' ) {
     			 	var payload = {
     			 		"type":"permissionDenied",
     			 	};
     			 	payload = JSON.stringify( payload );
     			 	socket.send( payload );
     			 }
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
