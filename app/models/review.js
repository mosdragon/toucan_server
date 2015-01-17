var mongoose = require("../../db");
var collectionName = "Reviews";

var reviewSchema = mongoose.Schema({
	_id: {type: Number},
	_tutor: {type: Number},
	_student: {type: Number},
	tutorName: {type: String, required: true},
	tutorId: {type: Number, ref: "User"},
	rating: {type: Number, required: true},
	title: String,
	description: String,
	dateWritten: Date,
	deleted: Boolean,

});



module.exports = mongoose.model(collectionName, reviewSchema);