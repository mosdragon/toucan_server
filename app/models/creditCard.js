var mongoose = require("../../db");
var creditCardCollection = "CreditCards";

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose);


var creditCardSchema = new mongoose.Schema({
	_user: {type: Number, ref: "Users"},
	_charges: {type: [Number], ref: "Charges"},
	userEmail: String,
    cardNumber: {type: String, default: "XXXX-XXXX-XXXX-"},
    stripe_id: {type: String, unique: true},
    stripe_token: {type: Object, unique: true},
});

creditCardSchema.plugin(autoIncrement.plugin, {
	model: creditCardCollection,
	startAt: 77092,
	incrementBy: (13 * 403 * 17),
});

creditCardSchema.methods.addCharge = function(charge, callback) {
	var self = this;
	self._charges.push(charge._id);
	self.save(callback);

};

creditCardSchema.methods.setCardNumber = function(card) {
	this.cardNumber += String(card);
}

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