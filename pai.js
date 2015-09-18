var _pai = function(sid) {
	var p = this;
	p.appid = window.location.protocol + '//' + window.location.hostname;
	p.mid = window.localStorage.getItem('_pai_mid');
	if (!p.mid) {
		var S4 = function() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1); }
		p.mid = S4()+S4()+'-'+S4()+'-'+S4()+'-'+S4()+'-'+S4()+S4()+S4();
		window.localStorage.setItem('_pai_mid', p.mid);
	}
	p.sid = sid ? sid : new Date().getTime() ;
	p.pa = [];
	p.push = function(obj, timeoff) {
		var v = {
			"t" : new Date().getTime() + (timeoff ? timeoff : 0),
			"p" : location.pathname,
			"v" : obj
		};
		console.log(JSON.stringify(v));
		p.pa.push(v);
		return p;
	};
	p.savelocal = function() {
		var op = JSON.parse(window.localStorage.getItem("_pai"));
		if (!op) {
			op = { "appid" : p.appid, "mid": p.mid, "sessions" : [{"sid" : p.sid, "pa": p.pa}] };
		} else {
			var foundSession = null;
			for (var i = op.sessions.length - 1; i >= 0; i--) {
				if (op.sessions[i].sid === p.sid) {
					foundSession = op.sessions[i];
					break;
				}
			}
			if (foundSession) {
				foundSession.pa.push(p.pa);
			} else {
				op.sessions.push({"sid" : p.sid, "pa": p.pa});
			}
		}
		console.log(JSON.stringify(op));
		window.localStorage.setItem("_pai", JSON.stringify(op));
	};
	p.saveremote = function() {
		console.log(window.localStorage.getItem("_pai"));
		window.localStorage.removeItem("_pai");
	}
	var eventInject = function(obj, eventname, func) {
		if (obj.addEventListener) {
			obj.addEventListener(eventname, func, false);
		} else if (obj.attachEvent) {
			obj.attachEvent("on" + eventname, func);
		}
	}
	p.domready = function() {
		var getEleId = function(ele) {
			return ele && (ele.id || ele.name || ele.tagName);
		};
		var relMouseCoords = function(e) {
			var x, y;
			if (e.pageX || e.pageY) {
				x = e.pageX;
				y = e.pageY;
			} else {
				x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
				y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			}
			x -= e.srcElement.offsetLeft;
			y -= e.srcElement.offsetTop;
			return {x: x, y: y, xp: Math.round(10000 * x / e.srcElement.offsetWidth), yp: Math.round(10000 * y / e.srcElement.offsetHeight)};
		};
		eventInject(document.body, 'click', function() {
			var cords = relMouseCoords(event);
			p.push({"e" : "click", "x" : event.clientX, "y" : event.clientY, "srcElement" : getEleId(event.srcElement), "sc" : cords});
		});
		eventInject(document.body, 'keyup', function() {
			p.push({"e" : "keyup", "keyCode" : event.keyCode, "ctrlKey" : event.ctrlKey, "altKey" : event.altKey, "shiftKey" : event.shiftKey, "srcElement" : getEleId(event.srcElement)});
		});
		_pai.moveTimer = null;
		_pai.oldX = null;
		_pai.oldY = null;
		eventInject(document.body, 'mousemove', function() {
			_pai.moveTimer && clearTimeout(_pai.moveTimer);
			// TODO: 性能优化
			var cx = event.clientX;
			var cy = event.clientY;
			var cords = relMouseCoords(event);
			_pai.moveTimer = setTimeout(function() {
				if (_pai.oldX != cx || _pai.oldY != cy) {
					// TODO: 由250改成100是因为mousemove与click的反序问题，因为mouseevent是等待250不动之后才触发的，因此点击会先有，然后才有mousemove，改成100才能符合人类移动+点击的速度
					p.push({"e" : "mousemove", "x" : cx, "y" : cy, "srcElement" : getEleId(document.elementFromPoint(cx, cy)), "sc" : cords}, -100);
					_pai.oldX = cx;
					_pai.oldY = cy;
				}
			}, 100);
		});
		_pai.scrollTimer = null;
		eventInject(window, 'scroll', function() {
			_pai.scrollTimer && clearTimeout(_pai.scrollTimer);
			_pai.scrollTimer = setTimeout(function() {
				p.push({"e" : "scroll", "scrollTop" : document.documentElement.scrollTop || document.body.scrollTop});
			}, 250);
		});
		var getViewPortSize = function() {
			// TODO: 这段代码还得继续调一下，不太准，比如Chrome上是算滚动条的，但是IE是不算的
			// Standards compliant browsers (chrome/mozilla/netscape/opera)
			if (typeof window.innerWidth != 'undefined') {
				return [window.innerWidth, window.innerHeight];
			// IE6/IE8
			} else if (document.documentElement && typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth != 0) {
				return [document.documentElement.clientWidth, document.documentElement.clientHeight];
			// Older IE
			} else {
				return [document.getElementsByTagName('body')[0].clientWidth, document.getElementsByTagName('body')[0].clientHeight];
			}
		};
		_pai.resizeTimer = null;
		eventInject(window, 'resize', function() {
			// TODO: 级联resize会被触发么？需不需要只挂在top上？但这样内部的可调大小的事件是不是就没有了？
			_pai.resizeTimer && clearTimeout(_pai.resizeTimer);
			_pai.resizeTimer = setTimeout(function() {
				p.push({"e" : "resize", "viewport" : getViewPortSize(), "screen" : [screen.width, screen.height], "pos" : [window.screenLeft, window.screenTop]});
			}, 250);
		});
		eventInject(window, 'unload', function() {
			p.push({"e" : "unload"});
		});
		// TODO: DIV、TEXTAREA等的onscroll没有截取到（不冒泡），iframe的有截取到
		// TODO: onfocus（不冒泡）如果记录了mousemove和keyuptab，是不是可以认为就是可以区分focus了
		var bodyjs = document.createElement('script');
		bodyjs.type = "text/javascript";
		// this maybe buggy on IE<=9 when there is more than one script use appendChild script, and with defer.
		// On Chrome, this works after $(window).load, but before body tag onload.
		bodyjs.defer = "true";
		bodyjs.text = "pai.push({'e':'pageload', 't':" + (new Date().getTime() - p.loadStart) + "});"
		document.body.appendChild(bodyjs);
	};
	eventInject(window, 'load', p.domready);
	p.loadStart = new Date().getTime();
};