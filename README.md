ashitajs - decentralized P2P C&C Center
================================
ashitajs has shifted focus, will do a writeup later

Next we need to install our modules from the main directory with server.js
```bash
npm install
```
Now we only need to add our internal IP to the rudimentary ACL in server.js
```javascript
API.aclCtl.addEntry("10.0.1.4");
```
Now we are ready to start our server
```bash
npm start Wi-Fi
```
And our Client
```bash
npm test
```
