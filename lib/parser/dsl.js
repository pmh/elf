var elf = require ( "../runtime/runtime" )
  , fun = require ( "funargs"            )
  ;

var ParserDSL = elf.Object.clone({
  stmt: function (ids, std) {
    var args = fun(arguments)
      , ids  = args.strings()
      , std  = args.functions()[0]
      ;

    ids.forEach(function (id) {
      this.symbol(id).std = function (token) {
        token.arity = "(statement)";
        return (std || function (token) {
          token.first = this.expression();
          return token;
        }).call(this, token);
      }
    }, this);
  },

  prefix: function (id, nud) {
    var args = fun(arguments)
      , ids  = args.strings()
      , nud  = args.functions()[0]
      ;

    ids.forEach(function (id) {
      this.symbol(id).nud = function (token) {
        token.arity = "(unary)";
        return (nud || function (token) {
          token.first = this.expression(70);
          return token;
        }).call(this, token);
      };
    }, this);
  },

  infix: function (ids, bp, led) {
    var args = fun(arguments)
      , ids  = args.strings()
      , bp   = args.numbers()[0]
      , led  = args.functions()[0]
      ;

    ids.forEach(function (id) {
      this.symbol(id, bp).led = function (token, left) {
        token.arity = "(binary)";
        return (led || function (token, left) {
          token.first  = left;
          token.second = this.expression(bp);
          return token;
        }).call(this, token, left);
      }
    }, this);
  },

  infixr: function (ids, bp, led) {
    var args = fun(arguments)
      , ids  = args.strings()
      , bp   = args.numbers()[0]
      , led  = args.functions()[0]
      ;

    ids.forEach(function (id) {
      this.symbol(id, bp).led = function (token, left) {
        token.arity = "(binary)";
        return (led || function (token, left) {
          token.first  = left;
          token.second = this.expression(bp - 1);
          return token;
        }).call(this, token, left);
      };
    }, this);
  },

  constant: function (id, value) {
    var sym = this.symbol(id);
    sym.nud = function (token) {
      token.type  = "(constant)";
      token.arity = "(literal)";
      return token;
    }
    sym.value = value;
  }
});

module.exports = ParserDSL;
