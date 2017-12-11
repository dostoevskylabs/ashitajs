"use strict";
const net             = require("net");
const node            = require("./node.js");
const cli             = require("./cli.js");
const nodeManager     = require("./nodeManager.js");

class AshitaClient extends net.Socket {
  constructor ( nodeIp, nodePort ) {
    super();
    this.nodeIp = nodeIp;
    this.nodePort = nodePort;
    this.connect(this.nodePort, this.nodeIp);
    this.on("connect", this.onConnect.bind(this));
    this.on("data", this.onData.bind(this));
    this.on("timeout", this.onTimeout.bind(this));
    this.on("error", this.onError.bind(this));
    this.on("close", this.onClose.bind(this));
    this.on("end", this.onEnd.bind(this));


    this.send({
      "newNode":`${nodeManager.getNodeHost}:${nodeManager.getNodePort}`
    });
    cli.screens["Debug"].add("AshitaClient initialized with", this.nodeIp, this.nodePort);
  }

  onConnect () {
    nodeManager.addNode(`${this.nodeIp}:${this.nodePort}`, this);
    cli.screens["Log"].add("here we go adding", this.nodeIp, this.nodePort);
    cli.screens["Debug"].add("Handshake completed with", `${this.nodeIp}:${this.nodePort}`);  
  }

  send ( data ) {
    data = JSON.stringify(data);
    this.write(data);
  }

  onData ( data ) {
    cli.screens["Log"].add( data );
  }

  onTimeout () {
    cli.screens["Log"].add("Idle");
  }

  onError ( error ) {
    cli.screens["Debug"].add( error );
    this.destroy();
  }

  onClose () {
    /* TODO: Handling removing peer with nodeManager */
    cli.screens["Log"].add(this.nodePort);
  }

  onEnd () {
    cli.screens["Log"].add("Socket received FIN");
  }
}

module.exports = AshitaClient;