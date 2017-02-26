var crypto=require('crypto');
var controllers=require('./controllers.js');
/**
 * Loop through known peers
 * and broadcast to new peers
 */
exports.discoverPeers = function discoverPeers( socket ) {
	for ( var peer in controllers.peerCtl.getPeers() ) {
		var payload = {
 		   "type":"newPeerDiscovered",
 		   "ipaddr": peer
 	   };
 	   payload = JSON.stringify( payload );
 	   socket.send( payload );
	}
}
exports.doSession = function doSession( ashita, socket, sessionid, nodeip, ipaddr ) {
	this.socket = socket;
	this.sessionid = sessionid;
  this.nodeIp = nodeip;
	this.ipaddr = ipaddr;
	var sessionObject = controllers.sessionCtl.getObject(this.sessionid);
	if ( sessionObject ) {
		controllers.sessionCtl.setObject({
			sessionid:this.sessionid,
			ipaddr:this.ipaddr,
			username:sessionObject.username,
			channels:sessionObject.channels,
			authenticated:true
		});
		if ( controllers.peerCtl.checkPeer(this.ipaddr) ) {
			return this.socket.close();
		} else {
			controllers.peerCtl.addPeer(this.ipaddr, sessionObject.username);
			ashita.clients.forEach(function( client ) {
				var payload = {
					"type":"newPeerDiscovered",
					"ipaddr": ipaddr
				};
				payload = JSON.stringify( payload );
				client.send( payload );
			});
		}
		controllers.consoleCtl.printSystem("New Authenticated Connection: " + this.sessionid);
		var payload = {
			"type":"newAuthedConnection",
			"sid":this.sessionid,
			"channels":sessionObject.channels
		};
		payload = JSON.stringify(payload);
		this.socket.send(payload);
		var channels = controllers.sessionCtl.getValue(this.sessionid, "channels");
		if ( channels ) {
				 for (var i = 0; i < channels.length; ++i ) {
					 controllers.consoleCtl.printSystem(controllers.sessionCtl.getValue(this.sessionid, "username") + " subscribing to " + channels[i]);
					 var payload = {
						 "type":"subscribeSuccessful",
						 "content":{
							 "channel":channels[i]
						 }
					 };
					 payload = JSON.stringify( payload );
					 this.socket.send( payload );
					 var channelObject = controllers.channelCtl.getObject(channels[i]);
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
						 this.socket.send( payload );
					}
				}
		}
		return true;
	} else {
		var sessionObject = controllers.sessionCtl.setObject({
			sessionid:this.sessionid,
			ipaddr:this.ipaddr,
			username:"Anonymous",
			channels:[],
			authenticated:false
		});
		if ( sessionObject ) {
			controllers.consoleCtl.printSystem("New Anonymous Connection: " + this.sessionid);
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
exports.doLogin = function doLogin( ashita, socket, sessionid, ipaddr, username, password ) {
	this.sessionid = controllers.sessionCtl.generateId();
	this.ipaddr = ipaddr;
	this.username = username;
	this.password = password;
	var encryptedPassword = crypto.createHmac( 'sha512', password ).digest( 'hex' );
	var sessionObject = controllers.sessionCtl.setObject({
		sessionid:this.sessionid,
		ipaddr:this.ipaddr,
		username:this.username,
		channels:[],
		authenticated:true
	});
	if ( sessionObject ) {
		if ( controllers.peerCtl.checkPeer(this.ipaddr) ) {
			return this.socket.close();
		} else {
			controllers.peerCtl.addPeer(this.ipaddr, this.username);
			ashita.clients.forEach(function( client ) {
				var payload = {
					"type":"newPeerDiscovered",
					"ipaddr": ipaddr
				};
				payload = JSON.stringify( payload );
				client.send( payload );
			});
		}
		controllers.consoleCtl.printSystem(this.username + " logged in");
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
exports.getUserlist = function getUserlist( socket, channel ) {
	var channelObject = controllers.channelCtl.getObject(channel);
	if ( channelObject ) {
		var activeUsers = new Object();
		for ( session in controllers.sessionCtl.activeSessions ) {
			var usr = controllers.sessionCtl.getValue(session, "username");
			if ( channelObject.userlist.indexOf(usr) !== -1 ) {
				activeUsers[usr] = controllers.sessionCtl.getValue(session, "ipaddr");
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
exports.doLogout = function doLogout( socket, sessionid, ipaddr ) {
	this.sessionid = sessionid;
	this.ipaddr = ipaddr;
	this.username = controllers.sessionCtl.getValue(this.sessionid, "username");
	// pass
}
exports.doRegister = function doRegister( socket, username, password ) {
	this.username = username;
	this.password = password;
	var encryptedPassword = crypto.createHmac( 'sha512', this.password ).digest( 'hex' );
	// pass
}
exports.doUnsubscribe = function doUnsubscribe( socket, sessionid, channel, username ) {
	this.sessionid = sessionid;
	this.channel = channel;
	this.username = username;
	// pass
}
/**
 * uhh
 */
exports.doSubscribe = function doSubscribe( socket, sessionid, channel )
 {
	 this.socket = socket;
	 this.sessionid = sessionid;
	 this.ipaddr = "0.0.0.0";
	 this.channel = channel;
	 this.username = controllers.sessionCtl.getValue(this.sessionid, "username");
	 var channelObject = controllers.channelCtl.getObject(this.channel);
	 if ( channelObject ) {
		var activeChannels = controllers.sessionCtl.getValue(this.sessionid, "channels");
		activeChannels.push(this.channel);
		controllers.sessionCtl.setValue(this.sessionid, "channels", activeChannels );
		controllers.consoleCtl.printSystem(this.username + " subscribing to " + this.channel);
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
		 controllers.channelCtl.setObject({
			 "name":this.channel,
			 "userlist":[this.username],
			 "owner":this.username,
			 "groups":[this.username],
			 "messages":[]
		 });
		 var activeChannels = controllers.sessionCtl.getValue(this.sessionid, "channels");
		 activeChannels.push(this.channel);
		 controllers.sessionCtl.setValue(this.sessionid, "channels", activeChannels );
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
 exports.doPrivate = function doPrivate(username, recepient) {
	 // pass
	 console.log(username + " sent a private message to " + recepient);
 }
 exports.doMessage = function doMessage( ashita, socket, sessionid, channel, ipaddr, username, text ) {
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
		controllers.channelCtl.message({
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
