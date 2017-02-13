/**
 * ashita/core
 *
 * @package    ashita/core
 * @author     recursiveoverflow
 * @version    1.0.0
 */
process.env.mode = "development";
switch ( process.env.mode ) {
	case "development":
		process.env.ipaddr = "10.0.1.2";
	break;
}
var WebSocketServer=require('uws').Server;
var https=require('https');
var fs=require('fs');
var express=require('express');
var path=require('path');
var app=express();
var server=https.createServer({
    key:fs.readFileSync('./.ssl/server.key'),
    cert:fs.readFileSync('./.ssl/server.crt'),
    ca:fs.readFileSync('./.ssl/ca.crt'),
    requestCert: true,
    rejectUnauthorized: false
}, app).listen(443);
var ashita=new WebSocketServer({
	server: server,
	origin:"https://" + process.env.ipaddr
});
//var mongodb=require('mongodb').MongoClient;
//var mongourl='mongodb://localhost:27017/ashita';
var util=require('util');
var crypto=require('crypto');
var validator=require('validator');
var assert=require('assert');
var moment=require('moment');
/**
 * Console Controller
 */
var consoleCtl = {
	printMessage:function printMessage( usr, msg ) {
		var timestamp = moment().format("HH:mm:ss");
		console.log("["+timestamp+"] <" + usr + ">: " + msg );
	},
	printSystem:function printSystem( str )	{
		var timestamp = moment().format("HH:mm:ss");
		console.log("["+timestamp+"] @System: " + str);
	},
	printError:function printError( str ) {
		var timestamp = moment().format("HH:mm:ss");
		console.log("["+timestamp+"] !!! Error !!!: " + str);
	}
};
/**
 * Session Controller
 */
var sessionCtl = {
	init:function init() {
		this.activeSessions = new Object();
	},
	generateId:function generateId() {
		return crypto.randomBytes(8).toString('hex');
	},
	getValue:function getValue( sessionid, field ) {
		if (  this.activeSessions[sessionid] ) {
			return this.activeSessions[sessionid][field];
		}
		return false;
	},
	setValue:function setValue( sessionid, field, value) {
		if ( this.activeSessions[sessionid] ) {
			this.activeSessions[sessionid][field] = value;
			return true;
		}
		return false;
	},
	getObject:function getObject( sessionid ) {
		if ( this.activeSessions[sessionid] ) {
			return this.activeSessions[sessionid];
		}
		return false;
	},
	setObject:function setObject( sessionData )	{
		if ( !this.activeSessions[sessionData.sessionid] ) {
			this.activeSessions[sessionData.sessionid] = {
				"username":sessionData.username,
				"ipaddr":sessionData.ipaddr,
				"channels":sessionData.channels,
				"authenticated":sessionData.authenticated
			};
			return true;
		}
		return false;
	},
	destroyObject:function( sessionid )	{
		if ( this.activeSessions[sessionid] ) {
			delete this.activeSessions[sessionid];
			return true;
		}
		return false;
	}
};
/**
 * Channel Controller
 */
var channelCtl = {
	init:function init() {
		this.activeChannels = new Object();
		this.activeChannels["System"] = {
			"userlist":['System'],
			"owner":"System",
			"groups":['System']
		};
	},
	getValue:function getValue( channel, field ) {
		if ( this.activeChannels[channel] ) {
			return this.activeChannels[channel][field];
		}
		return false;
	},
	setValue:function setValue( channel, field, value ) {
		if ( this.activeChannels[chanenl] ) {
			this.activeChannels[channel][field] = value;
			return true;
		}
		return false;
	},
	getObject:function getObject( channel )	{
		if ( this.activeChannels[channel] ) {
			return this.activeChannels[channel];
		}
		return false;
	},
	setObject:function setObject( channelData )	{
		if ( !this.activeChannels[channelData.name] ) {
			this.activeChannels[channelData.name] = {
				"userlist":channelData.userlist,
				"owner":channelData.owner,
				"groups":channelData.groups,
				"messages":channelData.messages
			};
			consoleCtl.printSystem("created channel " + channelData.name);
			return true;
		}
		return false;
	},
	destroyObject:function destroyObject( channelData )	{
		if ( this.activeChannels[channelData.name] ) {
			delete this.activeChannels[channelData.name];
			consoleCtl.printSystem("deleted channel " + channelData.name);
			return true;
		}
		return false;
	},
	join:function join( channelData ) {
		if ( this.activeChannels[channelData.name]['userlist'].indexOf( channelData.username ) !== -1 ) {
			consoleCtl.printSystem(channelData.username + " joined " + channelData.name);
			return true;
		}
		return false;
	},
	exit:function exit( channelData ) {
		if ( this.activeChannels[channelData]['userlist'].indexOf( channelData.username ) === -1 ) {
			consoleCtl.printSystem(channelData.username + " exited " + channelData.name);
			return true;
		}
		return false;
	},
	message:function message( channelData )	{
		if ( this.activeChannels[channelData.name] ) {
			this.activeChannels[channelData.name]['messages'].push( channelData );
			consoleCtl.printMessage(channelData.username, channelData.message);
			return true;
		}
		return false;
	}
};
/**
 * Peer Controller
 */
 var peerCtl = {
 		init:function init() {
 			this.activePeers = new Object();
 		},
		getPeers:function getPeers() {
			return this.activePeers;
		},
 		addPeer:function addPeer( peerIp, username ) {
 			this.activePeers[peerIp] = username;
 		},
		checkPeer:function checkPeer( peerIp ) {
			if ( this.activePeers[peerIp] ) {
				return true;
			}
			return false;
		},
 		removePeer:function addPeer( peerIp ) {
 			delete this.activePeers[peerIp];
 		}
 };
