"use strict";
const net             = require("net");
const fs              = require('fs');
const cli             = require('../ui');
const crypto          = require("crypto");
const manifest        = require("../manifest");

class AshitaClient extends net.Socket {
  constructor ( peerIp, peerPort, peerManager ) {
    super();
    this.peerManager    = peerManager;
    this.peerIp         = peerIp;
    this.peerPort       = peerPort;
    this.validationKey  = undefined;
    this.peerId         = undefined;
    this.publicKey      = undefined;
    this.instanced      = false;
    this.leaderId       = undefined;
    this.connect( this.peerPort, this.peerIp);
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

    
    if ( this.peerManager.getPeerIp === this.peerIp && this.peerManager.getPeerPort === this.peerPort ) {
      return false;
    }

    if ( this.peerManager.getActivePeers.includes(`${this.peerIp}:${this.peerPort}`) ) {
      return false;
    }

    cli.Panel.debug(`Attempting connection with ${this.peerIp}:${this.peerPort}...`);
  }

  onData ( data ) {
    data = this.safeParseJSON( data );

    switch ( data.type ) {
      /**
       * todo: implement handling for switching to a new peer if the current peer is full
       */

      case "connectionRecieved":
        this.sendClientEvent("keyExchange", {
          "publicKey" : this.peerManager.getPublicKey
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
        let message = crypto.privateDecrypt( this.peerManager.getPrivateKey, Buffer.from( data.content.message, 'utf-8') );

        if ( message.toString() !== this.validationKey ) return false;
        this.instanced = true;
        this.peerId    = this.peerManager.generatePeerId (this.publicKey);
        

        /**
          If a leader is sent from the peer we connected to, we set it as our leader
          if none is set we set ourselves to the leader
        */
        if ( data.content.leaderId ) {
          this.peerManager.setLeader( data.content.leaderId );
        } else {
          this.peerManager.setLeader( this.peerManager.getPeerId );
        }

        this.peerManager.addPeer ( this );    


        cli.Panel.debug("Handshake completed with", `${this.peerId}`);
        cli.Panel.debug("Recieved key for peer\n", this.publicKey);


        cli.Panel.debug("Leader found: " + this.peerManager.getLeader);  

        this.sendClientEvent("connectionEstablished", {
          peerIp : this.peerManager.getPeerIp,
          peerPort: this.peerManager.getPeerPort
        });
      break;

      case "manifest":
        manifest.recvManifest( data.content.manifest );
      break;

      case "peerLocation":
        if ( data.content.requestorIds[data.content.requestorIds.length -1] === this.peerManager.getPeerId ) {
          let route = data.content.route;

          // remove ourself from the chain going back to original requestor
          let newNodes = data.content.requestorIds;
          newNodes.pop();

          this.peerManager.whoHasAnswer( data.content.peerId, newNodes, route );
        }
      break;

      default:
        // derp
    }
  }

  onTimeout () {
    // pass
  }

  onError ( error ) {
    
    // pass
  }

  onClose () {
    if ( this.peerId ) this.peerManager.removePeer( this.peerId, this.peerManager.getPeerId );
    this.destroy();
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
