var elf        = require ( "../runtime/runtime"  );
var Token      = require ( "./token/token"       );
var ErrorToken = require ( "./token/error_token" );

var Lexer = elf.Object.clone(function () {
  this.extend(require('./dsl'));

  this.error = function (value) {
    var prev  = this.tokens[this.tokens.length - 1];
    if (prev && prev.end >= (this.column - 1) && prev.line === this.line && prev.type === "(error)") {
      prev.value += value;
      prev.end++;
    } else {
      var token = ErrorToken.create(value).pos({
        start : this.column - 1,
        end   : this.column,
        line  : this.line
      });
      this.tokens.push(token);
    }
  };

  this.advance = function () {
    var self               = this;
    var longestMatchLength = 0;
    var longestMatch       = null;
    var longestMatchRule   = null;

    this.rules.forEach(function (rule) {
      var match = rule.match(self.source);
      if (match.length >= longestMatchLength) {
        longestMatchRule   = rule;
        longestMatchLength = match.length;
        longestMatch       = match;
      }
    });

    this.source = this.source.replace(longestMatch, "");

    if (longestMatch) {
      var token = Token.clone().pos({
        start : self.column,
        end   : self.column + (longestMatch.length - 1),
        line  : self.line
      });

      if (longestMatchRule.arity)
        token.arity = longestMatchRule.arity;

      self.column += longestMatchLength;
      if (longestMatch.match(/\n/)) {
        this.line = this.line + 1;
        this.column = longestMatch.split(/\n/)[1].length
      }

      if (longestMatchRule.action){
        var result = longestMatchRule.action.call(token, longestMatch);

        if (Object.prototype.toString.call(result).match(/Array|Object/))
          return result;
        else if (result === null)
          return null;
        else
          longestMatch = result;
      }

      return token.create(longestMatchRule.name, longestMatch)
    }

    this.source = this.source.substring(1);
    return undefined;
  }

  this.recalculatePosition = function (tokens) {
    return tokens.map(function (token, idx) {
      this.column += (token.value || "").length - 1;
      if (idx === 0) {
        token.end   = token.start + (token.value || "").toString().length - 1;
      } else {
        token.start = tokens[idx - 1].end + 1;
        token.end   = token.start + (token.value || "").toString().length - 1;
      }
      return token;
    }, this);
  };

  this.lex = function (source) {
    this.source = source;
    this.init();

    var error   = "";
    while (this.source) {
      var oldSource = this.source;
      var token     = this.advance();
      if (token) {
        var next = this.tokens.next
        var peek = this.tokens.peek
        this.tokens = this.tokens.
          concat(token.map ? this.recalculatePosition(token) : token);
        this.tokens.next = next;
        this.tokens.peek = peek;
      }
      if (token === undefined) {
        this.column++;
        this.error(oldSource[0]);
      }
    }

    return this.tokens;
  };

  this.borrow = function (other) {
    var ruleNames = [].slice.call(arguments).slice(1);
    ruleNames.forEach(function (ruleName) {
      var rules = other.rules.filter(function (rule) {
        return rule.name === ruleName ||
          (rule.regex.source ?
           rule.regex.source === new RegExp("^(" + ruleName.source + ")").source :
           rule.regex === ruleName);
      });
      rules.forEach(function (rule) {
        this.rule(rule.name, "", rule.action, rule.arity).regex = rule.regex;
      }, this)
    }, this);
  };

  this.init = function () {
    var self = this;
    this.column = 0;
    this.line   = 0;
    this.rules  = Array.apply(null, this.rules || []);
    this.tokens = [];

    var token_nr = 0;
    this.tokens.next = function () {
      var token = this[token_nr++] || Token.create("(eof)", "(eof)").pos({
        start : self.column,
        end   : self.column + 1,
        line  : self.line
      });
      if (token.type === "error") token.end--;
      return token;
    };
    this.tokens.peek = function (n) {
      return this[token_nr + (n || 0)] || Token.create("(eof)", "(eof)");
    };
  }
});

module.exports = Lexer;
