ashitajs - decentralized P2P network
================================
ashitajs intends to be a fully decentralized P2P network (though not there yet) designed to be deployed anywhere. It comes in two parts following a client and server model for each node. To be part of the network you need only access a node via the browser, to be a node you need only run your own node with the server portion of the model. It's still in its infancy and a lot of work still needs to be done. Currently a PoC so security may be non-existent. Run at your own risk. (although theres not a whole lot they can probably do as it doesn't have much of anything to it yet);

![PoC](https://i.imgur.com/vJkAZoN.png)

As a test case you can run
```javascript
npm install
nodejs index.js 8000
nodejs index.js 9000
nodejs index.js 10000
```

Then open your browser to http://127.0.0.1:8000 http://127.0.0.1:9000/ and http://127.0.0.1:10000/ (output is to console) from the console if you run:
```javascript
generateSocket("127.0.0.1:8000");
```
from a node other than 8000, you will see the p2p at work, if you then type ```javascript ashita.socket``` you can see the peer sockets.

Server API
================================
These are calls within the node to perform certain tasks/communicatons
###### User
```javascript
constructor ( data ) {}
isAuthenticated () {}
```
###### Client
```javascript
constructor( socket, data ){}
sendClientEvent( event, data ){}
```

Node Events
================================
These events are pushed through to the client

###### nodeOperatorConnected
> this event is triggered when the operator of the node a connects to their own node (not implemented)

###### nodeConnected
> this event is triggered when peer a peer connect sto any node, it is transmitted to the client to let the client known there is an active socket

###### nodeDiscovered
> this event is triggered whenever a new peer connects to any node in the node family, it is then propagated to all other peers

Client Signals
================================
These signals are transmitted to the node to setup a new node, or perform some other action

###### auth
```javascript
ashita.signal = {
  "auth":function ( nodeIp ) {
    ashita.socket[nodeIp].send({
      type:"auth",
      node:"127.0.0.1:8000",
      content:{}
    });
  }
};
```
