var SymTab = require('../../lib/parser/symbol_table');
var should = require('should')

describe ("Symbol Table", function () {
  var sym_tab;
  beforeEach(function () {
    sym_tab = SymTab.clone();
  });

  describe ("get", function () {
    var token;
    beforeEach (function () {
      sym_tab.set("+", 10);
      sym_tab.set("(literal)")
      token = function (props) {
        return {
          extend: function (obj) {
            for (var slot in obj) this[slot] = obj[slot];
            return this;
          }
        }.extend(props);
      }
    });

    it ("expects a token and returns it extended with all the properties from the symbol it finds", function () {
      sym_tab.get(token({value: "+", name: "plus"})).name.should.eql("plus")
      sym_tab.get(token({arity: "(literal)", name: "literal"})).name.should.eql("literal")
    });

    it ("returns an error token if no symbol is found", function () {
      sym_tab.set("(error)")
      sym_tab.get(token({value: "-"})).id.should.eql("(error)")
    });
  });

  describe ("set", function () {

    it ("creates a new symbol if there isn't one already", function () {
      sym_tab.set("+", 10);
      should.exist(sym_tab.symbols["+"])
    });

    it ("it updates the existing symbol if one exists", function () {
      sym_tab.set("+", 20);
      sym_tab.symbols["+"].lbp = 20      
    });
  });
});