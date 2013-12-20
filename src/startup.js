/* globals require, phantom */

var PSIM = require('./phantom-spider-image-bot'),
	fs = require('fs'),	
	UrlStore = require('./urlStore'),
	stream;

	
function onError (details) {
	console.log("Error: " + JSON.stringify(details));
}	
function perPageCallback (status, url) {
	console.log("PROCESSED - " + status + " - " + url);
}
function finishedCallback (images) {
	try {
		stream = fs.open('./results_PO.txt', 'w');
		stream.writeLine('Images used: ');
		for (var p in images) {
			if (images.hasOwnProperty(p)) {
				stream.writeLine(p);
			}
		}
		stream.flush();
		stream.close();
	} finally {
		phantom.exit(); 
	}
} 

PSIM.start({
	loginRequired: true,
	loginSettings: {
		username: "",
		password: "",
		url: "",
		usernameParam: "NameOrEmail",
		passwordParam: "Password",
	},
	urlSettings: {
		queryStringExclusions: ["page", "author", "pagesize", "ipaddress", "nacs", "tag", "postingtype"],
		rateLimits: [ 	{ segment: '/services/', limit: 50}, 
						{ segment: '/tags/', limit: 10 },
						{ segment: '/info/', limit: 20 },
						{ segment: '/emails/edit/', limit: 10 },
						{ segment: '/opinions/', limit: 50 },
						{ segment: '/edit/', limit: 50 }],
		additionalChecks: [ ] //UrlStore.rules.ignoreNumericLastSection ]
	},
	// onError: onError, don't care about errors.
	perPageCallback: perPageCallback,
	finishedCallback: finishedCallback,
	startingUrls: [],
	ignoreUrls: []
});