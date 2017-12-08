const net             = require('net');
const cli             = require('./cli.js');
const nodeManager     = require('./nodeManager.js');

class AshitaClient extends net.Socket {
  constructor ( myPort, nodeIp, nodePort ) {
    super();
    this.nodeIp = nodeIp;
    this.nodePort = nodePort;
    this.connect(this.nodePort, this.nodeIp);
    this.on('connect', this.onConnect.bind(this));
    this.on('data', this.onData.bind(this));
    this.on('timeout', this.onTimeout.bind(this));
    this.on('error', this.onError.bind(this));
    this.on('close', this.onClose.bind(this));
    this.on('end', this.onEnd.bind(this));

    this.write(JSON.stringify({"newNode":`${this.nodeIp}:${myPort}`}));
    cli.screens["Debug"].add("AshitaClient initialized with", this.nodeIp, this.nodePort);
  }

  onConnect( ) {
    nodeManager.addNode(`${this.nodeIp}:${this.nodePort}`, this);
    cli.screens["Debug"].add("Handshake completed with", `${this.nodeIp}:${this.nodePort}`);    
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
  onClose(){
    cli.screens["Log"].add("Socket closed");
  }
  onEnd () {
    cli.screens["Log"].add("Socket received FIN");
  }
}

module.exports = {
  "AshitaClient" : AshitaClient
};