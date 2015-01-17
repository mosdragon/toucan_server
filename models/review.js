var db = require("db");
var mongoose = require("mongoose");
var collectionName = "Reviews";


var reviewSchema = mongoose.Schema({
	_id: {type: Number, },
	_tutor: {type: Number, },
	_student: {type: Number, },
	tutorName: {type: String, required: true},
	tutorId: {type: Number, ref: "User"},
	rating: {enum: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5], required: true},
	title: String,
	description: String,
	dateWritten: Date,
	deleted: Boolean,

});



module.exports = mongoose.Model(collectionName, reviewSchema);