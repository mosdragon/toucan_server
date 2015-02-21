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
	var stripe_token = input.bank_token;
	var legal_name = input.legal_name;
	var accountNumber = input.accountNumber; // ex: XXX-XXX-XXX-1234. 1234 is the accountNumber number

	var params = {
		"identifier": identifier,
		"stripe_token": stripe_token,
		"legal_name": legal_name,
		"accountNumber": accountNumber,
	}
	console.log("addToken params");
	console.log(params);
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
			result.addBankToken(params, function(err, result) {
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

router.post(path("/addCardToken"), function(req, res) {
	var input = JSON.parse(req.body);
	var identifier = input.userId;
	var stripe_token = input.bank_token;
	var cardNumber = input.cardNumber; // ex: XXX-XXX-XXX-1234. 1234 is the cardNumber number

	var params = {
		"identifier": identifier,
		"stripe_token": stripe_token,
		"cardNumber": cardNumber,
	}
	console.log("addToken params");
	console.log(params);
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
			result.addCardToken(params, function(err, result) {
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

	var beginTime = input.beginTime ? input.beginTime : new Date();

	var hourLater = new Date(beginTime);
	hourLater.setHours(hourLater.getHours() + 1);
	console.log("hour later");
	console.log(hourLater);

	var endTime = input.endTime ? input.endTime : hourLater;
	var latitude = input.latitude;
	var longitude = input.longitude;

	var params = {
		"beginTime": beginTime,
		"endTime": endTime,
		"location": [longitude, latitude],
		"available": true,
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
	// var radians = km / earthRadius; // approximate
	// return radians;
	var degrees = km/111.12;
	return degrees;
};

var milesToRadians = function(miles) {
	// var km = Math.floor(miles * milesToKM * 100) / 100;
	var km = miles * milesToKM;
	return kmToRadians(km);
};

var milesToM = function(miles) {
	var km = miles * milesToKM;
	return km * 1000;
}

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
	console.log(maxDistRadians);


	var params = {
		"endTime": endTime,
		"location": [longitude, latitude],
	}

	Active.find({  
	    location: {
	        $near: {
		    	$geometry: {
	        		type: "Point" ,
	        		coordinates: params.location
		    	},
		    	// $maxDistance: <distance in meters>,
		    	// $minDistance: <distance in meters>
		    	$maxDistance: milesToM(miles),
		  	}
	    },

	    coursesTaught: {
	    	$in: [course],
	    },
	    available: true,
	    endTime: {
	    	$lt: params.endTime,
	    	$gte: (new Date()),
	    }
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
