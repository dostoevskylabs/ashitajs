/**
 * ashita/core
 *
 * @package    ashita/core
 * @author     evolretsinis
 */
 var ipaddr=require('ipaddr.js');//1.3.0
 var assert=require('assert');
 try {
   var args=process.argv.slice(2);
   var nodeIp=args[0];
   assert(ipaddr.parse(nodeIp), true);
 } catch (e){
   console.log("example usage: npm test 10.0.1.4");
   process.exit();
 }
var net=require('net');
var readline=require('readline');
var rl=readline.createInterface({
  input:process.stdin,
  output:process.stdout,
  prompt:"[anon@localhost] "
});
try {
  var client = new net.createConnection(8000, nodeIp);
  client.on('data', function(data){
    var data = JSON.parse(data);
    console.log(data);
    rl.prompt();
  });
  rl.on('line', function(cmd){
    if(cmd !== ""){
      var data = {
        "COMMAND":cmd,
        "ARGUMENTS":"test"
      }
      var data = JSON.stringify(data);
      client.write(data, function(){
        // do stuff
      });
    }
  });
} catch (e){
  console.log("CONNECTION.REFUSED");
}
