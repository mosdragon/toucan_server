var express = require('express');
var router = express.Router();

var User = require("../models/user");
var Active = require("../models/active");
var TutorCode = require("../models/tutorCode");

var baseRate = require("../../config").dev.baseRate;
var baseRateCertified = require("../../config").dev.baseRateCertified;

// Function to convert miles to meters
var milesToMeters = require("../../util").milesToMeters;

var success = 200;
var failure = 500;

var basepath = "/users";
var path = function(addition) {
	return basepath + addition;
}

router.post(path('/signupStudent'), function(req, res) {
	var input = JSON.parse(req.body);

	var firstName = input.firstName;
	var lastName = input.lastName;
	var phoneNumber = input.phoneNumber;
	var username = input.username;
	var password = input.password;
	var emailAddress = input.emailAddress;
	// This will be null at time -> defaults to "TUTEE"
	var userType = "TUTEE";

	var userParams = {
		'firstName': firstName,
		'lastName': lastName,
		'phoneNumber': phoneNumber,
		'username': username,
		'password': password,
		'emailAddress': emailAddress,
		'userType': userType,
	};
	console.log(userParams);

	// Card Parameters
	var stripe_token = input.card_token;
	// ex: XXX-XXX-XXX-1234. 1234 is the cardNumber number
	var cardNumber = input.cardNumber;
	var cardParams = {
		"stripe_token": stripe_token,
		"cardNumber": cardNumber,
	};
	console.log(cardParams);

	var member = new User(userParams);

	member.save(function(err) {
		if (err) {
			res.send({
				msg: "ERRORORR",
				code: failure,
			});
			console.log(err);
		} else {
			console.log(member);
			res.cookie("userId", member._id);

			member.addCardToken(cardParams, function(err) {
				if (err) {
					console.log(err);
					res.send({
						msg: "FAILURE",
						error: err,
						code: failure
					})
				} else {
					res.send({
						msg: "SUCESSS",
						code: success,
						userId: member._id,
						isInSession: member.isInSession,
						userType: member.userType,
					})
				}
			});
		}
	});
});

router.post(path('/signupTutor'), function(req, res) {
	
	var input = JSON.parse(req.body);
	var firstName = input.firstName;
	var lastName = input.lastName;
	var phoneNumber = input.phoneNumber;
	var username = input.username;
	var password = input.password;
	var emailAddress = input.emailAddress;
	var tutorCode = input.tutorCode;

	// Taking credit card AND bank info from a user makes them "BOTH" a 
	// tutor and a tutee
	var userType = "BOTH";

	var userParams = {
		'firstName': firstName,
		'lastName': lastName,
		'phoneNumber': phoneNumber,
		'username': username,
		'password': password,
		'emailAddress': emailAddress,
		'userType': userType,
	};
	console.log(userParams);

	// Card Parameters
	var card_token = input.card_token;
	// ex: XXX-XXX-XXX-1234. 1234 is the cardNumber number
	var cardNumber = input.cardNumber;
	var cardParams = {
		"stripe_token": card_token,
		"cardNumber": cardNumber,
	};
	console.log(cardParams);

	// Bank Parameters
	var bank_token = input.bank_token;
	var legal_name = input.legal_name;
	// ex: XXX-XXX-XXX-1234. 1234 is the accountNumber number
	var accountNumber = input.accountNumber;

	var bankParams = {
		"stripe_token": bank_token,
		"legal_name": legal_name,
		"accountNumber": accountNumber,
	};
	console.log(bankParams);

	var member = new User(userParams);
	// console.log("MEMBER");
	// console.log(member);
	member.save(function(err) {
		if (err) {
			res.send({
				msg: "FAILURE",
				code: failure,
				err: err,
			});
			console.log(err);
		} else {
			console.log(member);
			res.cookie("userId", member._id);

			member.addCardToken(cardParams, function(err) {
				if (err) {
					console.log(err);
					res.send({
						msg: "FAILURE",
						error: err,
						code: failure
					});
				} else {
					member.addBankToken(bankParams, function(err) {
						if (err) {
							console.log(err);
							res.send({
								msg: "FAILURE",
								error: err,
								code: failure,
							});
						} else {
							member.useTutorCode(tutorCode, function(err) {
								if (err) {
									// console.log(err);
									res.send({
										msg: "FAILURE",
										error: err.mesage,
										code: failure
									});
								} else {
									res.send({
										msg: "SUCESSS",
										code: success,
										userId: member._id,
										isInSession: member.isInSession,
										userType: member.userType,
									});
								}
							});
						}
					});
				}
			});
		}
	});
});


