"use strict";
const net             = require("net");
const nodeManager     = require("./nodeManager.js");
const cli             = require("./cli.js");

class AshitaClient extends net.Socket {
  constructor ( nodeIp, nodePort ) {
    super();
    this.nodeIp     = nodeIp;
    this.nodePort   = nodePort;
    this.nodeId     = nodeManager.generatePeerId (`${this.nodeIp}:${this.nodePort}`);
    this.MOTD       = undefined;
    this.instanced  = false;
    this.connect(this.nodePort, this.nodeIp);
    this.on("connect", this.onConnect.bind(this));
    this.on("data", this.onData.bind(this));
    this.on("timeout", this.onTimeout.bind(this));
    this.on("error", this.onError.bind(this));
    this.on("close", this.onClose.bind(this));
    this.on("end", this.onEnd.bind(this));
  }

  onConnect () {
    if ( this.instanced ) {
      return false;
    }

    if ( nodeManager.getNode( this.nodeId ) ||
         nodeManager.getNodeId === this.nodeId ) {
      return false;
    }
    cli.Logger.debug("AshitaClient initialized with", this.nodeId);

  }

  onData ( data ) {
    data = JSON.parse( data );
    if ( data.type === "connectionSuccessful" ) {
      this.instanced = true;
      this.MOTD = data.content.MOTD;
      nodeManager.addNode(this);
      cli.Logger.debug("Handshake completed with", `${this.nodeId}`);   
      this.sendClientEvent("newNode", {
        "nodeHost": `${nodeManager.getNodeHost}:${nodeManager.getNodePort}`
      });         
    }
    // pass
  }

  onTimeout () {
    // pass
  }

  onError ( error ) {
    // pass
  }

  onClose () {
    /* TODO: Handling removing peer with nodeManager */
    // nodeManager.removeNode( this.nodeId );
  }

  onEnd () {
    // pass
  }

  send ( data ) {
    data = JSON.stringify(data);
    this.write(data);
  }

  sendClientEvent ( event, object ) {
    let message = {
      "type"    : event,
      "content" : object
    };

    this.send(message);
  }
}

module.exports = AshitaClient;