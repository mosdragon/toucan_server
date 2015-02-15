var mongoose = require("../../db");
var creditCardCollection = "CreditCards";
var chargesCollection = "Charges";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);

var chargesSchema = new mongoose.Schema({
	currency: {type: String, default: "usd"},
	amount: Number,
	description: String,
	dateCreated: {type: Date, default: new Date()},
});

chargesSchema.plugin(autoIncrement.plugin, {
	model: chargesCollection,
	startAt: 674339,
	incrementBy: (207 * 83 * 97),
});



var creditCardSchema = new mongoose.Schema({
	_user: {type: Number, ref: "Users"},
	_charges: {type: [Number], ref: "Charges"},
	userEmail: String,
    blurred_number: {type: String, default: "XXXX-XXXX-XXXX-"},
    stripe_id: {type: String},
    stripe_token: {type: Object},
});

creditCardSchema.plugin(autoIncrement.plugin, {
	model: creditCardCollection,
	startAt: 77092,
	incrementBy: (13 * 403 * 17),
});

creditCardSchema.methods.setStripeId = function() {
	this.stripe_id = stripe_token.id;
};

creditCardSchema.methods.setBlurredNumber = function(input) {
	this.blurred_number += input;
};

creditCardSchema.methods.addCharge = function(charge) {
	this._charges.push(charge)
};

module.exports = mongoose.model(creditCardCollection, creditCardSchema);


// stripe.charges.create({
//   amount: 400,
//   currency: "usd",
//   card: {
//     number: '4242424242424242',
//     exp_month: 12,
//     exp_year: 2016,
//     cvc: '123'
//   },
//   description: "Charge for test@example.com"
// }, function(err, charge) {
//   // asynchronously called
// });