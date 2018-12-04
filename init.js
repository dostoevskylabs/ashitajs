"use strict";
const fs                = require("fs");
const os                = require("os");
const nodeManager       = require("./middleware/peerManager");
const node              = require("./lib/node");
const client            = require("./lib/client");
const cli               = require("./lib/ui");

class Init {
  setup ( nodeHost, nodePort ) {
    this.nodeHost = nodeHost;
    this.nodePort = nodePort;

    this.setupNode();
    this.checkEncryption();
    //derp
  }

  setupNode () {
    nodeManager.setNodeHost( this.nodeHost );
    nodeManager.setNodePort( this.nodePort );  
  }

  checkEncryption () {
    try {
      nodeManager.setPublicKey( fs.readFileSync("./.keys/node.pub", "utf-8") );
      nodeManager.setPrivateKey( fs.readFileSync("./.keys/node.priv", "utf-8") );
      this.encryptionEnabled();
    } catch ( err ) {}

    if ( !nodeManager.getPublicKey || !nodeManager.getPrivateKey ) {
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
    require('./discovery.js');

    let inputHandler = require ('./middleware/inputParser');

      cli.Panel.security("Encryption Enabled.");
      new node();

      // set myself as leader
      nodeManager.setLeader( nodeManager.getNodeId );   

      cli.screens["Test"].on("submit", function( message ) {
        inputHandler( message );
      });  
  }
}

module.exports = new Init;