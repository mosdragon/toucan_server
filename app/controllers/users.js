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

var successMsg = "SUCCESS";
var failureMsg = "FAILURE";

var basepath = "";
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

	// Card Parameters
	var stripe_token = input.card_token;
	// ex: XXX-XXX-XXX-1234. 1234 is the cardNumber number
	var cardNumber = input.cardNumber;
	var cardParams = {
		"stripe_token": stripe_token,
		"cardNumber": cardNumber,
	};

	var member = new User(userParams);

	member.save(function(err) {
		if (err) {
			res.send({
				msg: failureMsg,
				code: failure,
			});
			console.log(err);
		} else {
			res.cookie("userId", member._id);

			member.addCardToken(cardParams, function(err) {
				if (err) {
					console.log(err);
					res.send({
						msg: failureMsg,
						error: err,
						code: failure
					})
				} else {
					res.send({
						msg: successMsg,
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

	// Card Parameters
	var card_token = input.card_token;
	// ex: XXX-XXX-XXX-1234. 1234 is the cardNumber number
	var cardNumber = input.cardNumber;
	var cardParams = {
		"stripe_token": card_token,
		"cardNumber": cardNumber,
	};

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

	var member = new User(userParams);
	member.save(function(err) {
		if (err) {
			res.send({
				msg: failureMsg,
				code: failure,
				err: err,
			});
			console.log(err);
		} else {
			res.cookie("userId", member._id);

			member.addCardToken(cardParams, function(err) {
				if (err) {
					console.log(err);
					res.send({
						msg: failureMsg,
						error: err,
						code: failure
					});
				} else {
					member.addBankToken(bankParams, function(err) {
						if (err) {
							console.log(err);
							res.send({
								msg: failureMsg,
								error: err,
								code: failure,
							});
						} else {
							member.useTutorCode(tutorCode, function(err) {
								if (err) {
									console.log(err);
									res.send({
										msg: failureMsg,
										error: err.mesage,
										code: failure
									});
								} else {
									res.send({
										msg: successMsg,
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
				msg: failureMsg,
				code: failure,
				error: err,
			});
		} else if (user) {

			user.comparePassword(password, function(err, isMatch) {
				if (err || !isMatch) {
					console.log(err);
					res.send({
						msg: failureMsg,
						code: failure,
						reason: "Bad username or password",
					});
				} else {
					res.send({
						msg: "SUCCESS",						
						code: success,
						userId: user._id,
						isInSession: user.isInSession,
						isAvailable: user.isAvailable,
						userType: user.userType,
					});
				}
			});			
		} else {
			res.send({
				msg: failureMsg,
				code: failure,
				reason: "Bad username or password",
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
				msg: failureMsg,
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
