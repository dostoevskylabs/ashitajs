"use strict";
const fs     = require('fs');
const btoa   = require('btoa');
const crypto = require('crypto');
const color  = require('./color.js');

class Client {
  constructor ( nodes, ownerId, socket, data ) {
    this.nodes = nodes;
    this.ownerId = ownerId;
    this.socket = socket;
    this.nodeId = undefined;
    this.data = JSON.parse( data );

    this.peerId = this.nodes.hasOwnProperty(this.data.content.sessionId) ? this.data.content.sessionId : this.generateSessionId();
    this.handleClientRequest( this.data.type );
  }

  get isOwner () {
    if ( this.ownerId === this.nodes[this.peerId].nodeId ) {
      return true;
    }
    return false;
  }

  addNode () {
    console.info(color.Blue + this.peerId + " peer connection established");
    this.nodes[this.peerId] = {
      "nodeId"   : this.nodeId,
      "username" : "Anonymous",
      "socket"   : this.socket
    };
  }

  handleClientRequest ( request ) {
    switch ( request ) {
      case "handshake":
        this.handshake();
        break;

      case "publicMessage":
        this.publicMessage();
        break;

      default:
        console.info("unhandled");
    }
  }

  sendClientEvent ( event, data ) {
    if ( Object.keys( this.nodes ).length === 0 ) return false;
    console.info(color.Blue + "Sending client event: " + event);
    let payload = {
      "type"    : event,
      "content" : data
    };
    
    this.socket.send( JSON.stringify( payload ) );
  }

  sendNodeEvent ( event, data ) {
    if ( Object.keys( this.nodes ).length === 0 ) return false;
    console.info(color.Blue + "Sending node event: " + event);
    let payload = {
      "type"    : event,
      "content" : data
    };

    for ( let peerId in this.nodes ) {
      if ( peerId !== this.peerId ) {
        this.nodes[peerId].socket.send( JSON.stringify( payload ) );
      }
    }
  }

  generateSessionId () {
    return crypto.randomBytes(8).toString('hex');
  }

  handshake () {
    console.info(color.Blue + "Handshake started");
    this.nodeId = btoa(this.data.content.nodeId);
    this.addNode();

    if ( this.isOwner ) {
      this.sendClientEvent("nodeOwnerConnected");
    } else {
      this.sendClientEvent("nodeConnected");
    }

    // send this client all known peers
    for ( let peerId in this.nodes ) {
      if ( peerId !== this.peerId ) {
        if ( this.nodes[peerId].nodeId !== this.ownerId ) {
          this.sendClientEvent("nodeDiscovered", {
            "nodeId" : this.nodes[peerId].nodeId
          });
        }
      }
    }

    this.sendNodeEvent("nodeDiscovered", {
      "nodeId" : this.nodeId
    });

    fs.readFile("./etc/issue", "utf8", ( error, data ) => {
      this.sendClientEvent("MOTD", {
        "MOTD" : data.toString()
      });
    });

    this.sendClientEvent("handshakeEstablished", {
     sessionId : this.peerId
    });
    console.info(color.Blue + "Handshake Established");
    this.printPeers();
  }

  printPeers () {
    console.info("Active Peers");
    console.info("-------------");
    for ( let peerId in this.nodes ) {
      console.info(peerId);
    }
    console.info("-------------");
  }
  publicMessage () {
    this.sendNodeEvent("publicMessage", {
      username : this.data.content.username,
      message : this.data.content.message
    });
  }

}

module.exports = {
  "Client" : Client
}