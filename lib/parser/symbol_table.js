var elf = require ( "../runtime/runtime" );

var SymbolTable = elf.Object.clone(function () {

  this.init = function () {
    this.symbols = elf.Object.clone();
  };

  this.get = function (token) {
    var sym = this.symbols[token.arity] || this.symbols[token.value] || this.symbols["(error)"];
    return token.extend(sym);
  };

  this.set = function (id, bp) {
    bp = bp || 0;
    var sym = this.symbols[id];
    if (sym) {
      if (bp >= sym.lbp) sym.lbp = bp;
      return sym;
    }

    return this.symbols[id] = elf.Object.clone(function () {
      this.id  = id;
      this.lbp = bp;
      this.nud = function (token) {
        token.id      = "(error)";
        token.first   = this.expression();
        token.message = token.message || function () { return "Unexpected token '" + this.value + "' line " + this.line + ", column [" + this.start + ", " + (this.end) + "]"; };
        token.arity   = "unary";
        return token;
      };

      this.led = function (parser, left) {
        token.id      = "(error)";
        token.first   = left;
        token.second  = this.expression();
        token.message = token.message || function () { return "Unexpected token '" + this.value + "' line " + this.line + ", column [" + this.start + ", " + (this.end) + "]"; };
        token.arity   = "binary";
        return token;
      };
    });
  };

  this.cloned = function (clonee) {
    if (this.symbols)
      clonee.symbols.extend(this.symbols)
  }
});

module.exports = SymbolTable;