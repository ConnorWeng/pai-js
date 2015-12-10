var chai = require('chai');
var server = require('../../src/backend/server');

chai.should();

describe('server', function() {
	describe('handleStaticResource', function() {
		it('should false when request is not for static resource', function() {
			server.handleStaticResource({url: 'http://test/api', method: 'GET'}, {}, null).should.equal(false);
		});
		it('should true when request is for static resource', function() {
			server.handleStaticResource({url:'http://test/some.html', method: 'GET'}, {}, null).should.equal(true);
		});
	});
});
