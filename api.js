/**
 * ashita/Core/API
 *
 * @package    ashita/Core
 * @author     dostoevskylabs
 */
"use strict";
const fs              = require('fs');
const btoa            = require('btoa');
const atob            = require('atob');
const crypto          = require('crypto');
const Logger          = require('./logger.js')

class API {
  constructor ( parent, socket ) {
    this.parent = parent;
    this.ownerId = this.parent.ownerId;
    this.socket = socket;

    this.socket.on('message', this.onMessage.bind(this) );
    this.socket.on('error', this.onError.bind(this) );
    this.socket.on('close', this.onClose.bind(this) );

    this.established = false;
    this.data   = undefined;
    this.nodeId = undefined;
    this.sessionId = undefined;

    this.remoteAddress = this.socket._socket.remoteAddress.substr(7);
    this.remotePort    = this.socket._socket.remotePort;

    Logger.debug("Constructed new instance of API");
    Logger.info(`New connection received from ${this.remoteAddress}:${this.remotePort}`)    
  }

  onMessage ( data ) {
    this.data = this.safeParseJSON( data );

    if ( this.data === undefined || !this.data.hasOwnProperty("type") || !this.data.hasOwnProperty("content") ) {
      Logger.warn(`Malformed data received from ${this.remoteAddress}:${this.remotePort}`);
      return this.killSocket();
    }

    this.sessionId = this.parent.getNode(this.data.content.sessionId) ? this.data.content.sessionId : this.generateSessionId();
    this.handleClientRequest();
  }

  onError ( error ) {
    console.log( error );

  }

  onClose () {
    console.log("close");
  }

  killSocket () {
    this.socket.terminate();
    return false;
  }

  safeParseJSON ( data ) {
    try {
      let obj = JSON.parse( data );
      if ( obj && typeof obj === "object" ) {
        return obj;
      }
    } catch ( error ) {}
    return undefined;
  }

  get isOwner () {
    if ( this.ownerId === this.parent.getNode(this.sessionId).nodeId ) {
      return true;
    }
    return false;
  }

  handleClientRequest () {
    switch ( this.data.type ) {
      case "handshake":
        this.handshake( this.data );
        break;

      case "publicMessage":
        this.publicMessage( this.data );
        break;

      default:
        Logger.warn("Invalid Event Received From Client");
    }
  }

  sendClientEvent ( event, data ) {
    if ( Object.keys( this.parent.getNodeList ).length === 0 ) return false;

    let payload = {
      "type"    : event,
      "content" : data
    };
    
    this.socket.send( JSON.stringify( payload ) );

    Logger.debug(`Sending client Event: ${event}`)
  }

  sendNodeEvent ( event, data ) {
    if ( Object.keys( this.parent.getNodeList ).length === 0 ) return false;

    let payload = {
      "type"    : event,
      "content" : data
    };

    for ( let sessionId in this.parent.getNodeList ) {
      if ( sessionId !== this.sessionId ) {
        this.parent.getNode( sessionId ).socket.send( JSON.stringify( payload ) );
      }
    }

    Logger.debug(`Sending node Event: ${event}`)
  }

  generateSessionId () {
    return crypto.randomBytes(8).toString('hex');
  }

  handshake () {
    // hacky pos, rewrite later
    if ( this.established ) {
      Logger.warn(`Client tried to send a new handshake when they already have an active one`);
      return false;
    }
    if ( !this.data.content.nodeId || this.data.content.nodeId.split(":")[0] !== this.socket._socket.remoteAddress.substr(7) ) {
      Logger.warn(`Invalid handshake received from ${this.sessionId}`);
      return false;
    }
    
    Logger.info(`Handshake initialized with ${this.sessionId}`)
    this.nodeId = btoa(this.data.content.nodeId);
    this.parent.addNode(this.sessionId, {
      "nodeId"   : this.nodeId,
      "username" : "Anonymous",
      "socket"   : this.socket
    });

    if ( this.isOwner ) {
      this.sendClientEvent("nodeOwnerConnected");
    } else {
      this.sendClientEvent("nodeConnected");
    }

    // send this client all known peers
    for ( let sessionId in this.parent.getNodeList ) {
      if ( sessionId !== this.sessionId ) {
        if ( this.parent.getNode( sessionId ).nodeId !== this.ownerId ) {
          this.sendClientEvent("nodeDiscovered", {
            "nodeId" : this.parent.getNode( sessionId ).nodeId
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
    this.established = true;
  }

  printPeers () {
    Logger.info("Active Peers");
    Logger.info("-------------");
    for ( let sessionId in this.parent.getNodeList ) {
      Logger.info(sessionId);
    }
    Logger.info("-------------");
  }

  publicMessage () {
    this.sendNodeEvent("publicMessage", {
      username : this.data.content.username,
      message : this.data.content.message
    });

    Logger.info(`<${this.data.content.username}> ${this.data.content.message}`)
  }
}

module.exports = API;