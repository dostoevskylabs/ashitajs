// import the module
var mdns = require('mdns');
 
// advertise a http server on port 4321
var ad = mdns.createAdvertisement(mdns.tcp('ashitajs'), nodeManager.getNodePort);
ad.start();
 
// watch all http servers
var browser = mdns.createBrowser(mdns.tcp('ashitajs'));
browser.on('serviceUp', function(service) {
    //service.addresses[1]
    //service.port
  console.log("service up: ", service);
});
browser.on('serviceDown', function(service) {
  console.log("service down: ", service);
});
browser.start();
 
// discover all available service types
//var all_the_types = mdns.browseThemAll(); // all_the_types is just another
