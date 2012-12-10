var elf = require ( "../runtime/runtime" );

var ParserAPI = elf.Object.clone({
  previous: [],

  symbol: function (id, bp) {
    return this.symbol_table.set(id, bp);
  },

  advance: function (id) {
    if (id && !this.token.match(id)) {
      return this.token.error("Expected: " + id + " but got: " + this.token.value);
    }

    var oldToken = this.token;
    this.token   = this.symbol_table.get(this.tokens.next());
    return oldToken;
  },

  expression: function (rbp) {
    if (this.token.type  === "(eof)") return;

    rbp = rbp || 0;
    var token = this.token;
    this.advance();
    var left = token.nud.call(this, token);
    while (rbp < this.token.lbp) {
      token = this.token;
      this.advance();
      left = token.led.call(this, token, left);
    }

    return left;
  },

  parseUntil: function (value, opts) {
    opts = opts || {};
    var stmts     = [].concat(this.previous);
    this.previous = [];

    if (stmts.length === 1 && stmts[0].match(value)) return [];

    while (!this.token.match(value, "(eof)")) {
      var stmt;
      if (this.token.match(opts.abort_if) || this.tokens.peek().match(opts.abort_if)) {
        if (stmt) this.previous.push(stmt);
        return stmts;
      }
      stmt = (opts.parser ? this[opts.parser]() : this.statement())
      stmt = opts.validator ? opts.validator.call(this, stmt) : stmt;

      if (opts.meta) {
        for (var tag in opts.meta)
          if (opts.meta.hasOwnProperty(tag)) stmt[tag] = opts.meta[tag];
      }
      stmts.push(stmt);
      if (opts.step) {
        if (!this.token.match(opts.step)) break;
        this.advance(opts.step);
      }

      if (this.token.match("(eol)")) {
        if (this.token.match(value)) break;
        this.advance("(eol)");
      }
    }

    this.advance(value);

    return stmts;
  },

  statement: function () {
    var token = this.token;
    if (token.std) {
      this.advance();
      return token.std.call(this, token);
    }

    return this.expression();
  },

  statements: function () {
    var stmts = [];
    while (this.token.type !== "(eof)") {
      var statement = this.statement()
      if (statement) stmts.push(statement);
      if (this.token.match("(eol)")) this.advance("(eol)");
      if (this.token.type  === "(eof)") break;
    }

    return stmts;
  }
});

module.exports = ParserAPI;
