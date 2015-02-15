var express = require('express');
var router = express.Router();

var User = require("../models/user");
var Active = require("../models/active");

var basepath = "/api/v1";

var success = 200;
var failure = 500;

var path = function(addition) {
	return basepath + addition;
}

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

router.post(path('/registerUser'), function(req, res) {
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

	// _user: {type: Number, ref: "Users"},
	// _transfers: {type: [Number], ref: "Transfers", default: []},
	// userEmail: String,
	//    bank_account: Number,
	//    legal_name: String,

router.post(path("/addBankInfo"), function(req, res) {
	var input = JSON.parse(req.body);
	var identifier = req.cookies.userId;
	// var bankInfo = input.bankInfo;
	User.findOne({
		'identifier': identifier
	}).exec(function(err, result) {
		if (err || !result) {
			res.send({
				msg: "ERRORORR"
			});
		} else {
			result.addBankAccountInfo(input, function(err, result) {
				if (err) {
					console.log(err);
					res.send({
						msg: "FAILURE",
						error: err,
					});
				}
				res.send({
						msg: "Successfully Added Bank Account",
					});
			});
		}
	})
});

router.post(path("/createBankInfoId"), function(req, res) {
	var input = JSON.parse(req.body);
	var identifier = req.cookies.userId;
	// var bankInfo = input.bankInfo;
	User.findOne({
		'identifier': identifier
	}).exec(function(err, result) {
		if (err || !result) {
			res.send({
				msg: "ERRORORR"
			});
		} else {
			result.addBankAccountInfo(input, function(err, result) {
				if (err) {
					console.log(err);
					res.send({
						msg: "FAILURE",
						error: err,
						code: failure,
					});
				}
				res.send({
						msg: "Successfully Added Bank Account",
						code: success,
					});
			});
		}
	});
});

router.post(path('/verifyCredentials'), function(req, res) {
	var input = JSON.parse(req.body);
	var username = input.username;
	var emailAddress = input.emailAddress;
	var password = input.password;

	Active.findOne({
		// username: username,
		"emailAddress": emailAddress,
	}).exec(function(err, result) {
		if (err) {
			console.log(err);
		} else if (result) {
			console.log(result);
			console.log(typeof(result));
			console.log("time to check password");

			result.comparePassword(password, function(err, isMatch) {
				if (err || !isMatch) {
					console.log(err);
					res.send("BAD PASSWORD");
				} else {
					console.log("password is bueno. Good job grasshopper");
					res.cookie("userId", result.identifier);
					res.send({
						msg: "VERIFIED",
						userId: result.identifier
					});
				}
			});			
		} else {
			res.send({
				msg: "FAILURE"
			});
		}
	});
});

// Client Apps only

router.post(path("/addBankToken"), function(req, res) {
	var input = JSON.parse(req.body);
	var identifier = input.userId;
	User.findOne({
		'identifier': identifier
	}).exec(function(err, result) {
		if (err || !result) {
			res.send({
				msg: "ERRORORR",
				code: failure,
			});
		} else {
			result.addBankAccountInfo(input, function(err, result) {
				if (err) {
					console.log(err);
					res.send({
						msg: "FAILURE",
						error: err,
						code: failure
					});
				}
				res.send({
						msg: "SUCESSS",
						code: success
					});
			});
		}
	});
});

router.post(path('/login'), function(req, res) {
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
		} else if (result) {
			console.log(result);
			console.log(typeof(result));
			console.log("time to check password");

			result.comparePassword(password, function(err, isMatch) {
				if (err || !isMatch) {
					console.log(err);
					res.send("BAD PASSWORD");
				} else {
					console.log("password is bueno. Good job grasshopper");
					res.send({
						msg: "VERIFIED",
						userId: result.identifier,
						code: success,
					});
				}
			});			
		} else {
			res.send({
				msg: "FAILURE",
				code: failure,
			});
		}
	});
});

router.post(path("/activeTutor"), function(req, res) {
	var input = JSON.parse(req.body);
	var identifier = input.userId;

	var endTime = input.endTime ? input.endTime : null;
	var latitude = input.latitude;
	var longitude = input.longitude;

	var params = {
		"endTime": endTime,
		"location": [longitude, latitude],
	}

	User.findOne({
		'identifier': identifier
	}).exec(function(err, user) {
		if (err || !result) {
			res.send({
				msg: "ERRORORR",
				code: failure,
			});
		} else {
			params._tutor = user._id;
			params.coursesTaught = user.coursesTaught;
			Active.update({_tutor: user._id}, upsertData, {upsert: true}, function(err) {
				if (err) {
					res.send({
						msg: "ERRORORR",
						code: failure,
					});
				} else {
					res.send({
						msg: "SUCESSS",
						code: success,
					});
				}
			});
		}
	});
});

router.post(path("/findActiveTutors"), function(req, res) {
	var input = JSON.parse(req.body);
	var identifier = input.userId;

	var hourLater = new Date();
	hourLater.setHours(hourLater.getHours() + 1);

	var endTime = hourLater;
	var latitude = input.latitude;
	var longitude = input.longitude;
	var course = input.course;

	var params = {
		"endTime": endTime,
		"location": [longitude, latitude],
	}

	Active.find({  
	    loc: {
	        $near: coords,
	        $maxDistance: maxDistance
	    },
	    coursesTaught: {
	    	$in: [course],
	    },
	    available: true
	})
	.populate("_tutor")
	.limit(70).exec(function(err, actives) {
	    if (err) {
	        res.send({
	        	msg: "FAILURE",
	        	code: failure,
	        });
	    } else {

	    	res.send({
	    		msg: "SUCCESS",
	    		code: success,
	    		data: actives,
	    	})
	    }
	});
});

module.exports = router;
