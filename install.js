var http = require('http');
var fs = require('fs');
var resolvePath = require('path').resolve;
var spawn = require('child_process').spawn;

var NODE_MODULES_URL = 'http://gitlab.sdc.icbc/000831501/pai-js-node_modules/raw/master/node_modules.zip';

if (fs.existsSync(resolvePath('./node_modules'))) {
	console.log('node_modules exists, no need to download');
	process.exit(0);
}

console.log('downloading node_modules...');

http.get(NODE_MODULES_URL, function(req, res) {
    var bufferArray = [];
    var length = 0;
    req.on('data', function(chunk) {
        bufferArray.push(chunk);
        length += chunk.length;
    });
    req.on('end', function() {
        var fd = fs.openSync(resolvePath('./node_modules.zip'), 'a');
        fs.writeSync(fd, Buffer.concat(bufferArray, length), 0, length);
        fs.close(fd);
        console.log('downloaded');
        console.log('extracting zip...');
        var extractProcess = spawn('unzip', ['node_modules.zip', '-d', 'node_modules']);
        extractProcess.stdout.on('data', function(data) {
            console.log(data.toString());
        });
        extractProcess.stderr.on('data', function(data) {
            console.log(data.toString());
        });
        extractProcess.on('close', function(code) {
			fs.unlinkSync(resolvePath('./node_modules.zip'));
            console.log('extract process exited with code: ' + code);
            console.log('finish');
        });
    });
});
