"use strict";
const fs                = require("fs");
const nodeManager       = require("./nodeManager.js");
const os                = require("os");
const node              = require("./node.js");
const cli               = require("./cli.js");
const client            = require("./client.js");
const adapter           = process.argv[2];
var sleep               = require('sleep');
let interfaces          = os.networkInterfaces();
let nodeHost            = interfaces[adapter][0].family === 'IPv4' ? interfaces[adapter][0].address : interfaces[adapter][1].address;

let state               = 'public';
let peerId              = '';

nodeManager.setNodeHost( nodeHost );
nodeManager.setNodePort( 8000 );  

try {
  nodeManager.setPublicKey( fs.readFileSync("./node.pub", "utf-8") );
  nodeManager.setPrivateKey( fs.readFileSync("./node.priv", "utf-8") );
  encryptionEnabled();
} catch ( err ) {}

if ( !nodeManager.getPublicKey || !nodeManager.getPrivateKey ) {
  cli.Panel.security("Generating KeyPair...");
  setTimeout(() => {
    const NodeRSA = require('node-rsa');
    const key = new NodeRSA();
    key.generateKeyPair(2048, 65537);
    const publicDer = key.exportKey('pkcs8-public');
    const privateDer = key.exportKey('pkcs8-private');

    fs.writeFileSync( "./node.pub", publicDer, ( err ) => cli.Panel.debug( err ) );
    fs.writeFileSync( "./node.priv", privateDer, ( err ) => cli.Panel.debug( err ) );
    nodeManager.setPublicKey( fs.readFileSync("./node.pub", "utf-8") );
    nodeManager.setPrivateKey( fs.readFileSync("./node.priv", "utf-8") );
    cli.Panel.security("Keys generated.");

    encryptionEnabled();
  }, 500);
}

let peers = [];

function discoverPeers( repeat ) {
  var mdns = require('mdns');
  var ad = mdns.createAdvertisement(mdns.tcp('ashitajs'), nodeManager.getNodePort);
  ad.start();
   
  // watch all http servers
  var browser = mdns.createBrowser(mdns.tcp('ashitajs'));
  browser.on('serviceUp', function(service) {
    try {
      let nodeId = nodeManager.generatePeerId(`${service.addresses[1]}:${service.port}`);

      if ( nodeId !== nodeManager.getNodeId  && !nodeManager.getNode( nodeId ) ) {
        nodeManager.connectToNode( service.addresses[1], service.port );
      }
    } catch ( e ) {}
  });
  browser.on('serviceDown', function(service) {
    try {
      nodeManager.removeNode( nodeManager.generatePeerId(`${service.addresses[1]}:${service.port}`) );
    } catch ( e ) {}
  });
  browser.start();

  repeat();
}

function encryptionEnabled() {
  cli.Panel.security("Encryption Enabled.");
  new node();

  // set myself as leader
  nodeManager.setLeader( nodeManager.getNodeId );

    (function repeat(){
      setTimeout(function(){
        discoverPeers( repeat );
      }, 10000);
    })();

   

  function handleInput( input ) {
    const commands = input.split(" ");

    switch ( commands[0] ) {
      case "/exit":
        nodeManager.sendEndEvent();
        process.exit(0);
      break;

      case "/peers":
        let peers = nodeManager.getNodes();
        cli.Panel.debug(`Active Peer Sessions\n${peers.join('\n')}`)
  
        
        cli.screens["Test"].clearValue();
        cli.screens["Test"].focus();    
      break;

      case "/join":
        nodeManager.connectToNode(commands[1], commands[2]);

        cli.screens["Test"].clearValue();
        cli.screens["Test"].focus();  
      break;

      case "/username":
        nodeManager.setUsername( commands[1] );

        cli.screens["Test"].clearValue();
        cli.screens["Test"].focus();       
      break;

      case "/pm":
        let peer = nodeManager.getManifestEntry( commands[1] );
        if ( peer ) {
          cli.Panel.notice( `Opened channel with ${commands[1]}` );

          state = 'private';
          peerId = commands[1];       
        } else {
          cli.Panel.notice(`Cannot locate peer`);
        }

        
        cli.screens["Test"].clearValue();
        cli.screens["Test"].focus(); 
      break;

      case '/public':
        cli.Panel.notice( `Closed private channel, speaking publically.`);
        state = 'public';
        peerId = '';

        cli.screens["Test"].clearValue();
        cli.screens["Test"].focus(); 
      break;

      default:
        if ( state === 'public' ) {
          cli.Panel.publicMessage( nodeManager.getNodeId, nodeManager.getUsername, input );
          nodeManager.sendPublicMessage( nodeManager.getUsername, input);
        } else {
          cli.Panel.privateMessage( peerId, nodeManager.getUsername, input );
          nodeManager.sendPrivateMessage( peerId, nodeManager.getUsername, input);
        }

        
        cli.screens["Test"].clearValue();
        cli.screens["Test"].focus(); 
    }
  }

  cli.screens["Test"].on("submit", function( message ) {
    handleInput( message );
  });  
}