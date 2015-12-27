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
		it('should have a strong ETag in response head', function() {
			server.stubFs({
				readFile: function(path, callback) {
					callback(null, 'some data');
				}
			});
			server.stubMakeETag(function() {
				return 'HASHOFHTML';
			});
			var resStub = {
				setHeader: sinon.stub(),
				writeHead: sinon.stub(),
				end: sinon.stub(),
				_headers: {}
			};
			server.handleStaticResource({url:'http://test/some.html', method: 'GET', headers: {}}, resStub, null);
			resStub.setHeader.calledOnce.should.equal(true);
			resStub.setHeader.args[0].should.eql(['ETag', 'HASHOFHTML']);
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

	describe('handleDynamicConfig', function() {
		var endStub, writeHeadStub, resStub;
		beforeEach(function() {
			endStub = sinon.stub();
			writeHeadStub = sinon.stub();
			resStub = {end: endStub, writeHead: writeHeadStub};
		});
		it('should return false if request file is not config.js', function() {
			server.handleDynamicConfig({url: 'http://test/other.js?app=nonexists', method: 'GET'}, {}, null).should.equal(false);
		});
		it('should return default config if app is not defined', function() {
			server.handleDynamicConfig({url: 'http://test/config.js?app=nonexists', method: 'GET'}, resStub, null).should.equal(true);
			resStub.writeHead.args[0].should.eql([200, {'Content-Type': 'text/javascript'}]);
			resStub.end.args[0].should.eql(['var PAI_APP="";var PAI_IGNORE_EVENTS=[];var PAI_SKIP=false;']);
		});
		it('should return config according to app', function() {
			server.handleDynamicConfig({url: 'http://test/config.js?app=smis', method: 'GET'}, resStub, null).should.equal(true);
			resStub.end.args[0].should.eql(['var PAI_APP=smis;var PAI_IGNORE_EVENTS=[];var PAI_SKIP=false;']);
		});
	});
});
