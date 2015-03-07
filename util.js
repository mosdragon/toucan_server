
// Distance conversion factors
var milesToKM = 1.60934;
var milesToMeters = function(miles) {
	var km = miles * milesToKM;
	return km * 1000;
}

var utils = {
	'milesToMeters': milesToMeters,
};

module.exports = utils;
