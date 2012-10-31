var Walker = require("../walker/walker"), ErrorWalker, _;

ErrorWalker = Walker.clone(function () {
  var errors;

  this.match('error', function (node) {
    var childNodes = Array.prototype.slice.call(arguments, 1), self = this;
    this.addError(node);

    childNodes.map(function (child) { return self.walk(child); });

    return this;
  })

  this.match(_, function (node) {
    var childNodes = Array.prototype.slice.call(arguments, 1), self = this;
    childNodes.map(function (child) { return self.walk(child); });

    return this;
  });

  this.addError = function (errorNode) {
    if (!errors[errorNode.line]) errors[errorNode.line] = [];
    errors[errorNode.line].push({message: errorNode.message(), start: errorNode.start, end: errorNode.end});
  }

  this.report = function (source) {
    var report = ""
      , lines  = (source || '').split(/\n+/);

    for (var line in errors) {
      line = parseInt(line, 10);

      report += "\n\nLine: " + (line + 1);
      errors[line].forEach(function (err) {
        report += "\n * " + err.message + " [" + err.start + ", " + err.end + "]";
      });
      if (source) {
        var lines      = source.split(/\n+/);
        var paddLine   = function (line) { return (line + 1) < 10 ? ('0' + (line + 1)) : (line + 1) };
        var lineNum    = function (line) { return paddLine(line) + ":  "; }
        var current    = lineNum(line) + lines[line];

        report += "\n"
        if (lines[line - 1]) report += '\n' + lineNum(line - 1) + lines[line - 1]
        report += "\n" + current + "\n";

        for (var i = 0; i < ((errors[line][0].start) + (lineNum(line).length)); i++) report += ' ';
        errors[line].forEach(function (err, idx) {
          var prevLen = idx ? errors[line][idx - 1].end : err.end;

          for (var i = prevLen  ; i < err.start - 1; i++) report += " ";
          for (var i = err.start; i <= err.end     ; i++) report += "^";
        });
        if (lines[line + 1]) report += '\n' + lineNum(line - 1) + lines[line + 1]
      }
    }
    if (report) {
      report = '\n------------- Errors -------------\n' + report + '\n\n----------------------------------\n';
    }

    return report;
  }

  this.walk = function (nodeList, source) {
    errors = {};
    var walk = this.parent.walk.call(this, nodeList);

    return this.report(source);
  };
})

module.exports = ErrorWalker;