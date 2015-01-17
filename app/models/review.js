var mongoose = require("../../db");
var reviewCollection = "Reviews";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var reviewSchema = new mongoose.Schema({
	_tutor: {type: Number, ref: "User"},
	_student: {type: Number, ref: "User"},
	tutorName: {type: String, required: true},
	tutorId: {type: Number, ref: "User"},
	rating: {type: Number, required: true},
	title: String,
	description: String,
	course: String,
	hourlyRate: Number,
	dateWritten: {type: Date, default: new Date()},
	deleted: {type: Boolean, default: false},

});

reviewSchema.plugin(autoIncrement.plugin, {
	model: reviewCollection,
	startAt: 104,
	incrementBy: 10,
});

module.exports = mongoose.model(reviewCollection, reviewSchema);