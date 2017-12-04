/**
 * ashita/API
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 */
"use strict";
const fs     = require('fs');
const btoa   = require('btoa');
const crypto = require('crypto');
const color  = require('./color.js');

/**
 * Client
 *
 * @package    ashita/API
 * @author     dostoevskylabs
 */
class Client {
  constructor ( nodes, ownerId, socket, data ) {
    this.nodes = nodes;
    this.ownerId = ownerId;
    this.socket = socket;
    this.nodeId = undefined;
    this.data = this.safeParseJSON( data );

    if ( !this.data.hasOwnProperty("type") || !this.data.hasOwnProperty("content") ) {
      console.error(color.Red + "Malformed Data");
      return false;
    }

    this.sessionId = this.nodes.hasOwnProperty(this.data.content.sessionId) ? this.data.content.sessionId : this.generateSessionId();
    this.handleClientRequest( this.data.type );
  }

  get isOwner () {
    if ( this.ownerId === this.nodes[this.sessionId].nodeId ) {
      return true;
    }
    return false;
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

  addNode () {
    console.info(color.Blue + this.sessionId + " peer connection established");
    this.nodes[this.sessionId] = {
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
        console.error(color.Red + "Invalid Event");
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

    for ( let sessionId in this.nodes ) {
      if ( sessionId !== this.sessionId ) {
        this.nodes[sessionId].socket.send( JSON.stringify( payload ) );
      }
    }
  }

  generateSessionId () {
    return crypto.randomBytes(8).toString('hex');
  }

  handshake () {
    // hacky pos, rewrite later
    if ( !this.data.content.nodeId || this.data.content.nodeId.split(":")[0] !== this.socket._socket.remoteAddress.substr(7) ) {
      console.error(color.Red + "Invalid handshake");
      return false;
    }
    console.info(color.Blue + "Handshake started");
    this.nodeId = btoa(this.data.content.nodeId);
    this.addNode();

    if ( this.isOwner ) {
      this.sendClientEvent("nodeOwnerConnected");
    } else {
      this.sendClientEvent("nodeConnected");
    }

    // send this client all known peers
    for ( let sessionId in this.nodes ) {
      if ( sessionId !== this.sessionId ) {
        if ( this.nodes[sessionId].nodeId !== this.ownerId ) {
          this.sendClientEvent("nodeDiscovered", {
            "nodeId" : this.nodes[sessionId].nodeId
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
     sessionId : this.sessionId
    });
    console.info(color.Blue + "Handshake Established");
    this.printPeers();
  }

  printPeers () {
    console.info("Active Peers");
    console.info("-------------");
    for ( let sessionId in this.nodes ) {
      console.info(sessionId);
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