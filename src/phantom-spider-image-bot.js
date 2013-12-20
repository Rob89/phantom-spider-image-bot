/* globals require */

var UrlStore = require('./urlStore'),
	webpage = require('webpage'),
    utils = require('./utilities');

var PhantomSpider = function (config) {
	var visitUrl, nextUrl, page, login, siteRoot,
		options, initialize, urlStore, 
		images = [], 
		that = this,
		noop = function () { };

	initialize = function () {
		var ignored = config.ignoreUrls || [],
			i, l = ignored.length;
		urlStore = UrlStore.create(config.urlSettings);
		urlStore.addUrls(config.startingUrls);
		for (i = 0; i < l; i++) {
			urlStore.addIgnoredUrl(ignored[i]);
		}
	};
	
	login = function () {
		page = webpage.create();
		var settings = config.loginSettings,
			data = settings.usernameParam + '=' + settings.username + '&' + settings.passwordParam + '=' + settings.password;
		page.viewportSize = { width: 1024, height: 1024 };
		page.onError = that.onError;
		page.open(settings.url, 'post', data, function(status) {
			if (status === 'success') {
				// page.render('login.png');
				return nextUrl('success', 'logged in');
			} else {
				that.onError("Failed to log in.");
				return that.finishedCallback([]);
			}
		});
	};
	
	siteRoot = function (url) {
		var index = url.indexOf('/');
		return index === -1 ? url : url.slice(0, index);
	};
	
	nextUrl = function (status, url) {
		page.close();
		that.perPageCallback(status, url);
		return visitUrl();
	};
	
	visitUrl = function () {
		var url;
		url = urlStore.getNextUrl();
		if (!url) { return that.finishedCallback(images); }
		page = webpage.create();
		page.onError = that.onError;
		page.viewportSize = { width: 1600, height: 1080 };
		page.settings.userAgent = 'Phantom spider image bot';
		return page.open('http://' + url, function (status) {
			if (status == 'success') {
				page.injectJs("client_script.js");
				return window.setTimeout(function() {
					var i, l, internalLinks, imgs, temp,
						resources, failed;
					resources = page.evaluate(function () {
						return phantomSpiderBot_ScrapeImages();
					});
					// 404s masquerading as 200. Who'da thunk it?
					failed = page.evaluate(function () {
						var e, s, temp;
						e = document.getElementById('error_messages');
						s = (e == null ? '' : e.innerHTML);
						temp = s.indexOf('We couldn\'t find the story you were looking for');
						if (temp !== -1) {
							return true;
						} else {
							return s.indexOf('We couldn\'t find the page you were looking for') !== -1;
						}
					});
					if (failed) {
						urlStore.markAsFailed(url);
					}
					internalLinks = resources.slice(0, resources.indexOf("{{BREAK}}"));
					imgs = resources.slice(resources.indexOf("{{BREAK}}")+1);						
					l = imgs.length;
					for (i =0; i < l; i++) {
						images[imgs[i]] = 1;
					}
					l = internalLinks.length;
					for (i = 0; i < l; i++) {
						temp = siteRoot(url) + internalLinks[i];
						urlStore.addUrls(temp);
					}
					return nextUrl(status, url);
				}, 200);
			}
		});
	};
	
	this.start = function () {	
		if (config.loginRequired) {
			return login();
		}
		else {
			return visitUrl();
		}
	};
	
	this.onError = noop;
	this.perPageCallback = noop;
	this.finishedCallback = noop;
	
	initialize();
};


exports.start = function (config) {
	var spider = new PhantomSpider(config);
	if (config.onError) {
		spider.onError = config.onError;
	}
	if (config.perPageCallback) {
		spider.perPageCallback = config.perPageCallback;
	}
	if (config.finishedCallback) {
		spider.finishedCallback = config.finishedCallback;
	}
	spider.start();
};