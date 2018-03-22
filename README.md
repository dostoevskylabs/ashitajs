ashitajs [![gplv3](https://img.shields.io/badge/license-GPLv3-red.svg)](LICENSE)
[![nodejs](https://img.shields.io/badge/nodejs-v9.8.0-blue.svg)](README.md)
[![npm](https://img.shields.io/badge/npm-v5.6.0-blue.svg)](README.md)
[![p2p](https://img.shields.io/badge/p2p-enabled-green.svg)](README.md)
================================

ashitajs intends to be a fully decentralized P2P network (though not there yet) designed to be deployed anywhere. It's still in its infancy and a lot of work still needs to be done. Currently a PoC so security may be non-existent. Run at your own risk.

Diagram
```
[localhost]
	\
	[p2p layer] <------------> [GUI] <----------> [API] <--------> [OS]
		|
		[Messages]
		      |
		[TCP Layer]
		      |
		[Messages]
		|
	[p2p layer] <------------> [GUI] <----------> [API] <--------> [OS]
	/
[remote host]
```

![Image](https://i.imgur.com/wBfvnlx.png)

As a test case you can run
```javascript
npm install
nodejs index.js # peer 1 on 8000 (node) / 60000 (gui)
nodejs index.js # peer 2 on 8001 (node) / 60001 (gui)
```



Then open your browser to http://127.0.0.1:60000/ and http://127.0.0.1:60001/

Currently there is a hacky way to connect to another peer just type ip:port from the console. For example if you want to connect to 8001 from 8000 you would type 127.0.0.1:8001
