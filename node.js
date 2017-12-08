const net             = require('net');
const cli             = require('./cli.js');
const client          = require('./client.js');
const nodeManager     = require('./nodeManager.js');

class AshitaNode extends net.Server {
  constructor ( nodeHost, nodePort ) {
    super();
    this.nodePort = nodePort;
    this.listen(this.nodePort, nodeHost);
    this.socket = undefined;
    this.on('connection', this.onConnection.bind(this));
    cli.screens["Debug"].add("AshitaNode initialized.");

  }

  onConnection ( socket ) {
    this.socket = socket;
    this.socket.on('data', this.onData.bind(this));
    this.socket.on('error', this.onError.bind(this));   
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

  onData ( data ) {
    data = this.safeParseJSON(data);
    if ( data.hasOwnProperty("newNode") ) {
      let host = data.newNode;
      if ( nodeManager.getNode( host ) ) {
        return false;
      }

      let peer = new client.AshitaClient(this.nodePort, host.split(":")[0], host.split(":")[1]);

    } else {
      cli.screens["Log"].add(data);
    }     
  }

  onError ( error ) {
    cli.screens["Debug"].add( error );
  }
}

module.exports = {
  "AshitaNode" : AshitaNode
};