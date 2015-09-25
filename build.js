var spawn = require('child_process').spawn;
var fs = require('fs');
var resolvePath = require('path').resolve;

var PAI_HOST = process.env.PAI_HOST || '127.0.0.1';
var PAI_PORT = process.env.PAI_PORT || '9898';

deleteFolderRecursive(resolvePath('./dist'));
fs.mkdirSync(resolvePath('./dist'));

fs.writeFileSync(resolvePath('./const.js'), [
	'var PAI_HOST = "' + PAI_HOST + '";',
	'var PAI_PORT = "' + PAI_PORT + '";'
].join('\n'));

var buildProcess = spawn('node', ['node_modules/uglify-js/bin/uglifyjs', './const.js', './src/frontend/json2.js', './src/frontend/pai.js', '-o', 'dist/pai.min.js', '--source-map', 'dist/pai.min.js.map', '-c', '-m']);

buildProcess.stdout.on('data', function(data) {
	console.log(data.toString());
});

buildProcess.stderr.on('data', function(data) {
	console.log(data.toString());
});

buildProcess.on('close', function(code) {
	console.log('build process exited with code: ' + code);
});

function deleteFolderRecursive(path) {
  if( fs.existsSync(path) ) {
      fs.readdirSync(path).forEach(function(file) {
        var curPath = path + "/" + file;
          if(fs.statSync(curPath).isDirectory()) { // recurse
              deleteFolderRecursive(curPath);
          } else { // delete file
              fs.unlinkSync(curPath);
          }
      });
      fs.rmdirSync(path);
    }
};
