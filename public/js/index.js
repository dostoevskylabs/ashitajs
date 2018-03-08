"use strict";
class Messages {
  constructor () {
    this.privateMessages = [];
    this.publicMessages  = [];
  }

  storePublicMessage ( messageObject ) {
    this.publicMessages.push(messageObject);
  }

  get getPublicMessages () {
    return this.publicMessages;
  }
}

class AshitaSocket extends WebSocket {
  constructor () {
    super("ws://" + location.host);
    this.addEventListener("open", this.onOpen);
    this.addEventListener("close", this.onClose);
    this.addEventListener("message", this.onMessage);
    this.addEventListener("error", this.onError);

    this.onReceiveMOTD = undefined;
    this.onPublicMessage = undefined;
    this.onPeerDiscovery = undefined;
    this.onSubscribeSuccessful = undefined;
    this.messages = new Messages();
  }

  send ( data ) {
    data = JSON.stringify( data );
    if ( this.readyState === this.OPEN ) {
      super.send( data );
    }
  }

  onOpen ( event ) {}

  onClose ( event ) {
    if ( event.code === 3001 ) {
      //console.log("disconnected");
    } else {
      //console.log("couldn't establish connection");
    }
  }

  onMessage ( event ) {
    let data = JSON.parse( event.data );
    if ( this.readyState === this.OPEN ) {
      switch ( data.type ) {
        case "MOTD":
          this.onReceiveMOTD( data.content );
          break;

        case "availablePeers":
          // known peers
          console.log(data.content);
          break;

        case "subscriptions":
          // your subscriptions
          console.log(data.content);
          break;

        case "subscribeSuccessful":
          // your sub was acknowledged
          this.onSubscribeSuccessful( data.content );
          break;

        case "subscribeFailed":
          // your sub failed
          console.log(data);
          break;          

        case "peerDiscovered":
          // a new peer discovered
          this.onPeerDiscovery( data.content );
          break;

        case "publicMessageSuccessful":
          // your public message was accepted
          this.onPublicMessage( data.content );
          break;

        case "publicMessageFailed":
          // your public message failed to send
          console.log( data.content );
          break;

        case "invalidEvent":
          // you sent an unknown event
          console.log("Unknown Event", data.content );
          break;

        default:
          // pass
      }
    }
  }

  onError ( event ) {}
}

class Ashita {
  constructor ( ui = undefined ) {
    this.ui = ui;
    this.ui.addTab({"tabId":"Dashboard","tabName":"Dashboard"});
    this.ui.addTab({"tabId":"ChannelList","tabName":"ChannelList"});
    this.state = "Dashboard";
    document.getElementById( this.state ).style = "background:#455A64;";
    this.node = new AshitaSocket();

    this.peers = new Map();
    this.subscribedTo = [];
    
    this.node.onReceiveMOTD = this.onReceiveMOTD.bind( this );
    this.node.onPublicMessage = this.onPublicMessage.bind( this );
    this.node.onPeerDiscovery = this.onPeerDiscovery.bind( this );
    this.node.onSubscribeSuccessful = this.onSubscribeSuccessful.bind( this );

    this.ui.onInput = this.onUiInput.bind( this );
    this.ui.changeTab = this.onUiChangeTab.bind( this );
  }

  onUiChangeTab ( peerId ) {
    if ( this.ui ) {
      // hack
      document.getElementById( this.state ).style = "background:#37474F;";
      this.state = peerId;
      document.getElementById( this.state ).style = "background:#455A64;";
      let output = document.getElementById("output");
      switch ( this.state ) {
        case "ChannelList":
          output.innerHTML = "";
          for ( let peer of this.peers ) {
            let channel = document.createElement("a");
            channel.setAttribute("style", "display:block;background-color:#37474F;magin:5px;padding:10px;");
            channel.setAttribute("id", peer[0] + "-ChannelList");
            channel.innerText = peer[1].channelName + " - " + peer[0];
            output.appendChild( channel );

            document.getElementById(peer[0] + "-ChannelList").addEventListener('click', () => {
              if ( this.subscribedTo.includes(peer[0]) ) {
                return false;
              }
              this.node.send({
                type     : "subscribe",
                content  : {
                  peerId   : peer[0]
                }
              });              

            });
          }
          break;

        default:
          // otherwise print out messages stored in the messages array ie: "Dashboard" messages, or channel messages, private messages
          output.innerHTML = "";
          for ( let i = 0; i < this.node.messages.getPublicMessages.length; i++ ) {
            let entry = {};
            if ( this.node.messages.getPublicMessages[i].peerId === this.state ) {
              for ( let key in this.node.messages.getPublicMessages[i] ) {
                entry[key] = this.node.messages.getPublicMessages[i][key];
              }
              this.ui.print( entry ); 
            }
          }
      }
    }
  }

  onUiInput ( data ) {
    // hack if dashboard or channel list, don't send input to the node
    // maybe storeSystemMessages()
    // store channelList cache
    // store private messages, etc
    if ( this.state === "Dashboard" || this.state === "ChannelList" ) {
      return false;
    }

    this.node.send({
      type     : "publicMessage",
      content  : {
        peerId   : this.state,
        username : data.username,
        message  : data.message,
      }
    });

    this.node.messages.storePublicMessage({
      timestamp: Date.now(),
      peerId   : this.state,
      username : data.username,
      message  : data.message
    });

    if ( this.ui ) {
      this.ui.print({
        "timestamp": Date.now(),
        "peerId"   : this.state,
        "username" : data.username,
        "message"  : data.message
      });
    }    
  }

