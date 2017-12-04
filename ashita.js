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
const Logger          = require('./logger.js')

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
    this.remoteAddress = undefined;
    this.remotePort   = undefined;
    this.sessionId = undefined;

    Logger.notice(`Server started. Visit http://${atob( this.ownerId )}`);
  }

  onConnection ( socket ) {
    this.socket = socket;
    this.socket.on('message', this.onMessage.bind(this) );
    this.socket.on('error', this.onError.bind(this) );
    this.socket.on('close', this.onClose.bind(this) );

    this.remoteAddress = this.socket._socket.remoteAddress.substr(7);
    this.remotePort    = this.socket._socket.remotePort;

    Logger.info(`New connection received from ${this.remoteAddress}:${this.remotePort}`)
  }

  onMessage ( data ) {
    data = this.safeParseJSON( data );

    if ( !data.hasOwnProperty("type") || !data.hasOwnProperty("content") ) {
      Logger.warn(`Malformed data received from ${this.sessionId}`)
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
    this.nodes[this.sessionId] = {
      "nodeId"   : this.nodeId,
      "username" : "Anonymous",
      "socket"   : this.socket
    };

    Logger.info(`New peer session: ${this.sessionId}`)
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
        Logger.warn("Invalid Event Received From Client");
    }
  }

  sendClientEvent ( event, data ) {
    if ( Object.keys( this.nodes ).length === 0 ) return false;

    let payload = {
      "type"    : event,
      "content" : data
    };
    
    this.socket.send( JSON.stringify( payload ) );

    Logger.debug(`Sending client Event: ${event}`)
  }

  sendNodeEvent ( event, data ) {
    if ( Object.keys( this.nodes ).length === 0 ) return false;

    let payload = {
      "type"    : event,
      "content" : data
    };

    for ( let sessionId in this.nodes ) {
      if ( sessionId !== this.sessionId ) {
        this.nodes[sessionId].socket.send( JSON.stringify( payload ) );
      }
    }

    Logger.debug(`Sending node Event: ${event}`)
  }

  generateSessionId () {
    return crypto.randomBytes(8).toString('hex');
  }

  handshake ( data ) {
    // hacky pos, rewrite later
    if ( !data.content.nodeId || data.content.nodeId.split(":")[0] !== this.socket._socket.remoteAddress.substr(7) ) {
      Logger.warn(`Invalid handshake received from ${this.sessionId}`);
      return false;
    }
    
    Logger.info(`Handshake initialized with ${this.sessionId}`)
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

    Logger.info(`Handshake Established with ${this.sessionId}`);
    this.printPeers();
  }

  printPeers () {
    Logger.info("Active Peers");
    Logger.info("-------------");
    for ( let sessionId in this.nodes ) {
      Logger.info(sessionId);
    }
    Logger.info("-------------");
  }

  publicMessage ( data ) {
    this.sendNodeEvent("publicMessage", {
      username : data.content.username,
      message : data.content.message
    });

    Logger.info(`<${data.content.username}> ${data.content.message}`)
  }
}

module.exports = {
  "API" : API
}