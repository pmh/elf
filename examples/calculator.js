var elf = require("../index");

var CalcLexer = elf.Lexer.clone(function () {
  this.number     ( /\d+/         )
  this.operator   ( /\+|\-|\*|\// )
  this.skip       ( /\s+/         )
})

console.log("Tokens:\n", CalcLexer.lex("1 + 2 * 3"));

var CalcParser = elf.Parser.clone(function () {

  this.prefix("-");

  this.infix("+", 10)
  this.infix("-", 10)
  this.infix("*", 20)
  this.infix("/", 20)
});

var ast  = CalcParser.parse("1 + 2 * -3", CalcLexer);
var sexp = elf.sexp(ast);
console.log("\nsexp:\n", sexp);

var CalcEvaluator = elf.Parser.clone(function () {
  this.prefix("(literal)", function () { return this.value; })

  this.prefix("-", function (parser) { return -parser.expression(70) })

  this.infix("+", 10, function (parser, left) { return left + parser.expression(); })
  this.infix("-", 10, function (parser, left) { return left - parser.expression(); })
  this.infix("*", 20, function (parser, left) { return left * parser.expression(); })
  this.infix("/", 20, function (parser, left) { return left / parser.expression(); })
});

console.log("\nEVAL:\n", CalcEvaluator.parse("1 + 2 * -3", CalcLexer))