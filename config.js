
//provide a sensible default for local development
var db_name = "toucan";
var mongodb_connection_string = 'mongodb://localhost/' + db_name;

//take advantage of openshift env vars when available:
if (process.env.OPENSHIFT_MONGODB_DB_URL){
  mongodb_connection_string = process.env.OPENSHIFT_MONGODB_DB_URL + db_name;
}


var data = {
	dev: {
		mongo:  mongodb_connection_string,
		// Stripe demo key
		stripeApi: "sk_test_BQokikJOvBiI2HlWgH4olfQ2",
		cookiePassword: "insertpasswordhere",
		baseRate: 8,
		baseRateCertified: 18,
	}
};

module.exports = data;