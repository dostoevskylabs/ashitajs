"use strict";
const crypto    = require("crypto");
const client    = require("../../lib/client");
const cli       = require("../../lib/ui");
const manifest  = require("../../lib/manifest");
let username    = "Anonymous";
let publicKey   = undefined;
let privateKey  = undefined;
let peerIp      = undefined;
let peerPort    = undefined;
let Interface   = undefined;
let activePeers       = [];

//todo: define message types and standardize
//todo: split this up?
//todo: bootstrapping
//todo: routing
//todo: disconnected 'cache'
//todo: rejoin to network
//todo: purge caches
//todo: heartbeats
//todo: acl
//todo: username unique check
//todo: join vote?
//todo: privatemessage routing
//todo: ui fixes
/*
let niceNames = {
  'Bob' : 'peerId'
}

if ( peerId !== niceNames[Username]){
  send('invalid');
}
*/
// Hmm, okay.

let leaderId    = undefined; // who am i following || null
let pSockets = new Map(); // my direct peers (not distributed)

/**
 *  getManifest from other peers
 *  ie: query peers, ask for manifest
 *  recieve manifest from first available or all peers?
 *  
 *  adding to manifest propogates thru all peers?
 *
 * how do we verify integrity of the manifest? well we have the public keys of our peers so a connection already verifies identity
 * however, how will we know its who they say they are? verify identity via keybase?
 * 
 * onboarding:
 * client sends packet to peer
 * peer checks if client can join
 * client can join
 * verify client
 * connection successful
 * add client to local manifest
 * send manifest to client
 * propogate new manifest to network
 *
 * we should track our peers, and the global manifest separately!!
 * damn so much coding to do, not to mention all the error handling im missing because im dumb :(
 */

class peerManager {

  static get getActivePeers () {
    return activePeers;
  }

  static setUsername( user ) {
    username = user;
  }

  static get getUsername () {
    return username;
  }

  static setInterface( iface ) {
    Interface = iface;
  }

  static get getInterface () {
    return Interface;
  }

  static setPeerIp ( ip ) {
    peerIp = ip;
  }

  static get getPeerIp () {
    return peerIp;
  }

  static setPeerPort ( port ) {
    peerPort = port;
  }

  static get getPeerPort () {
    return peerPort;
  }

  static get getPeerId () {
    return peerManager.generatePeerId( publicKey );
  }

  static connectToPeer( ip, port ) {
    if ( ip === peerManager.getPeerIp && port == peerManager.getPeerPort ) return false;
    if ( activePeers.includes(`${ip}:${port}`) ) return false;
    new client( ip, port, peerManager );
  }

  static setPublicKey ( key ) {
    publicKey = key;
  }

  static get getPublicKey () {
    return publicKey;
  }

  static setPrivateKey ( key ) {
    privateKey = key;
  }

  static get getPrivateKey () {
    return privateKey;
  }

  static get getLeader() {
    return leaderId;
  }

  static setLeader ( id ) {
    leaderId = id;
  }

  static addPeer ( clientInstance ) {
    if ( !activePeers.includes( `${clientInstance.peerIp}:${clientInstance.peerPort}` ) ) {
      activePeers.push( `${clientInstance.peerIp}:${clientInstance.peerPort}` );
      if ( peerManager.getPeer ( clientInstance.peerId ) ||
          clientInstance.peerId === peerManager.getPeerId ) {
        return false;
      }

      manifest.addEntry( clientInstance.peerId, clientInstance.publicKey );
      pSockets.set( clientInstance.peerId, clientInstance );
    }

    return false;
  }

  static removePeer ( peerId ) {
    if ( peerManager.getPeer( peerId ) ) {
      pSockets.delete( peerId );
    }
  }

  static sendPeerEvent ( event, object ) {
    let message = {
      "type"      : event,
      "content"   : object
    };

    pSockets.forEach( ( peerSocket, peer ) => {
      if ( peer !== peerManager.getPeerId && peer !== object.peerId ) {
        message = JSON.stringify( message );
        peerSocket.write( message );
      }
    });
  }

  static sendEndEvent() {
    pSockets.forEach( ( peerSocket, peer ) => {
      if ( peer !== peerManager.getPeerId ) {
        let payload   = {
          "type"    : "disconnecting",
          "content" : {
            "peerId"   : peerManager.getPeerId
          }
        };

        payload = JSON.stringify( payload );
        peerSocket.write(payload);
      }
    });
  }

  static sendNewPeerMessage ( peerId ) {
    let peers = [peerManager.getPeerId];
    pSockets.forEach( ( peerSocket, peer ) => {
      if ( peer !== peerManager.getPeerId && peer !== peerId ) {
        peers.push( peer );
      }
    });

    pSockets.forEach( ( peerSocket, peer ) => {
      if ( peer !== peerManager.getPeerId && peer !== peerId ) {
        let payload = {
          "type"      : "peerJoined",
          "content"   : {
            "peers"   : peers,
            "peerId"   : peerId
          }
        };

        payload = JSON.stringify( payload );
        peerSocket.write( payload );
      }
    });
  }

