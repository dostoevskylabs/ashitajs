const cli = require('./cli.js');

const nodes = new Map();
class nodeManager {
  static addNode ( host, socket ) {   
    cli.screens["Peers"].addItem(host);
    nodes.set( host, socket );
    this.drawNodes();
    this.alertPeers( host );
  }

  static alertPeers ( host ) {
    nodes.forEach(function(peerSocket, peer) {
      if ( peer !== host ) {
        peerSocket.write(JSON.stringify({"newNode":host}));
      }
    });
  }

  static drawNodes () {
    let keys = Array.from(nodes.keys());
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