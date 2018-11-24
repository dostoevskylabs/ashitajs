"use strict";
const net             = require("net");
const fs              = require('fs');
const cli             = require('./cli.js');


class AshitaClient extends net.Socket {
  constructor ( nodeIp, nodePort, nodeManager ) {
    super();
    this.nodeManager = nodeManager;
    this.nodeIp      = nodeIp;
    this.nodePort    = nodePort;
    this.nodeId      = this.nodeManager.generatePeerId (`${this.nodeIp}:${this.nodePort}`);
    this.publicKey   = undefined;
    this.instanced   = false;
    this.leaderId    = undefined;

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
    if ( this.nodeManager.getNode( this.nodeId ) ||
         this.nodeManager.getNodeId === this.nodeId ) {
      return false;
    }

  }

  onData ( data ) {
    data = this.safeParseJSON( data );

    switch ( data.type ) {

      /**
       * When a connection is made to a node, the first message in the handshake will
       * be a request for our node's publicKey which will land in our "requestPublicKey"
       * statement.
       *
       */
      case "getPublicKey":
        cli.Panel.debug("Attempting connection with", this.nodeId + "...");
        
        this.sendClientEvent("publicKey", {
          "publicKey" : this.nodeManager.getPublicKey,
          "peerId"    : this.nodeManager.getNodeId
        });
      break;

      /**
       * Next, we recieve connectionSuccessful, stating that they accepted our key to their chain,
       * they will return their key to us and we can now add it to our chain.
       *
       */
      case "connectionSuccessful":
        this.instanced = true;
        this.publicKey = data.content.publicKey;

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


        cli.Panel.debug("Handshake completed with", `${this.nodeId}`);
        cli.Panel.debug("Recieved key for node\n", this.publicKey);


        cli.Panel.debug("Leader found: " + this.nodeManager.getLeader);

        this.sendClientEvent("connectionEstablished", {
          "peerId" : this.nodeManager.getNodeId
        });

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