  addPeer ( peerId ) {
    if ( this.peers.has( peerId ) ) {
      return false;
    }


    this.peers.set( peerId, {
      "channelName" : "default"
    });
    
    if ( this.ui ) {
      

      if ( this.state === undefined ) {
        this.state = peerId;
      }
    }

  }

  onReceiveMOTD ( data ) {
    this.node.messages.storePublicMessage({
      type     : "blank",
      peerId   : data.peerId,
      message  : data.MOTD
    });     

    if ( this.ui ) {
      if ( this.state === data.peerId ) {
        this.ui.print({
          type    : "blank",
          peerId  : data.peerId,
          message : data.MOTD
        });
      }
    }    
  }

  onSubscribeSuccessful ( data ) {
    this.addPeer( data.peerId );
    this.ui.addTab({
      tabId: data.peerId,
      tabName: "default"
    });
    this.onReceiveMOTD({peerId:data.peerId, MOTD:data.MOTD});
    this.subscribedTo.push(data.peerId);
    this.onUiChangeTab( data.peerId );
  }

  onPublicMessage ( data ) {
    this.node.messages.storePublicMessage({
      peerId   : data.peerId,
      timestamp: Date.now(),      
      username : data.username,
      message  : data.message
    });

    if ( this.ui ) {
      if ( this.state === data.peerId ) {
        this.ui.print({
          timestamp: Date.now(),
          username : data.username,
          message  : data.message
        });
      }
    }     
  }

  onPeerDiscovery ( data ) {
    if ( this.peers.has( data.peerId ) || this.state === data.peerId ) {
      return false;
    }

    this.addPeer( data.peerId );

    this.node.messages.storePublicMessage({
      type     : "notice",
      peerId   : "Dashboard",
      timestamp: Date.now(),
      message  : "New peer discovered: " + data.peerId
    });

    if ( this.ui ) {
      this.ui.print({
        type      : "notice",
        peerId    : data.peerId,
        timestamp : Date.now(),
        message   : "New peer discovered: " + data.peerId
      });
    }
  }
}

class UI {
  constructor () {
    this.input = document.getElementById("input");
    this.output = document.getElementById("output");
    this.menu = document.getElementById("menu");

    this.changeTab = undefined;
    this.onInput = undefined;

    this.input.addEventListener( "keydown", this.inputKeydown.bind( this ) );
  }

  tabClick ( event ) {
    this.changeTab( event.currentTarget.dataset.tabid );
  }

  addTab ( data ) {

    let elNode = UI.HTMLElement("div", {
      "class"       : "node",
      "id"          : data.tabId,
      "data-tabid" : data.tabId
    });

    let elIndicator = UI.HTMLElement("div", {
      "class" : "nodeIndicator"
    });

    let elTitle = UI.HTMLElement("div", {
      "class" : "nodeTitle"
    }, data.tabName);

    let elRight = UI.HTMLElement("div", {
      "class" : "nodeRight"
    });

    let elAddress = UI.HTMLElement("div", {
      "class" : "nodeAddress"
    }, `${data.tabId}`);

    elNode.addEventListener("click", this.tabClick.bind( this ), false);

    elNode.appendChild(elIndicator);
    elNode.appendChild(elTitle);
    elNode.appendChild(elRight);
    elNode.appendChild(elAddress);

    this.menu.appendChild( elNode );
  }

  static HTMLElement ( tag, props, innerText = null ) {
    let el = document.createElement( tag );
    for ( const [key, value] of Object.entries( props ) ) {
      el.setAttribute( key, value );
    }
    if ( innerText ) {
      el.innerText = innerText;
    }

    return el;
  }

  inputKeydown ( event ) {
    if ( event.key === "Enter" ) {
      const data = {
        "username" : "Anonymous",
        "message"  : event.target.value
      };
      event.target.value = "";
      this.onInput( data );
    }
  }

  createEntry ( data ) {
    let entry;

    const time = Intl.DateTimeFormat("en-US", {
      hour: "numeric", minute: "numeric", second: "numeric"
    }).format( data.timestamp );

    if ( data.hasOwnProperty("type") ) {
      switch ( data.type ) {
        case "blank":
          break;
        case "error":
          data.username = "\uf06a";
          break;
        case "notice":
          data.username = "\uf0f3";
          break;
        case "warning":
          data.username = "\uf071";
          break;
        case undefined:
          break;
        default:
          console.error(`Invalid Type "${data.type}"`);
      }
    }

    if ( data.type === "blank" ) {
      entry = `
      <div class="entry blank">
        <div class="msg">${data.message}</div>
      </div>`;
    } else {
      entry = `
      <div class="entry ${data.type ? data.type : ""}"">
        <time class="date" datetime="${data.timestamp}">${time}</time>
        <div class="user ${data.type ? "fa" : ""}">${data.username}</div>
        <div class="msg">${data.message}</div>
      </div>`;
    }

    return entry;
  }

  print ( data ) {
    if ( data ) {
      const newEntry = this.createEntry( data );
      if ( newEntry ) {
        this.output.insertAdjacentHTML("beforeend", newEntry);
        this.output.scrollTop = this.output.scrollHeight;
      }
    }
  }
}

let ui = new UI();
let ashita = new Ashita( ui );