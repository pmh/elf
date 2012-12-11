process.env.NODE_ENV = 'test';

var chai = require('chai');

chai.Assertion.includeStack = true;


var SpecHelper = {

  assert: chai.assert

};

module.exports = SpecHelper;