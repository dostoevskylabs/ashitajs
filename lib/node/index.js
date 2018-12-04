"use strict";
const net             = require("net");
const fs              = require("fs");
const cli             = require('../ui');
const client          = require("../client");
const nodeManager     = require("../../middleware/peerManager");
const config          = require("../../config.js");

if ( !config.getConfigValue('maxConnections') ) config.setConfigValue('maxConnections', 0);
const max_conns       = config.getConfigValue('maxConnections');
let busy              = false;

class AshitaNode extends net.Server {
  constructor () {
    super();

    this.listen({
      port:nodeManager.getNodePort,
      host:nodeManager.getNodeHost,
      exclusive:true
    }, () => cli.Panel.notice(`Node Listening @${nodeManager.getNodeHost}:${nodeManager.getNodePort}`) );

    this.on("error", ( error ) => {
      if ( error.code === "EADDRINUSE" ) {
        this.close();
        let port = nodeManager.getNodePort;
        port++;
        nodeManager.setNodePort( port );
        return new AshitaNode();
      }
    });

    this.on("connection", this.onConnection.bind( this ));
  }

  onConnection ( socket ) {
    this.socket     = socket;
    this.publicKey  = undefined;
    this.socket.on("data", this.onData.bind( this ));
    this.socket.on("error", this.onError.bind( this ));

    // request public key of client
    this.socket.write( JSON.stringify({
        "type":"connectionRecieved",
        "content":{}
    }));
  }

  onData ( data ) {
    data = this.safeParseJSON( data );
    const crypto = require("crypto");
    if ( !data.hasOwnProperty("type") ||
         !data.hasOwnProperty("content") ) {
      // missing basic structure
      return false;
    }

    /**
      TODO: implement security controls to confirm a peer connection has been established properly before accepting commands
    */
    switch ( data.type ) {
      case "keyExchange":
        this.publicKey = data.content.publicKey;

        this.socket.write( JSON.stringify({
          "type" : "publicKey",
          "content" : {
            "publicKey" : nodeManager.getPublicKey
          }
        }));
      break;

      case "validateIdentity":
        try {
          let message = crypto.privateDecrypt(nodeManager.getPrivateKey, Buffer.from(data.content.message, 'utf-8'));
          let encrypted = crypto.publicEncrypt( this.publicKey, message );


          this.socket.write( JSON.stringify({
            "type": "validateIdentity",
            "content": {
              "message":  encrypted
            }
          }));
        } catch (e){}
      break;

      case "disconnecting":
        // send dc event to nodes?
        // pass
        cli.Panel.alert( `${data.content.nodeId} disconnected` );
        nodeManager.removeNode( data.content.nodeId );
      break;

      case "connectionEstablished":
        cli.Panel.notice(`${nodeManager.generatePeerId(this.publicKey)} has joined your node.`);
      break;

      case "privateMessage":
        {
          let message = crypto.privateDecrypt(nodeManager.getPrivateKey, Buffer.from(data.content.message, 'utf-8'));
          cli.Panel.privateMessageRecieved( data.content.peerId, data.content.username, message.toString() );
        };
      break;

      case "publicMessage":
        {
          let message = crypto.publicDecrypt(nodeManager.getNodeKey( data.content.peerId[0] ), Buffer.from(data.content.message, 'utf-8'));
          cli.Panel.publicMessage( data.content.peerId[0], data.content.username, message.toString() );

          nodeManager.relayPublicMessage(data.content.peerId, data.content.username, message.toString());
        };
      break;
      
      default:
        // pass
    }   
  }

  onError ( error ) {
    // pass
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

module.exports = AshitaNode;