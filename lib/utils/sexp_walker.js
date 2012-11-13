var Walker = require("../walker/walker"), SexpWalker, _;

SexpWalker = Walker.clone(function () {
  this.match('error', function (node) {
    var childNodes = Array.prototype.slice.call(arguments, 1), self = this;

    if (childNodes.length)
      return '(<SyntaxError: ' + node.message() + '>' + childNodes.map(function (child) { return ' ' + self.walk(child); }).join('') + ')';
    else
      return '<SyntaxError: ' + node.message() + '>'
  })

  this.match(_, function (node) {
    var childNodes = Array.prototype.slice.call(arguments, 1), self = this;
    if (childNodes.length)
      return '(' + (node.value ? node.value : JSON.stringify(node)) + childNodes.map(function (child) { return ' ' + self.walk(child); }).join('') + ')';
    else
      return node.value ? node.value : JSON.stringify(node)
  });
});

module.exports = SexpWalker;