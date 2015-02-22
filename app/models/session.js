var mongoose = require("../../db");
var sessionCollection = "Session";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var sessionSchema = new mongoose.Schema({
	_tutor: {type: Number, ref: "User", required: true},
	tutorPhone: String,
	_student: {type: Number, ref: "User", required: true},
	studentPhone: String,
	appointmentCreated: {type: Date, default: new Date()},
	appointmentBegin: Date,
	appointmentEnd: Date,
	hoursOfService: Number,
	course: String,
	hourlyRate: Number,
	totalCost: Number,
	_creditCard: {type: Number, ref: "CreditCard"},
});

sessionSchema.methods.beginAppointment = function() {
	this.appointmentBegin = new Date();
};

sessionSchema.methods.endAppointment = function() {
	var self = this;
	
	self.appointmentEnd = new Date();

	// Gets hours up-to 2 decimal places
	var hours = Math.floor((Math.abs(date1 - date2) / 36e5) * 100) / 100;
	var fullHours = Math.floor(hours);
	var partialHours = hours - fullHours;

	var total;
	if (partialHours > 0.75) {
		total = 1;
	} else if (partialHours > 0.50) {
		total = 0.75;
	} else if (partialHours > 0.25) {
		total = 0.50;
	} else if (partialHours > 0.03) {
		total = 0.25;
	}

	total += fullHours;

	self.hoursOfService = total;

	// Rounds amount due to 2 decimal places/ to pennies
	var amountDue = Math.floor(self.hoursOfService * self.hourlyRate * 100) / 100;
	self.totalCost = amountDue;

	self.makePayment();
};

sessionSchema.methods.makePayment = function() {

};

sessionSchema.plugin(autoIncrement.plugin, {
	model: sessionCollection,
	startAt: 5563,
	incrementBy: (63 * 107 * 11),
});

module.exports = mongoose.model(sessionCollection, sessionSchema);