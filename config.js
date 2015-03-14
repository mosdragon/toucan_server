// Useful for parsing input
var math = require('mathjs');
//provide a sensible default for local development
var db_name = "beta";
var mongodb_connection_string = 'mongodb://localhost/' + db_name;

//take advantage of openshift env vars when available:
if (process.env.OPENSHIFT_MONGODB_DB_URL){
  	mongodb_connection_string = process.env.OPENSHIFT_MONGODB_DB_URL + db_name;
}

var baseTime = 0;
if (process.env.baseTime) {
	baseTime = math.eval(process.env.baseTime);
}


var data = {
	dev: {
		mongo:  mongodb_connection_string,
		// Stripe demo key
		stripe_api_key: "sk_test_4dRYACzSml2igCRyOvb0d8Xw",
		cookiePassword: "insertpasswordhere",
		baseRate: 8,
		baseRateCertified: 18,
		toucan_bank_id: "ba_15bJsYHnsjstms08Q6FPoH5I",
		toucan_transfer_id: "rp_15bJqCHnsjstms08oyZH6xmU",
		percentTutor: 80,
		percentStripe: 5,
		tutorRadius: 3, // in Miles
		courseRadius: 15, // in Miles
		defaultHours: 0.75, // Hours automatically charged if Session ends within an hour
		baseTime: baseTime, // If Openshift passes in a value, use that instead. Time must be
		// greater than this time to count it as a session
	}
};

module.exports = data;