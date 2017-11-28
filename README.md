ashitajs - decentralized P2P network
================================
![AUR](https://img.shields.io/aur/license/yaourt.svg)
[![Docs](https://img.shields.io/readthedocs/pip/stable.svg)](README.md)

ashitajs intends to be a fully decentralized P2P network (though not there yet) designed to be deployed anywhere. It comes in two parts following a client and server model for each node. To be part of the network you need only access a node via the browser, to be a node you need only run your own node with the server portion of the model. It's still in its infancy and a lot of work still needs to be done. Currently a PoC so security may be non-existent. Run at your own risk. (although theres not a whole lot they can probably do as it doesn't have much of anything to it yet);

![PoC](https://i.imgur.com/vJkAZoN.png)

As a test case you can run
```javascript
npm install
nodejs index.js 8000
nodejs index.js 9000
nodejs index.js 10000
```

Then open your browser to http://127.0.0.1:8000 http://127.0.0.1:9000/ and http://127.0.0.1:10000/ (output is to console) from the console if you type:
```javascript
generateSocket("127.0.0.1:8000");
```
from a node other than 8000, you will see the p2p at work, if you then type:
```javascript
ashita.socket
```
you can see the peer sockets.

Node API
================================
These are calls within the node to perform certain tasks/communicatons
###### User
```javascript
constructor ( nodeOwner, node, data ) {}
isOwner () {}
```
###### Client
```javascript
constructor( socket, data ){}
sendClientEvent( event, data ){}
```

Client API
================================
These calls are transmitted to the node to setup a new node, or perform some other action

###### ashita.transmit.auth( node );

Client Events
================================
These events are pushed through to the client

###### nodeOwnerConnected
> this event is triggered when the owner of the node a connects to their own node

###### nodeConnected
> this event is triggered when peer a peer connect sto any node, it is transmitted to the client to let the client known there is an active socket

###### nodeDiscovered
> this event is triggered whenever a new peer connects to any node in the node family, it is then propagated to all other peers

Client Interfaces
================================
###### ashita

###### ashita.socket
```javascript
function generateSocket ( node ) {}
```

###### ashita.ui

###### ashita.transmit
```javascript
ashita.transmit = {
  "auth":function ( nodeIp ) {
    ashita.socket[nodeIp].send({
      type:"auth",
      node:"127.0.0.1:8000",
      content:{}
    });
  }
};
```
