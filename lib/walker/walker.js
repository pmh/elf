var elf = require ( "../runtime/runtime" );

var Walker = elf.Object.clone(function () {
  this.matchers   = elf.Object.clone();
  this.childNames = ["first", "second", "third"];

  this.init = function () {
    this.matchers            = this.matchers.clone();
    this.matchers[undefined] = {specific: [], default: { handler: this.default }}
    this.childNames          = Object.create(this.childNames);
  }

  this.default = function (node) {
    this.ast.ErrorWalker.addError(node.clone({
      message: function () {
        return "No rule found for the " + (node.type === "error" ? 'token' : node.type) + " '" + node.value + "'."
      }
    }));
  };

  this.match = function (type) {
    if (!this.matchers[type]) this.matchers[type] = {specific: [], default: { handler: this.default }}

    if (arguments.length === 3) {
      this.matchers[type].specific.push({
        pattern : arguments[1],
        handler : arguments[2]
      })
    } else {
      this.matchers[type].default = { handler: arguments[1] }
    }
  }

  this.patternLength = function (pattern) {
    var self = this;
    return pattern.reduce(function (acc, el) {
      if (elf.helpers.isArray(el)) return acc + self.patternLength(el);
      return acc + 1
    }, 0);
  }

  this.validate = function (node, pattern) {
    return node && (typeof pattern === "undefined" || (pattern === node.value || pattern === node.type));
  }

  this.process = function (node, patterns) {
    var self = this;

    var matches = patterns.filter(function (pattern, idx) {
      var child = node[self.childNames[idx]];
      if (elf.helpers.isArray(pattern))
        return self.validate(child, pattern[0]) && self.process(child, pattern.slice(1))
      else
        return self.validate(child, pattern);
    });

    return matches.length === patterns.length;
  };

  this.visit = function (node) {
    if (!node) return;

    var matcher    = this.matchers[node.value] || this.matchers[node.type] || this.matchers[undefined]
      , childNames = this.childNames.filter(function (name) { return node[name]; })
      , self       = this;

    var match = matcher.specific.reduce(function (acc, el) {
      var patternLen = self.patternLength(el.pattern);
      return (self.process(node, el.pattern) && (patternLen >= childNames.length)) ? el.handler : acc;
    }, null);

    var args = childNames.map(function (name) { return node[name]; });
    return (match || matcher.default.handler).apply(this, [node].concat(args));
  };

  this.walk = function (nodeList) {
    var self = this;
    if (elf.helpers.isArray(nodeList.nodes)) {
      this.ast = nodeList;
      return nodeList.nodes.map(function (node) { return self.visit(node) })
    } else {
      return this.visit(nodeList);
    }
  };

});

module.exports = Walker;