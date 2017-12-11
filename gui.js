"use strict";
let port                = 60000;
const cli               = require("./cli.js");
const path              = require("path");
const fs                = require("fs");
const ws                = require("ws").Server;
const nodeManager       = require("./nodeManager.js");
const node              = require("./node.js");
const http              = require("http");
const express           = require("express");
const app               = express();
app.use( express.static( path.join(__dirname, "/public") ) );

class GUI extends ws {
  constructor () {
    const guiServer = http.createServer( app ).listen( port, () => {
      cli.screens["Log"].add(`GUI is Listening on http://${nodeManager.getNodeHost}:${port}`);
    });
    super({ server : guiServer });
    this.on("error", (error) => {
      // temporary
      if ( error.code === "EADDRINUSE" ) {
        port++;
        return new GUI();
      }
    });
    nodeManager.setGui(this);
    this.socket       = undefined;
    this.clientIP     = undefined;
    this.knownPeers   = nodeManager.getNodes();
    this.subscribedTo = [];
    this.on("connection", this.onConnection);
  }

  send ( data ) {
    if ( this.socket !== undefined ) {
      data = JSON.stringify(data);
      this.socket.send(data);
    }
  }

  safeParseJSON ( data ) {
    try {
      let obj = JSON.parse( data );
      if ( obj && typeof obj === "object" ) {
        return obj;
      }
    } catch ( error ) {}
    return {};
  }

  onConnection ( socket ) {
    if ( this.socket !== undefined ) {
      /* handle error, trying to open multiple instances of the GUI */
      return false;
    }
    this.socket = socket;
    this.knownPeers = nodeManager.getNodes();
    this.clientIP = this.socket._socket.remoteAddress.substr(7);
    this.socket.on("message", this.onMessage.bind(this));
    this.socket.on("error", this.onError.bind(this));
    this.socket.on("close", this.onClose.bind(this));
    
    this.peerDiscovered(nodeManager.generatePeerId(`${nodeManager.getNodeHost}:${nodeManager.getNodePort}`));
    
    fs.readFile("./etc/issue", "utf8", ( error, data ) => {
      this.sendClientEvent("MOTD", {
        "peerId"  : nodeManager.generatePeerId(`${nodeManager.getNodeHost}:${nodeManager.getNodePort}`),
        "MOTD"    : data.toString()
      });
    });

    cli.screens["Debug"].add("New GUI Session with", this.clientIP);
  }

  onMessage ( data ) {
    data = this.safeParseJSON(data);
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
    this.socket = undefined;
    this.close();
    // pass
  }

  sendClientEvent ( event, object ) {
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