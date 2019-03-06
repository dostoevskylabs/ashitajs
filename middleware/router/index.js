let routes = {};

class Router {
  static addRoute ( originatingPeerId, peerId ) {
    if ( !routes[originatingPeerId] ) routes[originatingPeerId] = [];
    routes[originatingPeerId].push( peerId );
  }
  
  static get getRoutes () {
    return routes;
  }

  static getRoute ( originatingPeerId ) {
    return routes[originatingPeerId];  
  }
  
  static isBlocked ( originatingPeerId, peerId ) {
   if ( routes[originatingPeerId] ) {
     if ( routes[originatingPeerId].includes( peerId ) ) {
      return true; 
     }
   }
   return false;
  }
  
  static removeRoute () {
    // todo
  }

}

module.exports = Router;
