var Token = require("./token"), ErrorToken;

ErrorToken = Token.clone(function () {

  this.create = function (value) {
    return this.clone(function () {
      this.type    = "(error)";
      this.arity   = "(error)";
      this.value   = value;
      this.message = this.message
      this.lbp     = 100;
    });
  };

  this.message = function () {
    return "Unknown token: '" + this.value + "'";
  };

  this._type = "ErrorToken";
});

module.exports = ErrorToken
