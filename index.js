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
const http            = require('http');
const express         = require('express');
const app             = express().use( express.static( path.join(__dirname, '/public') ) );
const server          = http.createServer( app ).listen( args[0] );
const Ashita          = require('./ashita.js');

new Ashita.API({
  server:server
});