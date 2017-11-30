/**
 * ashita/core/index
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 */
"use strict";
require('consoleplusplus');
const args = process.argv.slice(2);

if ( args.length !== 1 ) {
  //process.exit(0);
  args[0] = 8000;
}

const path            = require('path');
const WebSocketServer = require('ws').Server;
const http            = require('http');
const express         = require('express');
const app             = express().use(express.static(path.join(__dirname, '/public')));
const server          = http.createServer(app).listen(args[0]);
const ashita          = new WebSocketServer({server: server});
const clientAPI       = require('./clientAPI.js');
const color           = require('./color.js');

let connectedNodes    = {};

console.info(color.BgGreen + color.Black + "System is now online. http://127.0.0.1:" + args[0] + color.Reset);

ashita.on('connection', function ( socket ) {
  socket.node = `${socket._socket.remoteAddress.substr(7)}`;

  console.info(color.Green + "Connection opened from " + socket.node);

  socket.on('message', function ( socket_data ) {
    this.owner = `127.0.0.1:${args[0]}`;
    this.data = JSON.parse( socket_data );
    socket.node += ":" + this.data.node.split(":")[1];

    if ( typeof clientAPI[this.data.type] !== "function" ) {
      console.warn("Invalid clientAPI call received from socket.");
    }

    return clientAPI[this.data.type](connectedNodes, this.owner, socket, this.data.content);
  });

  socket.on('error', function ( error ) {
    console.error(error)
  });

  socket.on('close', function () {
    console.debug(color.Red + "Removed node " + socket.node);

    connectedNodes[socket.node] = null;
    delete connectedNodes[socket.node];

    console.info(color.Red + "Connection closed.");
  });
});
