const cli               = require('./cli.js');
const path              = require('path');
const http              = require('http');
const express           = require('express');
const app               = express();
const server            = http.createServer( app ).listen( 60000 );
const ws                = require('ws').Server;
const btoa              = require('btoa');

app.use( express.static( path.join(__dirname, '/public') ) );

class GUI extends ws {
  constructor () {
    super({server:server});
    this.on('connection', this.onConnection);
  }

  onConnection ( socket ) {
    this.socket = socket;
    this.socket.on('message', this.onMessage.bind(this));
    this.socket.on('error', this.onError.bind(this));
    this.socket.on('close', this.onClose.bind(this));
    this.socket.send(JSON.stringify({
      "type":"MOTD",
      "peerId":btoa("127.0.0.1:8000"),
      "MOTD": "THIS IS A TEST"
    }));
    cli.screens["Debug"].add("New GUI Session");
  }

  onMessage ( data ) {
    data = JSON.parse(data);
    switch ( data.type ) {
      case "publicMessage":
          
        break;

      default:
        // pass
    }
    cli.screens["Debug"].add(data);
  }

  onError ( error ) {
    // pass
  }

  onClose () {
    // pass
  }
}

module.exports = GUI;