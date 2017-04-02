/**
 * ashita/core/SYSCALL
 *
 * @package    ashita/core
 * @author     evolretsinis
 */
module.exports = {
  echo:function( socket, data ) {
    var payload = {
      "TYPE":"SYS.ECHO",
      "COMMAND":"echo",
      "STDOUT":data.join(" ")
    };
    payload = JSON.stringify( payload );
    socket.write( payload );
  },
  systemctl:function( socket, data ) {

  },
  peerctl:function( socket, data ) {

  },
  aclctl:function( socket, data ) {
    switch ( data[0] ) {
      case "-a":
        var payload = {
          "TYPE":"SYS.CMD.SUCCESS",
          "COMMAND":"aclctl",
          "STDOUT":"add rule"
        };
        payload = JSON.stringify( payload );
        socket.write( payload );
      break;
      case "-d":
        var payload = {
          "TYPE":"SYS.CMD.SUCCESS",
          "COMMAND":"aclctl",
          "STDOUT":"delete rule"
        };
        payload = JSON.stringify( payload );
        socket.write( payload );
      break;
      case "-l":
        var payload = {
          "TYPE":"SYS.CMD.SUCCESS",
          "COMMAND":"aclctl",
          "STDOUT":"list acl"
        };
        payload = JSON.stringify( payload );
        socket.write( payload );
      break;
      default:
        var payload = {
          "TYPE":"SYS.CMD.FAIL",
          "COMMAND":"aclctl",
          "STDOUT":"invalid usage"
        };
        payload = JSON.stringify( payload );
        socket.write( payload );
    }
  },
  /**
   * mkdir
   */
  mkdir:function( socket, data ) {
    var payload = {
      "TYPE":"SYS.CMD.SUCCESS",
      "COMMAND":"mkdir",
      "STDOUT":data
    };
    payload = JSON.stringify( payload );
    socket.write( payload );
  },
  /**
   * ls
   */
  ls:function( socket, data ) {
    var payload = {
      "TYPE":"SYS.CMD.SUCCESS",
      "COMMAND":"ls",
      "STDOUT":data
    };
    payload = JSON.stringify( payload );
    socket.write( payload );
  },
  /**
   * cd
   */
  cd:function( socket, data ) {
    var payload = {
      "TYPE":"SYS.CMD.SUCCESS",
      "COMMAND":"cd",
      "STDOUT":data
    };
    payload = JSON.stringify( payload );
    socket.write( payload );
  },
  /**
   * rm
   */
  rm:function( socket, data ) {
    var payload = {
      "TYPE":"SYS.CMD.SUCCESS",
      "COMMAND":"rm",
      "STDOUT":data
    };
    payload = JSON.stringify( payload );
    socket.write( payload );
  },
  /**
   * exit
   */
  exit:function( socket, data ) {
    socket.close();
  }
};
