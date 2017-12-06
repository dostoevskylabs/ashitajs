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
const os                = require('os');
const path              = require('path');
const http              = require('http');
const express           = require('express');
const app               = express();
const server            = http.createServer( app ).listen( args[0] );
const ashita            = require('./ashita.js');
const Logger            = require('./logger.js');
const cli               = require('./cli.js');
Logger.setVerbosity(Logger.WARN, Logger.INFO, Logger.NOTICE, Logger.ERROR, Logger.DEBUG);
let interfaces = os.networkInterfaces();
let nodeHost = undefined;
for (let k in interfaces) {
  for (let k2 in interfaces[k]) {
    let address = interfaces[k][k2];
    if ( address.family === 'IPv4' && !address.internal ) {
      nodeHost = address.address + ":" + args[0];
    }
  }
}

app.get('/', function ( req, res, next ) {
  if ( req.headers.host !== nodeHost ) {
    return res.redirect("http://" + nodeHost);
  }
  next();
});

app.use( express.static( path.join(__dirname, '/public') ) );
new ashita.Core({
  server:server
}, nodeHost);