/**
 * ashita/core
 *
 * @package    ashita/core
 * @author     evolretsinis
 */
var net=require('net');
var readline=require('readline');
var rl=readline.createInterface({
  input:process.stdin,
  output:process.stdout,
  prompt:"[anon@localhost] "
});
var client = new net.createConnection(8000, "10.0.1.4");
client.on('data', function(data){
  var data = JSON.parse(data);
  console.log(data);
  rl.prompt();
});
rl.on('line', (data) => {
  if(data !== ""){
    var data = {
      "SIGNAL":data,
      "PAYLOAD":"test"
    }
    var data = JSON.stringify(data);
    client.write(data, function(){
      // do stuff
    });
  }
});
