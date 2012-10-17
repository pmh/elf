var elf = require("../../runtime/runtime"), Token;

Token = elf.Object.clone(function () {
  
  this.create = function (type, value) {
    return this.clone(function () {
      this.type  = type;
      this.value = value;
      this.line  = this.line;
      this.start = this.start;
      this.end   = this.end;
    });
  };

  this.error = function (msg) {
    this.type    = "error";
    this.arity   = "(error)";
    this.message = function () { return msg; };
    return this;
  };

  this.pos = function (pos) {
    this.start = pos.start;
    this.end   = pos.end;
    this.line  = pos.line;

    return this;
  };

  this.toString = function () {
    var value = typeof this.value === "string" ? ("'" + this.value + "'") : this.value;
    return "<Token { type: '" + this.type + "', value: " + value + ", start: " + (this.start + 1) + ", end: " + (this.end + 1) + ", line: " + this.line + " }>";
  };

  this.inspect = this.toString;

  this._type = "Token";
});

module.exports = Token;