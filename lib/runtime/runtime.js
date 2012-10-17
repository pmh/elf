require("./core_ext");

module.exports = {
  Object  : require( "./object"  ),
  Evented : require( "./evented" ),

  helpers : {
    isArray: function (coll) {
      return Object.prototype.toString.call(coll).match(/Array/);
    }
  }
}