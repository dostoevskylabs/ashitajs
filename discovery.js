const nodeManager       = require("./middleware/peerManager");
let mdns;
let bonjour;
const cli               = require("./lib/ui");
let v1 = false;

if ( process.platform === 'darwin' ) v1 = true;

if ( v1 ) {
  mdns              = require('mdns');
  mdns.createAdvertisement(mdns.tcp('ashitajs'), nodeManager.getNodePort, {networkInterface: nodeManager.getNodeHost}).start();
} else {
  bonjour           = require('bonjour')({interface: nodeManager.getNodeHost});
  let broadcast = bonjour.publish({ name: `hostname`, type: 'ashitajs', port: nodeManager.getNodePort });
  broadcast.on('up', function(){
    cli.Panel.debug("Broadcasting: ", nodeManager.getNodePort);
  });  
}

function parseService ( service ) {
      let nodeHost = null;
      if ( v1 ) {
          nodeHost = (function getIPv4 ( ind ){
            if ( service.addresses[ind].includes(':') ) return getIPv4( ind + 1 );
            return service.addresses[ind]; 
          })( 0 );
      } else {
          nodeHost = service.referer.address;
      }
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
      }
}

function discoverPeers( repeat ) {
    // watch all http servers
    let browser;
    try {
      
      if ( v1 ) {
        browser = mdns.createBrowser(mdns.tcp('ashitajs'));
        browser.on('serviceUp', function(service) {
          parseService( service );
        });
      } else {
        browser = bonjour.find({ type: 'ashitajs' }, (service) => {
          parseService( service );
        });
      }
    
    // 

    } catch ( e ) {}
    setTimeout(function(){
      cli.screens["Log"].setLabel("Log"); // hack-o!
    }, 3000);
    browser.start();
    return repeat(); // repeat-o!
}

(function repeat(){
  setTimeout(function(){
    cli.screens["Log"].setLabel("Searching for Peers..."); // hack-o!
    discoverPeers( repeat ); // discover peers infinitely with a recursive function derp x.x
  }, 10000);
})();
