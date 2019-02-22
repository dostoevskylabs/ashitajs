var bonjour = require('bonjour')({interface: '192.168.1.5', port:5555, loopback:true})

// advertise an HTTP server on port 3000
var service = bonjour.publish({ name: 'My Web Serveraaa', type: 'http', port: 3000 });
service.on('up', function() {
	console.log('up');
});
browser = bonjour.find({ type:'http' });
browser.on('up', function(service){
	console.log(a, service);
});

