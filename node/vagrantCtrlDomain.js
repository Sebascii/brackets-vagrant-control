
(function () {
	"use strict";

	var util  = require('util'),
    spawn = require('child_process').spawn;
  
	function nodeVagrantExec(path, command, cb) {
		var output = "";

		var cmd = spawn('vagrant', [command], {cwd : path});

		cmd.stdout.on('data', function (data) {
		  console.log('stdout: ' + data);
		  output += data;
		});

		cmd.stderr.on('data', function (data) {
		  console.log('stderr: ' + data);
          output += "- ERR_VAGRANT_RESP";
		  output += data;	
		});

		cmd.on('close', function (code) {
		  console.log('child process exited with code ' + code);
	      cb(undefined, output);
		});
		
	}

	
	function init(domainManager) {
		if (!domainManager.hasDomain("vagrantCtrl")) {
			domainManager.registerDomain("vagrantCtrl", {major: 0, minor: 1});
		}

		domainManager.registerCommand(
			"vagrantCtrl", // domain name
			"nodeVagrantExec", // command name
			nodeVagrantExec, // command handler function
			true, 
			"Vagrant up"
		);
		

	}
	exports.init = init;
}());
