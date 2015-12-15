var http = require('http');
var fs = require('fs');
var parseUrl = require('url').parse;
var resolvePath = require('path').resolve;
var moment = require('moment');

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
var HANDLERS = [handleStaticResource, handleMessage];

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

function handleStaticResource(req, res, next) {
	var path = parseUrl(req.url).path.substr(1);
	var ext = path.substr(path.lastIndexOf('.') + 1);
	if (req.method !== 'GET' || !~STATIC_RESOURCE_EXTS.indexOf(ext)) return false;
	fs.readFile(resolvePath(path), function(err, data) {
		if (err) return next(new Error('request resouce not exists'), 404);
		res.writeHead(200, {'Content-Type': RESOURCE_TYPE_MAP[ext]});
		res.end(data);
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

if (process.env.NODE_ENV === 'test') {
	exports.handleStaticResource = handleStaticResource;
	exports.handleMessage = handleMessage;
	exports.handleError = handleError;
	exports.appendLog = appendLog;
	exports.stubFs = function(fsStub) { fs = fsStub; };
}