  static relayNewPeerMessage( peerId, peerArray ) {
    let peers = peerArray.slice();

    pSockets.forEach( ( peerSocket, peer ) => {
      if ( peer !== peerManager.getPeerId && !peers.includes( peer ) ) {
        peers.push( peer );
      }
    });

    pSockets.forEach( ( peerSocket, peer ) => {
      if ( peer !== peerManager.getPeerId ) {
        if ( !peerArray.includes( peer ) ) {
          let payload = {
            "type"      : "peerJoined",
            "content"   : {
              "peers"   : peers,
              "peerId"  : peerId
            }
          };

          payload = JSON.stringify( payload );
          peerSocket.write( payload );
        }
      }
    });    
  }

  // todo: handle dc'd during, probably easily handled by routing thru network
  static sendPrivateMessage( peerId, username, message ) {
    const crypto  = require('crypto');
    let encrypted = crypto.publicEncrypt( manifest.getPublicKeyOfPeer( peerId ), Buffer.from( message, 'utf-8') );
    let payload   = {
      "type"    : "privateMessage",
      "content" : {
        "peerId"   : peerManager.getPeerId,
        "username" : username,
        "message"  : encrypted
      }
    };

    payload = JSON.stringify( payload );
    pSockets.get( peerId ).write( payload );   
  }

  static sendPublicMessage( username, message ) {
    const crypto = require('crypto');

    let peers = [peerManager.getPeerId];
    pSockets.forEach( ( peerSocket, peer ) => {
      if ( peer !== peerManager.getPeerId ) {
        peers.push( peer );
      }
    });

    pSockets.forEach( ( peerSocket, peer ) => {
      if ( peer !== peerManager.getPeerId ) {
        let encrypted = crypto.privateEncrypt( privateKey, Buffer.from( message, 'utf-8') );
        let payload = {
          "type"      : "publicMessage",
          "content"   : {
            "peerId"   : peers,
            "username" : username,
            "message"  : encrypted
          }
        };

        payload = JSON.stringify( payload );
        peerSocket.write( payload );
      }
    });

  }

  static relayPublicMessage( peerId, username, message ) {
    const crypto = require('crypto');
    let peers = peerId.slice();

    pSockets.forEach( ( peerSocket, peer ) => {
      if ( peer !== peerManager.getPeerId && !peers.includes( peer ) ) {
        peers.push( peer );
      }
    });

    pSockets.forEach( ( peerSocket, peer ) => {
      if ( peer !== peerManager.getPeerId ) {
        if ( !peerId.includes(peer) ) {
          let encrypted = crypto.publicEncrypt( manifest.getPublicKeyOfPeer( peer ), Buffer.from( message, 'utf-8') );
          let payload = {
            "type"      : "publicMessage",
            "content"   : {
              "peerId"   : peers,
              "username" : username,
              "message"  : encrypted
            }
          };

          payload = JSON.stringify( payload );
          peerSocket.write( payload );
        }
      }
    });
  }

  static whoHasAnswer ( peerId, requestorIds, route ) {
    pSockets.get(requestorIds[requestorIds.length - 1]).write(JSON.stringify({
      "type": "whoHasAnswer",
      "content": {
        "peerId" : peerId,              // who was found
        "requestorIds" : requestorIds,  // chain to reverse
        "route": route                  // route to peer
      }
    }));
  }

  static whoHas( peerId ) {
    if ( peerManager.getPeer ( peerId ) ) return true;
    let requestorIds = [peerManager.getPeerId];
    pSockets.forEach( ( peerSocket, peer ) => {
        if ( peer !== peerManager.getPeerId ) {
          if ( !requestorIds.includes(peer) ) {
            let payload = {
              "type"      : "whoHas",
              "content"   : {
                "requestorIds"  : requestorIds, // who is asking
                "peerId"        : peerId      // to be located
              }
            };

            payload = JSON.stringify( payload );
            peerSocket.write( payload );
          }
        }
      });

    return false;
  }

  static whoHasRelay( requestorIds, peerId ) {
    if ( peerManager.getPeer ( peerId ) ) return true;

    pSockets.forEach( ( peerSocket, peer ) => {
        if ( peer !== peerManager.getPeerId ) {
          if ( !requestorIds.includes(peer) ) {
            let payload = {
              "type"      : "whoHas",
              "content"   : {
                "requestorIds"  : requestorIds, // who has requested
                "peerId"        : peerId        // to be located
              }
            };

            payload = JSON.stringify( payload );
            peerSocket.write( payload );
          }
        }
      });

    return false;
  }  

  static generatePeerId ( key ) {
    return crypto.createHmac("sha256", key).digest("hex");
  }

  static getPeerEntry( id ) {
    return pSockets.get( id );
  }

  static getPeers () {
    return Array.from( pSockets.keys() );
  }

  static getPeer ( peerId ) {
    if ( pSockets.has( peerId ) ) {
      return true;
    }
    return false;
  }
}

module.exports = peerManager;
