ashitajs [![gplv3](https://img.shields.io/badge/license-GPLv3-red.svg)](LICENSE)
[![nodejs](https://img.shields.io/badge/nodejs-v9.8.0-blue.svg)](README.md)
[![npm](https://img.shields.io/badge/npm-v5.6.0-blue.svg)](README.md)
[![p2p](https://img.shields.io/badge/p2p-enabled-green.svg)](README.md)
================================

Ashita intends to be a fully decentralized peer-to-peer network without the use of a global DHT, *true* super peers, specific bootstrapping nodes or any centralized elements.

Currently, it's more of a giant proof of concept to learn the algorithms and structures of peer-to-peer systems as I experiment with different research papers I read.

I'm not sure if it will be possible in the end, but it's fun to play with. Currently the discovery mechanism uses mdns and operates best locally. I'm still learning overlay topology and effecient message routing. Until I figure out everything at this stage I won't work on deploying it to the internet.

File Diagram
```
├── middleware
│   ├── inputParser
│   │   └── index.js
│   └── peerManager
│       └── index.js
├── config.js
├── discovery.js
├── init.js
├── lib
│   ├── client
│   │   └── index.js
│   ├── node
│   │   └── index.js
│   └── ui
│       ├── color.js
│       └── index.js
├── main.js
```


As a test case you can run
```bash
npm install
nodejs index.js en0
nodejs index.js en0
```

Preferably from different folders with a separate set of keys in the .keys folder (generated on boot, if they don't exist). This way it can simulate two distinct peers.

Tons of hacky code and bugs, at this point I want to work through the local network only version until it's completely bug-free and has proper implementations for:
- overlay topology
- effecient message routing
- effecient join/leave tracking
- heartbeats
- file transfers
- searching

This isn't ever intended to be a replacement for any existing technology, so chances are you won't be using this, however if you are interested in learning some of these concepts or have experience already. I would love to hear from you.
