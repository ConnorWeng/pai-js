var spawn = require('child_process').spawn;
var fs = require('fs');
var resolvePath = require('path').resolve;

var PAI_HOST = process.env.PAI_HOST || '127.0.0.1';
var PAI_PORT = process.env.PAI_PORT || '9898';

deleteFolderRecursive(resolvePath('./dist'));
fs.mkdirSync(resolvePath('./dist'));

fs.writeFileSync(resolvePath('./const.js'), [
    'var PAI_HOST = "' + PAI_HOST + '";',
    'var PAI_PORT = "' + PAI_PORT + '";',
    'var CONSOLE_INJECT = false;'
].join('\n'));

fs.writeFileSync(resolvePath('./inject-const.js'), [
    'var PAI_HOST = "' + PAI_HOST + '";',
    'var PAI_PORT = "' + PAI_PORT + '";',
    'var CONSOLE_INJECT = true;'
].join('\n'));

var uglifyCommand = ['node_modules/uglify-js/bin/uglifyjs'];

outputProcess(spawn('node', appendArgs('./const.js ./src/frontend/json2pai.js ./src/frontend/pai.js -c -m -o dist/pai.min.js --source-map dist/pai.min.js.map --source-map-url http://' + PAI_HOST + ':' + PAI_PORT + '/dist/pai.min.js.map --source-map-root /')), 'build min');
outputProcess(spawn('node', appendArgs('./const.js ./src/frontend/json2pai.js ./src/frontend/pai.js -o dist/pai.js -b')), 'build src');
outputProcess(spawn('node', appendArgs('./inject-const.js ./src/frontend/json2pai.js ./src/frontend/pai.js -o dist/pai-inject.js -b')), 'build console inject');

function appendArgs(argsString) {
    var newArgs = uglifyCommand.map(function(a) { return a; });
    var args = argsString.split(' ');
    for(var i = 0; i < args.length; i++) {
        newArgs.push(args[i]);
    }
    return newArgs;
}

function outputProcess(buildProcess, processName) {
    buildProcess.stdout.on('data', function(data) {
        console.log(data.toString());
    });
    buildProcess.stderr.on('data', function(data) {
        console.log(data.toString());
    });
    buildProcess.on('close', function(code) {
        if (code === 0) {
            console.log(processName + ' success');
        } else {
            console.log(processName + ' process error, exit code: ' + code);
        }
    });
}

function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file) {
            var curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}
