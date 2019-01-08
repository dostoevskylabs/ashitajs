const nodeManager       = require("./middleware/peerManager");
const cli               = require("./lib/ui");

function discoverPeers( repeat ) {
  var mdns = require('mdns');
  var ad = mdns.createAdvertisement(mdns.tcp('ashitajs'), nodeManager.getNodePort);
  ad.start();
   
  // watch all http servers
  var browser = mdns.createBrowser(mdns.tcp('ashitajs'));
  browser.on('serviceUp', function(service) {
    try {
        /**
         * This is done to grab the IPv4 address from mdns information
         * different platforms and systems store it in different indexes
         * so we recurively go through them looking for an IPv4 address to use.
         * furthermore we could restrict this to ip ranges we want to interact with
         */
        let nodeHost = (function getIPv4 ( ind ){
          if ( service.addresses[ind].includes(':') ) return getIPv4( ind + 1 );
          return service.addresses[ind];
        })( 0 );

        if ( !nodeHost ) return false; // no ipv4 discovered in the broadcast
        if ( nodeManager.getActivePeers.includes(`${nodeHost}:${service.port}`) ) return false; // if we already know this peer
        if ( nodeHost === '127.0.0.1' && service.port === nodeManager.getNodePort ) return false; // connecting to ourselves lol
        // if it matches ourself, we shouldn't connect, lol
        if ( nodeHost === nodeManager.getNodeHost && service.port === nodeManager.getNodePort ) {

          return false;
        } else {

          // in this case we are connecting, debug information logged:
          cli.Panel.debug('Discovered node: ' + nodeHost + ':' + service.port);
          nodeManager.connectToPeer( nodeHost, service.port );
        }
    } catch ( e ) {
      cli.Panel.debug(e);
    }
  });

  browser.on('serviceDown', function(service) {
    // we aren't handling this yet
    try {
      //nodeManager.removeNode( nodeManager.generatePeerId(`${service.addresses[1]}:${service.port}`) );
    } catch ( e ) {}
  });
  browser.start(); // start-o!

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
