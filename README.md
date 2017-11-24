ashitajs - decentralized P2P network
================================
ashitajs intends to be a fully decentralized P2P network (though not there yet) designed to be deployed anywhere. It comes in two parts following a client and server model for each node. To be part of the network you need only access a node via the browser, to be a node you need only run your own node with the server portion of the model. It's still in its infancy and a lot of work still needs to be done. Currently a PoC so security may be non-existent. Run at your own risk. (although theres not a whole lot they can probably do as it doesn't have much of anything to it yet);

![PoC](https://i.imgur.com/vJkAZoN.png)

Server API
================================
These are calls within the node to perform certain tasks/communicatons

As a test case you can run
```javascript
npm install
nodejs index.js
```

Then open your browser to http://127.0.0.1:8000 http://127.0.0.1:8000/node.html and http://127.0.0.1:8000/test.html (output is to console) (currently running off of the same node as a PoC test - haven't written the code to handle broadcasting the connected node's ip:port to the server so each (.html) is a hardcoded ip/port to pass to the node hosted on :8000)

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

```bash
nodeOperatorConnected - this event is triggered when the operator of the node a connects to their own node (127.0.0.1)
```
```bash
nodeConnected - this event is triggered when you peer b connected to peer a.
```
```bash
nodeList - this event is sent when peer b connected to peer a, it contains all nodes peer a is connected to.
```
```bash
nodeDiscovered - this event is triggered whenever a new peer connects to any node in the node family, it is then propagated to all other peers
```

Client Signals
================================
These signals are transmitted to the node to setup a new node, or perform some other action

###### auth
```javascript
ashita.signal = {
  "auth":function () {
    ashita.socket.send({
      type:"auth",
      node:"127.0.0.1:8000",
      content:{}
    });
  }
};
```
