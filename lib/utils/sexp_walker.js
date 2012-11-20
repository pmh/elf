var Walker = require("../walker/walker"), SexpWalker, _;

SexpWalker = Walker.clone(function () {
  this.match('error', function (env, node) {
    var childNodes = Array.prototype.slice.call(arguments, 2);

    if (childNodes.length)
      return '(<SyntaxError: ' + node.message() + '> ' + this.walk(childNodes).join(' ') + ')';
    else
      return '<SyntaxError: ' + node.message() + '>'
  })

  this.match(_, function (env, node) {
    var childNodes = Array.prototype.slice.call(arguments, 2);
    if (childNodes.length)
      return ('(' + (typeof node.value !== "undefined" ? node.value : JSON.stringify(node)) + childNodes.map(function (child) {
        return ' ' + (Array.isArray(child) ? '[' + this.walk(child).join(', ') + ']' : this.walk(child));
      }, this).join('') + ')');
    else
      return (typeof node.value !== "undefined" ? node.value : JSON.stringify(node))
  });
});

module.exports = SexpWalker;