router.post(path('/login'), function(req, res) {
	var input = JSON.parse(req.body);
	var password = input.password;

	var user = String(input.user);
	var params = {};
	// If given email, find by email. Otherwise, by username
	if (user.indexOf("@") === -1) {
		params = {
			'username': user,
		}
	} else {
		params = {
			'emailAddress': user,
		}
	}

	User.findOne(params)
	.exec(function(err, user) {
		if (err || !user) {
			console.log(err);
			res.send({
				msg: "FAILURE",
				code: failure,
				error: err,
			});
		} else if (user) {

			user.comparePassword(password, function(err, isMatch) {
				if (err || !isMatch) {
					console.log(err);
					res.send({
						msg: "FAILURE",
						code: failure,
						reason: "Bad username or password",
					});
				} else {
					res.send({
						msg: "SUCCESS",						
						code: success,
						userId: user._id,
						isInSession: user.isInSession,
						userType: user.userType,
					});
				}
			});			
		} else {
			res.send({
				msg: "FAILURE",
				code: failure,
				reason: "Bad username or password",
			});
		}
	});
});

router.post(path("/activeTutor"), function(req, res) {
	var input = JSON.parse(req.body);
	var userId = input.userId;

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
		'_id': userId
	}).exec(function(err, user) {
		if (err || !user) {
			res.send({
				msg: "FAILURE",
				code: failure,
				error: err,
			});
		} else {
			console.log("USER FOUND");
			params._tutor = user._id;
			params.coursesTaught = user.coursesTaught;
			Active.findOne({_tutor: user._id}, function(err, active) {
				if (err || !active) {
					console.log(err);
					console.log(active);
					// No active exists for this person. Create a new one.
					var active = new Active(params);
					active.save(function(err) {
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
				} else {
					active.update(params, function(err) {
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
		}
	});
});


router.post(path("/findActiveTutors"), function(req, res) {
	var input = JSON.parse(req.body);

	var hourLater = new Date();
	hourLater.setHours(hourLater.getHours() + 1);

	var endTime = hourLater;
	var latitude = input.latitude;
	var longitude = input.longitude;
	var course = input.course;
	var miles = input.miles ? parseInt(input.miles) : 3;


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
		    	$maxDistance: milesToMeters(miles), // <distance in meters>
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
	.exec(function(err, availableTutors) {
	    if (err) {
	    	console.log(err);
	        res.send({
	        	msg: "FAILURE",
	        	code: failure,
	        });
	    } else {
	    	var tutors = [];
	    	availableTutors.forEach(function(availableTutor) {
	    		var data = availableTutor._tutor.toObject();
	    		var tutor = {};
	    		tutor.name = data.firstName + " " + data.lastName;
	    		tutor.reviews = data._reviews;
	    		tutor.isCertified = data.isCertified;

	    		var rates = JSON.parse(data.hourlyRates);
	    		tutor.course = course;
	    		tutor.rate = rates[course];
	    		
	    		tutor.biography = data.biography;
	    		tutor.tutorId = data._id;
	    		tutors.push(tutor);
	    	});
	    	res.send({
	    		msg: "SUCCESS",
	    		code: success,
	    		tutors: tutors,
	    	});
	    }
	});
});

router.post(path("/generateTutorCode"), function(req, res) {
	var input = JSON.parse(req.body);

	var firstName = input.firstName;
	var lastName = input.lastName;
	var emailAddress = input.emailAddress;
	var coursesTaught = input.coursesTaught;
	var isCertified = input.isCertified;
	var rates = input.rates;

	for (var index in coursesTaught) {
		var coursename = coursesTaught[index];
		if (!rates[coursename]) {
			if (isCertified) {
				rates[coursename] = baseRateCertified;
			} else {
				rates[coursename] = baseRate;
			}
		}
	}

	console.log("Ensured all courses have rates");
	console.log(rates);

	var params = {
		firstName : firstName,
		lastName : lastName,
		emailAddress : emailAddress,
		coursesTaught : coursesTaught,
		isCertified : isCertified,
		rates : rates,
	};

	var tutorCode = new TutorCode(params);
	tutorCode.save(function(err) {
		if (err) {
			console.log(err);
			res.send({
				err: err,
				msg: "FAILURE",
				code: failure,
			});
		} else {
			tutorCode.generateTutorCode(function(err, code) {
				if (err) {
					res.send({
						err: err,
						msg: "FAILURE",
						code: failure,
					});
				} else {
					res.send({
						msg: "SUCESSS",
						code: success,
						tutorCode: code,
						emailAddress: emailAddress,
					});
				}
			});
		}
	});
});

router.post(path("/checkCodeValid"), function(req, res) {
	var input = JSON.parse(req.body);
	var tutorCode = input.tutorCode;

	TutorCode.findOne({
		'tutorCode': tutorCode,
	})
	.exec(function(err, code) {
		if (err || !code) {
			res.send({
				err: err,
				msg: "FAILURE",
				code: failure,
				isValid: false,
			});
		} else {
			res.send({
				msg: "SUCCESS",
				code: success,
				isValid: !code.codeUsed,
			});
		}
	});
});


module.exports = router;
