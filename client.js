/**
 * ashita/core
 *
 * @package    ashita/client
 * @author     evolretsinis
 */
var ipaddr=require('ipaddr.js');
var assert=require('assert');
var args=process.argv.slice(2);
var nodeIp=args[0];
try {
  /**
   * Check if argument is in IPv4 Format by counting the
   * number of parts and making sure they are 4, otherwise
   * let client know
   */
  assert(ipaddr.parse( nodeIp ).octets.length === 4, true);
} catch ( e ) {
  console.log("example usage: npm test 10.0.1.4");
  process.exit();
}
var net=require('net');
var readline=require('readline');
/**
 * Setup our readline interface for intepreting commands
 */
var STDIN=readline.createInterface({
  input:process.stdin,
  output:process.stdout,
  prompt:"[anon@localhost] "
});
try {
  /**
   * Start a new connection to our server
   */
  var client = new net.createConnection(8000, nodeIp);
  client.on('data', function( data ) {
    var data = JSON.parse( data );
    /**
     * Setup our signal for retreiving responses
     */
    switch(data.TYPE){
      /**
       * SYS.MOTD
       */
      case "SYS.MOTD":
        console.log(data.STDOUT);
      break;
      /**
       * SYS.CMD.SUCCESS
       */
      case "SYS.CMD.SUCCESS":
        console.log("executing: " + data.STDOUT);
      break;
      /**
       * SYS.CMD.UNKNOWN
       */
      case "SYS.CMD.UNKNOWN":
        console.log(data.STDOUT + ": unknown command");
      break;
    }
    STDIN.prompt();
  });
  /**
   * Setup event listener to read lines from terminal input
   */
  STDIN.on('line', function( STDIN ) {
    /**
     * Pass the COMMAND as a string and the ARGUMENTS as an array
     */
    if ( STDIN !== "" ) {
      var STDIN = STDIN.split(" ");
      var COMMAND = STDIN[0];
      var ARGUMENTS = STDIN.slice(1);
      var payload = {
        "COMMAND":COMMAND,
        "ARGUMENTS":ARGUMENTS
      }
      var payload = JSON.stringify( payload );
      /**
       * Send our data to the server
       */
      client.write(payload, function() {
        // do stuff
      });
    }
  });
} catch ( e ){}
