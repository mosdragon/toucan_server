var mongoose = require("../../db");
var sessionCollection = "Session";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var isLive = process.env.isLive;

// Scheduling payments/transfers
var schedule = require('node-schedule');
var twoDaysLater = function(input) {
	if (isLive) {
		input.setDate(input.getDate() + 2);
		input.setHours(input.getHours() + 2);
	} else {
		// Do it after 5 seconds -- we're in test mode
		input.setSeconds(input.getSeconds() + 5);
	}
	return input;
};

var minuteLater = function(input) {
	if (isLive) {
		input.setMinutes(input.getMinutes() + 1);
	} else {
		// Do it after 5 seconds -- we're in test mode
		input.setSeconds(input.getSeconds() + 5);
	}
	return input;
};

var stripe_api_key = require("../../config").dev.stripe_api_key;
var stripe = require("stripe")(stripe_api_key);

var toucan_bank_id = require("../../config").dev.toucan_bank_id;
var toucan_transfer_id = require("../../config").dev.toucan_transfer_id;

var defaultHours = require("../../config").dev.defaultHours;
var baseTime = require("../../config").dev.baseTime;

// How much Toucan keeps vs what percentage a tutor gets
var percentTutor = require("../../config").dev.percentTutor / 100;
var percentStripe = require("../../config").dev.percentStripe / 100;
var percentToucan = Math.floor((1 - (percentTutor + percentStripe))* 100) / 100;

console.log("percentTutor: " + percentTutor);
console.log("percentStripe: " + percentStripe);
console.log("percentToucan: " + percentToucan);

var User = require("../models/user");
var CreditCard = require("../models/creditCard");
var BankAccount = require("../models/bankAccount");
var Charge = require("../models/charge");
var Transfer = require("../models/transfer");

var sessionSchema = new mongoose.Schema({

	_creditCard: {type: Number, ref: "CreditCard"},
	_tutor: {type: Number, ref: "Users", required: true},
	tutorPhone: String,
	_student: {type: Number, ref: "Users", required: true},
	studentPhone: String,
	appointmentCreated: {type: Date, default: new Date()},
	appointmentBegin: Date,
	appointmentEnd: Date,
	hasBegun: {type: Boolean, default: false},
	hasEnded: {type: Boolean, default: false},
	hoursOfService: Number,
	course: String,
	hourlyRate: Number,
	totalCost: Number,
	tuteeTimeBegin: {type: Date},
	tuteeTimeEnd: {type: Date},
	tutorTimeBegin: {type: Date},
	tutorTimeEnd: {type: Date},

});

sessionSchema.methods.tuteeBegin = function(callback) {
	var self = this;
	self.tuteeTimeBegin = new Date();
	self.appointmentBegin = self.tuteeTimeBegin;
	self.save(callback);
};

sessionSchema.methods.tutorBegin = function(callback) {
	var self = this;
	self.tutorTimeBegin = new Date();
	self.appointmentBegin = self.tutorTimeBegin;
	self.save(callback);
};

sessionSchema.methods.tuteeEnd = function(callback) {
	var self = this;
	self.tuteeTimeEnd = new Date();
	self.appointmentEnd = self.tuteeTimeEnd;

	self.save(function(err) {
		if (err) {
			return callback(err);
		} else {
			calculateCosts(self, callback);
		}
	});

	self.checkAppointmentDone();
};

sessionSchema.methods.tutorEnd = function(callback) {
	var self = this;
	self.tutorTimeEnd = new Date();
	self.appointmentEnd = self.tutorTimeEnd;

	self.save(function(err) {
		if (err) {
			return callback(err);
		} else {
			calculateCosts(self, callback);
		}
	});
	self.checkAppointmentDone();
};

sessionSchema.methods.checkAppointmentDone = function() {
	var self = this;
	console.log("checkAppointmentDone");
	if (self.appointmentBegin && self.tutorTimeBegin && self.tuteeTimeBegin
		&& self.appointmentEnd && self.tutorTimeEnd && self.tuteeTimeEnd) {
		console.log("Yup, appointment is definitely done");
		self.endAppointment(function(err) {
			if (err) {
				console.log(err);
			} else {
				console.log("Appointment finished without any errors. We good!");
			}
		})
	}
};

