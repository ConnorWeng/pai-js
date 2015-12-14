var chai = require('chai');
var sinon = require('sinon');
var moment = require('moment');
var resolvePath = require('path').resolve;
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

    describe('appendLog', function() {
		var mkdirStub, appendFileStub, callbackStub;
		beforeEach(function() {
			mkdirStub = sinon.stub();
			appendFileStub = sinon.stub();
            server.stubFs({
                existsSync: function(path) {
                    return false;
                },
                mkdirSync: mkdirStub,
				appendFile: appendFileStub
            });
			callbackStub = sinon.stub();
		});
		
        it('should create directory if not exists', function() {
            server.appendLog('one log record', callbackStub);
            mkdirStub.calledOnce.should.equal(true);
            mkdirStub.args[0].should.eql([resolvePath('./logs')]);
        });
        it('should append log to the daily file', function() {
			server.appendLog('one log record', callbackStub);
			appendFileStub.calledOnce.should.equal(true);
			appendFileStub.args[0].should.eql([resolvePath('./logs', moment().format('YYYY-MM-DD') + '.log'), 'one log record\n', callbackStub]);
        });
    });
});
