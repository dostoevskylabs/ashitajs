const cli     = require('./cli.js');
const crypto  = require('crypto');
const nodes   = new Map();
let gui       = undefined;
class nodeManager {
  static init ( guiInstance ) {
    gui = guiInstance; 
  }
  
  static addNode ( host, socket ) {   
    cli.screens["Peers"].addItem(host);
    let nodeId = this.generatePeerId(host);
    nodes.set( nodeId, socket );
    nodes.get( nodeId ).host = host;
    this.drawNodes();
    this.alertPeers( nodeId );
    gui.knownPeers.push( nodeId );
    gui.peerDiscovered( nodeId );
  }

  static peerObserver () {
    return {
      "get" : ( target, property, receiver ) => {
        let proxyGet = Reflect.get( target, property, receiver );
        if ( typeof proxyGet === "function" ) {
          proxyGet = proxyGet.bind( target );    
        }                                
        return proxyGet;
      },

      "set" : ( target, property, value, receiver ) => {
        return Reflect.set( target, property, value, receiver );
      }
    };
  }

  static alertPeers ( host ) {
    nodes.forEach(function(peerSocket, peer) {
      if ( peer !== host ) {
        peerSocket.write(JSON.stringify({"newNode":host}));
      }
    });
  }

  static generatePeerId ( peerId ) {
    return crypto.createHmac('sha1', peerId).digest('hex')
  }

  static getNodes () {
    return Array.from(nodes.keys());
  }

  static drawNodes () {
    let keys = [];
    this.getNodes().map( (key) => {
      keys.push(nodes.get(key).host);
    });
    for ( let i = 0; i < keys.length; i++ ) {
      if ( i === 0 ) {
        cli.ScreenManager.generateNode(keys[i], cli.screens["NodeList"], 0, 0, 0, 0, 25, 8);
      } else if ( cli.screens[keys[i-1]].left + cli.screens[keys[i-1]].width >= cli.screens["NodeList"].width - cli.screens[keys[i-1]].width ) {
        cli.ScreenManager.generateNode(keys[i], cli.screens["NodeList"], cli.screens[keys[i-1]].top + cli.screens[keys[0]].height, 0, 0, 0, 25, 8);    
      } else {
        cli.ScreenManager.generateNode(keys[i], cli.screens["NodeList"], cli.screens[keys[i-1]].top -1, cli.screens[keys[i-1]].left + cli.screens[keys[0]].width, 0, 0, 25, 8);          
      }
    }
  }

  static getNode ( host ) {
    if ( nodes.has( host ) ) {
      return true;
    }
    return false;
  }
}

module.exports = nodeManager;