var elf = require("../../runtime/runtime"), Rule;

Rule = elf.Object.clone(function () {
  
  this.create = function (name, regex, action, arity) {
    if (typeof action === "string") {
      arity = action;
      action = null;
    }
    return this.clone(function () {
      this.name   = name;
      this.regex  = regex.source ? new RegExp("^(" + (regex.source) + ")") : regex;
      this.action = action;
      this.arity  = arity;
    });
  };

  this.match = function (source) {
    var match;
    if (typeof this.regex === "string") {
     match = true;
     for (var i = 0; i < this.regex.length; i++)
       if (source[i] !== this.regex[i]) match = false;
     return match ? source.substring(0, this.regex.length) : '';
    }

    match = source.match(this.regex)//.shift() : '';
    return match ? match.shift() : '';
  };

  this.toString = function () {
    return "<Rule { name: '" + this.name + "', regex: " + this.regex + " }>"
  };
});

module.exports = Rule;