var runtime = require( "./runtime/runtime" );
var Lexer   = require( "./lexer/lexer"     );
var Parser  = require( "./parser/parser"   );
var Walker  = require( "./walker/walker"   );

var elf = runtime.Object.clone(function () {
  this.extend(runtime);

  this.Lexer  = Lexer;
  this.Parser = Parser;
  this.Walker = Walker;
});

module.exports = elf;