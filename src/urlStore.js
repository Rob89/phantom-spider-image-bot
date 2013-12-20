/* globals exports, require */

var utils = require('./utilities');

var UrlStore = function (config) {
	var removeDuplicateUrls, shouldVisitUrl, removeExcludedQS, cleanUrl,
		removeLastCharIfEndsWith, defaults, initialize,
		visitedUrls = [],
		ignoredUrls = [],
		urlsToVisit = [],
		limitCounters = {},
		that = this;
	
	defaults = {
        queryStringExclusions: [],
		rateLimits: [],
		additionalChecks: []
	};	
	
	initialize = function () {
		that.options = utils.extend(defaults, config);
		limitCounters.urlsServed = 0;
		var i,
			rateLimits = that.options.rateLimits,
			l = rateLimits.length;
		for (i = 0; i < l; i++) {
			limitCounters[rateLimits[i].segment] = 0;
		}
	};
		
	removeLastCharIfEndsWith = function (str, ch) {
		if (str.indexOf(ch) === str.length - 1) {
			return str.slice(0, -1);
		} else {
			return str;
		}
	};
	
    removeExcludedQS = function (url) {
        var i, regex, getFirstChar, 
			exclusions = that.options.queryStringExclusions,
			l = exclusions.length;
        if (url.indexOf('?') === -1 || l === 0) { return url; }
        getFirstChar = function (a) { return a.charAt(0); };
		for (i = 0; i < l; i++) {
			regex = new RegExp('[?&]' + exclusions[i] + '=([^&]*)&??', 'g');
            url = url.replace(regex, getFirstChar);
            url = removeLastCharIfEndsWith(url, '&');
		}
        url = removeLastCharIfEndsWith(url, '?');
        return removeLastCharIfEndsWith(url, '/');
    };
    
	cleanUrl = function (url) {
		url = url.toLowerCase();
        url = removeExcludedQS(url);	
		return url.replace('/?', '?');
	};
	
	removeDuplicateUrls = function () {
		urlsToVisit = urlsToVisit.filter(function (elem, pos, self) {
			return self.indexOf(elem) === pos;
		});
	};
	
	shouldVisitUrl = function (url) {
		var i, l, j, l2, matching, rule,
			additionalChecks = that.options.additionalChecks,
			limiters = that.options.rateLimits;	
		url = cleanUrl(url);
		l = additionalChecks.length;
		l2 = limiters.length;
		matching = visitedUrls.filter(function (elem) {
			for (i = 0; i < l; i++) {
				if (additionalChecks[i](url, elem)) { return true; }
			}
			for (j = 0; j < l2; j++) {
				rule = limiters[j];
				if (elem.indexOf(rule.segment) !== -1 &&
                        url.indexOf(rule.segment) !== -1 &&
                        limitCounters[rule.segment] >= rule.limit) { 
                    return true; 
                }
			}
			if (ignoredUrls.indexOf(url) !== -1) { return true; }
			return elem === url;
		});
		return matching.length === 0;
	};
	
	// Adds urls to the current instance. 
	// e.g. addUrls("www.google.co.uk", "www.abc.com", ["www.patientopinion.org.uk", "www.a.com"]);
	this.addUrls = function () {
		var i, j, l2, url,
			urls = Array.prototype.slice.apply(arguments),
			l = urls.length;
		if (l === 0) { return that; }
		for (i = 0; i < l; i++) {
			if (Object.prototype.toString.apply(urls[i]) == '[object Array]') {
				l2 = urls[i].length;
				for (j = 0; j < l2; j++) { that.addUrls(urls[i][j]); }				
			} else {
				url = cleanUrl(urls[i]);
				if (shouldVisitUrl(url)) {
					urlsToVisit.push(url);
				}
			}
		}
		removeDuplicateUrls();
		return that; // support chaining?
	};
	
	this.addIgnoredUrl = function (url) {
		url = cleanUrl(url);
		ignoredUrls.push(url);
	};
	
	this.getNextUrl = function () {
		var url, i,
			limits = that.options.rateLimits, 
			l = limits.length;
		removeDuplicateUrls();
		if (limitCounters.urlsServed++ % 10 === 0) {
				console.log(urlsToVisit.length + " urls left to visit.");
			};
		while (!url && urlsToVisit.length > 0) {
			url = urlsToVisit.shift();
			if (!shouldVisitUrl(url)) { url = ''; }
		}
		if (url) { 
            visitedUrls.push(url);
        } else {
            return '';
        }
		for (i = 0; i < l; i++) {
			if (url.indexOf(limits[i].segment) !== -1) {
				limitCounters[limits[i].segment]++;
			}
		}
		return url;
	};
	
	this.markAsFailed = function (url) {
		var index = visitedUrls.indexOf(url);
		if (index > -1) {
			visitedUrls.splice(index, 1);
		}
		that.addIgnoredUrl(url);
	};
	
	this.getUrlsToVisit = function () {
		return urlsToVisit;
	};
	
	initialize();
};

// Define a rule that returns true if two urls only differ by their last section (i.e. the bit after the last '/')
// and this is numeric. e.g. http://www.google.com/123 and http://www.google.com/1234 are treated as equal by this rule.
var ignoreNumericLastSection = function (elem, url) {
    var baseUrl, baseElem, idx1, idx2;
    idx1 = url.lastIndexOf('/');
    idx2 = elem.lastIndexOf('/');
    baseUrl = url.slice(0, idx1 == -1 ? url.length : idx1);
    baseElem = elem.slice(0, idx2 == -1 ? elem.length : idx2);
    if (baseUrl === baseElem) {
        return !isNaN(url.slice(idx1+1)) &&
            !isNaN(elem.slice(idx2+1)); 
    }
};

exports.create = function (config) {
	return new UrlStore(config);
};
exports.rules = {
	"ignoreNumericLastSection": ignoreNumericLastSection
};