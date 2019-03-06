"use strict";
const fs                = require("fs");
const os                = require("os");
const peerManager       = require("./middleware/peerManager");
const node              = require("./lib/node");
const client            = require("./lib/client");
const cli               = require("./lib/ui");
const manifest          = require("./lib/manifest");

class Init {
  setup ( adapter, peerIp, peerPort ) {
    this.adapter  = adapter;
    this.peerIp   = peerIp;
    this.peerPort = peerPort;

    this.setupNode();
    this.checkEncryption();
    //derp
  }

  setupNode () {
    // define node properties
    peerManager.setPeerIp( this.peerIp );
    peerManager.setPeerPort( this.peerPort );
    peerManager.setInterface( this.adapter );
  }

  checkEncryption () {
    try {
      // read contents of our key files if they already exist
      peerManager.setPublicKey( fs.readFileSync("./.keys/node.pub", "utf-8") );
      peerManager.setPrivateKey( fs.readFileSync("./.keys/node.priv", "utf-8") );

      this.encryptionEnabled(); // step to encryption enabled actions
    } catch ( err ) {}

    if ( !peerManager.getPublicKey || !peerManager.getPrivateKey ) {
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
        peerManager.setPublicKey( fs.readFileSync("./.keys/node.pub", "utf-8") );
        peerManager.setPrivateKey( fs.readFileSync("./.keys/node.priv", "utf-8") );
        cli.Panel.security("Keys generated.");

        this.encryptionEnabled();
      }, 500);
    }    
  }

  encryptionEnabled () {
    new node(); // start listening
    manifest.addEntry( peerManager.getPeerId, peerManager.getPublicKey );
       
    // set myself as leader
    peerManager.setLeader( peerManager.getPeerId );
    
    
    let inputHandler = require ('./middleware/inputParser'); // wait for client input
    cli.Panel.security("Encryption Enabled.");
    
    //cli.Panel.debug("peerId: " + peerManager.getPeerId); //whoami?
    setTimeout( function(){
      //require('./discovery.js'); // begin peer discovery 
    }, 5000);
    
    cli.screens["Test"].on("submit", function( message ) {
      inputHandler( message );
    });  
  }
}

module.exports = new Init;
