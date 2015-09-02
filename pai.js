var _pai = function(sid) {
	var p = this;
	p.appid = window.location.protocol + '//' + window.location.hostname;
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
			op = { "appid" : p.appid, "sessions" : [{"sid" : p.sid, "pa": p.pa}] };
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
	var getEleId = function(ele) {
		return ele && (ele.id || ele.name || ele.tagName);
	};
	p.domready = function() {
		document.body.onclick = function() {
			p.push({"e" : "onclick", "x" : event.clientX, "y" : event.clientY, "srcElement" : getEleId(event.srcElement)})
		};
		document.body.onkeyup = function() {
			p.push({"e" : "onkeyup", "keyCode" : event.keyCode, "ctrlKey" : event.ctrlKey, "altKey" : event.altKey, "shiftKey" : event.shiftKey, "srcElement" : getEleId(event.srcElement)});
		};
		document.body.onmousemove = function() {
			if (_pai.moveTimer) {
				clearTimeout(_pai.moveTimer);
			}
			var cx = event.clientX;
			var cy = event.clientY;
			_pai.moveTimer = setTimeout(function() {
				if (_pai.oldX != cx || _pai.oldY != cy) {
					p.push({"e" : "onmousemove", "x" : cx, "y" : cy, "srcElement" : getEleId(document.elementFromPoint(cx, cy))}, -200);
					_pai.oldX = cx;
					_pai.oldY = cy;
				}
			}, 250);
		};
		window.onscroll = function() {
			if (_pai.scrollTimer) {
				clearTimeout(_pai.scrollTimer)
			}
			_pai.scrollTimer = setTimeout(function() {
				p.push({"e" : "onscroll", "scrollTop" : document.documentElement.scrollTop || document.body.scrollTop});
			}, 250);
		};
		// TODO: DIV、TEXTAREA等的onscroll没有截取到（不冒泡），iframe的有截取到
		// TODO: onunload
		// TODO: onfocus（不冒泡）如果记录了mousemove和keyuptab，是不是可以认为就是可以区分focus了
		// TODO: onbeforeunload
		// TODO: onresize
	};
	window.onload = p.domready;
};
_pai.scrollTimer = null;
_pai.moveTimer = null;
_pai.oldX = null;
_pai.oldY = null;