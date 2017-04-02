/**
 * ashita/core/SYSCALL
 *
 * @package    ashita/core
 * @author     evolretsinis
 */
module.exports = {
  systemctl:function( socket, data ) {

  },
  peerctl:function( socket, data ) {

  },
  /**
   * mkdir
   */
  mkdir:function( socket, data ) {
    var payload = {
      "TYPE":"SYS.CMD.SUCCESS",
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
  },
  /**
   * auth
   */
  auth:function( socket, data ) {
    try {
      API.consoleCtl.printMessage("SYSTEM", "New Anonymous Connection", PEER.sessionid);
      var payload = {
        "TYPE":"SYS.CMD.SUCCESS",
        "STDOUT":data,
        "content":{
          "sid":PEER.sessionid
        }
      };
      payload = JSON.stringify( payload );
      socket.write( payload );
    } catch ( e ) {
      API.consoleCtl.printError( e );
    }
  }
};
