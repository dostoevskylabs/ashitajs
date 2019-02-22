const nodeManager       = require("./middleware/peerManager");
//const mdns              = require('mdns');
const bonjour		= require('bonjour')();
const cli               = require("./lib/ui");

let broadcast = bonjour.publish({ name: `ashitajs-${require('shortid').generate()}`, type: 'http', port: nodeManager.getNodePort });
broadcast.on('up', function(){
  cli.Panel.debug("Broadcasting: ", nodeManager.getNodePort);
});

function discoverPeers( repeat ) {
    // watch all http servers
    try {
  	  let browser = bonjour.find({ type: 'http' }, (service) => {
        let nodeHost = service.referer.address;
        cli.Panel.debug(service);
        if ( !nodeHost ) return false; // no ipv4 discovered in the broadcast
        if ( nodeManager.getActivePeers.includes(`${nodeHost}:${service.port}`) ) return false; // if we already know this peer
        if ( nodeHost === '127.0.0.1' && service.port === nodeManager.getNodePort ) return false; // connecting to ourselves lol
        // if it matches ourself, we shouldn't connect, lol
        if ( nodeHost === nodeManager.getNodeHost && service.port === nodeManager.getNodePort ) {
          return false;
        } else {
          // in this case we are connecting, debug information logged
          cli.Panel.debug('Discovered node: ' + nodeHost + ':' + service.port);
          nodeManager.connectToPeer( nodeHost, service.port );
          this.stop();
        }     
      });
    } catch ( e ) {}
    setTimeout(function(){
      cli.screens["Log"].setLabel("Log"); // hack-o!
    }, 3000);
    return repeat(); // repeat-o!
}

(function repeat(){
  setTimeout(function(){
    cli.screens["Log"].setLabel("Searching for Peers..."); // hack-o!
    discoverPeers( repeat ); // discover peers infinitely with a recursive function derp x.x
  }, 10000);
})();
