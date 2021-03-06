var http = require('http');
var fs = require('fs');
var parseUrl = require('url').parse;
var parseQuery = require('querystring').parse;
var resolvePath = require('path').resolve;
var moment = require('moment');
var etag = require('etag');
var fresh = require('fresh');

var STATIC_RESOURCE_EXTS = ['js', 'css', 'html', 'htm', 'jpge', 'jpg', 'png', 'ico', 'map'];
var RESOURCE_TYPE_MAP = {
	'js': 'text/javascript',
	'css': 'text/stylesheet',
	'html': 'text/html',
	'htm': 'text/html',
	'jpeg': 'image/jpeg',
	'jpg': 'image/jpeg',
	'png': 'image/png',
	'ico': 'image/ico',
	'map': 'text/javascript'
};
var HANDLERS = [handleDynamicConfig, handleStaticResource, handleMessage];

http.createServer(function(req, res) {
	var next = function(err, statusCode) {
		if (err) handleError(req, res, statusCode, err);
	};
	req.setEncoding('utf8');
	var data = '';
	req.on('data', function(chunck) {
		data += chunck;
	});
	req.on('end', function() {
		req.body = data;
		var i = 0;
		for(; i < HANDLERS.length; i++) {
			var handler = HANDLERS[i];
			if (handler(req, res, next)) break;
		}
		if (i === HANDLERS.length) {
			handleError(req, res, 500, new Error('no handler for this request'));
		}
	});
}).listen(process.env.PAI_PORT || 9898);

function handleDynamicConfig(req, res, next) {
	var url = parseUrl(req.url);
	var pathname = url.pathname;
	if (req.method !== 'GET' || pathname !== '/config.js') return false;
	var query = url.query;
	var params = parseQuery(query);
	res.writeHead(200, {'Content-Type': RESOURCE_TYPE_MAP.js});
	if (params.app && dynamicConfig(params.app)) {
		res.end(dynamicConfig(params.app));
	} else {
		res.end('var PAI_APP="";var PAI_IGNORE_EVENTS=[];var PAI_SKIP=false;');
	}
	return true;
}

function handleStaticResource(req, res, next) {
	var path = parseUrl(req.url).path.substr(1);
	var ext = path.substr(path.lastIndexOf('.') + 1);
	if (req.method !== 'GET' || !~STATIC_RESOURCE_EXTS.indexOf(ext)) return false;
	fs.readFile(resolvePath(path), function(err, data) {
		if (err) return next(new Error('request resouce not exists'), 404);
		res.setHeader('ETag', makeETag(data, 'utf8'));
		var statusCode = fresh(req.headers, res._headers) ? 304 : 200;
		res.writeHead(statusCode, {'Content-Type': RESOURCE_TYPE_MAP[ext]});
		if (statusCode === 200) {
			res.end(data);
		} else {
			res.end();
		}
	});
	return true;
}

function handleMessage(req, res, next) {
	if (req.method !== 'POST') return false;
	appendLog(req.body, function(err) {
		if (err) return next(err, 500);
		res.writeHead(200, {'Content-Type': 'text/json'});
		res.end('{"success": true}');
	});
	return true;
}

function handleError(req, res, statusCode, err) {
	res.writeHead(statusCode, {'Content-Type': 'text/plain'});
	res.end(err.message);
}

function appendLog(message, callback) {
	var dir = resolvePath('./logs');
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
	fs.appendFile(resolvePath(dir, moment().format('YYYY-MM-DD') + '.log'), message + '\n', callback);
}

function dynamicConfig(app) {
	if (app === 'smis') {
		return 'var PAI_APP="smis";var PAI_IGNORE_EVENTS=["mousemove"];var PAI_SKIP=false;';
	} else {
		return false;
	}
}

var makeETag = function(data, encoding) {
	var buf = !Buffer.isBuffer(data) ? new Buffer(data, encoding) : data;
	return etag(buf, {weak: false});
};

if (process.env.NODE_ENV === 'test') {
	exports.handleStaticResource = handleStaticResource;
	exports.handleDynamicConfig = handleDynamicConfig;
	exports.handleMessage = handleMessage;
	exports.handleError = handleError;
	exports.appendLog = appendLog;
	exports.stubFs = function(fsStub) { fs = fsStub; };
	exports.stubMakeETag = function(stub) { makeETag = stub; };
}
