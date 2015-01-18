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
	startAt: 101,
	incrementBy: 10,
});



var creditCardSchema = new mongoose.Schema({
	_user: {type: Number, ref: "Users"},
	_charges: {type: Number, ref: "Charges"},
	userEmail: String,
    number: String,
    exp_month: Number,
    exp_year: Number,
    cvc: String,
});

creditCardSchema.plugin(autoIncrement.plugin, {
	model: creditCardCollection,
	startAt: 102,
	incrementBy: 10,
});

module.exports = mongoose.model(creditCardCollection, creditCardSchema);

// var stripe = require("stripe")(
//   "sk_test_BQokikJOvBiI2HlWgH4olfQ2"
// );

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