sessionCtl.init();
channelCtl.init();
peerCtl.init();
app.use(express.static(path.join(__dirname, '/public')));
/**
 * Peer Connection
 */
ashita.on('connection', function( socket ){
	discoverPeers( socket );
	/**
	 * Data received
	 */
	socket.on('message', function( data ) {
		var data = JSON.parse( data );
		socket.ipaddr = data.ipaddr;
		var signal = {
			auth : function( data ){
				try {
					data.sid = data.sid ? data.sid : sessionCtl.generateId();
					doSession( socket, data.sid, data.ipaddr );
				} catch ( e ) {
					consoleCtl.printError( e );
				}
			},
			register : function( data ){
				try {
					var username = data.content.username ? data.content.username : "";
					var password = data.content.password ? data.content.password : "";
					assert.equal( validator.isEmpty( username ), false);
					assert.equal( validator.isAlphanumeric( username ), true);
					assert.equal( validator.isEmpty( password ), false);
					assert.equal( validator.isAlphanumeric( password ), true);
					if ( sessionCtl.getValue(data.sid, "authenticated") === false ) {
						doRegister( socket, username, password );
					} else {
						var payload = {
							"type":"permissionDenied",
							"content":{}
						};
						payload = JSON.stringify( payload );
						socket.send( payload );
					}
				} catch ( e ) {
					consoleCtl.printError( e );
				}
			},
			login : function( data ){
				try {
					var username = data.content.username ? data.content.username : "";
					var password = data.content.password ? data.content.password : "";
					assert.equal( validator.isEmpty( username ), false);
					assert.equal( validator.isAlphanumeric( username ), true);
					assert.equal( validator.isEmpty( password ), false);
					assert.equal( validator.isAlphanumeric( password ), true);
					if ( sessionCtl.getValue(data.sid, "authenticated") === true ) {
						var payload = {
							"type":"permissionDenied",
							"content":{}
						};
						payload = JSON.stringify( payload );
						socket.send( payload );
					} else {
						doLogin( socket, data.sid, data.ipaddr, username, password );
					}
				} catch ( e ) {
					consoleCtl.printError( e );
				}
			},
			logout : function( data ){
				try {
					if ( sessionCtl.getValue(data.sid, "authenticated") === true ) {
						doLogout( socket, data.sid, data.ipaddr );
					} else {
						var payload = {
							"type":"permissionDenied",
							"content":{}
						};
						payload = JSON.stringify( payload );
						socket.send( payload );
					}
				} catch ( e ) {
					consoleCtl.printError( e );
				}
			},
			userlist : function( data ){
				try {
					var channel = data.content.channel ? data.content.channel : "";
					assert.equal( validator.isEmpty( channel ), false);
					//assert.equal( validator.isAlphanumeric( channel ), true);
					getUserlist( socket, channel );
				} catch ( e ) {
					consoleCtl.printError( e );
				}
			},
			private : function (data) {
				this.username = sessionCtl.getValue(data.sid, "username");
				this.recepient = data.content.user;
				console.log(this.username + " opened a private chat with " + this.recepient);
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
			privateMessage : function(data){
				this.username = sessionCtl.getValue(data.sid, "username");
				this.recepient = data.content.user;
				doPrivate(this.username, this.recepient);
			},
			subscribe : function( data ){
				try {
					if ( sessionCtl.getValue(data.sid, "authenticated") === true ) {
						var channel = data.content.channel ? data.content.channel : "";
						assert.equal(validator.isEmpty(channel), false);
						//assert.equal(validator.isAlphanumeric(channel), true);
						doSubscribe( socket, data.sid, channel );
					} else {
						var payload = {
							"type":"permissionDenied",
							"content":{}
						};
						payload = JSON.stringify( payload );
						socket.send( payload );
					}
				} catch ( e ) {
					consoleCtl.printError( e );
				}
			},
			unsubscribe : function( data ){
				try {
					var channel = data.content.channel ? data.content.channel : "";
					assert.equal( validator.isEmpty( channel ), false);
					//assert.equal( validator.isAlphanumeric( channel ), true);
					if ( sessionCtl.getValue(data.sid, "authenticated") === true ) {
						doUnsubscribe( socket, data.sid, channel, sessionCtl.getValue(data.sid, "username") );
					} else {
						var payload = {
							"type":"permissionDenied",
							"content":{}
						};
						payload = JSON.stringify( payload );
						socket.send( payload );
					}
				} catch ( e ) {
					consoleCtl.printError( e );
				}
			},
			purge : function( data ){
				//pass
			},
			message : function( data ){
				data.sid = data.sid ? data.sid : sessionCtl.generateId();
				var channel = data.content.channel ? data.content.channel : "";
				var text = data.content.text ? data.content.text : "";
				assert.equal( validator.isEmpty( channel ), false );
				//assert.equal( validator.isAlphanumeric( channel ), true );
				assert.equal( validator.isEmpty( text ), false );
				assert.equal( validator.isAscii( text ), true );
				try {
					doMessage( socket, data.sid, channel, data.ipaddr, sessionCtl.getValue(data.sid, "username"), text );
				} catch ( e ) {
					consoleCtl.printError( e );
				}
			}
		};
		if (typeof signal[data.type] !== "function" ) {
			consoleCtl.printError("Invalid Signal");
		}
		return signal[data.type](data);
	});
	socket.on('error', function( e ) {
		// pass
	});
	socket.on('close', function() {
		peerCtl.removePeer(socket.ipaddr);
	});
});
/**
 * Loop through known peers
 * and broadcast to new peers
 */
function discoverPeers( socket ) {
	for ( var peer in peerCtl.getPeers() ) {
		var payload = {
 		   "type":"newPeerDiscovered",
 		   "ipaddr": peer
 	   };
 	   payload = JSON.stringify( payload );
 	   socket.send( payload );
	}
}
function doSession( socket, sessionid, ipaddr ) {
	this.socket = socket;
	this.sessionid = sessionid;
	this.ipaddr = ipaddr;
	var sessionObject = sessionCtl.getObject(this.sessionid);
	if ( sessionObject ) {
		sessionCtl.setObject({
			sessionid:this.sessionid,
			ipaddr:this.ipaddr,
			username:sessionObject.username,
			channels:sessionObject.channels,
			authenticated:true
		});
		if ( peerCtl.checkPeer(this.ipaddr) ) {
			return this.socket.close();
		} else {
			peerCtl.addPeer(this.ipaddr, sessionObject.username);
			ashita.clients.forEach(function( client ) {
				var payload = {
					"type":"newPeerDiscovered",
					"ipaddr": this.ipaddr
				};
				payload = JSON.stringify( payload );
				client.send( payload );
			});
		}
		consoleCtl.printSystem("New Authenticated Connection: " + this.sessionid);
		var payload = {
			"type":"newAuthedConnection",
			"sid":this.sessionid,
			"channels":sessionObject.channels
		};
		payload = JSON.stringify(payload);
		this.socket.send(payload);
		var channels = sessionCtl.getValue(this.sessionid, "channels");
		if ( channels ) {
				 for (var i = 0; i < channels.length; ++i ) {
					 consoleCtl.printSystem(sessionCtl.getValue(this.sessionid, "username") + " subscribing to " + channels[i]);
					 var payload = {
						 "type":"subscribeSuccessful",
						 "content":{
							 "channel":channels[i]
						 }
					 };
					 payload = JSON.stringify( payload );
					 this.socket.send( payload );
					 var channelObject = channelCtl.getObject(channels[i]);
					 for ( var j = 0; j < channelObject['messages'].length ; ++j ) {
						 var payload = {
							 "type":"messageSuccessful",
							 "content":{
								 "nodeIpaddr":process.env.ipaddr,
								 "ipaddr":this.ipaddr,
								 "channel":channelObject['messages'][j].name,
								 "username":channelObject['messages'][j].username,
								 "text":channelObject['messages'][j].message
							 }
						 };
						 payload = JSON.stringify( payload );
						 this.socket.send( payload );
					}
				}
		}
		return true;
	} else {
		var sessionObject = sessionCtl.setObject({
			sessionid:this.sessionid,
			ipaddr:this.ipaddr,
			username:"Anonymous",
			channels:[],
			authenticated:false
		});
		if ( sessionObject ) {
			consoleCtl.printSystem("New Anonymous Connection: " + this.sessionid);
			var payload = {
				"type":"newAnonymousConnection",
				"sid":this.sessionid
			};
			payload = JSON.stringify(payload);
			this.socket.send(payload);
		}
		return true;
	}
	return false;
}
function doLogin( socket, sessionid, ipaddr, username, password ) {
	this.sessionid = sessionCtl.generateId();
	this.ipaddr = ipaddr;
	this.username = username;
	this.password = password;
	var encryptedPassword = crypto.createHmac( 'sha512', password ).digest( 'hex' );
	var sessionObject = sessionCtl.setObject({
		sessionid:this.sessionid,
		ipaddr:this.ipaddr,
		username:this.username,
		channels:[],
		authenticated:true
	});
	if ( sessionObject ) {
		if ( peerCtl.checkPeer(this.ipaddr) ) {
			return this.socket.close();
		} else {
			peerCtl.addPeer(this.ipaddr, this.username);
			ashita.clients.forEach(function( client ) {
				var payload = {
					"type":"newPeerDiscovered",
					"ipaddr": this.ipaddr
				};
				payload = JSON.stringify( payload );
				client.send( payload );
			});
		}
		consoleCtl.printSystem(this.username + " logged in");
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
function getUserlist( socket, channel ) {
	var channelObject = channelCtl.getObject(channel);
	if ( channelObject ) {
		var activeUsers = new Object();
		for ( session in sessionCtl.activeSessions ) {
			var usr = sessionCtl.getValue(session, "username");
			if ( channelObject.userlist.indexOf(usr) !== -1 ) {
				activeUsers[usr] = sessionCtl.getValue(session, "ipaddr");
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
}
function doLogout( socket, sessionid, ipaddr ) {
	this.sessionid = sessionid;
	this.ipaddr = ipaddr;
	this.username = sessionCtl.getValue(this.sessionid, "username");
	// pass
}
function doRegister( socket, username, password ) {
	this.username = username;
	this.password = password;
	var encryptedPassword = crypto.createHmac( 'sha512', this.password ).digest( 'hex' );
	// pass
}
function doUnsubscribe( socket, sessionid, channel, username ) {
	this.sessionid = sessionid;
	this.channel = channel;
	this.username = username;
	// pass
}
/**
 * uhh
 */
function doSubscribe( socket, sessionid, channel )
 {
	 this.socket = socket;
	 this.sessionid = sessionid;
	 this.ipaddr = "0.0.0.0";
	 this.channel = channel;
	 this.username = sessionCtl.getValue(this.sessionid, "username");
	 var channelObject = channelCtl.getObject(this.channel);
	 if ( channelObject ) {
		var activeChannels = sessionCtl.getValue(this.sessionid, "channels");
		activeChannels.push(this.channel);
		sessionCtl.setValue(this.sessionid, "channels", activeChannels );
		consoleCtl.printSystem(this.username + " subscribing to " + this.channel);
		var payload = {
			"type":"subscribeSuccessful",
			"content":{
				"channel":this.channel
			}
		};
		payload = JSON.stringify( payload );
		this.socket.send( payload );
		for ( var j = 0; j < channelObject['messages'].length ; ++j ) {
			var payload = {
				"type":"messageSuccessful",
				"content":{
					"nodeIpaddr":process.env.ipaddr,
					"ipaddr":this.ipaddr,
					"channel":channelObject['messages'][j].channel,
					"username":channelObject['messages'][j].username,
					"text":channelObject['messages'][j].text
				}
			};
			payload = JSON.stringify( payload );
			this.socket.send( payload );
		}
	 } else {
		 channelCtl.setObject({
			 "name":this.channel,
			 "userlist":[this.username],
			 "owner":this.username,
			 "groups":[this.username],
			 "messages":[]
		 });
		 var activeChannels = sessionCtl.getValue(this.sessionid, "channels");
		 activeChannels.push(this.channel);
		 sessionCtl.setValue(this.sessionid, "channels", activeChannels );
		 var payload = {
		   "type":"subscribeNewSuccessful",
		   "content":{
			   "channel":this.channel
		   }
		 };
		 payload = JSON.stringify( payload );
		 this.socket.send( payload );
	 }
 }
 function doPrivate(username, recepient) {
	 // pass
	 console.log(username + " sent a private message to " + recepient);
 }
 function doMessage( socket, sessionid, channel, ipaddr, username, text ) {
	this.sessionid = sessionid;
	this.channel = channel;
	this.ipaddr = ipaddr;
	this.username = username;
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
		channelCtl.message({
			"name":this.channel,
			"type":"channelMessage",
			"nodeIpaddr":process.env.ipaddr,
			"ipaddr":this.ipaddr,
			"username":this.username,
			"timestamp":0,
			"message":this.text
		});
		payload = JSON.stringify( payload );
		ashita.clients.forEach(
		function( client )
		{
			client.send( payload );
		});
	} else if ( this.channel === 'System' ) {
		var payload = {
			"type":"permissionDenied",
		};
		payload = JSON.stringify( payload );
		socket.send(payload);
	}
}
