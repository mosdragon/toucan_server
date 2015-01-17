var mongoose = require("../../db");
var reviewSchema = require("./review").schema;

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var bcrypt = require('bcrypt'),
var SALT_WORK_FACTOR = 12;

var rateCollection = "Rate";
var rateSchema = new mongoose.Schema({
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

rateSchema.plugin(autoIncrement.plugin, {
	model: rateCollection,
	startAt: 100,
	incrementBy: 10,
});


var userCollection = "Users";
var userSchema = new mongoose.Schema({

	_creditCards: {type: [Number], ref: "CreditCards", default: []},
	_sessions: {type: [Number], ref: "Sessions", default: []},
	firstName: String,
	lastName: String,
	username: String,
	emailAddress: String,
	password: String,
	deleted: {type: Boolean, default: false}, 
	dateCreated: Date,
	dateDeleted: {type: Date, required: false, default: null},
	identifier: {required: true, type: Number},

	// For now, usertype TUTOR is created in case we want tutors that absolutely cannot be students
	userType: {type: String, enum: ["STUDENT", "TUTOR", "BOTH"], required: true},

	// Only applies to tutors
	_reviews: {type: [Number], ref: "Reviews", default: []},
	coursesTaught: {type: [String], required: false, default: []},
	hourlyRates: {type: [Number], ref: "Rate", required: false, default: []},
});

userSchema.plugin(autoIncrement.plugin, {
	model: userCollection,
	startAt: 100,
	incrementBy: 10,
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
userSchema.methods.getHourlyRates = function() {return this.hourlyRates};
userSchema.methods.getReviews = function() {return this.reviews};
userSchema.methods.getCreditCards = function() {return this._creditCards};

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
userSchema.methods.setHourlyRates = function(update) {this.hourlyRates = update};
userSchema.methods.setReviews = function(update) {this.reviews = update};
userSchema.methods.setCreditCards = function(addition) {this._creditCards = addition};
userSchema.methods.setSession = function(addition) {this._sessions = addition};

// Array fields can have single pieces of data pushed to them

userSchema.methods.addCreditCards = function(addition) {this._creditCards.push(addition)};
userSchema.methods.addSession = function(addition) {this._sessions.push(addition)};
userSchema.methods.addCourseTaught = function(addition) {this.coursesTaught.push(addition)};
userSchema.methods.addHourlyRate = function(addition) {this.hourlyRates.push(addition)};
userSchema.methods.addReview = function(addition) {this.reviews.push(addition)};

// Hash Password
userSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) {
    	return next();
    }

    // Generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) {
        	return next(err);
        } else {
        	// hash the password along with our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) {
            	return next(err);

            } else {
            	// override the cleartext password with the hashed one
	            user.password = hash;
	            next();
            }
        });
        }
    });
});


userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) {
        	console.log(err);
        }
        cb(err, isMatch);
    });
};


module.exports = mongoose.model(userCollection, userSchema);