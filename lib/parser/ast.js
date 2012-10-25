var elf         = require ( "../runtime/runtime" );

var AST = elf.Object.clone(function () {
  this.ErrorWalker = require ( "../utils/error_walker" );
  this.SexpWalker  = require ( "../utils/sexp_walker" );

  this.create = function (nodes) {
    return this.clone({ nodes: nodes })
  };

  this.errors = function (source) {
    return this.ErrorWalker.walk(this, source);
  };

  this.toSexp = function () {
    var sexp = this.SexpWalker.walk(this);
    return sexp.join('\n');
  };
});

module.exports = AST;