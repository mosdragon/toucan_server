var express = require('express');
var router = express.Router();

var User = require("../models/user");
var Active = require("../models/active");

var basepath = "/users";

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
			res.send({
				msg: "ERRORORR",
				code: failure,
			});
			console.log(err);
		} else {
			console.log(member);
			res.cookie("userId", member.identifier);
			res.send({
				msg: "VERIFIED",
				code: success,
				userId: member.identifier
			});
		}
		// resetCount(member);
	});
});


// router.post(path('/verifyCredentials'), function(req, res) {
// 	var input = JSON.parse(req.body);
// 	var username = input.username;
// 	var emailAddress = input.emailAddress;
// 	var password = input.password;

// 	Active.findOne({
// 		// username: username,
// 		"emailAddress": emailAddress,
// 	}).exec(function(err, result) {
// 		if (err) {
// 			console.log(err);
// 		} else if (result) {
// 			console.log(result);
// 			console.log(typeof(result));
// 			console.log("time to check password");

// 			result.comparePassword(password, function(err, isMatch) {
// 				if (err || !isMatch) {
// 					console.log(err);
// 					res.send("BAD PASSWORD");
// 				} else {
// 					console.log("password is bueno. Good job grasshopper");
// 					res.cookie("userId", result.identifier);
// 					res.send({
// 						msg: "VERIFIED",
// 						code: success,
// 						userId: result.identifier
// 					});
// 				}
// 			});			
// 		} else {
// 			res.send({
// 				msg: "FAILURE"
// 			});
// 		}
// 	});
// });

// Client Apps only

router.post(path("/addBankToken"), function(req, res) {
	var input = JSON.parse(req.body);
	var identifier = input.userId;
	User.findOne({
		'identifier': identifier
	}).exec(function(err, result) {
		if (err || !result) {
			console.log(err);
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

router.post(path('/addCourse'), function(req, res) {

	var input = JSON.parse(req.body);
	console.log(input);
	var coursename = input['coursename'];

	console.log(coursename);
	console.log(typeof(coursename));
	var identifier = input.userId;

	User.findOne({
		'identifier': identifier,
	},
	function(err, user) {
		if (err || !user) {
			console.log(err);
			console.log(user)
			res.send({
				message: "FAILURE",
				code: failure,
			});
		} else {
			user.addCourse(coursename);
			user.save(function(err) {
				if (err) {
					console.log(err);
					res.send({
						message: "FAILURE",
						code: failure,
					});
				} else {
					res.send({
						message: "SUCESSS",
						code: success,
						data: user,
					});
				}
			})
		}
	});
});

router.post(path('/addManyCourses'), function(req, res) {

	var input = JSON.parse(req.body);
	console.log(input);
	var coursename = input['coursename'];

	console.log(coursename);
	console.log(typeof(coursename));
	var identifier = input.userId;

	User.findOne({
		'identifier': identifier,
	},
	function(err, user) {
		if (err || !user) {
			console.log(err);
			console.log(user)
			res.send({
				message: "FAILURE",
				code: failure,
			});
		} else {
			user.addManyCourses(coursename);
			user.save(function(err) {
				if (err) {
					console.log(err);
					res.send({
						message: "FAILURE",
						code: failure,
					});
				} else {
					res.send({
						message: "SUCESSS",
						code: success,
						data: user,
					});
				}
			})
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

	var hourLater = new Date();
	hourLater.setHours(hourLater.getHours() + 1);

	var beginTime = input.beginTime ? input.beginTime : new Date();
	var endTime = input.endTime ? input.endTime : hourLater;
	var latitude = input.latitude;
	var longitude = input.longitude;

	var params = {
		"beginTime": beginTime,
		"endTime": endTime,
		"location": [longitude, latitude],
	}

	User.findOne({
		'identifier': identifier
	}).exec(function(err, user) {
		if (err || !user) {
			console.log(err);
			console.log(user);
			res.send({
				msg: "ERRORORR",
				code: failure,
			});
		} else {
			console.log("USER FOUND");
			params._tutor = user._id;
			params.coursesTaught = user.coursesTaught;
			Active.update({_tutor: user._id}, params, {upsert: true}, function(err) {
				if (err) {
					console.log(err);
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

// Distance conversion factors
var milesToKM = 1.60934;
var earthRadius = 6371; // in KM

var kmToRadians = function(km) {
	var radians = km / earthRadius; // approximate
	return radians;
};

var milesToRadians = function(miles) {
	var km = Math.floor(miles * milesToKM * 100) / 100;
	return kmToRadians(km);
};

router.post(path("/findActiveTutors"), function(req, res) {
	var input = JSON.parse(req.body);
	// var identifier = input.userId;

	var hourLater = new Date();
	hourLater.setHours(hourLater.getHours() + 4);

	var endTime = hourLater;
	var latitude = input.latitude;
	var longitude = input.longitude;
	var course = input.course;
	var miles = 3;
	var maxDistRadians = milesToRadians(miles);


	var params = {
		"endTime": endTime,
		"location": [longitude, latitude],
	}

	Active.find({  
	    location: {
	        $near: params.location,
	        $maxDistance: maxDistRadians,
	    },
	    coursesTaught: {
	    	$in: [course],
	    },
	    // available: true, // this is the problem!!
	    // endTime: {  // this is the problem too!!
	    // 	$lt: params.endTime,
	    // 	$gte: (new Date()),
	    // }
	})
	.populate("_tutor")
	.exec(function(err, actives) {
	    if (err) {
	    	console.log(err);
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
