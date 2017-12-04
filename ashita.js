/**
 * ashita/API
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 */
"use strict";
const WebSocketServer = require('ws').Server;
const fs              = require('fs');
const btoa            = require('btoa');
const atob            = require('atob');
const crypto          = require('crypto');
const color           = require('./color.js');

/**
 * Client
 *
 * @package    ashita/API
 * @author     dostoevskylabs
 */
class API extends WebSocketServer {
  constructor ( Object ) {
    super( Object );
    this.on('connection', this.onConnection );

    this.nodes = {};
    this.ownerId = btoa("127.0.0.1:" + Object["server"]["_connectionKey"].split(":").pop() );
    this.socket = undefined;
    this.nodeId = undefined;
    this.sessionId = undefined;

    console.log(color.Green + "Server started: http://" + atob(this.ownerId));
  }

  onConnection ( socket ) {
    console.info(color.Green + "New connection");
    this.socket = socket;
    this.socket.on('message', this.onMessage.bind(this) );
    this.socket.on('error', this.onError.bind(this) );
    this.socket.on('close', this.onClose.bind(this) );  
  }

  onMessage ( data ) {
    data = this.safeParseJSON( data );

    if ( !data.hasOwnProperty("type") || !data.hasOwnProperty("content") ) {
      console.error(color.Red + "Malformed Data");
      return false;
    }

    this.sessionId = this.nodes.hasOwnProperty(data.content.sessionId) ? data.content.sessionId : this.generateSessionId();

    this.handleClientRequest( data );

  }

  onError ( error ) {
    console.log( error );

  }

  onClose () {
    console.log("close");
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

  get isOwner () {
    if ( this.ownerId === this.nodes[this.sessionId].nodeId ) {
      return true;
    }
    return false;
  }

  addNode () {
    console.info(color.Blue + this.sessionId + " peer connection established");
    this.nodes[this.sessionId] = {
      "nodeId"   : this.nodeId,
      "username" : "Anonymous",
      "socket"   : this.socket
    };
  }

  handleClientRequest ( data ) {
    switch ( data.type ) {
      case "handshake":
        this.handshake( data );
        break;

      case "publicMessage":
        this.publicMessage( data );
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

  handshake ( data ) {
    // hacky pos, rewrite later
    if ( !data.content.nodeId || data.content.nodeId.split(":")[0] !== this.socket._socket.remoteAddress.substr(7) ) {
      console.error(color.Red + "Invalid handshake");
      return false;
    }
    console.info(color.Blue + "Handshake started");
    this.nodeId = btoa(data.content.nodeId);
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

  publicMessage ( data ) {
    this.sendNodeEvent("publicMessage", {
      username : data.content.username,
      message : data.content.message
    });
  }
}

module.exports = {
  "API" : API
}