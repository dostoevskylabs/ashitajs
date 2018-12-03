"use strict";
const net             = require("net");
const fs              = require('fs');
const cli             = require('../ui');
const crypto          = require("crypto");

class AshitaClient extends net.Socket {
  constructor ( nodeIp, nodePort, nodeManager ) {
    super();
    this.nodeManager    = nodeManager;
    this.nodeIp         = nodeIp;
    this.nodePort       = nodePort;
    this.validationKey  = undefined;
    this.nodeId         = undefined;
    this.publicKey      = undefined;
    this.instanced      = false;
    this.leaderId       = undefined;

    this.connect( this.nodePort, this.nodeIp );
    this.on("connect", this.onConnect.bind( this ));
    this.on("data", this.onData.bind( this ));
    this.on("timeout", this.onTimeout.bind( this ));
    this.on("error", this.onError.bind( this ));
    this.on("close", this.onClose.bind( this ));
    this.on("end", this.onEnd.bind( this ));
  }

  onConnect () {
    if ( this.instanced ) {
      return false;
    }

    // prevent duplicate links

    
    if ( this.nodeManager.getNodeHost === this.nodeIp && this.nodeManager.getNodePort === this.nodePort ) {
      return false;
    }

    if ( this.nodeManager.getPeers.includes(`${this.nodeIp}:${this.nodePort}`) ) {
      return false;
    }

    cli.Panel.debug(`Attempting connection with ${this.nodeIp}:${this.nodePort}...`);
  }

  onData ( data ) {
    data = this.safeParseJSON( data );

    switch ( data.type ) {
      case "connectionRecieved":
        this.sendClientEvent("keyExchange", {
          "publicKey" : this.nodeManager.getPublicKey
        });

      break;

      case "publicKey":
        this.publicKey = data.content.publicKey;
        this.validationKey = crypto.randomBytes(32).toString('hex');

        let encrypted = crypto.publicEncrypt( this.publicKey, Buffer.from( this.validationKey, 'utf-8') );

        this.sendClientEvent("validateIdentity", {
          "message" : encrypted
        });

      break;


      case "validateIdentity":
        let message = crypto.privateDecrypt( this.nodeManager.getPrivateKey, Buffer.from( data.content.message, 'utf-8') );

        if ( message.toString() !== this.validationKey ) return false;
        this.instanced = true;
        this.nodeId    = this.nodeManager.generatePeerId (this.publicKey);
        

        /**
          If a leader is sent from the node we connected to, we set it as our leader
          if none is set we set ourselves to the leader
        */
        if ( data.content.leaderId ) {
          this.nodeManager.setLeader( data.content.leaderId );
        } else {
          this.nodeManager.setLeader( this.nodeManager.getNodeId );
        }

        this.nodeManager.addNode ( this );
        this.nodeManager.addPeer(`${this.nodeIp}:${this.nodePort}`);        


        cli.Panel.debug("Handshake completed with", `${this.nodeId}`);
        cli.Panel.debug("Recieved key for node\n", this.publicKey);


        cli.Panel.debug("Leader found: " + this.nodeManager.getLeader);  

        this.sendClientEvent("connectionEstablished", {});
      break;

      default:
        // derp
    }
  }

  onTimeout () {
    // pass
  }

  onError ( error ) {
    cli.Panel.debug( error );
    // pass
  }

  onClose () {
    /* TODO: Handling removing peer with nodeManager */
    // nodeManager.removeNode( this.nodeId );
  }

  onEnd () {

  }

  send ( data ) {
    data = JSON.stringify( data );
    this.write( data );
  }

  sendClientEvent ( event, object ) {
    let message = {
      "type"    : event,
      "content" : object
    };

    this.send( message );
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
}

module.exports = AshitaClient;