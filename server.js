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
  API.consoleCtl.printSystem("Process running: " + process.pid);
  API.consoleCtl.printSystem("Listening on: " + nodeIp + ":443");
  API.consoleCtl.printSystem("Starting " + forks + " workers.");
  cluster.on('online', function(worker){
    API.consoleCtl.printSystem("Worker " + worker.process.pid + " Dispatched");
  });
  cluster.on('message', function(worker, message){
    API.consoleCtl.printMessage("Worker " + worker.process.pid, message);
  });
  cluster.on('exit', function(worker, code, signal){
    API.consoleCtl.printSystem("Worker " + worker.process.pid + " Stopped");
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
  process.send("Listening");

  /**
   * On Connection
   */
  ashita.on('connection', function( socket ) {
    API.consoleCtl.printSystem("Using Worker: " + process.pid);
    /**
     * Get our client's IP address
     */
    socket.ipaddr = socket._socket.remoteAddress.substr(7);
    if ( API.aclCtl.checkEntry(socket.ipaddr) === false ) {
        socket.close();
    }
    /**
     * Loop Through Nodes
     */
    for ( var peer in API.peerCtl.getPeers() ) {
      var payload = {
        "type":"newPeerDiscovered",
        "ipaddr": peer
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
          this.sessionid = data.sid ? data.sid : API.sessionCtl.generateId();
          this.nodeIp = nodeIp;
          this.ipaddr = socket.ipaddr;
          if ( API.peerCtl.checkPeer(this.ipaddr) ) {
            return socket.close();
          } else {
            API.peerCtl.addPeer(this.ipaddr);
            ashita.clients.forEach(function( client ) {
              var payload = {
                "type":"newPeerDiscovered",
                "ipaddr": this.ipaddr
              };
              payload = JSON.stringify( payload );
              client.send( payload );
            });
          }
          try {
            var sessionObject = API.sessionCtl.getObject(this.sessionid);
            if ( sessionObject ) {
              API.sessionCtl.setObject({
                sessionid:this.sessionid,
                ipaddr:this.ipaddr,
                channels:sessionObject.channels,
              });
              API.consoleCtl.printSystem("New Authenticated Connection: " + this.sessionid);
              var payload = {
                "type":"newAuthedConnection",
                "sid":this.sessionid,
                "channels":sessionObject.channels
              };
              payload = JSON.stringify(payload);
              socket.send(payload);
              var channels = API.sessionCtl.getValue(this.sessionid, "channels");
              if ( channels ) {
                   for (var i = 0; i < channels.length; ++i ) {
                     API.consoleCtl.printSystem(API.sessionCtl.getValue(this.sessionid, "ipaddr") + " subscribing to " + channels[i]);
                     var payload = {
                       "type":"subscribeSuccessful",
                       "content":{
                         "channel":channels[i]
                       }
                     };
                     payload = JSON.stringify( payload );
                     socket.send( payload );
                     var channelObject = API.channelCtl.getObject(channels[i]);
                     for ( var j = 0; j < channelObject['messages'].length ; ++j ) {
                       var payload = {
                         "type":"messageSuccessful",
                         "content":{
                           "nodeIpaddr":this.nodeIp,
                           "ipaddr":this.ipaddr,
                           "channel":channelObject['messages'][j].name,
                           "text":channelObject['messages'][j].message
                         }
                       };
                       payload = JSON.stringify( payload );
                       socket.send( payload );
                    }
                  }
              }
              return true;
            } else {
              var sessionObject = API.sessionCtl.setObject({
                sessionid:this.sessionid,
                ipaddr:this.ipaddr,
                channels:[],
              });
              if ( sessionObject ) {
                API.consoleCtl.printSystem("New Anonymous Connection: " + this.sessionid);
                var payload = {
                  "type":"newAnonymousConnection",
                  "sid":this.sessionid
                };
                payload = JSON.stringify(payload);
                socket.send(payload);
              }
              return true;
            }
            return false;
          } catch ( e ) {
            API.consoleCtl.printError( e );
          }
  			},
        /**
         * UserList Signal
         */
  			userlist:function( data ) {
          var channel = data.content.channel ? data.content.channel:"";
          assert.equal( validator.isEmpty( channel ), false);
          try {
      			var channelObject = API.channelCtl.getObject(channel);
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
         * Private Signal
         */
  			private:function( data ) {
  				this.ipaddr = API.sessionCtl.getValue(data.sid, "ipaddr");
  				this.recepient = data.content.ipaddr;
  				var payload = {
  					"type":"privateSubscribeSuccessful",
  					"content":{
  						ipaddr:data.content.ipaddr
  					}
  				};
  				payload = JSON.stringify( payload );
  				socket.send( payload );
  				// setup event to open private message with end user
  			},
        /**
         * PrivateMessage Signal
         */
  			privateMessage:function( data ) {
  				this.ipaddr = API.sessionCtl.getValue(data.sid, "ipaddr");
  				this.recepient = data.content.ipaddr;
  				console.log(this.ipaddr, this.recepient);
  			},
        /**
         * Subscribe Signal
         */
  			join:function( data ) {
          var channel = data.content.channel ? data.content.channel:"";
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
              API.consoleCtl.printSystem(this.ipaddr + " subscribing to " + this.channel);
              var payload = {
                "type":"subscribeSuccessful",
                "content":{
                  "channel":this.channel
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
                  "channel":this.channel
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
  			part:function( data ) {
          var channel = data.content.channel ? data.content.channel:"";
          assert.equal( validator.isEmpty( channel ), false);
          //return functions.doUnsubscribe( socket, data.sid, channel, sessionCtl.getValue(data.sid, "username") );
  			},
        /**
         * Message Signal
         */
  			message:function( data ) {
  				data.sid = data.sid ? data.sid:API.sessionCtl.generateId();
  				var channel = data.content.channel ? data.content.channel:"";
  				var text = data.content.text ? data.content.text:"";
  				assert.equal( validator.isEmpty( channel ), false );
  				assert.equal( validator.isEmpty( text ), false );
  				assert.equal( validator.isAscii( text ), true );
          try {
     			 this.sessionid = data.sid;
     			 this.channel = channel;
     			 this.ipaddr = socket.ipaddr;
     			 this.text = text;
     			 if ( this.channel !== "System" ) {
     			 	var payload = {
     			 		"type":"messageSuccessful",
     			 		"content":{
     			 			"nodeIpaddr":process.env.ipaddr,
     			 			"channel":this.channel,
     			 			"ipaddr":this.ipaddr,
     			 			"text":this.text
     			 		}
     			 	};
     			 	API.channelCtl.message({
     			 		"name":this.channel,
     			 		"type":"channelMessage",
     			 		"nodeIpaddr":nodeIp,
     			 		"ipaddr":this.ipaddr,
     			 		"timestamp":0,
     			 		"message":this.text
     			 	});
     			 	payload = JSON.stringify( payload );
     			 	ashita.clients.forEach(function( client )	{
     			 		client.send( payload );
     			 	});
     			 } else if ( this.channel === 'System' ) {
     			 	var payload = {
     			 		"type":"permissionDenied",
     			 	};
     			 	payload = JSON.stringify( payload );
     			 	socket.send(payload);
     			 }
     		 } catch ( e ) {
     			 API.consoleCtl.printError( e );
     		 }
     	 }
  		};
  		if ( typeof signal[data.type] !== "function" ) {
  			API.consoleCtl.printError("Invalid Signal");
  		}
  		return signal[data.type](data);
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
