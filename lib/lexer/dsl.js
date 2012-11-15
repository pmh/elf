var elf  = require ( "../runtime/runtime"  )
  , Rule = require ( "./rule/rule"         )
  ;

var LexerDSL = elf.Object.clone({
  rule: function (name, regex, action, arity) {
    var rule = Rule.create(name, regex, action, arity);
    this.rules.push(rule);

    return rule;
  },

  name     : function (regex, helper) {
    return this.rule('name', regex, helper);
  },

  number   : function (regex, helper) {
    return this.rule("number", regex, helper || this.helpers.literal)
  },

  string   : function (regex, helper) {
    return this.rule("string", regex, helper || this.helpers.literal)
  },

  regex    : function (regex, helper) {
    return this.rule("regex", regex, helper || this.helpers.literal);
  },

  operator : function (regex, helper) {
    return this.rule("operator", regex, helper);
  },

  eol      : function (regex, helper) {
    return this.rule("eol", regex, helper || this.helpers.value("(eol)"));
  },

  skip     : function (regex) {
    return this.rule("(skip)", regex, this.helpers.skip)
  },

  helpers: {
    number  : function (str) { return parseFloat(str, 10);              },
    literal : function (str) { return parseFloat(str, 10) ? parseFloat(str, 10) : str.substring(1, str.length - 1); },
    skip    : function (   ) { return null;                             },
    value   : function (val) { return function () { return val; }       },
    trim    : function (str) { return str.trim();                       }
  }
});

module.exports = LexerDSL;