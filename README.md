ashitajs - Distributed P2P Trash
================================
I don't even know what this is I'm just building it.

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
node server.js Wi-Fi
```
And our Client
```bash
node client.js 10.0.1.4
```
