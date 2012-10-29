var elf        = require ( "../runtime/runtime"  );
var Rule       = require ( "./rule/rule"         );
var Token      = require ( "./token/token"       );
var ErrorToken = require ( "./token/error_token" );

var Lexer = elf.Object.clone(function () {
  this.extend(require('./dsl'));

  this.rule = function (name, regex, action, arity) {
    var rule = Rule.create(name, regex, action, arity);
    this.rules.push(rule);

    return rule;
  };

  this.error = function (value) {
    var prev  = this.tokens[this.tokens.length - 1];
    if (prev && prev.end >= (this.column - 1) && prev.line === this.line && prev.type === "error") {
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
        this.column = 0;
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

  this.lex = function (source) {
    this.source = source;
    this.init();

    var error   = "";
    while (this.source) {
      var oldSource = this.source;
      var token     = this.advance();
      if (token) {
        var next = this.tokens.next
        this.tokens = this.tokens.concat(token);
        this.tokens.next = next;
      }
      if (token === undefined) {
        this.column++;
        this.error(oldSource[0]);
      }
    }

    return this.tokens;
  };

  this.init = function () {
    var self = this;
    this.column = 0;
    this.line   = 0;
    this.rules  = Array.apply(null, this.rules || []);
    this.tokens = [];

    this.tokens.next = (function () {
      var token_nr = 0;
      return function () {
        return this[token_nr++] || Token.create("(eof)", "(eof)").pos({
          start : self.column,
          end   : self.column + 1,
          line  : self.line
        });
      };
    })();
  }
});

module.exports = Lexer;
