"use strict";
const cli               = require('./cli.js');
const path              = require('path');
const fs                = require('fs');
const ws                = require('ws').Server;
const nodeManager       = require('./nodeManager.js');
const http              = require('http');
const express           = require('express');
const app               = express();
const server            = http.createServer( app );
app.use( express.static( path.join(__dirname, '/public') ) );

class GUI extends ws {
  constructor ( args ) {
    const guiServer = server.listen( args[1], () => {
      cli.screens["Log"].add(`Listening on http://192.168.1.19:${args[1]}`);
    });

    super({ server : guiServer });

    this.on('error', (error) => {
      // temporary
      if ( error.code === "EADDRINUSE" ) {
        console.log(`port ${args[1]} is already in use.\nTry: node index.js 8000 ${args[1]++}`)
        process.exit();
      }
      process.exit();
    });
    
    this.nodePort     = args[0];
    this.socket       = undefined;
    this.clientIP     = undefined;
    this.knownPeers   = nodeManager.getNodes();
    this.subscribedTo = [];
    this.on('connection', this.onConnection);
  }



  send ( data ) {
    if ( this.socket !== undefined ) {
      data = JSON.stringify(data);
      this.socket.send(data);
    }
  }

  onConnection ( socket ) {
    this.socket = socket;
    this.knownPeers = nodeManager.getNodes();
    this.clientIP = this.socket._socket.remoteAddress.substr(7);
    this.socket.on('message', this.onMessage.bind(this));
    this.socket.on('error', this.onError.bind(this));
    this.socket.on('close', this.onClose.bind(this));
    
    this.peerDiscovered(nodeManager.generatePeerId(`${this.clientIP}:${this.nodePort}`));
    
    fs.readFile("./etc/issue", "utf8", ( error, data ) => {
      this.sendClientEvent("MOTD", {
        "peerId"  : nodeManager.generatePeerId(`${this.clientIP}:${this.nodePort}`),
        "MOTD"    : data.toString()
      });
    });

    cli.screens["Debug"].add("New GUI Session with", this.clientIP);
  }

  onMessage ( data ) {
    data = JSON.parse(data);
    switch ( data.type ) {
      case "getAvailablePeers":
        this.sendClientEvent("availablePeers", {
          "peers" : this.knownPeers
        });
        break;

      case "publicMessage":
        break;

      case "subscribe":
        if ( !nodeManager.getNode( data.content.peerId ) ) {
          this.sendClientEvent("subscribeFailed", {
            peerId  : data.content.peerId
          });
          return false;
        }
        this.subscribedTo.push(data.content.peerId);
        this.sendClientEvent("subscribeSuccessful", {
          peerId    :  data.content.peerId
        });
        cli.screens["Log"].add("GUI subscribed to ", data.content.peerId);
        break;

      default:
        this.sendClientEvent("invalidEvent", {
          "event"   : data.type
        });
    }
  }

  onError ( error ) {
    // pass
  }

  onClose () {
    // pass
  }

  sendClientEvent( event, object ) {
    this.send({
      "type"    : event,
      "content" : object
    })
    cli.screens["Debug"].add("Sending Client Event: ", event);
  }

  peerDiscovered ( peerId ) {
    this.sendClientEvent("peerDiscovered", {
      "peerId"    : peerId
    });
  }
}

module.exports = GUI;