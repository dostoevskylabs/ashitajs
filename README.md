ashitajs - decentralized P2P network in the browser
================================

ashitajs intends to be a fully decentralized P2P network  (though not there yet) designed to be deployed anywhere. It comes in two parts following a client and server model. To be part of the network you need only access a node via the browser, to be a node you need only run your own node with the server portion of the model. It's still in its infancy and a lot of work still needs to be done.

First we need to generate an SSL bundle to use with node.js
```bash
mkdir ssl
```

```bash
cd ssl
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

Now we only need to add our internal IP to the rudimentary ACL in server.js
```javascript
API.aclCtl.addEntry("10.0.1.4");
```
Now we are ready to start
```bash
npm start Wi-Fi
```

Server Controllers
================================
consoleCtl
```javascript
function printMessage( type, src, msg ){}
function printError( str ){}
```
aclCtl
```javascript
function init(){}
function addEntry( peerIp ){}
function removeEntry( peerIp ){}
```
sessionCtl
```javascript
function init(){}
function generateId(){}
function getValue( sessionid, field ){}
function setValue( sessionid, field, value){}
function getObject( sessionid ){}
function setObject( sessionData ){}
function destroyObject( sessionid ){}
```
channelCtl
```javascript
function init(){}
function getValue( channel, field ){}
function setValue( channel, field ){}
function getObject( channel ){}
function setObject( channelData ){}
function destroyObject( channelData ){}
function join( channelData ){}
function part( channelData ){}
function message( channelData ){}
```
peerCtl
```javascript
function init(){}
function addPeer( peerIp ){}
function removePeer( peerIp ){}
```

Client Signals
================================
auth - send socket auth signal
```javascript
ashita.socket.send({
	type:"auth",
	content:{
		sid:document.cookie,
	}
});
```
channelJoin - send socket channelJoin signal
```bash
/join [channel]
```
```javascript
ashita.socket.send({
	type:"channelJoin",
	content:{
		sid:document.cookie,
		channel:{
			name:channel
		}
	}
});
```
channelMessage - send socket channelMessage signal
```javascript
ashita.socket.send({
	type:"channelJoin",
	content:{
		sid:document.cookie,
		channel:{
			name:channel
		}
	}
});
```
Server Events
================================
```bash
newPeerDiscovered - new peer event
```
```bash
newAuthedConnection - new authenticated peer event
```
```bash
newAnonymousConnection - new anonymous peer event
```
```bash
subscribeNewSuccessful - create new channel successful event
```
```bash
subscribeSuccessful - subscribe to channel successful event
```
```bash
messageSuccessful - message to channel successful event
```
```bash
userList - retreived userlist event
```
