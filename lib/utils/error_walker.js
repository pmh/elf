var Walker = require("../walker/walker"), ErrorWalker, _;

ErrorWalker = Walker.clone(function () {
  var errors = {}

  this.match('error', function (node) {
    var childNodes = Array.prototype.slice.call(arguments, 1), self = this;
    this.addError(node);

    childNodes.map(function (child) { return self.visit(child); });

    return this;
  })

  this.match(_, function (node) {
    var childNodes = Array.prototype.slice.call(arguments, 1), self = this;
    childNodes.map(function (child) { return self.visit(child); });

    return this;
  });

  this.addError = function (errorNode) {
    if (!errors[errorNode.line]) errors[errorNode.line] = [];
    errors[errorNode.line].push({message: errorNode.message(), start: errorNode.start, end: errorNode.end});
  }

  this.report = function (source) {
    var report = ""
      , lines  = (source || '').split(/\n/);

    for (var line in errors) {
      line = parseInt(line, 10);

      report += "\n\nLine: " + (line + 1);
      if (source) {
        var prevLine   = lines[line - 1];
        var sourceLine = lines[line];
        var nextLine   = lines[line + 1];

        report += "\n\n - Source:";
        if (prevLine) report += '\n      ' + prevLine;
        
        report += '\n   => ' + sourceLine + "\n";
        report += '      '

        var first = true;
        errors[line].forEach(function (err, idx) {
          var prev = idx === 0 ? 0 : errors[line][idx - 1].end;
          
          for (var i = prev; i < (err.start - 1); i++) report += " ";
          for (var i = err.start ; i < err.end  ; i++) report += "^";

          if (err.start === err.end) {
            if (first) { report += " ^"; first = false}
            else       { report += "^"; }
          }
        });
        
        if (nextLine) report += '\n      ' + nextLine;
      }

      report += "\n\n - " + errors[line].length + " Error(s):";
      errors[line].forEach(function (err) {
        report += "\n     * " + err.message;
      });

    }

    return report;
  }

  this.walk = function (nodeList, source) {
    var walk = this.parent.walk.call(this, nodeList);

    return this.report(source);
  };
})

module.exports = ErrorWalker;