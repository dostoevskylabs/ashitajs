const peerManager = require('../peerManager');
const crypto      = require('crypto');
const cli         = require('../../lib/ui');
const manifest    = require('../../lib/manifest');
const router      = require('../router');
let messages = [];
let queue = [];

class Messages {

  static addToQueue ( messageObject ) {
    let messageId = messageObject['messageId'];
    
    if ( !messageId ) messageId = crypto.createHmac("sha256", peerManager.getPeerId + Date.now() ).digest("hex");
    
    if ( messages.includes( messageId ) ) return false;
    messageObject['messageId'] = messageId;
    if ( messages.length > 1000 ) messages.shift();
    messages.push( messageObject['messageId']);
    queue.push( messageObject );
  }

  static hasMessage( messageId ) {
    if ( messages.includes( messageId ) ) return true;
    return false;
  }

  static get getMessages () {
    return messages;
  }

  static sendMessage ( messageObject ) {
    switch ( messageObject['type'] ) {
      case 'peerJoined':
      case 'publicMessage':
      case 'disconnecting':
      case 'privateMessage':
        Messages.sendNetworkMessage( messageObject );
      break;

      default:
        // unknown type
    }
  }

  static sendPeerJoinMessage ( peerId, originatingPeerId, relayingPeerId ) {
    Messages.addToQueue({
      "type": "peerJoined",
      "content": {
        "originatingPeerId": originatingPeerId,
        "relayingPeerId": relayingPeerId,
        "newPeerId": peerId
      }
    });

    Messages.sendQueue();
  }

  static sendPeerDisconnectMessage ( peerId ) {
    //if ( peerId === peerManager.getPeerId ) return false;

    Messages.addToQueue({
      "type": "disconnecting",
      "content": {
        "originatingPeerId": peerId,
        "relayingPeerId": peerId,
        "peerId": peerId
      }
    });

    Messages.sendQueue();
  }

  static sendPeerRejoinMessage () {}

  static sendPeerHeartbeatMessage () {}

  static sendPublicMessage ( originatingPeerId, relayingPeerId, username, message, messageId = null ) {
    let encrypted = crypto.privateEncrypt( peerManager.getPrivateKey, Buffer.from( message, 'utf-8') );

    Messages.addToQueue({
      "messageId": messageId,
      "type": "publicMessage",
      "content": {
        "originatingPeerId": originatingPeerId,
        "relayingPeerId": relayingPeerId,
        "username": username,
        "message": encrypted
      }
    });

    Messages.sendQueue();  
  }

  static sendPrivateMessage ( originatingPeerId, relayingPeerId, destinationPeerId, username, message, messageId = null ) {
    const crypto  = require('crypto');
    let encrypted = message;

    if ( originatingPeerId === relayingPeerId ) encrypted = crypto.publicEncrypt( manifest.getPublicKeyOfPeer( destinationPeerId ), Buffer.from( message, 'utf-8') );

    Messages.addToQueue({
      "messageId": messageId,
      "type"    : "privateMessage",
      "content" : {
        "originatingPeerId": originatingPeerId,
        "relayingPeerId": relayingPeerId,
        "destinationPeerId": destinationPeerId,
        "username" : username,
        "message"  : encrypted
      }
    });
    
    Messages.sendQueue();     
  }

  static sendFindRouteToPeerMessage () {}
  static sendFoundRouteToPeerMessage () {}

  static sendAlreadyRecievedMessage () {}


  // network wide
  static sendNetworkMessage ( messageObject ) {
    peerManager.getPeerSockets().forEach( ( peerSocket, peerId ) => {
        // don't send it back to the peer who sent it to us
        // or the peer who created the message
        if ( router.isBlocked( messageObject['content']['originatingPeerId'], peerId ) ) return false;
        if ( messageObject['content']['originatingPeerId'] === peerId ) return false;
        if ( messageObject['content']['relayingPeerId'] === peerId ) return false;
        if ( peerId === peerManager.getPeerId ) return false;
        cli.Panel.debug('sending to ', peerId);
        // send it to everyone else
        const messagePayload = JSON.stringify( messageObject );
        peerSocket.write( messagePayload );
    });
  }

  // single peer
  static sendDirectMessage ( messageObject ) {
    let recepientId = messageObject['content']['recepientId'];

    if ( peerManager.getPeer( recepientId ) ) {
      peerManager.getPeerEntry( recepientId ).write( JSON.stringify( messageObject ) );
    } else {
      for ( let peer in peerManager.getPeers() ) {
        if ( peer.peerId === peerManager.getPeerId ) return false;

        peer.write( JSON.stringify( messageObject ) );
      }
    }
  }

  static clearQueue () {
    queue = [];
  }

  static sendQueue () {
    while ( queue.length > 0 ) {
      const messageObject = queue.shift();
      Messages.sendMessage( messageObject );
    }
  }
}

module.exports = Messages;
