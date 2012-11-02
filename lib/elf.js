var runtime     = require( "./runtime/runtime"    )
  , Lexer       = require( "./lexer/lexer"        )
  , Parser      = require( "./parser/parser"      )
  , Language    = require( "./language/language"  )
  , REPL        = require( "./repl/repl"          )
  , Walker      = require( "./walker/walker"      )
  , ErrorWalker = require( "./utils/error_walker" )
  ;

var elf = runtime.Object.clone(function () {
  this.extend(runtime);

  this.Lexer        = Lexer;
  this.Parser       = Parser;
  this.Language     = Language;
  this.REPL         = REPL;
  this.Walker       = Walker;
  this.ErrorWalker  = ErrorWalker;
});

module.exports = elf;