ashitajs - decentralized P2P network in the browser
================================

ashitajs intends to be a fully decentralized P2P network  (though not there yet) designed to be deployed anywhere. It comes in two parts following a client and server model. To be part of the network you need only access a node via the browser, to be a node you need only run your own node with the server portion of the model. It's still in its infancy and a lot of work still needs to be done.

First we need to generate an SSL bundle to use with node.js
```bash
mkdir .ssl
```

```bash
cd .ssl
```

```bash
openssl genrsa -des3 -out ca.key 4096
```

```bash
openssl req -new -key ca.key -out ca.csr
```

```bash
openssl x509 -req -days 365 -in ca.csr -out ca.crt -signkey ca.key
```
```bash
openssl genrsa -des3 -out server.key 4096
```

```bash
openssl req -new -key server.key -out server.csr
```

```bash
cp server.key server.key.passphrase
```

```bash
openssl rsa -in server.key.passphrase -out server.key
```

```bash
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
```

Next we need to install our modules from the main directory with server.js
```bash
npm install
```

Now we need to make sure MongoDB is installed on our System, and make sure the daemon is running, once thats done we are ready to start
```bash
npm start
```

##Server Controllers
###consoleCtl
```javascript
function printMessage( usr, msg ){}
function printSystem( str ){}
function printError( str ){}
```
###sessionCtl
```javascript
function init(){}
function generateId(){}
function getValue( sessionid, field ){}
function setValue( sessionid, field, value){}
function getObject( sessionid ){}
function setObject( sessionData ){}
function destroyObject( sessionid ){}
```
###channelCtl
```javascript
function init(){}
function getValue( channel, field ){}
function setValue( channel, field ){}
function getObject( channel ){}
function setObject( channelData ){}
function destroyObject( channelData ){}
function join( channelData ){}
function exit( channelData ){}
function message( channelData ){}
```
###peerCtl
```javascript
function init(){}
function addPeer( peerIp ){}
function removePeer( peerIp ){}
```
##Client Signals
###auth
send socket auth signal
```javascript
ashita.socket.send({
	type:"auth",
	ipaddr:ashita.ipAddr,
	sid:document.cookie
});
```
###userlist
send socket userlist signal
```javascript
ashita.socket.send({
	type:"userlist",
	ipaddr:ashita.ipAddr,
	sid:document.cookie,
	content:{
		channel:channel
	}
});
```
###register
send socket register signal

```bash
/register [username] [password]
```

```javascript
ashita.socket.send({
	type:"register",
	ipaddr:ashita.ipAddr,
	sid:document.cookie,
	content:{
		username:username,
		password:password
	}
});
```
###login
send socket login signal

```bash
/login [username] [password]
```

```javascript
ashita.socket.send({
	type:"login",
	ipaddr:ashita.ipAddr,
	sid:document.cookie,
	content:{
		username:username,
		password:password
	}
});
```
###logout
send socket logout signal

```bash
/logout
```

```javascript
ashita.socket.send({
	type:"logout",
	ipaddr:ashita.ipAddr,
	sid:document.cookie,
	content:{}
});
```
###subscribe
send socket subscribe signal

```bash
/subscribe [channel]
```

```javascript
ashita.socket.send({
	type:"subscribe",
	ipaddr:ashita.ipAddr,
	sid:document.cookie,
	content:{
		channel:channel
	}
});
```
###unsubscribe
send socket unsubscribe signal

```bash
/unsubscribe [channel]
```

```javascript
ashita.socket.send({
	type:"unsubscribe",
	ipaddr:ashita.ipAddr,
	sid:document.cookie,
	content:{
		channel:channel
	}
});
```
###purge
send socket purge signal
```javascript
ashita.socket.send({
	type:"purge",
	ipaddr:ashita.ipAddr,
	sid:document.cookie,
	content:{
		channel:channel
	}
});
```
###message
send socket message signal
```javascript
ashita.socket.send({
	type:"message",
	ipaddr:ashita.ipAddr,
	sid:document.cookie,
	content:{
		channel:channel,
		text:message
	}
});
```

##Server Events
###newPeerDiscovered
new peer event
###newAuthedConnection
new authenticated peer event
###newAnonymousConnection
new anonymous peer event
###registerSuccessful
register successful event
###registerFailed
register failed event
###loginSuccessful
login successful event
###loginFailed
login failed event
###subscribeNewSuccessful
create new channel successful event
###subscribeNewFailed
create new channel failed event
###subscribeSuccessful
subscribe to channel successful event
###subscribeFailed
subscribe to channel failed event
###unsubscribeSuccessful
unsubscribe to channel successful event
###unsubscribeFailed
unsubscribe to channel failed event
###purgeSuccessful
purge channel successful event
###purgeFailed
purge channel failed event
###messageSuccessful
message to channel successful event
###messageFailed
message to channel failed event
###userList
retreived userlist event
###permissionDenied
permission denied event
###signalFault
signal fault event