var calculateCosts = function(session, callback) {
	var self = session;
	self.hasEnded = true;

	var begin = self.appointmentBegin;
	var end = self.appointmentEnd;

	// Gets hours up-to 2 decimal places
	var hours = Math.floor((Math.abs(end - begin) / 36e5) * 100) / 100;
	var fullHours = Math.floor(hours);
	var partialHours = hours - fullHours;

	var totalHours = 0;
	if (partialHours > 0.75) {
		totalHours = 1;
	} else if (partialHours > 0.50) {
		totalHours = 0.75;
	} else if (partialHours > 0.25) {
		totalHours = 0.50;
	} else if (partialHours > 0.05) {
		totalHours = 0.25;
	}

	totalHours += fullHours;
	if (totalHours >=  baseTime && totalHours < 0.75) {
		totalHours = defaultHours;
	}
	console.log("Total Hours: " + totalHours);

	self.hoursOfService = totalHours;

	// Rounds amount due to 2 decimal places to pennies
	var amountDue = Math.floor(self.hoursOfService * self.hourlyRate * 100) / 100;
	console.log(amountDue);
	return callback(null, amountDue);
};

sessionSchema.methods.endAppointment = function(callback) {
	var self = this;
	
	calculateCosts(self, function(err, amountDue) {
		self.totalCost = amountDue;

		self.save(function(err) {

			var immediately = new Date(Date.now());

			var updateJob = schedule.scheduleJob(immediately, 
				updateIsInSession.bind(null, self, function(err) {
					console.log("updateIsInSession complete");
					if (err) {
						console.log(err);
					}
				})
			);

			var date = minuteLater(new Date());
			var chargeStudentJob = schedule.scheduleJob(date,
				chargeStudent.bind(null, self, function(err) {
					console.log("ChargeStudent complete");
					if (err) {
						console.log(err);
					}
				})
			);
			return callback(err);
		});
	});
};

var updateIsInSession = function(session, callback) {
	var tutorId = session._tutor;
	var studentId = session._student;

	User.findOneAndUpdate({"_id": tutorId}, {"isInSession": false}, function(err) {
		if (err) {
			console.log(err);
		}
		User.findOneAndUpdate({"_id": studentId}, {"isInSession": false}, function(err) {
			if (err) {
				console.log(err);
			}
			return callback();
		})
	});
}

