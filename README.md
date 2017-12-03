ashitajs [![gplv3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](LICENSE)
[![rtfm](https://img.shields.io/readthedocs/pip/stable.svg)](README.md)
[![nodejs](https://img.shields.io/badge/using-nodejs-green.svg)](README.md)
[![p2p](https://img.shields.io/badge/using-p2p-green.svg)](README.md)
================================

ashitajs intends to be a fully decentralized P2P network (though not there yet) designed to be deployed anywhere. It's still in its infancy and a lot of work still needs to be done. Currently a PoC so security may be non-existent. Run at your own risk.

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
ashita.addNode("127.0.0.1:8000");
```

Client
================================
###### class Messages
> TODO

###### class AshitaSocket
> TODO

###### class Ashita
> TODO

###### class UI
> TODO

Client API
================================
###### handshake
###### publicMessage

Client Events
================================
These events are pushed through to the client

###### nodeOwnerConnected
> this event is triggered when the owner of the node a connects to their own node

###### nodeConnected
> this event is triggered when peer a peer connect sto any node, it is transmitted to the client to let the client known there is an active socket

###### nodeDiscovered
> this event is triggered whenever a new peer connects to any node in the node family, it is then propagated to all other peers

###### handshakeEstablished
> this event is triggered when a handshake is fully established

###### MOTD
> this event is triggered when a client connects, sends them our ./etc/issue file (or motd)

###### publicMessage
> this event is triggered when a public message is sent by a client, emits to all sockets on the node

Node
================================
> TODO

Node API
================================
> TODO

