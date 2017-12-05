/**
 * ashita/Core/API
 *
 * @package    ashita/Core
 * @author     dostoevskylabs
 * @author     mooglesonthecob
 */
"use strict";
const fs              = require('fs');
const btoa            = require('btoa');
const atob            = require('atob');
const crypto          = require('crypto');
const Logger          = require('./logger.js')

class API {
  /**
   * constructor
   * 
   * @param      parent
   * @param      socket
   */  
  constructor ( parent, socket ) {
    this.parent = parent;
    this.socket = socket;

    this.socket.on('message', this.onMessage.bind(this) );
    this.socket.on('error', this.onError.bind(this) );
    this.socket.on('close', this.onClose.bind(this) );

    this.data   = undefined;
    this.nodeId = undefined;
    this.sessionId = undefined;

    this.remoteAddress = this.socket._socket.remoteAddress.substr(7);
    this.remotePort    = this.socket._socket.remotePort;

    Logger.debug("Constructed new instance of API");
    Logger.info(`New connection received from ${this.remoteAddress}:${this.remotePort}`)    
  }

  /**
   * onMessage
   * 
   * @param      data
   */    
  onMessage ( data ) {
    this.data = this.safeParseJSON( data );

    if ( this.data === undefined || !this.data.hasOwnProperty("type") || !this.data.hasOwnProperty("content") ) {
      Logger.warn(`Malformed data received from ${this.remoteAddress}:${this.remotePort}`);
      return this.killSocket();
    }

    this.sessionId = this.parent.getNode(this.data.content.sessionId) ? this.data.content.sessionId : this.generateSessionId();
    this.handleClientRequest();
  }

  /**
   * constructor
   * 
   * @param      error
   */  
  onError ( error ) {
    console.log( error );

  }

  /**
   * onClose
   */   
  onClose () {
    console.log("close");
    this.parent.nodes[this.sessionId].socket = null;
  }

  /**
   * killSocket
   */ 
  killSocket () {
    this.socket.terminate();
    return false;
  }

  /**
   * safeParseJSON
   * 
   * @param      data
   */ 
  safeParseJSON ( data ) {
    try {
      let obj = JSON.parse( data );
      if ( obj && typeof obj === "object" ) {
        return obj;
      }
    } catch ( error ) {}
    return undefined;
  }

  /**
   * isOwner
   */ 
  get isOwner () {
    return false;
  }

  /**
   * handleClientRequest
   */   
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

  /**
   * printPeers
   */ 
  printPeers () {
    Logger.info("Active Peers");
    Logger.info("-------------");
    for ( let sessionId in this.parent.getNodeList ) {
      Logger.info(sessionId);
    }
    Logger.info("-------------");
  }

  /**
   * sendClientEvent
   * 
   * @param      event
   * @param      data
   */ 
  sendClientEvent ( event, data ) {
    if ( Object.keys( this.parent.getNodeList ).length === 0 ) return false;

    let payload = {
      "type"    : event,
      "content" : data
    };
    
    this.socket.send( JSON.stringify( payload ) );

    Logger.debug(`Sending client Event: ${event}`)
  }

  /**
   * sendNodeEvent
   * 
   * @param      event
   * @param      data
   */ 
  sendNodeEvent ( event, data ) {
    if ( Object.keys( this.parent.getNodeList ).length === 0 ) return false;

    let payload = {
      "type"    : event,
      "content" : data
    };

    for ( let sessionId in this.parent.getNodeList ) {
      if ( sessionId !== this.sessionId ) {
        if ( this.parent.getNode( sessionId ).socket !== null ) {
          this.parent.getNode( sessionId ).socket.send( JSON.stringify( payload ) );
        } else {
          Logger.debug(`Socket for ${sessionId} is null`);
        }
      }
    }

    Logger.debug(`Sending node Event: ${event}`)
  }

  /**
   * generateSessionId
   */   
  generateSessionId () {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * handshake
   */   
  handshake () {
    if ( !this.data.content.hasOwnProperty("nodeId") ) {
      Logger.warn(`Invalid handshake received from ${this.sessionId}`);
      return false;
    }

    this.nodeId = btoa(this.data.content.nodeId);

    if ( this.parent.established ) {
      this.parent.nodes[this.sessionId].socket = this.socket;

      // send this client all known peers
      for ( let sessionId in this.parent.getNodeList ) {
        if ( sessionId !== this.sessionId ) {
          if ( this.parent.getNode( sessionId ).socket !== null ) {
            this.sendClientEvent("nodeDiscovered", {
              "nodeId" : this.parent.getNode( sessionId ).nodeId
            });
          }
        }
      }     
      return false;
    }
    Logger.info(`Handshake initialized with ${this.sessionId}`);

    // send this client all known peers
    for ( let sessionId in this.parent.getNodeList ) {
      if ( sessionId !== this.sessionId && this.parent.nodeHost !== atob(this.parent.getNode( sessionId ).nodeId) ) {
        if ( this.parent.getNode( sessionId ).socket !== null ) {
          this.sendClientEvent("nodeDiscovered", {
            "nodeId" : this.parent.getNode( sessionId ).nodeId
          });
        }
      }
    }

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

    this.sendNodeEvent("nodeDiscovered", {
      "nodeId" : this.nodeId
    });

    fs.readFile("./etc/issue", "utf8", ( error, data ) => {
      this.sendClientEvent("MOTD", {
        "MOTD" : data.toString()
      });
    });

    this.sendClientEvent("handshakeEstablished", {
      sessionId : this.sessionId,
      channelName: this.parent.node.channelName
    });

    this.parent.established = true;
    Logger.info(`Handshake Established with ${this.sessionId}`);
    this.printPeers();
  }

  /**
   * publicMessage
   */ 
  publicMessage () {
    this.sendNodeEvent("publicMessage", {
      username : this.data.content.username,
      message : this.data.content.message
    });

    Logger.info(`<${this.data.content.username}> ${this.data.content.message}`)
  }
}

module.exports = API;