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

router.post(path("/activeTutor"), function(req, res) {
	var input = JSON.parse(req.body);
	var userId = input.userId;

	var beginTime = input.beginTime ? input.beginTime : new Date();

	var hourLater = new Date(beginTime);
	hourLater.setHours(hourLater.getHours() + 1);

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
								beginTime: beginTime,
								endTime: endTime,
								coursesTaught: active.coursesTaught,
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
	    		tutor.tutorId = data._id;
	    		tutor.isCertified = data.isCertified;
	    		tutor.tutorPhone = data.phoneNumber;

	    		// var rates = JSON.parse(data.hourlyRates);
	    		var rates = data.hourlyRates;
	    		tutor.course = course;
	    		tutor.rate = rates[course];
	    		
	    		tutor.biography = data.biography;
	    		tutor.major = data.major;
	    		tutor.year = data.year;

	    		tutor.experience = data._sessions.length;
	    		tutor.reviews = data._reviews;
	    		tutor.rating = data.rating;

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
			var hourlyRate = tutor.hourlyRates[course];
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
								course: course,
								rate: hourlyRate,

							});
						}		
					});
				}
			});
		}
	});
});

router.post(path('/tuteeBegin'), function(req, res) {
	var input = JSON.parse(req.body);
	var sessionId = input.sessionId;

	Session.findOne({
		_id: sessionId
	})
	.exec(function(err, session) {
		if (err || !session) {
			console.log(err);
			res.send({
				msg: "FAILURE",
				code: failure,
				err: err,
				session: session
			});
		} else {
			session.tuteeBegin(function(err) {
				if (err) {
					console.log(err);
					res.send({
						msg: "FAILURE",
						code: failure,
						err: err,
					});
				} else {
					res.send({
						msg: "SUCCESS",
						code: success,
						hasBegun: session.hasBegun,
						tutorTimeBegin: session.tuteeTimeBegin,
					});
				}
			})
		}
	});
});

router.post(path('/tutorBegin'), function(req, res) {
	var input = JSON.parse(req.body);
	var sessionId = input.sessionId;

	Session.findOne({
		_id: sessionId
	})
	.exec(function(err, session) {
		if (err || !session) {
			console.log(err);
			res.send({
				msg: "FAILURE",
				code: failure,
				err: err,
				session: session
			});
		} else {
			session.tutorBegin(function(err) {
				if (err) {
					console.log(err);
					res.send({
						msg: "FAILURE",
						code: failure,
						err: err,
					});
				} else {
					res.send({
						msg: "SUCCESS",
						code: success,
						hasBegun: session.hasBegun,
						tutorTimeBegin: session.tutorTimeBegin,
					});
				}
			})
		}
	});
});

router.post(path('/tuteeEnd'), function(req, res) {
	var input = JSON.parse(req.body);
	var sessionId = input.sessionId;

	Session.findOne({
		_id: sessionId
	})
	.exec(function(err, session) {
		if (err || !session) {
			console.log(err);
			res.send({
				msg: "FAILURE",
				code: failure,
				err: err,
				session: session
			});
		} else {
			session.tuteeEnd(function(err) {
				if (err) {
					console.log(err);
					res.send({
						msg: "FAILURE",
						code: failure,
						err: err,
					});
				} else {
					res.send({
						msg: "SUCCESS",
						code: success,
						hasEnded: session.hasEnded,
						tutorTimeBegin: session.tuteeTimeEnd,
					});
				}
			})
		}
	});
});

router.post(path('/tutorEnd'), function(req, res) {
	var input = JSON.parse(req.body);
	var sessionId = input.sessionId;

	Session.findOne({
		_id: sessionId
	})
	.exec(function(err, session) {
		if (err || !session) {
			console.log(err);
			res.send({
				msg: "FAILURE",
				code: failure,
				err: err,
				session: session
			});
		} else {
			session.tutorEnd(function(err) {
				if (err) {
					console.log(err);
					res.send({
						msg: "FAILURE",
						code: failure,
						err: err,
					});
				} else {
					res.send({
						msg: "SUCCESS",
						code: success,
						hasEnded: session.hasEnded,
						tutorTimeBegin: session.tutorTimeEnd,
					});
				}
			})
		}
	});
});

module.exports = router;