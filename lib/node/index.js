"use strict";
const net             = require("net");
const fs              = require("fs");
const cli             = require('../ui');
const client          = require("../client");
const peerManager     = require("../../middleware/peerManager");
const messages        = require("../../middleware/messageHandler");
const router          = require("../../middleware/router");
const config          = require("../../config.js");
const manifest        = require("../manifest");

if ( !config.getConfigValue('maxConnections') ) config.setConfigValue('maxConnections', 0);
const max_conns       = config.getConfigValue('maxConnections');

class AshitaNode extends net.Server {
  constructor () {
    super();

    this.listen({
      port:peerManager.getPeerPort,
      host:peerManager.getPeerIp,
      exclusive:true
    }, () => cli.Panel.notice(`Node Listening @${peerManager.getPeerIp}:${peerManager.getPeerPort}`) );

    this.on("error", ( error ) => {
      /**
       * Note: this doesn't work on WSL due to the way it implements the linux layer.
       * essentially it doesn't follow RFC as it seems to route the actual sockets through the windows layer?
       * it's annoying but essentially it just means you have to define an available port in main.js otherwise it 
       * will 'listen' on a port already in use but no traffic will ever reach it. lol.
       */
      if ( error.code === "EADDRINUSE" ) {
        this.close();
        let port = peerManager.getPeerPort;
        port++;
        peerManager.setPeerPort( port );
        return new AshitaNode();
      }
    });

    this.on("connection", this.onConnection.bind( this ));
  }

  onConnection ( socket ) {
    this.socket     = socket;
    this.publicKey  = undefined;
    this.socket.on("data", this.onData.bind( this ));
    this.socket.on("error", this.onError.bind( this ));


    /**
     * todo: handling to send either connectionReceived || connectHereInstead (tentative title) for instances
     * when we dont want to take on anymore conns so we ask our peers who can fit the new connection then relay it
     */

    // request public key of client
    this.socket.write( JSON.stringify({
        "type":"connectionRecieved",
        "content":{}
    }));
  }

