var mongoose = require("../../db");
var sessionCollection = "Session";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var stripe_api_key = require("../../config").dev.stripe_api_key;
var stripe = require("stripe")(stripe_api_key);

// How much Toucan keeps vs what percentage a tutor gets
var toucan_bank_id = require("../../config").dev.toucan_bank_id;
var percentTutor = require("../../config").dev.percentTutor / 100;
var percentToucan = 1 - percentTutor;

var User = require("../models/user");
var CreditCard = require("../models/creditCard");
var BankAccount = require("../models/bankAccount");
var Charge = require("../models/charge");
var Transfer = require("../models/transfer");

var sessionSchema = new mongoose.Schema({

	_creditCard: {type: Number, ref: "CreditCard"},
	_tutor: {type: Number, ref: "User", required: true},
	tutorPhone: String,
	_student: {type: Number, ref: "User", required: true},
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
	if (self.tutorTimeBegin !== undefined && self.tutorTimeBegin < self.tuteeTimeBegin) {
		self.appointmentBegin = self.tuteeTimeBegin;
		self.hasBegun = true;
		self.save(callback)
	} else {
		self.save(callback);
	}
};

sessionSchema.methods.tutorBegin = function(callback) {
	var self = this;
	self.tutorTimeBegin = new Date();
	if (self.tuteeTimeBegin !== undefined && self.tuteeTimeBegin < self.tutorTimeBegin) {
		self.appointmentBegin = self.tutorTimeBegin;
		self.hasBegun = true;
		self.save(callback);
	} else {
		self.save(callback);
	}
};

sessionSchema.methods.tuteeEnd = function(callback) {
	var self = this;
	self.tuteeTimeEnd = new Date();
	if (self.tutorTimeEnd !== undefined && self.tutorTimeEnd < self.tuteeTimeEnd) {
		self.appointmentEnd = self.tuteeTimeEnd;
		self.endAppointment(function(err) {
			self.save(callback);
		});
	} else {
		self.save(callback);
	}
};

sessionSchema.methods.tutorEnd = function(callback) {
	var self = this;
	self.tutorTimeEnd = new Date();
	if (self.tuteeTimeEnd !== undefined && self.tuteeTimeEnd < self.tutorTimeEnd) {
		self.appointmentEnd = self.tutorTimeEnd;
		self.endAppointment(function(err) {
			self.save(callback);
		});
	} else {
		self.save(callback);
	}
};

sessionSchema.methods.endAppointment = function(callback) {
	var self = this;
	
	self.appointmentEnd = new Date();
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
	if (totalHours < 0.5) {
		totalHours = 0.5;
	}
	console.log("Total Hours: " + totalHours);

	self.hoursOfService = totalHours;

	// Rounds amount due to 2 decimal places to pennies
	var amountDue = Math.floor(self.hoursOfService * self.hourlyRate * 100) / 100;
	console.log(amountDue);
	self.totalCost = amountDue;

	self.chargeStudent(callback);
};

sessionSchema.methods.chargeStudent = function(callback) {
	console.log("~~~~~~~~~~~~~~~~chargeStudent called");
	var self = this;

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


				stripe.charges.create({
					"amount": amount * 100,
					"currency": "usd",
					"customer": customerId,
				}, function(err, charge) {
					if (err) {
						// The card has been declined;
						console.log('CHARGE DELINED');
						console.log(err);
						return callback(err);
					} else {
						console.log("CHARGE CREATED");
						var description = "Tutoring session lasting " + self.hoursOfService +
							" hours at a rate of " +  self.hourlyRate + ". Total Cost: $" + amount;
						var chargeParams = {
							'currency': "usd",
							'amount': amount,
							'description': description,
						}
						var charge = new Charge(chargeParams);
						charge.save(function(err) {
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
												self.payTutor(callback);
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

sessionSchema.methods.payTutor = function(callback) {
	var self = this;
	var amount = self.totalCost;

	console.log("~~~~~~payTutor");

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
			var description = "Payment by Toucan Tutoring for teaching " + self.course +
				". Compsensation of $" + pennies/100 + ".";

			console.log(description);

			console.log("PAYMENT RECEIEVED: " + amount * 100);
			console.log("PAYMENT SENDING: " + pennies);
			var bank_account_id = account.stripe_token.active_account.id;

			stripe.transfers.create({
				"amount": pennies,
				"currency": "usd",
				"recipient": recipientId,
				"bank_account": bank_account_id,
				"statement_descriptor": description,
			}, function(err, transfer_obj) {
				if (err || !transfer_obj) {
					console.log(err);
					return callback(err);
				} else {
 					console.log("Transfer Created");
					var transferParams = {
						'currency': "usd",
						'amount': amount,
						'description': description,
						"_recipient": self._tutor,
						"transfer_obj": transfer_obj,
					};
					var transfer = new Transfer(transferParams);
					console.log(transfer);
					transfer.save(function(err) {
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

sessionSchema.plugin(autoIncrement.plugin, {
	model: sessionCollection,
	startAt: 5563,
	incrementBy: (63 * 107 * 11),
});

module.exports = mongoose.model(sessionCollection, sessionSchema);