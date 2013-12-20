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
		stream = fs.open('./results.txt', 'w');
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
		username: "test123",
		password: "test123",
		url: "http://www.supersecreta.org.au/account/login",
		usernameParam: "NameOrEmail",
		passwordParam: "Password",
	},
	urlSettings: {
		queryStringExclusions: ["page", "author", "pagesize", "ipaddress", "nacs", "tag", "postingtype", "subscriptionid", "username"],
		rateLimits: [ 	{ segment: '/services/', limit: 30}, 
						{ segment: '/tags/', limit: 30 },
						{ segment: '/info/', limit: 50 },
						{ segment: '/emails/edit/', limit: 20 },
						{ segment: '/opinions/', limit: 25 },
						{ segment: '/treatmentfunctions/edit/', limit: 20 },
						{ segment: '/subscriptions/', limit: 50 },						
						{ segment: '/users/', limit: 10 }						
					],
		additionalChecks: [ ] //UrlStore.rules.ignoreNumericLastSection ]
	},
	// onError: onError, don't care about errors.
	perPageCallback: perPageCallback,
	finishedCallback: finishedCallback,
	startingUrls: [
		'www.supersecreta.org.au/moderation', 
		'www.supersecreta.org.au/subscriptions?PartOfName=a', 
		'www.supersecreta.org.au/reports/member-listing', 
		'www.supersecreta.org.au/reports/opinion-summary?tag=ankle'],
	ignoreUrls: ['www.supersecreta.org.au/account/logout',
				'www.supersecreta/account/testemailfor']
});