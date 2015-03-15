var express = require('express');
var router = express.Router();

var Session = require("../models/session");
var User = require("../models/user");
var Active = require("../models/active");
var Review = require("../models/review");
var Course = require("../models/course");

// Function to convert miles to meters
var milesToMeters = require("../../util").milesToMeters;

var tutorRadius = require("../../config").dev.tutorRadius;
var courseRadius = require("../../config").dev.courseRadius;

var percentTutor = require("../../config").dev.percentTutor / 100;

var success = 200;
var failure = 500;

var successMsg = "SUCCESS";
var failureMsg = "FAILURE";


var basepath = "";
var path = function(addition) {
	return basepath + addition;
};

router.post(path("/getCourses"), function(req, res) {
	var input = JSON.parse(req.body);
	var latitude = input.latitude;
	var longitude = input.longitude;
	var miles = input.miles;

	// Preset dist from student to campus
	miles = courseRadius;

	console.log("Miles away " + miles);

	var location = [longitude, latitude];

	var params = {
		"location": {
	        $near: {
		    	$geometry: {
	        		type: "Point" ,
	        		coordinates: location,
		    	},
		    	$maxDistance: milesToMeters(miles), // <distance in meters>
		  	}
	    },
	}

	Course.find(params)
	.exec(function(err, courses) {
		if (err) {
			console.log(err);
			res.send({
				msg: failureMsg,
				code: failure,
				coursesFound: false,
			});
		} else if (!courses || courses.length === 0) {
			console.log("Courses: " + courses);
			console.log("No courses found");
			var message = "It looks like there are no courses offered near you. Please try searching"
				+ " closer to the University of Georgia(UGA) campus."; 

			res.send({
				msg: message,
				code: success,
				coursesFound: false,
			});
		} else {
			var courseData = [];
			courses.forEach(function(course) {
				var coursename = course.course;
				var school = course.school;
				var packed = {
					"coursename": coursename,
					"school": school,
				};

				courseData.push(packed);
			});
			res.send({
				msg: successMsg,
				code: success,
				courseData: courseData,
				coursesFound: true,
			});
		}
	});
});

