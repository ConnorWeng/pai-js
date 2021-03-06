var _pai = function(sid) {
	if (typeof PAI_SKIP !== 'undefined' && PAI_SKIP) return {};
	var paijsonstringify = (typeof(JSON) !== 'undefined' && JSON.stringify.toString().indexOf("[native code]") != -1) ? JSON.stringify : JSONPAI.stringifypai;
	var paijsonparse = (typeof(JSON) !== 'undefined' && JSON.parse.toString().indexOf("[native code]") != -1) ? JSON.parse : JSONPAI.parse;
	var p = this;
	p.appid = window.location.protocol + '//' + window.location.hostname;
	p.mid = window.localStorage.getItem('_pai_mid');
	if (!p.mid) {
		var S4 = function() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1); };
		p.mid = S4()+S4()+'-'+S4()+'-'+S4()+'-'+S4()+'-'+S4()+S4()+S4();
		window.localStorage.setItem('_pai_mid', p.mid);
	}
	p.sid = sid;
	p.uid = undefined;
	p.pa = [];
	// IE8 console未定义抑制
	window.console = window.console || (function(){
		var c = {};
		c.log = c.warn = c.debug = c.info = c.error = c.time = c.dir = c.profile = c.clear = c.exception = c.trace = c.assert = function(s){};
		return c;
	})();
	p.push = function(obj, timeoff) {
		var v = {
			"t" : new Date().getTime() + (timeoff ? timeoff : 0),
			"p" : location.pathname + location.search + (typeof(nowPage) !== 'undefined' ? ("#larvapage=" + nowPage) : ""),
			"v" : obj
		};
		console.log(paijsonstringify(v));
		p.pa.push(v);
		// TODO: uid在2500提交之后会掉
		// TODO: 针对多窗口同域名、不同会话，2500提交后的情况需要针对性验证
		if (p.pa.length > 2500) {
			p.saveremote();
		}
		return p;
	};
	p.savelocal = function() {
		var op = paijsonparse(window.localStorage.getItem("_pai"));
		if (!op) {
			op = { "appid" : p.appid, "mid": p.mid, "sessions" : [{"sid" : p.sid, "uid" : p.uid, "pa": p.pa}] };
		} else {
			var foundSession = null;
			for (var i = op.sessions.length - 1; i >= 0; i--) {
				if (op.sessions[i].sid === p.sid) {
					foundSession = op.sessions[i];
					break;
				}
			}
			if (foundSession) {
				foundSession.pa = foundSession.pa.concat(p.pa);
			} else {
				op.sessions.push({"sid" : p.sid, "uid" : p.uid, "pa": p.pa});
			}
		}
		console.log(paijsonstringify(op));
		window.localStorage.setItem("_pai", paijsonstringify(op));
		p.pa = [];
	};
	_pai.remoteURL = "http://" + PAI_HOST + ":" + PAI_PORT;
	_pai.remoteCORSHTML = _pai.remoteURL + "/cors.htm";
	_pai.saving = false;
	var ifr = null; // find&see: onbeforeunload在顶层页面预注入
	var initializeIFrameForPostMessage = function() {
		ifr = document.createElement('iframe');
		ifr.style.display = 'none';
		ifr.src = _pai.remoteCORSHTML;
		if (document.getElementsByTagName('body').length > 0) {
			document.body.appendChild(ifr);
		} else {
			var newBody = document.createElement('body');
			newBody.className = 'pai-body';
			document.getElementsByTagName('html')[0].appendChild(newBody);
			newBody.appendChild(ifr);
		}
	};
	p.saveremote = function() {
		if (_pai.saving)
			return;
		_pai.saving = true;
		if (p.pa.length > 0)
			p.savelocal();
		console.log(window.localStorage.getItem("_pai"));
		if (ifr === null) {
			initializeIFrameForPostMessage();
			var _load = function() {
				try {
					ifr.contentWindow.postMessage(window.localStorage.getItem("_pai"), '*');
					window.localStorage.removeItem("_pai");
					_pai.saving = false;
				} catch(e) {
					console.log(e);
				}
			};
			eventInject(ifr, 'load', _load);
		} else {
			ifr.contentWindow.postMessage(window.localStorage.getItem("_pai"), '*');
			window.localStorage.removeItem("_pai");
			_pai.saving = false;
		}
	};
	var eventInject = function(obj, eventname, func) {
		if (typeof PAI_IGNORE_EVENTS !== 'undefined' && ~arrayIndexOf(PAI_IGNORE_EVENTS, eventname)) return;
		if (obj.addEventListener) {
			obj.addEventListener(eventname, func, false);
		} else if (obj.attachEvent) {
			obj.attachEvent("on" + eventname, func);
		}
	};
	p.domready = function() {
		if (document.getElementById("menutree")) {
			var mtsrc = document.getElementById("menutree").src;
			var sidmatches = mtsrc.match(/dse_sessionId=([^&]+)/i);
			var uidmatches = mtsrc.match(/userId=([^&]+)/i);
			if (!p.sid && sidmatches) p.sid = sidmatches[1];
			if (!p.uid && uidmatches) p.uid = uidmatches[1];
		}
		if (!p.sid) {
			p.sid = document.getElementsByName('dse_sessionId')[0] ? document.getElementsByName('dse_sessionId')[0].value : new Date().getTime();
		}
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
		// jQuery不trim全角\u3000，而这在CTP菜单中作为缩入，因此自己写
		var trimRegexp = new RegExp();
		trimRegexp.compile("^[\\s\\uFEFF\\xa0\\u3000]+|[\\uFEFF\\xa0\\u3000\\s]+$", "g");
		eventInject(document.body, 'click', function() {
			var cords = relMouseCoords(event);
			var pushevent = {"e" : "click", "x" : event.clientX, "y" : event.clientY, "srcElement" : getEleId(event.srcElement), "sc" : cords};
			// CTP菜单项判断：
			// 1、点在菜单的 A 元素上，<a title="用户管理" hideFocus="hidefocus" onclick="very long blarblar..." ondrag="return false;" href="#@">
			if (typeof CTP_WEB_FULLPATH !== 'undefined') { // is CTP ?
				if (document.getElementsByName("signOffForm").length > 0) { // is mainframe.jsp?
					if ($(event.srcElement).closest('div').hasClass('menu-body') || $(event.srcElement).closest('div.Menu').length > 0)
						pushevent.ctpmenu = (event.srcElement.title || event.srcElement.innerText || event.srcElement.value || '').replace(trimRegexp, '');
				} else { // not mainframe.jsp, 具体交易页面
					var btnTestStr = ($(event.srcElement).attr('id') + "'" + $(event.srcElement).attr('class')).toLowerCase();
					if (btnTestStr.indexOf('button') !== -1 || btnTestStr.indexOf('btn') !== -1 || btnTestStr.indexOf('link') !== -1 || btnTestStr.indexOf('lnk') !== -1) {
						try {
							console.log("btn : " + (event.srcElement.title || event.srcElement.innerText || event.srcElement.value || '').replace(trimRegexp, ''));
						} catch(e) {
							// TODO: Below is CTP按下事件List
							// 列表的 跳转 等按钮，分左右DIV和中间文字的话，ctp_grid_btn_con_l 上层是 ctp_grid_btn_con
							// 弹出消息框的关闭按钮 undefined'ctp-messagebox-close
							// select的下拉选框_ctp_combobox_icon_vacType'ctp-combobox-image ctp-combobox-icon-focus
							// select项的选择 undefined'ctp-combobox-listview-alt，3属性或可以拿到
							// 日期控件的click居然没有捕获到，日期右边的按钮绑定的是mouseup，左侧的输入框绑定的是mousedown
							// 链接 gdQryLink41'ctp-link，3属性或可以拿到
							// radio项：_ctp_radio_icon_undefined_radio2'ctp-radio-icon、_ctp_radio_label_undefined_radio2'ctp-radio-text ctp-fs ctp-ff ctp-cn 要向上一层_ctp_radio_undefined_radio2'ctp-radio-container ctp-radiogroup-display-cols, 这个层上的3属性或可以拿到
							// 文件控件 mouseup
							console.log(e);
						}
					}
				}
			}
			p.push(pushevent);
		});
		eventInject(document.body, 'keyup', function() {
			p.push({"e" : "keyup", "keyCode" : event.keyCode, "ctrlKey" : event.ctrlKey, "altKey" : event.altKey, "shiftKey" : event.shiftKey, "srcElement" : getEleId(event.srcElement)});
		});
		_pai.moveTimer = null;
		_pai.oldX = null;
		_pai.oldY = null;
		eventInject(document.body, 'mousemove', measurable('_mousemove_', function() {
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
		}));
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
			} else if (document.documentElement && typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth !== 0) {
				return [document.documentElement.clientWidth, document.documentElement.clientHeight];
			// Older IE
			} else if (document.getElementsByTagName('body').length > 0
					   && document.getElementsByTagName('body')[0].className !== 'pai-body') {
				return [document.getElementsByTagName('body')[0].clientWidth, document.getElementsByTagName('body')[0].clientHeight];
			} else if (document.getElementsByTagName('frameset').length > 0) {
				return [document.getElementsByTagName('frameset')[0].clientWidth, document.getElementsByTagName('frameset')[0].clientHeight];
			} else {
				return '';
			}
		};
		_pai.resizeTimer = null;
		eventInject(window, 'resize', function() {
			// TODO: 级联resize会被触发么？需不需要只挂在top上？但这样内部的可调大小的事件是不是就没有了？
			_pai.resizeTimer && clearTimeout(_pai.resizeTimer);
			_pai.resizeTimer = setTimeout(function() {
				p.push({"e" : "resize", "viewport" : getViewPortSize(), "screen" : [screen.availWidth, screen.availHeight], "pos" : [window.screenLeft, window.screenTop]});
			}, 250);
		});
		// onbeforeunload在顶层页面预注入
		if (window.parent == window) {
			initializeIFrameForPostMessage();
			ifr.onload = function() {
				var savedpai = window.localStorage.getItem("_pai");
				if (!savedpai)
					return;
				savedpai = paijsonparse(savedpai);
				var savedsessions = savedpai.sessions;
				if (!savedsessions || savedsessions.length === 0)
					return;
				var sessions2send = [];
				for (var i = 0; i < savedsessions.length; i++) {
					if (savedsessions[i].sid != p.sid) {
						sessions2send.push(savedsessions[i]);
					}
				}
				try {
					ifr.contentWindow.postMessage(paijsonstringify({
						"appid": savedpai.appid,
						"mid": savedpai.mid,
						"sessions": sessions2send
					}), "*");
				} catch (e) {
					console.log(e);
				}
				for (var j = savedsessions.length - 1; j >= 0; j--) {
					if (savedsessions[j].sid != p.sid) {
						savedsessions.splice(j, 1);
					}
				}
				window.localStorage.setItem("_pai", paijsonstringify(savedpai));
			};
		}
		eventInject(window, 'beforeunload', measurable('_beforeunload_', function() {
			p.push({
				"e": "unload",
				"t": new Date().getTime() - p.loadStart
			});
			p.savelocal();
			if (window.parent == window)
			  p.saveremote();
		}));
		// TODO: DIV、TEXTAREA等的onscroll没有截取到（不冒泡），iframe的有截取到
		// TODO: onfocus（不冒泡）如果记录了mousemove和keyuptab，是不是可以认为就是可以区分focus了
		var bodyjs = document.createElement('script');
		bodyjs.type = "text/javascript";
		// this maybe buggy on IE<=9 when there is more than one script use appendChild script, and with defer.
		// On Chrome, this works after $(window).load, but before body tag onload.
		bodyjs.defer = "true";
		bodyjs.text = "if (pai) {pai.push(" + paijsonstringify({
			'e': 'pageload',
			't': new Date().getTime() - p.loadStart,
			"viewport": getViewPortSize(),
			'screen': [screen.availWidth, screen.availHeight],
			'pos': [window.screenLeft, window.screenTop],
			'b': navigator.appName,
			'bv': navigator.userAgent
		})+ ")};";
		document.body.appendChild(bodyjs);
	};

	function arrayIndexOf(arr, elt /*, from*/) {
        var len = arr.length >>> 0;
		var from = Number(arguments[2]) || 0;
		from = (from < 0)
			? Math.ceil(from)
			: Math.floor(from);
		if (from < 0)
			from += len;

		for (; from < len; from++) {
			if (from in arr &&
				arr[from] === elt)
				return from;
		}
		return -1;
	}

	function measurable(name, action) {
		if (typeof PAI_MEASURABLE !== 'undefined' && PAI_MEASURABLE) {
			return function() {
				var startTime = new Date().getTime();
				action();
				var duration = new Date().getTime() - startTime;
				if (duration > 0) {
					window.localStorage.setItem(name, 'uuid:' + startTime + ' elapsed:' + duration);
				}
			};
		} else {
			return action;
		}
	}

	/* console inject usage:
	 * var bodyjs = document.createElement('script');bodyjs.type = "text/javascript";bodyjs.src = "http://kfzxhuangxlp/my/pai-js/paii.js";document.body.appendChild(bodyjs);
	 * var pai = new _pai();
	 */
	if (CONSOLE_INJECT) {
		p.domready();
	} else {
		eventInject(window, 'load', p.domready);
	}
	p.loadStart = new Date().getTime();
};
