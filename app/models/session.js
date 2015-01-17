var mongoose = require("../../db");
var sessionCollection = "Sessions";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var sessionSchema = new mongoose.Schema({
	_tutor: {type: Number, ref: "User", required: true},
	tutorPhone: Number,
	_student: {type: Number, ref: "User", required: true},
	studentPhone: Number,
	appointmentCreated: {type: Date, default: },
	appointmentBegin: Date,
	appointmentEnd: Date,
	hoursOfService: Number,
	hourlyRate: Number,
	totalCost: Number,
	_creditCard: {type: Number, ref: "CreditCard"},
});

sessionSchema.methdos.beginAppointment = function() {
	this.appointmentBegin = new Date();
};

sessionSchema.methdos.endAppointment = function() {
	this.appointmentEnd = new Date();

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
	} else if (partialHours > 0.01) {
		total = 0.25;
	}

	total += fullHours;

	this.hoursOfService = total;

	// Rounds amount due to 2 decimal places/ to pennies
	var amountDue = Math.floor(this.hoursOfService * this.hourlyRate * 100) / 100;
	this.totalCost = amountDue;

	this.makePayment();
};

sessionSchema.methods.makePayment = function() {

};

sessionSchema.plugin(autoIncrement.plugin, {
	model: sessionCollection,
	startAt: 103,
	incrementBy: 10,
});

module.exports = mongoose.model(sessionCollection, sessionSchema);