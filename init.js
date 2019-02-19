"use strict";
const fs                = require("fs");
const os                = require("os");
const nodeManager       = require("./middleware/peerManager");
const node              = require("./lib/node");
const client            = require("./lib/client");
const cli               = require("./lib/ui");

class Init {
  setup ( adapter, nodeHost, nodePort ) {
    this.adapter  = adapter;
    this.nodeHost = nodeHost;
    this.nodePort = nodePort;

    this.setupNode();
    this.checkEncryption();
    //derp
  }

  setupNode () {
    // define node properties
    nodeManager.setNodeHost( this.nodeHost );
    nodeManager.setNodePort( this.nodePort );
    nodeManager.setInterface( this.adapter ); 
  }

  checkEncryption () {
    try {
      // read contents of our key files if they already exist
      nodeManager.setPublicKey( fs.readFileSync("./.keys/node.pub", "utf-8") );
      nodeManager.setPrivateKey( fs.readFileSync("./.keys/node.priv", "utf-8") );

      this.encryptionEnabled(); // step to encryption enabled actions
    } catch ( err ) {}

    if ( !nodeManager.getPublicKey || !nodeManager.getPrivateKey ) {
      // generate a new keypair as none were found
      cli.Panel.security("Generating KeyPair...");
      setTimeout(() => {
        const NodeRSA = require('node-rsa');
        const key = new NodeRSA();
        key.generateKeyPair(2048, 65537);
        const publicDer = key.exportKey('pkcs8-public');
        const privateDer = key.exportKey('pkcs8-private');

        fs.writeFileSync( "./.keys/node.pub", publicDer, ( err ) => cli.Panel.debug( err ) );
        fs.writeFileSync( "./.keys/node.priv", privateDer, ( err ) => cli.Panel.debug( err ) );
        nodeManager.setPublicKey( fs.readFileSync("./.keys/node.pub", "utf-8") );
        nodeManager.setPrivateKey( fs.readFileSync("./.keys/node.priv", "utf-8") );
        cli.Panel.security("Keys generated.");

        this.encryptionEnabled();
      }, 500);
    }    
  }

  encryptionEnabled () {
    require('./discovery.js'); // begin peer discovery
    new node(); // start listening
    
    // set myself as leader
    nodeManager.setLeader( nodeManager.getNodeId );

    let inputHandler = require ('./middleware/inputParser'); // wait for client input
    cli.Panel.security("Encryption Enabled.");
    
    cli.Panel.debug("nodeId: " + nodeManager.getNodeId); //whoami?

    cli.screens["Test"].on("submit", function( message ) {
      inputHandler( message );
    });  
  }
}

module.exports = new Init;
