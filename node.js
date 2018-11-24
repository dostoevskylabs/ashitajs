"use strict";
const net             = require("net");
const cli             = require('./cli.js');
const client          = require("./client.js");
const nodeManager     = require("./nodeManager.js");
const fs              = require("fs");
const max_conns       = 1;

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

    this.socket = undefined;
  }

  onConnection ( socket ) {
    this.socket = socket;
    this.socket.on("data", this.onData.bind( this ));
    this.socket.on("error", this.onError.bind( this ));


    // request public key of client
    this.socket.write( JSON.stringify({
        "type":"getPublicKey",
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
      case "disconnecting":
        // send dc event to nodes?
        // pass
        cli.Panel.debug( `${data.content.nodeId} disconnected` );
        nodeManager.removeNode( data.content.nodeId );
      break;

      case "publicKey":
        this.socket.write( JSON.stringify({
          "type":"connectionSuccessful",
          "content":{
            "leaderId"  : nodeManager.getNodes().length > max_conns ? null : nodeManager.getLeader,
            "publicKey" : nodeManager.getPublicKey
          }
        }));
      break;

      case "privateMessage":
        {
          let message = crypto.privateDecrypt(nodeManager.getPrivateKey, Buffer.from(data.content.message, 'utf-8'));
          cli.Panel.privateMessageRecieved( data.content.peerId, data.content.username, message.toString() );
        };
      break;

      case "publicMessage":
        {
          let message = crypto.privateDecrypt(nodeManager.getPrivateKey, Buffer.from(data.content.message, 'utf-8'));
          cli.Panel.publicMessage( data.content.peerId[0], data.content.username, message.toString() );

          nodeManager.relayPublicMessage(data.content.peerId, data.content.username, message.toString());
        };
      break;
        
      case "newNode":
        var host   = data.content.nodeHost;
        var peerId = nodeManager.generatePeerId( host );
        if ( nodeManager.getNode( peerId ) ) {
          return false;
        }
        
        new client(host.split(":")[0], host.split(":")[1], nodeManager);
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