var runtime = require( "./runtime/runtime" );
var Lexer   = require( "./lexer/lexer"     );
var Parser  = require( "./parser/parser"   );

var elf = runtime.Object.clone(function () {
  this.extend(runtime);

  this.Lexer  = Lexer;
  this.Parser = Parser;

  this.sexp = function (ast) {
    var str;
    if (ast.first) {
      str = "(" + ((ast.id === "(error)") ? ("<SyntaxError " + ast.message() + "> ") : (ast.value + " ")) + this.sexp(ast.first);
      if (ast.second) str  += " " + this.sexp(ast.second);
      if (ast.third)  str  += " " + this.sexp(ast.third);
      str += ")";
    } else if (ast.map) {
      var self = this;
      str = "[" + ast.map(function (node) { return self.sexp(node) }).join(", ") + "]"
    } else if (ast.id === "(error)") {

    } else {
      if (ast.id === "(error)")
        str = "<SyntaxError - " + ast.message() + ">";
      else
        str = ast.value;
    }

    return str;
  };
});

module.exports = elf;