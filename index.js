/**
 * ashita/core/index
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 */
"use strict";
require('consoleplusplus');
const args = process.argv.slice( 2 );

if ( args.length !== 1 ) {
  args[0] = 8000;
}

const path            = require('path');
const WebSocketServer = require('ws').Server;
const http            = require('http');
const express         = require('express');
const app             = express().use( express.static( path.join(__dirname, '/public') ) );
const server          = http.createServer( app ).listen( args[0] );
const ashita          = new WebSocketServer( {server: server} );
const API             = require('./api.js');
const btoa            = require('btoa');
const color           = require('./color.js');

const ownerId         = btoa(`127.0.0.1:${args[0]}`);
let nodes             = {};
console.info(color.Green + "Server started");
ashita.on('connection', function ( socket ) {
  console.info(color.Green + "New connection");
  socket.on('message', function ( socket_data ) {
    new API.Client(nodes, ownerId, socket, socket_data);
  });

  socket.on('error', function ( error ) {});
  socket.on('close', function () {});
});
