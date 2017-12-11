		// 是否是安卓
		function isAndroid() {
			var u = navigator.userAgent;
			if (u.indexOf('Android') > -1 || u.indexOf('Linux') > -1) { //安卓手机
				return true;
			}
			return false;
		}

		function isIOS() {
			var u = navigator.userAgent;
			var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
			return isiOS;
		}

		function isRunOnWeChat() {
			var ua = navigator.userAgent.toLowerCase();
			if (ua.match(/MicroMessenger/i) == "micromessenger") {
				return true;
			} else {
				return false;
			}
		}

		function UrlParameters() {
			var urlIndex = window.location.href.indexOf("?");
			if (urlIndex) {
				var parameters = window.location.href.substring(urlIndex + 1);
				if (parameters) {
					var arrayParam = parameters.split("&");  //参数数组
					var index; var name; var value;
					for (var i = 0; i < arrayParam.length; i++) {
						index = arrayParam[i].indexOf("=");
						name = arrayParam[i].substring(0, index);
						value = arrayParam[i].substring(index + 1);
						this[name] = value;
					}
				}
			}
		}

		function openApp(key, refresh) {
			var isrefresh = refresh; // 获得refresh参数  
			if (isrefresh == 1) {
				return
			}
			window.location.href = 'wx73653b5260b24787://?room='+key;
			/*
			window.setTimeout(function () {
				window.location.href += '&refresh=1' // 附加一个特殊参数，用来标识这次刷新不要再调用myapp:// 了  
			}, 500);
			*/
		}

		function enterRoom() {
			var browser = {
				versions: function () {
					var u = navigator.userAgent, app = navigator.appVersion;
					return {//移动终端浏览器版本信息
						trident: u.indexOf('Trident') > -1, //IE内核
						presto: u.indexOf('Presto') > -1, //opera内核
						webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
						gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
						mobile: !!u.match(/AppleWebKit.*Mobile.*/) || !!u.match(/AppleWebKit/), //是否为移动终端
						ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
						android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器
						iPhone: u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1, //是否为iPhone或者QQHD浏览器
						iPad: u.indexOf('iPad') > -1, //是否iPad
						weixin: u.match(/MicroMessenger/i), //微信浏览器
						webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
					};
				}(),
				language: (navigator.browserLanguage || navigator.language).toLowerCase()
			};

			if (!browser.versions.weixin) {
				if (browser.versions.android) {
					var urlParams = new UrlParameters();
					if (typeof urlParams != "undefined" && urlParams.room && 0 != urlParams.room) {

						//alert(" room : " + urlParams.room);

						openApp(urlParams.room, urlParams.refresh);
					}
				}
				else if (browser.versions.ios || browser.versions.iphone || browser.versions.ipad) {
					var urlParams = new UrlParameters();
					if (typeof urlParams != "undefined" && urlParams.room && 0 != urlParams.room) {

						//alert(" room : " + urlParams.room);

						openApp(urlParams.room, urlParams.refresh);
					}
				}
			}
		}

		$(document).ready(function () {

			enterRoom();

			initialize();
			function initialize() {
				$('.common-android').removeClass('common-hide');
				$('.common-ios').removeClass('common-hide');

				// 如果在微信中打开，直接弹遮罩
				if (true == isRunOnWeChat()) {
					$('#mask').removeClass("common-hide");
				}
			}
			$('#download-android').on('click', function (e) {
				if (true == isRunOnWeChat()) {
					e.preventDefault();
					$('#mask').removeClass("common-hide");
				}
			});
			$('#download-ios').on('click', function (e) {
				if (true == isRunOnWeChat()) {
					e.preventDefault();
					$('#mask').removeClass("common-hide");
				}
			});
			$('#mask').on('click', function () {
				//$('#mask').addClass("common-hide");
			});
		});