var chargeStudent = function(session, callback) {
	var self = session;

	var amount = self.totalCost;
	if (amount > 0.50) {

		CreditCard.findOne({
			"_user": self._student
		})
		.exec(function(err, card) {
			if (err || !card) {
				console.log(err);
				callback(err);
			} else {
				console.log("CARD FOUND");
				var customerId = card.stripe_id;
				var studentEmail = card.userEmail;
				// Send an email to student if charge successful. Use temp email.
				studentEmail = "ospsn101@gmail.com";

				var pennies = Math.floor(amount * 100);
				var dollars = Math.floor(pennies / 100);
				var cents = Math.floor(pennies % 100);

				var now = new Date();
				// Month + 1 because months start at 0 for some reason.
				var dateString = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();
				var description = "Toucan Tutoring session lasting " + self.hoursOfService +
					" hour(s) at a rate of $" +  self.hourlyRate + "/hour on " + dateString
					+ ". Total Cost: $" + dollars + "." + cents + ".";

				console.log(description);


				stripe.charges.create({
					"amount": pennies,
					"currency": "usd",
					"customer": customerId,
					"description": description,
				}, function(err, charge_object) {
					if (err) {
						// The card has been declined;
						console.log(err);
						return callback(err);
					} else {
						var chargeParams = {
							'currency': "usd",
							'amount': amount,
							'description': description,
							"charge_object": charge_object,
						}
						var charge = new Charge(chargeParams);
						charge.addSession(self, function(err) {
							if (err) {
								callback(err);
							} else {
								console.log("CHARGE SAVED");
								card.addCharge(charge, function(err) {
									if (err) {
										callback(err);
									} else {
										self.save(function(err) {
											if (err) {
												console.log(err);
												return callback(err);
											} else {
												// Schedule paying tutor in 2 days
												var date = twoDaysLater(new Date());
												var job = schedule.scheduleJob(date, payTutor
													.bind(null, self, function(err) {
														console.log("Bank Transfer Complete")
														if (err) {
															console.log(err);
														}
													})
												);

												// Schedule paying Toucan in 2 days
												var date = twoDaysLater(new Date());
												var job = schedule.scheduleJob(date, payToucan
													.bind(null, self, function(err) {
														console.log("Toucan Payment Is Complete!");
														if (err) {
															console.log(err);
														}
													})
												);

												return callback(err);
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
	} else {
		self.save(callback);
	}
};

var payTutor = function(session, callback) {
	console.log("Pay Tutor");
	var self = session;
	var amount = self.totalCost;

	BankAccount.findOne({
		"_user": self._tutor
	})
	.exec(function(err, account) {
		if (err || !account) {
			console.log(err);
			return callback(err);
		} else {
			console.log("Found Bank Account");
			// Create a transfer to the specified recipient
			var recipientId = account.stripe_id;
			var pennies = Math.floor(amount * 100 * percentTutor);

			var dollars = Math.floor(pennies / 100);
			var cents = Math.floor(pennies % 100);

			var now = new Date();
			// Month + 1 because months start at 0 for some reason.
			var dateString = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();
			var description = "Payment by Toucan Tutoring for teaching " + self.course +
				" on "  + dateString + ". Compsensation of $" + dollars + "." + cents + ".";

			console.log(description);

			var bank_account_id = account.stripe_token.active_account.id;

			stripe.transfers.create({
				"amount": pennies,
				"currency": "usd",
				"recipient": recipientId,
				"bank_account": bank_account_id,
				"statement_descriptor": description,
				"description": description,

			}, function(err, transfer_obj) {
				if (err || !transfer_obj) {
					console.log(err);
					return callback(err);
				} else {
					var transferParams = {
						'currency': "usd",
						'amount': amount,
						'description': description,
						"_recipient": self._tutor,
						"transfer_obj": transfer_obj,
					};
					var transfer = new Transfer(transferParams);
					transfer.addSession(session, function(err) {
						if (err) {
							callback(err);
						} else {
							console.log("Transfer SAVED");
							account.addTransfer(transfer, function(err) {
								if (err) {
									callback(err);
								} else {
									self.save(callback);
								}
							});
						}
					});
				}
			});
		}
	});
};

var payToucan = function(session, callback) {
	console.log("Pay Toucan");
	var self = session;
	var amount = self.totalCost;
	var amountDollars = Math.floor(amount);
	var amountCents = Math.floor(amount * 100) % 100;

	var pennies = Math.floor(amount * 100 * percentToucan);
	var dollars = Math.floor(pennies / 100);
	var cents = Math.floor(pennies % 100);


	var now = new Date();
	// Month + 1 because months start at 0 for some reason.
	var dateString = (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear();
	var description = "Toucan Tutoring automated payment for session: " + self._id  + " on "
		+ dateString + ". Session Cost: $" + amountDollars + "." + amountCents
		+ ". Self-payment: $" + dollars + "." + cents;

	console.log(description);
	
	var bank_account_id = toucan_bank_id;
	var recipientId = toucan_transfer_id;

	stripe.transfers.create({
		"amount": pennies,
		"currency": "usd",
		"recipient": recipientId,
		"bank_account": bank_account_id,
		"statement_descriptor": description,
		"description": description,

	}, function(err, transfer_obj) {
		if (err || !transfer_obj) {
			console.log(err);
			return callback(err);
		} else {
			return callback(err);
		}
	});
};

sessionSchema.plugin(autoIncrement.plugin, {
	model: sessionCollection,
	startAt: 5563,
	incrementBy: (63 * 107 * 11),
});

module.exports = mongoose.model(sessionCollection, sessionSchema);