'use strict';
global.chai = require('chai');
global.assert = global.chai.assert;

describe('sometest', function () {
  it('should run', function () {
    assert.isNotNull(1);
  });
});