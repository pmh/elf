var elf = require("../index"), _;

var CalcLexer = elf.Lexer.clone(function () {
  this.number     ( /\d+/         )
  this.operator   ( /\+|\-|\*|\// )
  this.skip       ( /\s+/         )
  this.eol        ( /\;/          )
})

var CalcParser = elf.Parser.clone(function () {
  this.prefix("-");

  this.infix("+", 10)
  this.infix("-", 10)
  this.infix("*", 20)
  this.infix("/", 20)
});

CalcWalker = elf.Walker.clone(function () {
  // Match unary -
  this.match ("-", [ _ ], function (node, left) {
    return -this.walk(left);
  })

  // Match binary -
  this.match ("-", [ _ , _ ], function (node, left, right) {
    return this.walk(left) - this.walk(right);
  })

  // Match binary +
  this.match ("+", function (node, left, right) {
    return this.walk(left) + this.walk(right);
  })

  // Match binary *
  this.match ("*", function (node, left, right) {
    return this.walk(left) * this.walk(right);
  });

  // Match and optimize binary * when the right node is 2 by turning it into a left shift
  this.match ("*", [ _ , 2 ], function (node, left, right) {
    return this.walk(left) << 1;
  });

  // Match binary /
  this.match ("/", function (node, left, right) {
    return this.walk(left) / this.walk(right);
  });

  // Match any number and return it's value
  this.match ("number", function (node) {
    return node.value;
  })
});

var ast = CalcParser.parse("1 + 2 * -3", CalcLexer);
var res = CalcWalker.walk(ast);
console.log(res) //=> [ 3, 16 ]