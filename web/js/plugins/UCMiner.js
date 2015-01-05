(function () {
	// avoid duplicated
	if (window.ucminer) return;
	// put old jQuery to No-Conflict mode if any
	var oldJQ = jQuery? jQuery.noConflict() : null,
		newJQ;
	// load new jquery
	var b = document.getElementsByTagName('body')[0],
		s=document.createElement('script');
	s.type='text/javascript';
	s.src='//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js';
	b.appendChild(s);
	function restoreJQ () {
		if (oldJQ)
			window.$ = window.jQuery = oldJQ;
	}
	function applyNewJQ () {
		if (newJQ)
			window.$ = window.jQuery = newJQ;
	}
	var init = function () {
		var $ = newJQ = jQuery.noConflict();
		applyNewJQ();
		// 處理 checkbox 的點擊事件
		var processCheckboxClick = function (e, checkbox) {
			if (ucminer.processingCheckboxClick) return;
			ucminer.processingCheckboxClick = true;
			var prev = ucminer.lastClickedCheckbox, // previous clicked label-checkbox
				last = ucminer.lastClickedCheckbox = checkbox, // current clicked label-checkbox
				status;
			if (!prev) {
				delete ucminer.processingCheckboxClick;
				return; // no previous one, skip
			}
			if (e.shiftKey) {
				var prevParentTR = $(prev).parents('tr')[0],
					prevParentDiv = $(prev).parents('div')[0],
					parent = (prevParentTR == $(last).parents('tr')[0])?
						prevParentTR : (prevParentDiv == $(last).parents('div')[0])?
						prevParentDiv : null;
				if (parent) { // under the same tr or div
					status = prev.checked;
					var boxes = $(parent).find('input[type="checkbox"]'),
						idx = 0,
						len = boxes.length,
						cnt = 0;
					for ( ; idx < len; idx++) {
						var cbx = boxes[idx];
						if (cbx == prev || cbx == last)
							cnt++;
						if (cnt)
							cbx.checked = status;
						if (cnt == 2)
							break;
					}
				}
			}
			delete ucminer.processingCheckboxClick;
		};
		function escapeQuote (str) {
			return str.replace(/["]/g, '&quot;').replace(/[']/g, '&#39;');
		}
		function unescapeQuote (str) {
			return str.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
		}
		function stripHTML (ele) {
			return itrue.domutil.stripHTMLTags($('<div></div>').append($(ele).clone()).html());
		}
		// yyyy-MM-dd 轉成 Date Object
		function stringToDate (str) {
			var arr = str.split('-');
			return new Date(parseInt(arr[0]), parseInt(arr[1])-1, parseInt(arr[2]));
		}
		// Date Object 轉成 yyyy-MM-dd 字串
		function dateToString (date) {
			return date.getFullYear() + '-' + ("0" + (date.getMonth()+1)).slice(-2) + '-' + ("0" + (date.getDate())).slice(-2);
		}
		// 是否為日期範圍的起始欄位
		function isStartDate (key) {
			return $('.hasDatepicker[name="'+key+'"]')[0] && key.indexOf('from') > 0;
		}
		// 是否為被選定要做分段處理的欄位 (由 shift+click 點擊動作選定)
		function shouldApplyInterval (key, dateFields) {
			return dateFields.filter('[name="'+key+'"]').hasClass('date-picker-should-filter');
		}
		// 將一字串 start - end 的部份取代為 substitute
		function replaceRange(s, start, end, substitute) {
			return s.substring(0, start) + substitute + s.substring(end);
		}
		// 取得要做重覆項目提示的欄位
		// (由 shift+click 點擊動作選定)
		function getDupNotifyFields () {
			applyNewJQ();
			var result = [];
			$('.title-should-notify-dup').each(function () {
				result.push(stripHTML(this));
			});
			restoreJQ();
			return result;
		}
		// 取得要做自動略過重覆項目的欄位
		// (由 shift+click 點擊動作選定)
		function getDupSkipFields () {
			applyNewJQ();
			var result = [];
			$('.title-should-skip-dup').each(function () {
				result.push(stripHTML(this));
			});
			restoreJQ();
			return result;
		}
		// 由要做分段處理的欄位將目前的 request 項目更新
		function updateRequests (requests, dateFields, key, dist) {
			// 開始日期及結束日期的欄位
			var start = dateFields.filter('[name="'+key+'"]')[0],
				end = dateFields[dateFields.index(start)+1],
				sval = start.value,
				eval = end.value || dateToString(new Date());
			// 有欄位且都有值
			if (start && sval && end && eval) {
				var inc = parseInt(dist), // 分段間隔
					idx = 0,
					len = requests.length,
					result = [];
				// loop over requests
				for ( ; idx < len; idx++) {
					var req = requests[idx],
						startDate = stringToDate(sval),
						endDate = stringToDate(eval),
						tmpDate = stringToDate(sval),
						skey = $(start).attr('name'), // request params 中的 start date key
						ekey = $(end).attr('name'), // request params 中的 end date key
						sidx,
						eidx,
						newReq;
					tmpDate.setDate(startDate.getDate()+inc);
					while (startDate < endDate) {
						if (tmpDate > endDate)
							tmpDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
						sidx = req.indexOf(skey)+skey.length+1; // skey=...
						eidx = sidx + 10; // yyyy-MM-dd 十個字

						newReq = replaceRange(req, sidx, eidx, dateToString(startDate));
						sidx = req.indexOf(ekey)+ekey.length+1; // ekey=...
						eidx = sidx + (end.value? 10 : 0);

						// 生成並加入新的 request
						newReq = replaceRange(newReq, sidx, eidx, dateToString(tmpDate));
						result.push(newReq);
						tmpDate.setDate(startDate.getDate()+inc+inc);
						startDate.setDate(startDate.getDate()+inc);
					}
				}
				if (result.length)
					return result;
			}
			return requests;
		}
		// 批次下載的資訊表, 有很多資訊區塊
		function getDownloadInfoList () {
			var list = $('.batch-download-info-list');
			if (!list[0]) {
				list = $('<div class="batch-download-info-list"'
							+'style="position: fixed; right: 5px; top: 50px; width: 200px; height: 35px; overflow: hidden; background-color: #ccc; min-width: 200px; min-height: 35px;">'
						+'</div>'
				);
				list.on('mouseover', function () {
					if (list.find('div')[0])
						list.css('height', 'auto')
							.css('width', 'auto')
							.css('overflow', 'auto');
				}).on('mouseout', function () {
					list.css('height', '35px')
						.css('width', '200px')
						.css('overflow', 'hidden');
				});
				$(document.body).append(list);
			}
			return list;
		}
		function getDownloadInfoBlock () {
			var list = getDownloadInfoList(),
				area = $('<div style="width: 180px; height: 30px; overflow: hidden; white-space: nowrap;">'
							+'<span class="progress-bar" style="display: inline-block; width: 100px; height: 25px; border: 1px solid black;">'
								+ '<span class="progress" style="display: inline-block; height: 100%; width: 0px; overflow: hidden; background-color: green;">&nbsp;</span>'
							+'</span>'
							+'<span class="restore" style="cursor: pointer; background-color: green;">--</span>'
							+'<span class="close" style="cursor: pointer; background-color: red;">X</span><br/>'
							+'<div class="current-req" style="white-space: normal;"></div>'
							+'<div class="notify" style="white-space: normal;"></div>'
						+'</div>')[0],
				infoBlock = {
					dom: area,
					valid: false,
					init: function () {
						var wgt = this;
						$(this.dom).find('.progress-bar').click(function () {
							wgt.expand();
						});
						$(this.dom).find('.restore').click(function () {
							wgt.restore();
						});
						$(this.dom).find('.close').click(function () {
							wgt.close();
						});
						this.valid = true;
					},
					updateProgress: function (current, all) {
						$(this.dom).find('.progress').css('width', Math.floor(current/all*100) + 'px');
					},
					updateReq: function (req) {
						$(this.dom).find('.current-req').html(req);
					},
					addNotify: function (notify) {
						$(this.dom).find('.notify').append(notify);
					},
					expand: function (e) {
						$(this.dom).css({
							'float': 'left',
							'width': '500px',
							'height': '300px',
							'overflow': 'auto'
						});
					},
					restore: function () {
						$(this.dom).css({
							'float': '',
							'width': '180px',
							'height': '30px',
							'overflow': 'hidden'
						});
					},
					close: function () {
						$(this.dom).remove();
						this.valid = false;
						if (!list.find('div').length)
							list.remove();
					}
				};
				infoBlock.init();
				list.append(infoBlock.dom);
				return infoBlock;
		}
		// 開始進行 batch download
		function performBatchDownload (requests, block) {
			var reqlen = requests.length,
				keys = {}, // {colName: {content: count}, colNames: [...]}, 記錄欄位值出現次數
				shouldNotifyDup = getDupNotifyFields(), // 設定要提示重覆值的欄位
				shouldSkipDup = getDupSkipFields(), // 設定要略過重覆值的欄位
				fileName = block.find('.fname').val() || 'SearchResult', // 下載檔名
				fsplit = block.find('.fsplit')[0].checked,
				showResult = block.find('.showResult')[0].checked,
				$dlLink = $('<a download="'+fileName+'.xls" href="data:application/csv;charset=utf-8," target="_blank">下載</a>'),
				infoBlock = getDownloadInfoBlock(),
				csvDatas = [], // 最後要下載的內容
				tmpCsvData = [], // 中間暫存的部份
				processData = function (idx, data) {
					applyNewJQ();
					if (infoBlock && infoBlock.valid)
						infoBlock.updateProgress(idx+1, reqlen);
					var $data = $(data);
					if (!keys.colNames) { // 未建立 title, 建立之
						var colNames = [];
						$data.find('tr').eq(0).each(function () {
							$(this).find('td').each(function () {
								// 將每一個 td 的內容存成 title (col name)
								var key = stripHTML(this);
								colNames.push(key);
								keys[key] = {};
								// 將要 notify 及 skip 的欄位做標記
								if (shouldNotifyDup.indexOf(key) >= 0)
									keys[key]['shouldNotify'] = true;
								if (shouldSkipDup.indexOf(key) >= 0)
									keys[key]['shouldSkip'] = true;
							});
							keys.colNames = colNames;
						});
					} else {
						// 若為分割下載則每一檔案都需保留 title
						if (!fsplit) {
							var colNames = keys.colNames;
							$data.find('tr').eq(0).remove();
						}
					}

					// 建立要做存檔的 csv data
					$data.find('tr').each(function () {
						var tds = $(this).find('td'),
							key = stripHTML(tds[0]),
							shouldRemove = false;
						tmpCsvData = [];
						// keys 中含 td 的內容, 表示為 title
						if (keys[key]) {
							tds.each(function () {
								var key = stripHTML(this);
								if (key.indexOf(',') >= 0)
									key = '"' + key.replace(/"/g, '""') + '"';
								tmpCsvData.push(key);
							});
							csvDatas.push(tmpCsvData.join(','));
						} else {
							tds.each(function () {
								var key = stripHTML(this),
									colName = keys.colNames[$(this).index()], // 取得對應的欄位名
									list = keys[colName]; // 取得該欄位的記錄 list

								// 若為要提醒或略過重覆值的欄位則記錄出現次數
								if (list['shouldNotify'] || list['shouldSkip']) {
									if (list[key])
										list[key]++;
									else
										list[key] = 1;
								}
								if (shouldRemove
									|| list['shouldSkip'] && list[key] > 1) {
									// 應略過
									shouldRemove = true;
								} else {
									// 應加入 CSV data
									if (key.indexOf(',') >= 0)
										key = '"' + key.replace(/"/g, '""') + '"';
									tmpCsvData.push(key);
								}
							});
							// 實際移除
							if (shouldRemove)
								$(this).remove();
							else {
								csvDatas.push(tmpCsvData.join(','));
							}
						}
					});
					if (fsplit) { // 分割下載
						if (csvDatas.length > 2) { // 只有 title 則略過
							$dlLink[0].download = fileName + '-'+idx+'.xls';
							$dlLink[0].innnerHTML = fileName + '-'+idx+'.xls';
							$dlLink[0].href += encodeURIComponent(requests[idx]+'\n'+csvDatas.join('\n'));
							$dlLink[0].click();
							infoBlock.addNotify($dlLink);
							infoBlock.addNotify('<br/>');
							// create new link
							$dlLink = $('<a download="'+fileName+'.xls" href="data:application/csv;charset=utf-8," target="_blank">下載</a>')
							// reset css data
							csvDatas = [];
						}
					}
					// debug 用
					if (showResult) {
						var dbgDiv = $('.dbgDiv')[0] ||
							$('<div class="dbgDiv" style="position: relative; padding-top: 30px;">'
							+ 	'<div style="position: absolute; left: 0; top: 0; cursor: pointer;">Clear</div>'
							+'</div>').appendTo(document.body)[0];
						$(dbgDiv).append(requests[idx]+'<br/>').append($data.addClass('fetched-data'));
					}

					// 有其餘 request 則繼續
					idx += 1;
					if (idx < reqlen)
						download(idx);
					else {
						// 否則輸出重覆項目提醒並更新下載內容
						var colNames = keys.colNames,
							cnidx = 0,
							len = colNames.length,
							key;
						for ( ; cnidx < len; cnidx++) {
							var colName = colNames[cnidx],
								list = keys[colName],
								not = shouldNotifyDup.indexOf(colName) >= 0,
								sk = shouldSkipDup.indexOf(colName) >= 0;
							if (not || sk) {
								infoBlock.addNotify(colName + '中重覆的項目有<br/>');
								for ( key in list ) {
									if (list[key] > 1)
										infoBlock.addNotify(key + '出現了 '+list[key]+' 次'+(sk? ' (已移除重覆項目)' : '')+'<br/>');
								}
							}
						}
						if (csvDatas.length) {
							$dlLink[0].href += encodeURIComponent(csvDatas.join('\n'));
							$dlLink[0].click();
							infoBlock.addNotify('<br/>');
							infoBlock.addNotify($dlLink);
						}
					}
					restoreJQ();
				}, download = function (idx) {
					if (infoBlock && infoBlock.valid)
						infoBlock.updateReq(requests[idx]);
					$.ajax({
						type: 'POST',
						url: window.location.href,
						data: requests[idx]+'&download=123',
						success: function (data) {
							processData(idx, data);
						}, error: function () {
							alert.log(error);
							idx+=1;
							if (idx < reqlen)
								download(idx);
						}
					});
				};
			download(0);
		}
		// namespace ucminer
		var ucminer = window.ucminer = {
			// called when click on element (bubble up to body)
			processClick: function (e) {
				var dom = e.target, // trigger dom
					$dom = $(dom);  // $
				if ($dom.attr('type') == 'checkbox' // is checkbox or
					|| ($dom.prop('tagName').toLowerCase() == 'label' // is label and
						&& (dom=$('#'+$dom.attr('for'))[0] || $dom[0].firstChild) // is for a checkbox
						&& $(dom).attr('type') == 'checkbox')) {

					// process checkbox click with its label
					processCheckboxClick(e, dom);
				} else if ($dom.hasClass('hasDatepicker') && e.shiftKey) {
					if ($dom.hasClass('date-picker-should-filter'))
						$dom.removeClass('date-picker-should-filter').css('background-color', '');
					else
						$dom.addClass('date-picker-should-filter').css('background-color', 'pink');
				} else if ($dom.parent('tr')[0] && e.shiftKey) {
					if ($dom.hasClass('title-should-notify-dup')) {
						$dom.removeClass('title-should-notify-dup').css('background-color', '')
							.addClass('title-should-skip-dup').css('background-color', 'LightBlue');
					} else if ($dom.hasClass('title-should-skip-dup')) {
						$dom.removeClass('title-should-skip-dup').css('background-color', '')
					} else
						$dom.addClass('title-should-notify-dup').css('background-color', 'pink');
				}
			},
			loadTrend: function (btn) {
				var div = btn.parentNode,
					expand = function () {
						if (ucminer.trendOutTimer)
							clearTimeout(ucminer.trendOutTimer);
						div.style.width = "500px";
						div.style.height = "500px";
						$(div).css('overflow', 'auto')
							.addClass('hover');
						
					};
				$(div).on('mouseover', expand);
				expand();
				$(div).empty()
					.append('<iframe style="width: 802px; height: 611px;" src="http://www.urcosme.com/internal/Buzz/index/factory_id_search.php" id="btFrame" onload="window.ucminer.adjustBtFrame(this)"></ifreame>');
			},
			adjustBtFrame: function (frame) {
				var div = frame.parentNode,
					inp,
					func = function () {
						if ($(div).hasClass('hover')) return; // hovered, do nothing
						if (inp = $(frame.contentWindow.document.body).find('.autocomplete.ac_input')[0]) {
							div.style.width = "200px";
							div.style.height = "50px";
							div.scrollLeft = 355;
							div.scrollTop = 162;
						} else {
							div.style.width = "350px";
							div.style.height = "350px";
						}
					};
				func();
				$(div).on('scroll', func);
				$(div).on('mouseout', function () {
					if (ucminer.trendOutTimer)
						clearTimeout(ucminer.trendOutTimer);
					ucminer.trendOutTimer = setTimeout(function () {
						$(div).css('overflow', 'hidden')
							.removeClass('hover');
						func();
					}, 500);
				});
			},
			initBatchDownload: function () {
				var block = $('<div style="display: inline-block; position: relative;">&nbsp;'
						+		'<div class="outer" style="display: inline-block; white-space: nowrap; position: absolute; height: 30px;">&nbsp;'
						+			'<input class="btn" type="button" value="分批下載"></input>'
						+			'間隔天數：<input class="inp" type="text" value="30"></input>'
						+			'檔案名稱：<input class="fname" type="text" value="SearchResult"></input>'
						+			'<input class="fsplit" id="fsplit" type="checkbox"></input><label for="fsplit">分割下載</label>'
						+			'<input class="showResult" id="showResult" type="checkbox"></input><label for="showResult">顯示於頁面</label>'
						+		'</div>'
						+	'</div>'
					),
					inp = block.find('.inp'),
					btn = block.find('.btn'),
					dateFields = $('.hasDatepicker'),
					form = dateFields[0]? dateFields[0].form : null;

				btn.on('click', function (e) {
					if (form) {
						var params = {},
							fparam = $(form).serialize(),
							fpArr = fparam.split('&'),
							idx = 0,
							len = fpArr.length,
							key,
							requests = [fparam];
						for ( ; idx < len; idx++) {
							var kv = fpArr[idx].split('=');
							params[kv[0]] = kv[1];
						}
						for (key in params) {
							if (isStartDate(key) && shouldApplyInterval(key, dateFields) && params[key]) {
								requests = updateRequests(requests, dateFields, key, inp[0].value);
							}
						}
						if (requests.length)
							performBatchDownload(requests, block);
					}
				});
				$($('input[name="download"]')[0].parentNode).append(block);
			}
		}
		$(document.body).on('click', window.ucminer.processClick);
		$(document.body).append(
			'<div style="position: fixed; left: 10px; top: 10px; width: 200px; height: 50px; overflow: hidden;"><button onclick="window.ucminer.loadTrend(this)">load Trend</button></div>'
		);
		ucminer.initBatchDownload();
		restoreJQ();
	}
	var initTimer = setInterval(function () {
		if (window.$) {
			if (!window.itrueAPIAppended) {
				window.itrueAPIAppended = true;
				$('head').append('<script type="text/javascript" src="https://cdn.rawgit.com/itrue/static-contents/f05aa3126a028f5da01c535a00302df258f6545f/web/js/apis/itrue.js"></script>');
			}
			if (window.itrue && !window.itrueDomAPIAppended) {
				window.itrueDomAPIAppended = true;
				$('head').append('<script type="text/javascript" src="https://cdn.rawgit.com/itrue/static-contents/f05aa3126a028f5da01c535a00302df258f6545f/web/js/apis/domutil.js"></script>');
			}
			if (window.itrue && window.itrue.domutil) {
				init();
				clearInterval(initTimer);
			}
		} else
			console.log('wait jquery loaded');
	}, 100);
})();