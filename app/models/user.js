var mongoose = require("../../db");
var BankAccount = require("./bankAccount");
var reviewSchema = require("./review").schema;
var baseRate = require("../../config").baseRate;

var rateCollection = "Rates";
var userCollection = "Users";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var bcrypt = require('bcrypt')
var SALT_WORK_FACTOR = 12;

// var rateSchema = new mongoose.Schema({
// 	course: String,
// 	rate: Number,
// });

// rateSchema.methods.getCourse = function() {
// 	return this.course;
// };

// rateSchema.methods.getRate = function() {
// 	return this.rate;
// };

// rateSchema.methods.setCourse = function(update) {
// 	this.course = update;
// };

// rateSchema.methods.setRate = function(update) {
// 	this.rate = update;
// };

// rateSchema.plugin(autoIncrement.plugin, {
// 	model: rateCollection,
// 	startAt: 104940,
// 	incrementBy: (11 * 97 * 17),
// });

// var Rate = mongoose.model(rateCollection, rateSchema);



var userSchema = new mongoose.Schema({

	_creditCards: {type: [Number], ref: "CreditCards", default: []},
	_sessions: {type: [Number], ref: "Sessions", default: []},
	_bankAccounts: {type: [Number], ref: "BankAccounts", default: []},
	firstName: String,
	lastName: String,
	username: {type: String, unique:  true},
	emailAddress: {type: String, unique: true},
	password: String,
	deleted: {type: Boolean, default: false}, 
	dateCreated: Date,
	dateDeleted: {type: Date, required: false, default: null},

	// Can be Tutor, Tutee, or both. We just want to have proper documentation added to enable both
	userType: {type: String, enum: ["TUTOR", "TUTEE", "BOTH"], required: true, default: "TUTEE"},

	// Only applies to tutors
	_reviews: {type: [Number], ref: "Reviews", default: []},
	coursesTaught: {type: [String], required: false, default: []},
	hourlyRates: {type: Object, required: false, default: {}},
	isCertified: {type: Boolean, default: false},
	biography: {type: String},
});

userSchema.plugin(autoIncrement.plugin, {
	model: userCollection,
	startAt: 903778,
	incrementBy: 13 * 13,
});

userSchema.plugin(autoIncrement.plugin, {
	model: userCollection,
	startAt: 6007949,
	// Multiplying two prime numbers together to make it harder to guess
	incrementBy: 7 * 21,
	field: 'identifier',
});

// Array fields can have single pieces of data pushed to them

userSchema.methods.addCreditCards = function(creditCard) {this._creditCards.push(creditCard)};
userSchema.methods.addSession = function(session) {this._sessions.push(session)};
userSchema.methods.addReview = function(review) {this.reviews.push(review)};

// userSchema.methods.addCourse = function(coursename) {
// 	this.addCourse(coursename, baseRate);
// };

userSchema.methods.addCourse = function(coursename, rate) {
	var setRate = rate? rate : baseRate;
	
	if (this.coursesTaught.indexOf(coursename) == -1) {
	    // In the array!
	    this.coursesTaught.push(coursename);
	}
	if (!this.hourlyRates) {
		this.hourlyRates = {};
	}
	this.hourlyRates[coursename] = rate;
};

userSchema.methods.addManyCourses = function(courses, rates) {
	
	for (var i = 0; i < courses.length; i++) {
		this.addCourse(courses[i], baseRate);
	}
};


userSchema.methods.addBankAccountInfo = function(info, callback) {
	var self = this;

	var user = self._id;
	var userEmail = self.emailAddress;
    var stripe_token = info.stripe_token;
    console.log(stripe_token);
    var legal_name = info.legal_name;

    var params = {
    	'_user': user,
    	'userEmail': userEmail,
    	'stripe_token': stripe_token,
    	'legal_name': legal_name
    };
    console.log(params);

    var addition = new BankAccount(params);
    addition.save(function(err) {
    	if (err) {
    		console.log(err);
    		return callback(err);
    	} else {
	    	self._bankAccounts.push(addition._id);
	    	self.save(function(err) {
		    	if (err) {
		    		return callback(err);
		    		console.log(err);
		    	}
		    	return callback(err, addition);
	    	});
	    }
    });
    // self._bankAccounts.push(addition); 
}

userSchema.methods.addBankToken = function(info, callback) {
	var self = this;

	var user = self._id;
	var userEmail = self.emailAddress;
    var bank_token = info.bank_token;
    var legal_name = info.legal_name;

    var params = {
    	'_user': user,
    	'userEmail': userEmail,
    	'stripe_token': bank_token,
    	'legal_name': legal_name
    };

    var addition = new BankAccount(params);
    addition.save(function(err) {
    	if (err) {
    		console.log(err);
    		return callback(err);
    	}
    	self._bankAccounts.push(addition._id);
    	self.save(function(err) {
	    	if (err) {
	    		return callback(err);
	    		console.log(err);
	    	}
	    	return callback(err, addition);
	    });
    });
    // self._bankAccounts.push(addition); 
}

// Hash Password
userSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (user.isModified('password')) {

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
	} else {
		return next();
	}
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