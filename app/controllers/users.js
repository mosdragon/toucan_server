var express = require('express');
var router = express.Router();

var User = require("../models/user");

resetCount = function(data) {
	data.resetCount(function(err, count) {
		console.log("count is");
		console.log(count);
	});
}

router.post('/', function(req, res) {
	console.log("Creating user");
	console.log(req.body);
	console.log(typeof(req.body));

	var input = JSON.parse(req.body);
	console.log(input);
	console.log(typeof(input));

	var member = new User(input);
	console.log("MEMBER");
	console.log(member);
	member.save(function(err) {
		if (err) {
			res.send("ERROR");
			console.log(err);
		} else {
			res.send('SUCCESS');
		}
		// resetCount(member);
	});
});

module.exports = router;
