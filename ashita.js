/**
 * ashita/Core
 *
 * @package    ashita
 * @author     dostoevskylabs
 */
"use strict";
const WebSocketServer = require('ws').Server;
const btoa            = require('btoa');
const atob            = require('atob');
const API             = require('./api.js');
const Logger          = require('./logger.js');

class Core extends WebSocketServer {
  constructor ( Object, port ) {
    super( Object );
    this.on('connection', this.onConnection );
    this.ownerId = btoa(`127.0.0.1:${port}`);
    this.nodes   = {};

    Logger.notice(`Server started. Visit http://${atob( this.ownerId )}`);
  }

  onConnection ( socket ) {
    new API( this, socket );
  }

  get getNodeList () {
    return this.nodes;
  }

  getNode ( sessionId ) {
    /**
     * TODO: Write checks to make sure session exists before returning it
     */
    return this.nodes[sessionId];
  }

  addNode ( sessionId, nodeObject ) {
    /**
     * TODO: Write checks to see if the object already exists/sessionId is valid/etc
     */
    this.nodes[sessionId] = nodeObject;
    Logger.info(`New peer session: ${sessionId}`)
  }
}

module.exports = {
  "Core" : Core
}