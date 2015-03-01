var mongoose = require("../../db");
var BankAccount = require("./bankAccount");
var CreditCard = require("./creditCard");
var TutorCode = require("./tutorCode");

var reviewSchema = require("./review").schema;
var baseRate = require("../../config").dev.baseRate;
var baseRateCertified = require("../../config").dev.baseRateCertified;

var rateCollection = "Rates";
var userCollection = "Users";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var bcrypt = require('bcrypt')
var SALT_WORK_FACTOR = 12;

var userSchema = new mongoose.Schema({

	_creditCards: {type: [Number], ref: "CreditCards", default: []},
	_sessions: {type: [Number], ref: "Sessions", default: []},
	_bankAccounts: {type: [Number], ref: "BankAccounts", default: []},
	firstName: String,
	lastName: String,
	phoneNumber: {type: String, required: true},
	username: {type: String, unique:  true},
	emailAddress: {type: String, unique: true},
	password: String,
	deleted: {type: Boolean, default: false}, 
	dateCreated: Date,
	dateDeleted: {type: Date, required: false, default: null},
	isInSession: {type: Boolean, default: false},

	// Can be Tutor, Tutee, or both. We just want to have proper documentation added to enable both
	userType: {type: String, enum: ["TUTOR", "TUTEE", "BOTH"], required: true, default: "TUTEE"},

	// Only applies to tutors
	_reviews: {type: [Number], ref: "Reviews", default: []},
	coursesTaught: {type: [String], required: false, default: []},
	// hourlyRates: {type: String, required: true, default:"{}"},
	hourlyRates: {type: Object, required: false, default:{}},
	isCertified: {type: Boolean, default: false},
	biography: {type: String, default: ""},
	major: {type: String, default: ""},
	year: {type: String, default: ""},
	rating: {type: Number, default: -1},
});

userSchema.plugin(autoIncrement.plugin, {
	model: userCollection,
	startAt: 903778,
	incrementBy: 13 * 13,
});

// Array fields can have single pieces of data pushed to them

userSchema.methods.addCreditCards = function(creditCard) {this._creditCards.push(creditCard)};
userSchema.methods.addSession = function(session) {this._sessions.push(session)};
userSchema.methods.addReview = function(review) {this.reviews.push(review)};

userSchema.methods.useTutorCode = function(tutorCode, callback) {
	var self = this;
	TutorCode.findOne({
		'tutorCode': tutorCode
	}, function(err, tutorCode) {
		if (err || !tutorCode) {
			var error = err ? err : (new Error("NO TUTOR CODE EXISTS"));
			return callback(error);
		} else {
			self.hourlyRates = tutorCode.rates;
			self.coursesTaught = tutorCode.coursesTaught;
			self.isCertified = tutorCode.isCertified;
			tutorCode.use(function(err) {
				if (err) {
					return callback(err);
				} else {
					self.save(callback);
				}
			});
		}
	});
};

userSchema.methods.addBankToken = function(info, callback) {
	var self = this;

	var user = self._id;
	var userEmail = self.emailAddress;
    var stripe_token = info.stripe_token;
    var legal_name = info.legal_name;
    var accountNumber = info.accountNumber;

    var params = {
    	'_user': user,
    	'userEmail': userEmail,
    	'stripe_token': stripe_token,
    	'stripe_id': String(stripe_token.id),
    	'legal_name': legal_name
    };

    var addition = new BankAccount(params);
    addition.setAccountNumber(accountNumber);
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
};

userSchema.methods.addCardToken = function(info, callback) {
	var self = this;

	var user = self._id;
	var userEmail = self.emailAddress;
    var stripe_token = info.stripe_token;
    var cardNumber = info.cardNumber;

    var params = {
    	'_user': user,
    	'userEmail': userEmail,
    	'stripe_token': stripe_token,
    	'stripe_id': String(stripe_token.id),
    };

    var addition = new CreditCard(params);
    addition.setCardNumber(cardNumber);
    addition.save(function(err) {
    	if (err) {
    		console.log(err);
    		return callback(err);
    	} else {
	    	self._creditCards.push(addition._id);
	    	self.save(function(err) {
		    	if (err) {
		    		return callback(err);
		    		console.log(err);
		    	}
		    	return callback(err, addition);
	    	});
	    }
    });
};

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