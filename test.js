class clientAPI {
  constructor ( nodes, ownerId, nodeId, socket, data ) {
    this.nodes = nodes;
    this.ownerId = ownerId;
    this.nodeId = nodeId;
    this.socket = socket;
    this.data = JSON.parse( data );

    this.clientRequest = this.data.hasOwnProperty("handshake") ? "handshake" : this.data.type;
    
    this.handleClientRequest( this.clientRequest );
  }

  isOwner () {
    if ( this.ownerId === this.nodeId ) {
      return true;
    }
    return false;
  }

  addNode () {
    this.nodes[this.nodeId] = {
      "username" : "Anonymous",
      "socket"   : this.socket
    };
  }

  handleClientRequest ( request ) {
    switch ( request ) {
      case "handshake":
        this.handshake();
        break;

      case "publicMessage":
        this.publicMessage();
        break;

      default:
        console.log("unhandled");
    }
  }

  sendClientEvent ( event, data ) {
    let payload = {
      "type"    : undefined,
      "content" : {}
    };
    
    payload.type    = event;
    payload.content = data;
    
    if ( payload.type !== undefined ) {
      this.socket.send( JSON.stringify( payload ) );
    }
  }

  sendNodeEvent ( event, data ) {
    if ( Object.keys( this.nodes ).length === 0 ) return false;

    let payload = {
      "type"    : event,
      "content" : data
    };

    for ( let peerId in this.nodes ) {
      if ( peerId !== this.nodeId ) {
        this.nodes[peerId].socket.send( JSON.stringify( payload );
      }
    }
  }

  handshake () {
    this.nodeId = btoa(this.data["handshake"]);
    this.addNode();
    if ( this.isOwner ) {
      this.sendClientEvent("nodeOwnerConnected");
    } else {
      this.sendClientEvent("nodeConnected");
    }

    // send this client all known peers
    for ( peerId in this.nodes ) {
      if ( peerId !== this.nodeId ) {
        this.sendClientEvent("nodeDiscovered", {
          "nodeId" : peerId
        });
      }
    }

    // send other nodes this new peer
    this.sendNodeEvent("nodeDiscovered", {
      "nodeId" : this.nodeId
    });

    
    fs.readFile("./etc/issue", "utf8", ( error, data ) => {
      this.sendClientEvent("MOTD", {
        "MOTD" : data.toString()
      });
    });
    this.sendClientEvent("handshakeEstablished"); 
  }

  publicMessage () {
    this.sendNodeEvent("publicMessage", {
      username : this.data.content.username,
      message : this.data.content.message
    });
  }

}