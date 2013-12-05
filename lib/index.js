/*

	Usage: require this with processing function
	exports = module.exports = function(done) {
		migration.loadData('[]', [processing function], done);
	};

*/

var request = require('request'),
	fs = require('fs'),
	readline = require('readline'),
	dir = __dirname + '/data';

// Settings
var cacheFile = true, // cache the file locally for use
	logErrorsToFile = true;


// Ensure the data dir exists
try {
	if (!fs.statSync(dir).isDirectory()) {
		throw new Error(dir + ' exists and is not a directory');
	}
} catch (err) {
	if (err.code === 'ENOENT') {
		fs.mkdirSync(dir);
	} else {
		throw err;
	}
}

/**
	Data Loading
	============
	
	Loads the data to migrate from .json files on a remote server
*/

var dataServer 	= '[server]',
	dataPath 	= '[foler page]',
	dataKeyMap 	= {
		'[key]': 	'[filename]'
	};

exports.loadData = function(key, it, callback) {
	
	var path = dataServer + '/' + dataPath + '/' + dataKeyMap[key],
		localFilePath = dir + '/' + dataKeyMap[key];
	
	if (!(key in dataKeyMap)) {
		throw new Error('Invalid data key provided (' + key + ').')
	}
	
	// if the file exists locally to use it, otherwise get it from remote.
	fs.exists(localFilePath, function(exists) {
		if (exists) {
			return readDataFile();
		} else {
			request(path).on('end', function() {
					return readDataFile();
			}).pipe(fs.createWriteStream(dataKeyMap[key]));		
		}
	});

	var lines = 0,
		complete = false;
	
	var check = function() {
		if (!lines && complete) callback();
	}
	
	var readDataFile = function() {
		
		var rd = readline.createInterface({
			input: fs.createReadStream(localFilePath),
			output: process.stdout,
			terminal: false
		});

		rd.on('line', function(line) {
			
			lines++;
			
			try {
				var obj = JSON.parse(line.toString()); // parse the JSON	
				it(obj, function() {
					lines--;
					check();
				});
			}
			catch(e){
				lines--;
				console.log("------------------------------");
				console.log("ERROR PROCESSING JSON:");
				console.log("------------------------------");
				// log errors to console
				console.log(e);
				console.log(line.toString());
				
				// log error to file
				if (logErrorsToFile) 
					logErrorToFile(line.toString());
				
				console.log("------------------------------");
			}
			
		}).on('close', function() {
			if (!cacheFile) {
				fs.unlink(localFilePath, function(err) {
					complete = true;
					check();
				});
			} else {
				complete = true;
				check();
			}
		});
	}
	
	// Log errors to file
	var logErrorToFile = function(data) {
		
		var logFile = 'errors.log';
		
		// Check the error log exists
		fs.exists(logFile, function(exists) {
			if (!exists) {
				
				// if the file doesn't - create it
				fs.writeFile(logFile, data, function (err) {
					if (err) { console.log('Unable to create log file'); }
					return;
				});
			} else {
				
				// if it does - append to it
				fs.appendFile(logFile, '\n' + data, function (err) {
					if (err) { console.log('Unable to appended error to file!'); }
					return;
				});	
			}
		});
	}
}