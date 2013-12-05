var parser = require('./lib/index');


function check(data,done) {
	// console.log(data);
	return done()
}

var exec = require('child_process').exec;

if (process.argv[2])
	
	parser.loadData(process.argv[2], check, function(err) {
		if (err) console.log(err);
		process.exit(1);
	});
else
	console.log('please pass an argument');