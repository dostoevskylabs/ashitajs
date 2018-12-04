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
        if ( nodeManager.getPeers.includes(`${service.addresses[1]}:${service.port}`) ) return false;
        if ( service.addresses[1] === nodeManager.getNodeHost && service.port === nodeManager.getNodePort ) {
          return false;
        } else {
          nodeManager.connectToNode( service.addresses[1], service.port );
        }

        
    } catch ( e ) {}
  });
  browser.on('serviceDown', function(service) {
    try {
      //nodeManager.removeNode( nodeManager.generatePeerId(`${service.addresses[1]}:${service.port}`) );
    } catch ( e ) {}
  });
  browser.start();

  setTimeout(function(){
    cli.screens["Log"].setLabel("Log");
  }, 3000);
  return repeat();
}

(function repeat(){
  setTimeout(function(){
    cli.screens["Log"].setLabel("Searching for Peers...");
    discoverPeers( repeat );
  }, 10000);
})();