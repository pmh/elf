module.exports = {
  literal  : function (type, regex, helper) {
    return this.rule(type, regex, helper, "(literal)");
  },

  name     : function (regex, helper) {
    return this.literal("name", regex, helper);
  },

  number   : function (regex, helper) {
    return this.literal("number", regex, helper || this.helpers.literal)
  },

  string   : function (regex, helper) {
    return this.literal("string", regex, helper || this.helpers.literal)
  },

  regex    : function (regex, helper) {
    return this.literal("regex", regex, helper || this.helpers.literal);
  },

  operator : function (regex, helper) {
    return this.rule("operator", regex, helper, "(operator)");
  },

  eol      : function (regex, helper) {
    return this.operator(regex, helper || this.helpers.value("(eol)"), "(eol)");
  },

  skip     : function (regex) {
    return this.rule("(skip)", regex, this.helpers.skip, "(skip)")
  },

  helpers: {
    number  : function (str) { return parseFloat(str, 10);              },
    literal : function (str) { return parseFloat(str, 10) ? parseFloat(str, 10) : str.substring(1, str.length - 1); },
    skip    : function (   ) { return null;                             },
    value   : function (val) { return function () { return val; }       },
    trim    : function (str) { return str.trim();                       }
  }
};