var mongoose = require("../../db");
var reviewCollection = "Reviews";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var reviewSchema = new mongoose.Schema({
	_tutor: {type: Number, ref: "Users"},
	_student: {type: Number, ref: "Users"},
	_session: {type: Number, ref: "Sessions", unique: true, required: true},
	studentUsername: {type: String, required: true},
	rating: {type: Number, required: true},
	title: {type: String, default: ""},
	details: {type: String, default: ""},
	course: String,
	hourlyRate: Number,
	dateWritten: {type: Date, default: new Date()},
});

reviewSchema.plugin(autoIncrement.plugin, {
	model: reviewCollection,
	startAt: 997994,
	incrementBy: (103 * 17 * 23),
});

module.exports = mongoose.model(reviewCollection, reviewSchema);