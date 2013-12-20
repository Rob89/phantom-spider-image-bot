function phantomSpiderBot_ScrapeImages () {
	var r = [],
		as = document.getElementsByTagName('a'),
		l = as.length,
		i,
		a,
		e,
		s,
		temp,
		href,
		getAllBgImages,
		deepCss,
		domImages;

	// Taken from: http://stackoverflow.com/a/2430761/1402923
	deepCss = function(who, css){
		if(!who || !who.style) return '';
		var sty = css.replace(/\-([a-z])/g, function(a, b) {
			return b.toUpperCase();
		});
		if (who.currentStyle) {
			return who.style[sty] || who.currentStyle[sty] || '';
		}
		var dv = document.defaultView || window;
		return who.style[sty] || 
			dv.getComputedStyle(who,"").getPropertyValue(css) || '';
	};

	getAllBgImages = function() {
		var url, B = [], A = document.getElementsByTagName('*');
		A = B.slice.call(A, 0, A.length);
		while (A.length) {
			url = deepCss(A.shift(), 'background-image');
			if(url) url=/url\(['"]?([^")]+)/.exec(url) || [];
			url = url[1];
			if(url && B.indexOf(url) == -1) B[B.length]= url;
		}
		return B;
	};
	// End of http://stackoverflow.com/a/2430761/1402923 code

	for (i = 0; i < l; i++) {
		a = as[i];
		href = a.getAttribute('href') || '';
		if (href.indexOf('/') === 0) {
			r.push(href);
		}
	}
	// *Beep* *beep* *beep* Incoming hack detected.
	// phantomjs only supports returning primitives - so we have two choices,
	// an array containing two arrays or one array with a known place to split. 
	r.push('{{BREAK}}'); // Insert split between urls and images. (x_x)

	r = r.concat(getAllBgImages());
	domImages = document.getElementsByTagName('img');
	l = domImages.length;
	for (i = 0; i < l; i++) {
		r.push(domImages[i].src);
	}
	return r;
}