router.post(path("/activeTutor"), function(req, res) {
	var input = JSON.parse(req.body);
	var userId = input.userId;

	var beginTime = input.beginTime ? new Date(input.beginTime) : new Date();

	var hourLater = new Date(beginTime);
	hourLater.setHours(hourLater.getHours() + 1);

	var endTime = input.endTime ? new Date(input.endTime) : hourLater;
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
				msg: failureMsg,
				code: failure,
				error: err,
			});
		} else {
			user.isAvailable = true;
			user.isInSession = false;

			user.save(function(err) {
				if (err) {
					console.log(err);
					res.send({
						msg: "FAILURE",
						code: failure,
					});
				} else {
					params._tutor = user._id;
					params.coursesTaught = user.coursesTaught;
					Active.findOne({_tutor: user._id}, function(err, active) {
						if (err || !active) {
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
										isAvailable: user.isAvailable,
										isInSession: user.isInSession,
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

router.post(path("/inactiveTutor"), function(req, res) {
	var input = JSON.parse(req.body);
	var userId = input.userId;

	var endTime = new Date();


	User.findOne({
		'_id': userId
	}).exec(function(err, user) {

		if (err || !user) {
			res.send({
				msg: failureMsg,
				code: failure,
				error: err,
			});
		} else {

			user.isAvailable = false;
			user.isInSession = false;

			user.save(function(err) {
				if (err) {
					res.send({
						msg: failureMsg,
						code: failure,
						error: err,
					});
				} else {
					var updates = {
						"endTime": endTime,
						"available": false,
					}
					Active.findOneAndUpdate({_tutor: user._id}, updates, function(err, active) {
						if (err) {
							res.send({
								msg: failureMsg,
								code: failure,
								error: err,
							});
						} else {
							res.send({
								msg: "SUCESSS",
								code: success,
								beginTime: active.beginTime,
								endTime: active.endTime,
								isAvailable: user.isAvailable,
								isInSession: user.isInSession,
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

	// Must have at least 30 mins of availability left
	var later = new Date();
	later.setMinutes(later.getMinutes() + 30);

	var endTime = later;
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
	        	msg: failureMsg,
	        	code: failure,
	        });
	    } else if (!availableTutors || availableTutors.length === 0) {
	    	console.log("No tutors found");
	    	var message = "It looks like there are no tutors available at this time. Please "
    			+ "try again later or try closer to the University of Georgia(UGA) campus for better results.";

    		res.send({
    			msg: message,
    			code: success,
    			foundTutors: false,
    			tutors: [],
    		})	

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

	    		tutor.experience = data.experience;
	    		tutor.reviews = data._reviews;
	    		tutor.rating = data.rating;

	    		tutor.longitude = availableTutor.location[0];
	    		tutor.latitude = availableTutor.location[1];

	    		tutors.push(tutor);
	    	});
	    	res.send({
	    		msg: successMsg,
	    		code: success,
	    		foundTutors: true,
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
							tutor.isAvailable = false;
							tutor.isInSession = true;

							tutor.save(function(err) {
								if (err) {
									console.log(err);
									res.send({
										msg: "Something went wrong. Please try another tutor.",
										code: failure,
										err: err,
										extra: "Active save",
									});	
								} else {
									var updates = {
										"isInSession": true,
									};
									User.findOneAndUpdate({
										"_id": userId,
									},
									updates,
									function(err) {

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
												msg: successMsg,
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
				msg: failureMsg,
				code: failure,
				err: err,
				session: session
			});
		} else {
			session.tuteeBegin(function(err) {
				if (err) {
					console.log(err);
					res.send({
						msg: failureMsg,
						code: failure,
						err: err,
					});
				} else {
					res.send({
						msg: successMsg,
						code: success,
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
				msg: failureMsg,
				code: failure,
				err: err,
				session: session
			});
		} else {
			session.tutorBegin(function(err) {
				if (err) {
					console.log(err);
					res.send({
						msg: failureMsg,
						code: failure,
						err: err,
					});
				} else {
					res.send({
						msg: successMsg,
						code: success,
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
				msg: failureMsg,
				code: failure,
				err: err,
				session: session
			});
		} else {
			session.tuteeEnd(function(err, amount) {
				if (err) {
					console.log(err);
					res.send({
						msg: failureMsg,
						code: failure,
						err: err,
					});
				} else {
					res.send({
						msg: successMsg,
						code: success,
						hasEnded: session.hasEnded,
						amount: amount,
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
				msg: failureMsg,
				code: failure,
				err: err,
				session: session
			});
		} else {
			session.tutorEnd(function(err, cost) {
				var pennies = Math.floor(cost * 100 * percentTutor);
				var amount = pennies / 100;
				if (err) {
					console.log(err);
					res.send({
						msg: failureMsg,
						code: failure,
						err: err,
					});
				} else {
					res.send({
						msg: successMsg,
						code: success,
						amount: amount,
					});
				}
			})
		}
	});
});

router.post(path('/review'), function(req, res) {
	var input = JSON.parse(req.body);

	var sessionId = input.sessionId;
	var rating = parseFloat(input.rating);
	var details = input.details;
	var title = input.title;

	Session.findOne({
		"_id": sessionId
	})
	.populate("_student")
	.populate("_tutor")
	.exec(function(err, session) {
		if (err || !session) {
			console.log(err);
			res.send({
				msg: failureMsg,
				code: failure,
				err: err,
			});
		} else {
			var _tutor = session._tutor._id;
			var _student = session._student._id;
			var studentUsername = session._student.username;
			var course = session.course;
			var hourlyRate = session.hourlyRate;

			var reviewParams = {
				"_student": _student,
				"studentUsername": studentUsername,
				"_tutor": _tutor,
				"_session": sessionId,
				"rating": rating,
				"details": details,
				"title": title,
				"course": course,
				"hourlyRate": hourlyRate,
			};

			var review = new Review(reviewParams);
			review.save(function(err) {
				if (err) {
					console.log(err);
					res.send({
						msg: failureMsg,
						code: failure,
						err: err,
					});
				} else {
					session._tutor.addReview(review, function(err) {
						if (err) {
							console.log(err);
							res.send({
								msg: failureMsg,
								code: failure,
								err: err,
							});	
						} else {
							res.send({
								msg: successMsg,
								code: success,
							});
						}
					});
				}
			});
		}
	});
});

module.exports = router;