var db = require("db");
var mongoose = require("mongoose");

var userCollection = "User"

var rateSchema = mongoose.Schema({
	course: String,
	rate: Number,
});

rateSchema.methods.getCourse = function() {
	return this.course;
};

rateSchema.methods.getRate = function() {
	return this.rate;
};

rateSchema.methods.setCourse = function(update) {
	this.course = update;
};

rateSchema.methods.setRate = function(update) {
	this.rate = update;
};



var userSchema = mongoose.Schema({

	firstName: String,
	lastName: String,
	username: String,
	emailAddress: String,
	password: String,
	deleted: {type: boolean, default: false}.
	dateCreated: Date,
	dateDeleted: {required: false, default: null},
	identifier: {required: true, type: Number},

	// For now, usertype TUTOR is created in case we want tutors that absolutely cannot be students
	userType: {enum: {"STUDENT", "TUTOR", "BOTH"}, required: true},

	// Only applies to tutors
	coursesTaught: {type: [String], required: false, default: null},
	rates: {type: [rateSchema], required: false, default: null},
	reviews: {type: }
});

// Getters

userSchema.methods.getFirstName = function() {return this.firstName};
userSchema.methods.getLasttName = function() {return this.lastName};
userSchema.methods.getUsername = function() {return this.username};
userSchema.methods.getEmailAddress = function() {return this.emailAddress};

// Might not want this
userSchema.methods.getPassword = function() {return this.password};

userSchema.methods.isDeleted = function() {return this.deleted};
userSchema.methods.getDateCreated = function() {return this.dateCreated};
userSchema.methods.getDateDeleted = function() {return this.dateDeleted};
userSchema.methods.getIdentifier = function() {return this.identifier};

userSchema.methods.getUserType = function() {return this.userType};
userSchema.methods.getCoursesTaught = function() {return this.coursesTaught};
userSchema.methods.getRates = function() {return this.rates};


// Setters	

userSchema.methods.setFirstName = function(update) {this.firstName = update};
userSchema.methods.setLasttName = function(update) {this.lastName = update};
userSchema.methods.setUsername = function(update) {this.username = update};
userSchema.methods.setEmailAddress = function(update) {this.emailAddress = update};
userSchema.methods.setPassword = function(update) {this.password = update};
userSchema.methods.setDeleted = function(update) {this.deleted = update};
userSchema.methods.setDateCreated = function(update) {this.dateCreated = update};
userSchema.methods.setDateDeleted = function(update) {this.dateDeleted = update};
userSchema.methods.setIdentifier = function(update) {this.identifier = update};

userSchema.methods.setUserType = function(update) {this.userType = update};
userSchema.methods.setCoursesTaught = function(update) {this.coursesTaught = update};
userSchema.methods.setRates = function(update) {this.rates = update};

// Array fields can use append to add invidual pieces of data
userSchema.methods.addCourseTaught = function(addition) {this.coursesTaught.push(addition)};
userSchema.methods.addRate = function(addition) {this.rates.push(addition)};


module.exports = mongoose.model(userCollection, userSchema);