  onData ( data ) {
    data = this.safeParseJSON( data );
    const crypto = require("crypto");
    if ( !data.hasOwnProperty("type") ||
         !data.hasOwnProperty("content") ) {
      // missing basic structure
      return false;
    }

    if ( messages.hasMessage( data.messageId ) ) {
      peerManager.getPeerEntry( data.content.relayingPeerId ).write(JSON.stringify({
        "type": "alreadyRouted",
        "content": {
          "relayingPeerId": data.content.relayingPeerId,
          "messageId": data.messageId,
          "originatingPeerId": data.content.originatingPeerId
        }
      }));
      return false;
    } else {
      /*
        if ( data.messageId.exists ) {
          startTriage -> 
            myPeers = [a,b,c]
            if a,b,c respond they already have the message, tell client i have no need
            else, build route to peers that need it, but clearly discard it myself
        }
      */
      /**
        TODO: implement security controls to confirm a peer connection has been established properly before accepting commands
      */
      switch ( data.type ) {
        case "alreadyRouted":
          cli.Panel.debug(`added new rule to router: messages originating from ${data.content.originatingPeerId} will no longer route to ${data.content.relayingPeerId}.`);
          router.addRoute( data.content.originatingPeerId, data.content.relayingPeerId );
        break;

        // stage 1 get public key and send our own
        case "keyExchange":
          this.publicKey = data.content.publicKey;

          this.socket.write( JSON.stringify({
            "type" : "publicKey",
            "content" : {
              "publicKey" : peerManager.getPublicKey
            }
          }));
        break;

        // stage two, verify our identity by decrypting the message and sending it back encrypted with their public key
        case "validateIdentity":
          try {
            let message = crypto.privateDecrypt(peerManager.getPrivateKey, Buffer.from(data.content.message, 'utf-8'));
            let encrypted = crypto.publicEncrypt( this.publicKey, message );


            this.socket.write( JSON.stringify({
              "type": "validateIdentity",
              "content": {
                "message":  encrypted
              }
            }));
          } catch (e){}
        break;

        // stage three, established
        case "connectionEstablished":
            cli.Panel.notice(`${peerManager.generatePeerId(this.publicKey)} has joined your node.`);
            this.socket.write( JSON.stringify({
              "type" : "manifest",
              "content" : {
                "manifest" : manifest.getManifest
              }
            }));

            messages.sendPeerJoinMessage( peerManager.generatePeerId(this.publicKey), peerManager.getPeerId, peerManager.getPeerId);
            peerManager.connectToPeer( data.content.peerIp, data.content.peerPort );
        break;

        case "whoHasAnswer":
          let route = data.content.route   

          // dis answer when made back to original requestor
          if ( data.content.requestorIds.length === 1 ) {
            cli.Panel.debug(route);
          } else {
             data.content.requestorIds.pop();
             this.socket.write( JSON.stringify({
              "type" : "peerLocation",
              "content" : {
                "requestorIds": data.content.requestorIds,
                "peerId": data.content.peerId,
                "route" : route  // relay route
              }
            }));         
          }
        break;

        case "peerJoined":
          if ( data.content.newPeerId !== peerManager.getPeerId ) {
            if ( peerManager.getPeer( data.content.newPeerId) ) return false;
            cli.Panel.debug("New Peer joined the network: ", data.content.newPeerId);
          }

          if ( data.content.newPeerId === peerManager.getPeerId ) return false;
          messages.sendPeerJoinMessage( data.content.newPeerId, data.content.originatingPeerId, peerManager.getPeerId );
        break;

        case "whoHas":
          if ( peerManager.getPeer( data.content.peerId ) ) {
            // if this node has the peer, send to its client (last requestor)
            let route = [...data.content.requestorIds, peerManager.getPeerId];

            this.socket.write( JSON.stringify({
              "type" : "peerLocation",
              "content" : {
                "requestorIds": data.content.requestorIds,
                "peerId": data.content.peerId,
                "route" : route  // relay route
              }
            }));
          } else {
            // build chain of routes until it gets to the end
            let route = [...data.content.requestorIds, peerManager.getPeerId];

            // add ourself to requestor chain
            let newNodes = data.content.requestorIds;
            newNodes.push( peerManager.getPeerId );

            // relay to our peers
            peerManager.whoHasRelay ( newNodes, data.content.peerId, route );
          }
        break;

        case "disconnecting":
          // send dc event to nodes?
          // pass
          if ( peerManager.isDisconnected( data.content.peerId ) ) return true;
          cli.Panel.alert( `${data.content.peerId} disconnected` );
          messages.sendPeerDisconnectMessage( data.content.peerId, peerManager.getPeerId );
          peerManager.removePeer( data.content.peerId );
        break;

        case "privateMessage":
          {
            if ( messages.hasMessage( data.messageId ) ) return false; // message exists
            if ( data.content.destinationPeerId !== peerManager.getPeerId ) {
              messages.sendPrivateMessage(data.content.originatingPeerId, peerManager.getPeerId, data.content.destinationPeerId, data.content.username, data.content.message, data.messageId);
              return true;
            }
            let message = crypto.privateDecrypt(peerManager.getPrivateKey, Buffer.from(data.content.message, 'utf-8'));
            cli.Panel.privateMessageRecieved( data.content.originatingPeerId, data.content.username, message.toString() );
          };
        break;

        case "publicMessage":
          {
            /**
             * yo cool novel bro.
             *
             * Currently if you aren't bilaterally connected to a peer, you wont be able to read their messages
             * as you will not have their key in your manifest to get their public key which is stored as well
             * need to work out some better way to do this
             * distributed blockchain of public keys is necessary to the entire network, kind of annoying, it's basically a dht
             * which has the constraints of a dst
             *
             * but god i hate that word, can I just call it an immutable linked list?
             *
             * what else can we do?
             * how about, a message for the network is individually encoded with the node it's going to's public key prior to delivery
             * that way they can decode it with their own private key
             * a 1-1 link works in the opposite way so both peers can verify identity
             *
             * and lastly a private message that needs to filter thru the network will be done with the public key of the intended party
             * if the message is flagged as 'for' someone, no one will try to read it (reading it would crash anyway) until it gets to its destination
             * this solves dht in this instance -- oh wait thats what i just said
             * but how do peers discover one another? thru masscan internet scanning, and gossip
             * how does a peer join? it connects to a single peer, then that peer communicates with its neighbors to decide who the best peer within a cluster
             * to join is, that peer becomes the new peers leader
             * then a slow flood message to determine a new location is run to eventually migrate the peer appropriately into the network
             * every peer is aware of its surroundings and has a mini dht- for its local cluster
             * every peer leader has a mini dht of its own cluster with the addition of other peer leaders
             * peer leaders have an api of their own for certain information to be pushed/pulled from
             * 
             * todo: trust models, acls, ipv6?, massdns scanner, network automatic restructuring, local dht routing behavior, leader dht routing behavior, 
             * discovery mode (mdns, internet); derp whatelse. 
             *
             * middle-out links to nodes that aren't adjacent to yours, random selection of peeers within a cluster so no peer has more than a defined MAX_CONNS
             * defined in config, herp derp.
             * lol i called it middle out because of silicon valley.
             * its more like a weird hangman with multiple sets of arms and no legs?

              where o is a leader
                and x is a child node
                notice each node has the following neighboring clusters:
                a: c,b
                b: a,d
                c: a,d
                d: c,b

                and one children from each cluster has a direct link to a child of a non-neighboring cluster creating a neighborhood messenger
                this should expand outwards up to max_conns of each child peer, if the connection cannot be satiated it should just be discarded
                until the next automatic scan for this information
                this can allow flooding messages to be far more effecient as there will be many effecient routes to send information
                this routes need to be understand by the network
                and each cluster should have this routing information stored in its locla dht,
                peers can decide to forward messages directly down these routes instead of passing them to the leader if its deemed faster

                likewise, a node leader can choose to pass a message to a node it knows has a specific route

                how is pathfinding done? idk yet.
                flood messages and judge the quickest path based on hops
                define the quickest route based on where a packet is going
                flood messages should take the quickest route based on what they know to propoagate to the full network
                message types:
                  flood
                    - floods the message along established routes then counts the hops to get to the end and back to determine the lowest hop count
                    route detection
                  routed
                    - uses pre-determined routes to effectively deliver messages to their destination ( or entire network )
                    publicMessages
                    privateMessages
                    newPeerJoin
                    peerLeaves
                leaderRoutes : {
                  'my-children' :'aaaa',
                  'neighbor-peer': a
                  'neighbor-peer': c

                }
              
                routes : {
                  'leader' : 'leader-address', // my leader
                  'abcd' : 'route-to-get-to',
                  'efgh' : 'route-to-get-to',


                }

                _______________________
              .x           x.  b       |
          a  `x_\         /_x`-----|   |
                  o-------o        |   |
                  |       |        |   |
                  o-------o        |   |
                 /|       |\       |   |
            c   x-x       x-x----------|
                  |         d      |
                  |________________|

             *
            **/
            if ( messages.hasMessage( data.messageId ) ) return false;
            let message = crypto.publicDecrypt(manifest.getPublicKeyOfPeer( data.content.relayingPeerId ), Buffer.from(data.content.message, 'utf-8'));
            cli.Panel.publicMessage( data.content.originatingPeerId, data.content.username, message.toString() );

            cli.Panel.debug('2');
            messages.sendPublicMessage( data.content.originatingPeerId, peerManager.getPeerId, data.content.username, message.toString(), data.messageId );
          };
        break;
        
        default:
          // pass
      }   
    }

  }

  onError ( error ) {
    // pass
  }

  safeParseJSON ( data ) {
    try {
      let obj = JSON.parse( data );
      if ( obj && typeof obj === "object" ) {
        return obj;
      }
    } catch ( error ) {}
    return {};
  }  
}

module.exports = AshitaNode;
