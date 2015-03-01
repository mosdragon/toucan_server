var mongoose = require("../../db");

var coursesCollection = "Courses";
var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var coursesSchema = new mongoose.Schema({
	course: {type: String, required: true},
	school: {type: String},
	// Using geospatial indexing -- format is [long, lat]
	location: { type: [Number], index: '2dsphere', required: true},
});

coursesSchema.plugin(autoIncrement.plugin, {
	model: coursesCollection,
	startAt: 3312,
	incrementBy: (11 * 3 * 7),
});


module.exports = mongoose.model(coursesCollection, coursesSchema);