/**
 * ashita/core/index
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 */
"use strict";
require('consoleplusplus');
const path            = require('path');
const WebSocketServer = require('ws').Server;
const http            = require('http');
const express         = require('express');
const app             = express().use(express.static(path.join(__dirname, '/public')));
const server          = http.createServer(app).listen(8000);
const ashita          = new WebSocketServer({server: server});
const SIGNAL          = require('./signal.js');
const color           = require('./color.js');

let connectedNodes    = {};

/* ----- <OUTPUT> ----- */
console.info(color.BgGreen + color.Black + "System is now online. http://127.0.0.1:8000" + color.Reset);
/* ----- </OUTPUT> ----- */

ashita.on('connection', function ( socket ) {
  socket.node = `${socket._socket.remoteAddress.substr(7)}:${socket._socket.remotePort}`;

  /* ----- <OUTPUT> ----- */
  console.info(color.Green + "Connection opened from " + socket.node);
  /* ----- </OUTPUT> ----- */

  socket.on('message', function ( socket_data ) {
    this.data = JSON.parse( socket_data );
    socket.node = this.data.node; // node
    if ( typeof SIGNAL[this.data.type] !== "function" ) {
      /* ----- <OUTPUT> ----- */
      console.warn("Invalid SIGNAL received from client socket.");
      /* ----- </OUTPUT> ----- */
    }
    return SIGNAL[this.data.type](connectedNodes, socket, this.data.content);
  });

  socket.on('error', function ( error ) {
    /* ----- <OUTPUT> ----- */
    console.error(error)
    /* ----- </OUTPUT> ----- */
  });

  socket.on('close', function () {
    /* ----- <OUTPUT> ----- */
    console.debug(color.Red + "Removed node " + socket.node);
    /* ----- </OUTPUT> ----- */
    connectedNodes[socket.node] = null;
    delete connectedNodes[socket.node];
    console.info(color.Red + "Connection closed.");
    /* ----- </OUTPUT> ----- */
  });
});
