var express = require('express');
var router = express.Router();

var TutorCode = require("../models/tutorCode");
var Course = require("../models/course");

var success = 200;
var failure = 500;

var successMsg = "SUCCESS";
var failureMsg = "FAILURE";

var baseRate = require("../../config").dev.baseRate;
var baseRateCertified = require("../../config").dev.baseRateCertified;

var courseRadius = require("../../config").dev.courseRadius;

var basepath = "";
var path = function(addition) {
	return basepath + addition;
};

router.post(path("/addCourse"), function(req, res) {
	var input = JSON.parse(req.body);

	var course = input.course;
	var school = input.school;
	var latitude = input.latitude;
	var longitude = input.longitude;

	var location = [longitude, latitude];

	var params = {
		"course": course,
		"school": school,
		"location": location,
	};

	var course = new Course(params);
	course.save(function(err) {
		if (err) {
			console.log(err);
			res.send({
				msg: failureMsg,
				code: failure,
			});
		} else {
			res.send({
				msg: successMsg,
				code: success,
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
				msg: failureMsg,
				code: failure,
				tutorCode: "",
				emailAddress: "",
			});
		} else {
			tutorCode.generateTutorCode(function(err, code) {
				if (err) {
					res.send({
						err: err,
						msg: failureMsg,
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

module.exports = router;