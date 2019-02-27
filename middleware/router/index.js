let routes = {};

class Router {
  static addRoute ( originatingPeerId, peerId ) {
    if ( !routes[originatingPeerId] ) routes[originatingPeerId] = [];
    routes[originatingPeerId].push( peerId );
  }
  
  static getRoute ( originatingPeerId ) {
    return routes[originatingPeerId];  
  }
  
  static removeRoute () {
    // todo
  }

}

module.exports = Router;
