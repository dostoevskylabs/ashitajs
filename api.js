/**
 * ashita/core/API
 *
 * @package    ashita/core
 * @author     evolretsinis
 */
var moment = require('moment');
var crypto = require('crypto');
module.exports = {
  printMessage:function printMessage( type, src, msg ) {
    var timestamp = moment().format("HH:mm:ss");
    console.log("("+ timestamp +") [" + type + "] " + src + ": " + msg );
  },
  printError:function printError( str ) {
    console.log(str);
  }
};
