var _Object = require("./object");

var Evented = _Object.clone(function () {
  this.extended = function (extendee) {
    extendee.handlers = {};
  };

  this.on = function (event, action) {
    if (!this.handlers[event])
      this.handlers[event] = [];

    this.handlers[event].push(action);
  };

  this.trigger = function (event) {
    var args = Array.prototype.slice.call(arguments, 1);
    var self = this;

    if (this.handlers[event])
      this.handlers[event].reverse().forEach(function (action) {
        action.apply(self, args);
      });
  };
});

module.exports = Evented;