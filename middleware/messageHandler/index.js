const peerManager = require('../peerManager');
let messages = [];
let queue = [];

class Messages {

  static addToQueue ( messageObject ) {
    messages.push('FakeMessageId');
    queue.push({ messageId : 'FakeMessageId', ...messageObject });
  }

  static hasMessage( messageId ) {
    if ( messages.includes( messageId ) ) return true;
    return false;
  }

  static sendMessage ( messageObject ) {
    switch ( messageObject['type'] ) {
      case 'peerJoined':
      case 'publicMessage':
      case 'disconnecting':
        Messages.sendNetworkMessage( messageObject );
      break;

      case 'privateMessage':
        Messages.sendDirectMessage( messageObject );
      break;

      default:
        // unknown type
    }
  }

  static sendPeerJoinMessage ( peerId, originatingPeerId ) {
    Messages.addToQueue({
      "type": "peerJoined",
      "content": {
        "originatingPeerId": originatingPeerId,
        "relayingPeerId": peerManager.getPeerId,
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
        "relayingPeerId": peerManager.getPeerId,
        "peerId": peerId
      }
    });

    Messages.sendQueue();
  }

  static sendPeerRejoinMessage () {}

  static sendPeerHeartbeatMessage () {}

  static sendFindRouteToPeerMessage () {}
  static sendFoundRouteToPeerMessage () {}

  static sendAlreadyRecievedMessage () {}


  // network wide
  static sendNetworkMessage ( messageObject ) {
    peerManager.getPeerSockets().forEach( ( peerSocket, peerId ) => {
        // don't send it back to the peer who sent it to us
        // or the peer who created the message
        if ( messageObject['content']['originatingPeerId'] === peerId ) return false;
        if ( messageObject['content']['relayingPeerId'] === peerId ) return false;
        if ( peerId === peerManager.getPeerId ) return false;

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