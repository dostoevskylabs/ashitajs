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

    this.remoteHost = `${this.socket._socket.remoteAddress.substr(7)}:${this.socket._socket.remotePort}`;
    Logger.debug(`${this.remoteHost}\tclass API instantiated`);
    Logger.notice(`${this.remoteHost}\tJOINED`)    
  }

  /**
   * onMessage
   * 
   * @param      data
   */    
  onMessage ( data ) {
    this.data = this.safeParseJSON( data );

    if ( this.data === undefined || !this.data.hasOwnProperty("type") || !this.data.hasOwnProperty("content") ) {
      Logger.security(`${this.remoteHost}\tMalformed data received`);
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
    Logger.quit(`${this.remoteHost}\tQUIT`);
    if ( this.parent.getNode( this.sessionId ) ) {
      this.parent.nodes[this.sessionId].socket = null;
      this.socket = null;
      return false;
    }
    this.printPeers();
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
   * handleClientRequest
   */   
  handleClientRequest () {
    switch ( this.data.type ) {
      case "handshake":
        this.handshake();
        break;

      case "login":
        this.login();
        break;

      case "publicMessage":
        this.publicMessage();
        break;

      default:
        Logger.security(`${this.remoteHost}\tInvalid Event Received`);
    }
  }

  /**
   * printPeers
   */ 
  printPeers () {
    Logger.clearPeers();
    for ( let sessionId in this.parent.getNodeList ) {
      if ( this.parent.nodes[sessionId].socket !== null ) {
        Logger.peer(atob(this.parent.nodes[sessionId].nodeId));
      }
    }
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
    
    if ( this.socket === null ) {
      return false;
    }
    this.socket.send( JSON.stringify( payload ) );

    Logger.debug(`${this.remoteHost}\tSending Client Event: ${event}`)
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
          Logger.debug(`NULL socket located in session: ${sessionId}`);
        }
      }
    }

    Logger.debug(`${this.remoteHost}\tBroadcasting Event: ${event}`)
  }

  compareHash ( string, hashedString ) {
    return crypto.createHmac('sha512', string).digest('hex') === hashedString;
  }

  /**
   * generateSessionId
   */   
  generateSessionId () {
    return crypto.createHmac('sha512', crypto.randomBytes(42)).digest('hex');
  }

  /**
   * handshake
   */   
  handshake () {
    if ( !this.data.content.hasOwnProperty("nodeId") ) {
      Logger.security(`${this.remoteHost}\tInvalid Handshake`);
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
    Logger.info(`${this.remoteHost}\tHandshake Started...`);

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

    this.sendClientEvent("nodeConnected");

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
    Logger.info(`${this.remoteHost}\tHandshake Established.`);
    this.printPeers();
  }

  login () {
    if ( !this.data.content.hasOwnProperty("password") ) {
      Logger.security(`${this.remoteHost}\tPassword Event Triggered With No Password Property`);
      return false;
    }

    if ( this.compareHash( this.data.content.password, this.parent.node.password ) ) {
      Logger.security(`${this.remoteHost}\tLogin Successful`);
      this.sendClientEvent("loginSuccessful", {
        // whatever?
      });
    } else {
      Logger.security(`${this.remoteHost}\tInvalid Login`);
      this.sendClientEvent("loginFailed", {
        // whatever?
      });      
    }
  }

  /**
   * publicMessage
   */ 
  publicMessage () {
    this.sendNodeEvent("publicMessage", {
      username : this.data.content.username,
      message : this.data.content.message
    });

    Logger.message(`${this.remoteHost}\t<${this.data.content.username}> ${this.data.content.message}`)
  }
}

module.exports = API;