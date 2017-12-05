/**
 * ashita/index
 *
 * @package    ashita
 * @author     dostoevskylabs
 * @author     mooglesonthecob
 */
"use strict";
const args = process.argv.slice( 2 );

if ( args.length !== 1 ) {
  args[0] = 8000;
}

const path            = require('path');
const http            = require('http');
const express         = require('express');
const app             = express().use( express.static( path.join(__dirname, '/public') ) );
const server          = http.createServer( app ).listen( args[0] );
const ashita          = require('./ashita.js');
const Logger          = require('./logger.js');
Logger.setVerbosity(Logger.WARN, Logger.INFO, Logger.NOTICE, Logger.ERROR, Logger.DEBUG);

new ashita.Core({
  server:server
}, args[0]);