var express = require('express');
var router = express.Router();

var User = require("../models/user");

// var resetCount = function(data) {
// 	data.resetCount(function(err, count) {
// 		console.log("count is");
// 		console.log(count);
// 	});
// }

var checkIfExists = function(emailAddress) {
	console.log("checkIfExists");
	schema.find({"emailAddress": emailAddress}).exec(function(err, result) {
		if (err) {
			console.log(err);
		} else {
			console.log(result);

		}
	});
};

router.post('/register', function(req, res) {
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
			console.log(member);
			res.send('SUCCESS');
		}
		// resetCount(member);
	});
});

router.post('/login', function(req, res) {

});

router.post('/verifyCredentials', function(req, res) {
	var input = JSON.parse(req.body);
	var username = input.username;
	var emailAddress = input.emailAddress;
	var password = input.password;

	User.findOne({
		// username: username,
		"emailAddress": emailAddress,
	}).exec(function(err, result) {
		if (err) {
			console.log(err);
		} else {
			console.log(result);
			console.log(typeof(result));
			console.log("time to check password");

			result.comparePassword(password, function(err, isMatch) {
				if (err || !isMatch) {
					console.log(err);
					res.send("BAD PASSWORD");
				} else {
					console.log("password is bueno. Good job grasshopper");
					res.send("VERIFIED");
				}
			});			
		}
	});
});

module.exports = router;
