var mongoose = require("../../db");
var sessionCollection = "Session";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

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

	var total = 0;
	if (partialHours > 0.75) {
		total = 1;
	} else if (partialHours > 0.50) {
		total = 0.75;
	} else if (partialHours > 0.25) {
		total = 0.50;
	} else if (partialHours > 0.05) {
		total = 0.25;
	}

	total += fullHours;
	console.log(total);

	self.hoursOfService = total;

	// Rounds amount due to 2 decimal places/ to pennies
	var amountDue = Math.floor(self.hoursOfService * self.hourlyRate * 100) / 100;
	console.log(amountDue);
	self.totalCost = amountDue;

	self.makePayment(callback);
};

sessionSchema.methods.makePayment = function(callback) {
	var self = this;
	self.save(callback);
};

sessionSchema.plugin(autoIncrement.plugin, {
	model: sessionCollection,
	startAt: 5563,
	incrementBy: (63 * 107 * 11),
});

module.exports = mongoose.model(sessionCollection, sessionSchema);