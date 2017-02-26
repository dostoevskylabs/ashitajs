/**
 * ashita/core
 *
 * @package    ashita/core
 * @author     recursiveoverflow
 * @version    1.0.0
 */
var os=require('os');
var interfaces=os.networkInterfaces();
var nodeIp = interfaces["Wi-Fi"][1].address;
var WebSocketServer=require('uws').Server;
var https=require('https');
var fs=require('fs');
var express=require('express');
var path=require('path');
var crypto=require('crypto');
var util=require('util');
var validator=require('validator');
var assert=require('assert');
var moment=require('moment');
var controllers=require('./controllers.js');
var functions=require('./functions.js');
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
 * Setup our controllers
 */
controllers.sessionCtl.init();
controllers.channelCtl.init();
controllers.peerCtl.init();
/**
 * Tell Express where our client lives
 */
app.use(express.static(path.join(__dirname, '/public')));
/**
 * Listening on:
 */
controllers.consoleCtl.printSystem("Listening on: " + nodeIp);
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
	functions.discoverPeers( socket );
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
			auth : function( data ) {
				try {
					data.sid = data.sid ? data.sid : controllers.sessionCtl.generateId();
					functions.doSession( ashita, socket, data.sid, nodeIp, socket.ipaddr );
				} catch ( e ) {
					controllers.consoleCtl.printError( e );
				}
			},
      /**
       * Register Signal
       */
			register : function( data ) {
				try {
					var username = data.content.username ? data.content.username : "";
					var password = data.content.password ? data.content.password : "";
					assert.equal( validator.isEmpty( username ), false);
					assert.equal( validator.isAlphanumeric( username ), true);
					assert.equal( validator.isEmpty( password ), false);
					assert.equal( validator.isAlphanumeric( password ), true);
					if ( controllers.sessionCtl.getValue(data.sid, "authenticated") === false ) {
						functions.doRegister( socket, username, password );
					} else {
						var payload = {
							"type":"permissionDenied",
							"content":{}
						};
						payload = JSON.stringify( payload );
						socket.send( payload );
					}
				} catch ( e ) {
					controllers.consoleCtl.printError( e );
				}
			},
      /**
       * Login Signal
       */
			login : function( data ) {
				try {
					var username = data.content.username ? data.content.username : "";
					var password = data.content.password ? data.content.password : "";
					assert.equal( validator.isEmpty( username ), false);
					assert.equal( validator.isAlphanumeric( username ), true);
					assert.equal( validator.isEmpty( password ), false);
					assert.equal( validator.isAlphanumeric( password ), true);
					if ( controllers.sessionCtl.getValue(data.sid, "authenticated") === true ) {
						var payload = {
							"type":"permissionDenied",
							"content":{}
						};
						payload = JSON.stringify( payload );
						socket.send( payload );
					} else {
						functions.doLogin( ashita, socket, data.sid, socket.ipaddr, username, password );
					}
				} catch ( e ) {
					controllers.consoleCtl.printError( e );
				}
			},
      /**
       * Logout Signal
       */
			logout : function( data ) {
				try {
					if ( controllers.sessionCtl.getValue(data.sid, "authenticated") === true ) {
						functions.doLogout( socket, data.sid, socket.ipaddr );
					} else {
						var payload = {
							"type":"permissionDenied",
							"content":{}
						};
						payload = JSON.stringify( payload );
						socket.send( payload );
					}
				} catch ( e ) {
					controllers.consoleCtl.printError( e );
				}
			},
      /**
       * UserList Signal
       */
			userlist : function( data ) {
				try {
					var channel = data.content.channel ? data.content.channel : "";
					assert.equal( validator.isEmpty( channel ), false);
					//assert.equal( validator.isAlphanumeric( channel ), true);
					functions.getUserlist( socket, channel );
				} catch ( e ) {
					controllers.consoleCtl.printError( e );
				}
			},
      /**
       * Private Signal
       */
			private : function( data ) {
				this.username = controllers.sessionCtl.getValue(data.sid, "username");
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
			privateMessage : function( data ) {
				this.username = sessionCtl.getValue(data.sid, "username");
				this.recepient = data.content.user;
				functions.doPrivate(this.username, this.recepient);
			},
      /**
       * Subscribe Signal
       */
			subscribe : function( data ) {
				try {
					if ( controllers.sessionCtl.getValue(data.sid, "authenticated") === true ) {
						var channel = data.content.channel ? data.content.channel : "";
						assert.equal(validator.isEmpty(channel), false);
						//assert.equal(validator.isAlphanumeric(channel), true);
						functions.doSubscribe( socket, data.sid, channel );
					} else {
						var payload = {
							"type":"permissionDenied",
							"content":{}
						};
						payload = JSON.stringify( payload );
						socket.send( payload );
					}
				} catch ( e ) {
					controllers.consoleCtl.printError( e );
				}
			},
      /**
       * Unsubscribe Signal
       */
			unsubscribe : function( data ) {
				try {
					var channel = data.content.channel ? data.content.channel : "";
					assert.equal( validator.isEmpty( channel ), false);
					//assert.equal( validator.isAlphanumeric( channel ), true);
					if ( controllers.sessionCtl.getValue(data.sid, "authenticated") === true ) {
						functions.doUnsubscribe( socket, data.sid, channel, sessionCtl.getValue(data.sid, "username") );
					} else {
						var payload = {
							"type":"permissionDenied",
							"content":{}
						};
						payload = JSON.stringify( payload );
						socket.send( payload );
					}
				} catch ( e ) {
					controllers.consoleCtl.printError( e );
				}
			},
      /**
       * Purge Signal
       */
			purge : function( data ) {
				//pass
			},
      /**
       * Message Signal
       */
			message : function( data ) {
				data.sid = data.sid ? data.sid : controllers.sessionCtl.generateId();
				var channel = data.content.channel ? data.content.channel : "";
				var text = data.content.text ? data.content.text : "";
				assert.equal( validator.isEmpty( channel ), false );
				assert.equal( validator.isEmpty( text ), false );
				assert.equal( validator.isAscii( text ), true );
				try {
					functions.doMessage( ashita, socket, data.sid, channel, socket.ipaddr, controllers.sessionCtl.getValue(data.sid, "username"), text );
				} catch ( e ) {
					controllers.consoleCtl.printError( e );
				}
			}
		};
		if ( typeof signal[data.type] !== "function" ) {
			controllers.consoleCtl.printError("Invalid Signal");
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
		controllers.peerCtl.removePeer(socket.ipaddr);
	});
});
