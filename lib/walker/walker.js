var elf = require ( "../runtime/runtime" );

var Matchers = elf.Object.clone({
  clone: function () {
    var obj = elf.Object.clone();
    for (var prop in this) {
      if (this.hasOwnProperty(prop) && prop !== "clone") {
        obj[prop] = typeof this[prop] === "object" ? Object.create(this[prop]) : this[prop];
      }
    }

    return obj;
  },

  get: function (name) {
    if ({}.hasOwnProperty.call(this, name))
      return this[name];
  }
});

var Walker = elf.Object.clone(function () {
  this.childNames = ["first", "second", "third"];

  this.init = function () {
    this.matchers = (this.matchers ? Matchers.clone.call(this.matchers) : Matchers.clone());
    this.matchers.extend(Matchers.clone.call(this.matchers));
    this.childNames = Object.create(this.childNames);
  }

  this.extend = function (obj) {
    var walkers = [].slice.call(arguments);
    walkers.forEach(function (walker) {
      for (var slot in walker) {
        if (walker.hasOwnProperty(slot) && slot !== "matchers")
          this[slot] = walker[slot];
      }
      this.extend.call(this.matchers, Matchers.clone.call(walker.matchers));
    }, this);
    return this;
  }

  this.borrow = function (other) {
    var matchers = [].slice.call(arguments, 1);
    matchers.forEach(function (matcher) {
      this.matchers[matcher] = other.matchers[matcher];
    }, this);
  };

  this.default = function (env, node) {
    var childNodes = Array.prototype.slice.call(arguments, 2);
    childNodes.forEach(function (node) { this.walk(node, env) }, this);

    return node;
  }

  this.error = function (env, node) {
    return node.error("No rule found for the " + (node.type === "error" ? 'token' : node.type) + " '" + node.value + "'.");
  };

  this.match = function (type) {
    if (!this.matchers.get(type)) this.matchers[type] = {specific: [], default: { handler: this.error }}

    if (arguments.length === 3) {
      this.matchers.get(type).specific.push({
        pattern : arguments[1],
        handler : arguments[2] || this.default
      })
    } else {
      this.matchers.get(type).default = { handler: arguments[1] || this.default }
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
    return node && (typeof pattern === "undefined" || (pattern === node.value || pattern === node.type || pattern === node.arity));
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

  this.visit = function (node, env) {
    if (!node) return;

    var matcher    = this.matchers.get(node.value) || this.matchers.get(node.type) || this.matchers.get(node.arity) || this.matchers.get(undefined) || {specific: [], default: { handler: this.error }}
      , childNames = this.childNames.filter(function (name) { return node[name]; })
      , self       = this;

    var match = matcher.specific.reduce(function (acc, el) {
      var patternLen = self.patternLength(el.pattern);
      return (self.process(node, el.pattern) && (patternLen >= childNames.length)) ? el.handler : acc;
    }, null);

    var args = childNames.map(function (name) { return node[name]; });
    return (match || matcher.default.handler).apply(this, [env, node].concat(args));
  };

  this.walk = function (nodeList, env) {
    if (!nodeList) return;
    env = env || elf.Object.clone();
    var visit = function (node) { return this.visit(node, env); };

    if (nodeList.nodes || Array.isArray(nodeList)) {
      return (nodeList.nodes || nodeList).map(visit, this);
    } else {
      return this.visit(nodeList, env);
    }
  };

});

module.exports = Walker;
