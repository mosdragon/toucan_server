var express = require('express');
var router = express.Router();

var Session = require("../models/session");
var User = require("../models/user");
var Active = require("../models/active");

// Function to convert miles to meters
var milesToMeters = require("../../util").milesToMeters;

var success = 200;
var failure = 500;

var basepath = "";
var path = function(addition) {
	return basepath + addition;
};

router.post(path('/selectTutor'), function(req, res) {
	var input = JSON.parse(req.body);
	var userId = input.userId;
	var tutorId = input.tutorId;
	var studentPhone = input.studentPhone;
	var course = input.course;

	Active.findOne({  
	    _tutor: tutorId
	})
	.populate("_tutor")
	.exec(function(err, active) {
		if (err || !active) {
			console.log(err);
			console.log("First error block");
			res.send({
				msg: "Something went wrong. Please try another tutor.",
				code: failure,
			});
		} else if(active && !active.available) {
			console.log("tutor availability");
			console.log(active.available);
			console.log("Tutor not available");
			res.send({
				msg: "It looks like this tutor is no longer available. Please try another tutor.",
				code: failure,
			});
		} else {
			active.available = false;
			var tutor = active._tutor;
			var hourlyRate = JSON.parse(tutor.hourlyRates)[course];
			var tutorPhone = tutor.phoneNumber;
			var params = {
				"course": course,
				"_student": userId,
				"studentPhone": studentPhone,
				"_tutor": tutorId,
				"tutorPhone": tutorPhone,
				"hourlyRate": hourlyRate,
			};
			var session = new Session(params);
			session.save(function(err) {
				if (err) {
					console.log(err);
					res.send({
						msg: "Something went wrong. Please try another tutor.",
						code: failure,
						err: err,
						extra: "Session save",
						sessionId: session._id,
						type: typeof(session._id),
						session: session,
					});				
				} else {
					active._session = session._id;
					active.save(function(err) {
						if (err) {
							console.log(err);
							res.send({
								msg: "Something went wrong. Please try another tutor.",
								code: failure,
								err: err,
								extra: "Active save",
							});				
						} else {
							res.send({
								msg: "SUCCESS",
								code: success,
								tutorPhone: tutorPhone,
								tutorName: tutor.firstName + " " + tutor.lastName,
								sessionId: session._id,
							});
						}		
					});
				}
			});
		}
	});
});

// router.post(path('/selectTutor'), function(req, res) {
// 	var input = JSON.parse(req.body);
// 	var userId = input.userId;
// 	var tutorId = input.tutorId;
// 	var studentPhone = input.studentPhone;
// 	var course = input.course;

// 	Active.findOne({  
// 	    _tutor: tutorId
// 	})
// 	.populate("_tutor")
// 	.exec(function(err, active) {
// 		if (err || !active) {
// 			console.log(err);
// 			console.log("First error block");
// 			res.send({
// 				msg: "Something went wrong. Please try another tutor.",
// 				code: failure,
// 			});
// 		} else if(!active.available) {
// 			console.log(active);
// 			console.log(active.available);
// 			console.log("Tutor not available");
// 			res.send({
// 				msg: "It looks like this tutor is no longer available. Please try another tutor.",
// 				code: failure,
// 			});
// 		} else {
// 			active.available = false;
// 			User.findOne({
// 				"identifier": tutorId,
// 			}, function(err, tutor) {

// 				if (err || !tutor) {
// 					console.log(err);
// 					res.send({
// 						msg: "Something went wrong. Please try another tutor.",
// 						code: failure,
// 					});

// 				} else {
// 					var hourlyRate = JSON.parse(tutor.hourlyRates)[course];
// 					var tutorPhone = tutor.phoneNumber;
// 					var params = {
// 						"course": course,
// 						"_student": userId,
// 						"studentPhone": studentPhone,
// 						"_tutor": tutorId,
// 						"tutorPhone": tutorPhone,
// 						"hourlyRate": hourlyRate,
// 					}
// 					var session = new Session(params);
// 					session.save(function(err) {
// 						if (err) {
// 							console.log(err);
// 							res.send({
// 								msg: "Something went wrong. Please try another tutor.",
// 								code: failure,
// 								err: err,
// 							});				
// 						} else {
// 							res.send({
// 								msg: "SUCCESS",
// 								code: success,
// 								tutorPhone: tutorPhone,
// 							});
// 						}
// 					});
// 				}
// 			});
// 		}
// 	});
// });


module.exports = router;