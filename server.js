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
var WebSocketServer=require('uws').Server;
var https=require('https');
var fs=require('fs');
var cluster=require('cluster');
var express=require('express');
var path=require('path');
var util=require('util');
var validator=require('validator');
var assert=require('assert');
var moment=require('moment');
var crypto=require('crypto');
var API=require('./api.js');
if ( cluster.isMaster ) {
  var forks = os.cpus().length;
  /**
   * Listening on:
   */
  API.consoleCtl.printSystem("Process running: " + process.pid);
  API.consoleCtl.printSystem("Listening on: " + nodeIp + ":443");
  API.consoleCtl.printSystem("Starting " + forks + " workers.");
  for ( var i = 0; i < forks; ++i ) {
    cluster.fork();
  }
  cluster.on('online', function(worker){
    // pass
  });
  cluster.on('message', function(worker){
    API.consoleCtl.printMessage("Worker " + worker.process.pid, "Started");
  });
  cluster.on('exit', function(worker, code, signal){
    console.log(worker.process.pid + " stopped");
  });
  var app=express();
  var server=https.createServer({
      key:fs.readFileSync('./ssl/server.key'),
      cert:fs.readFileSync('./ssl/server.crt'),
      ca:fs.readFileSync('./ssl/ca.crt'),
      requestCert: true,
      rejectUnauthorized: false
  }, app).listen(443);
  var ashita=new WebSocketServer({
  	server: server,
  	origin:"https://"+nodeIp
  });
  /**
   * Setup our API
   */
  API.sessionCtl.init();
  API.channelCtl.init();
  API.peerCtl.init();
  /**
   * Tell Express where our client lives
   */
  app.use(express.static(path.join(__dirname, '/public')));
  /**
   * On Connection
   */
  ashita.on('connection', function( socket ) {
    /**
     * Get our client's IP address
     */
    socket.ipaddr = socket._socket.remoteAddress.substr(7);
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
            //return socket.close();
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
                username:sessionObject.username,
                channels:sessionObject.channels,
                authenticated:true
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
                     API.consoleCtl.printSystem(API.sessionCtl.getValue(this.sessionid, "username") + " subscribing to " + channels[i]);
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
                           "username":channelObject['messages'][j].username,
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
                username:"Anonymous",
                channels:[],
                authenticated:false
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
         * Register Signal
         */
  			register:function( data ) {
          var username = data.content.username ? data.content.username:"";
          var password = data.content.password ? data.content.password:"";
          assert.equal( validator.isEmpty( username ), false);
          assert.equal( validator.isAlphanumeric( username ), true);
          assert.equal( validator.isEmpty( password ), false);
          assert.equal( validator.isAlphanumeric( password ), true);
          //return functions.doRegister( socket, username, password );
  			},
        /**
         * Login Signal
         */
  			login:function( data ) {
          var username = data.content.username ? data.content.username:"";
          var password = data.content.password ? data.content.password:"";
          assert.equal( validator.isEmpty( username ), false);
          assert.equal( validator.isAlphanumeric( username ), true);
          assert.equal( validator.isEmpty( password ), false);
          assert.equal( validator.isAlphanumeric( password ), true);
          this.sessionid = API.sessionCtl.generateId();
          this.ipaddr = socket.ipaddr;
          this.username = username;
          this.password = password;
          try {
      			if ( API.sessionCtl.getValue(this.sessionid, "authenticated") === true ) {
      				var payload = {
      					"type":"permissionDenied",
      					"content":{}
      				};
      				payload = JSON.stringify( payload );
      				socket.send( payload );
      			} else {
      				var encryptedPassword = crypto.createHmac( 'sha512', password ).digest( 'hex' );
      				var sessionObject = API.sessionCtl.setObject({
      					sessionid:this.sessionid,
      					ipaddr:this.ipaddr,
      					username:this.username,
      					channels:[],
      					authenticated:true
      				});
      				if ( sessionObject ) {
      					if ( API.peerCtl.checkPeer(this.ipaddr) ) {
      						return this.socket.close();
      					} else {
      						API.peerCtl.addPeer(this.ipaddr, this.username);
      						ashita.clients.forEach(function( client ) {
      							var payload = {
      								"type":"newPeerDiscovered",
      								"ipaddr": this.ipaddr
      							};
      							payload = JSON.stringify( payload );
      							client.send( payload );
      						});
      					}
      					API.consoleCtl.printSystem(this.username + " logged in");
      					var payload = {
      						"type":"loginSuccessful",
      						"sid":this.sessionid
      					};
      					payload = JSON.stringify( payload );
      					socket.send( payload );
      					return true;
      				}
      				return false;
      			}
      		} catch ( e ) {
      			API.consoleCtl.printError( e );
      		}
  			},
        /**
         * Logout Signal
         */
  			logout:function( data ) {
          //return functions.doLogout( socket, data.sid, socket.ipaddr );
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
  				this.username = API.sessionCtl.getValue(data.sid, "username");
  				this.recepient = data.content.user;
  				var payload = {
  					"type":"privateSubscribeSuccessful",
  					"content":{
  						user:data.content.user
  					}
  				};
  				payload = JSON.stringify( payload );
  				socket.send(payload);
  				// setup event to open private message with end user
  			},
        /**
         * PrivateMessage Signal
         */
  			privateMessage:function( data ) {
  				this.username = sessionCtl.getValue(data.sid, "username");
  				this.recepient = data.content.user;
  				console.log(this.username, this.recepient);
  			},
        /**
         * Subscribe Signal
         */
  			subscribe:function( data ) {
          var channel = data.content.channel ? data.content.channel:"";
          assert.equal(validator.isEmpty(channel), false);
          try {
      			this.sessionid = data.sid;
      			this.ipaddr = socket.ipaddr;
      			this.channel = channel;
      			this.username = API.sessionCtl.getValue(this.sessionid, "username");
      			if ( API.sessionCtl.getValue(this.sessionid, "authenticated") === true ) {
      			  var channelObject = API.channelCtl.getObject(this.channel);
      			  if ( channelObject ) {
      				 	var activeChannels = API.sessionCtl.getValue(this.sessionid, "channels");
      				 	activeChannels.push(this.channel);
      				 	API.sessionCtl.setValue(this.sessionid, "channels", activeChannels );
      				 	API.consoleCtl.printSystem(this.username + " subscribing to " + this.channel);
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
      				 				"username":channelObject['messages'][j].username,
      				 				"text":channelObject['messages'][j].text
      				 			}
      				 		};
      				 		payload = JSON.stringify( payload );
      				 		socket.send( payload );
      				 	}
      			  } else {
      			 	 API.channelCtl.setObject({
      			 		 "name":this.channel,
      			 		 "userlist":[this.username],
      			 		 "owner":this.username,
      			 		 "groups":[this.username],
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
      			} else {
      				var payload = {
      					"type":"permissionDenied",
      					"content":{}
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
  			unsubscribe:function( data ) {
          var channel = data.content.channel ? data.content.channel:"";
          assert.equal( validator.isEmpty( channel ), false);
          //return functions.doUnsubscribe( socket, data.sid, channel, sessionCtl.getValue(data.sid, "username") );
  			},
        /**
         * Purge Signal
         */
  			purge:function( data ) {
  				//pass
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
     			 this.username = API.sessionCtl.getValue(data.sid, "username");
     			 this.text = text;
     			 if ( this.channel !== "System" ) {
     			 	var payload = {
     			 		"type":"messageSuccessful",
     			 		"content":{
     			 			"nodeIpaddr":process.env.ipaddr,
     			 			"channel":this.channel,
     			 			"ipaddr":this.ipaddr,
     			 			"username":this.username,
     			 			"text":this.text
     			 		}
     			 	};
     			 	API.channelCtl.message({
     			 		"name":this.channel,
     			 		"type":"channelMessage",
     			 		"nodeIpaddr":nodeIp,
     			 		"ipaddr":this.ipaddr,
     			 		"username":this.username,
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
} else {
  process.on('message', function(message){
    API.consoleCtl.printMessage("Master", message);
  });
  process.send(1);
}
