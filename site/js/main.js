$(function() {

////////////////////////////////////////////////////////
// common value
////////////////////////////////////////////////////////

	var webRadicon;
	var webRadiconClient;
	var reloading = false;
	var timer;
	var pictureSocket = null;
	var tsubuyakiQueue = [];
	
////////////////////////////////////////////////////////
// init
////////////////////////////////////////////////////////
	
	// 最初はボタンは触れないように（別に触れても問題ないけど）
	disableControl();
	pictureSocket = io.connect( "http://tabiradi.jp:8800" );
	if ( pictureSocket ) {
		pictureSocket.on("message", function(data) {
			if ( data.message == "updated" )
				reloadViewImage();
		});
	}
	$("#queue_button").bind("click", queueButtonClick);
	$("#send_button").bind("click", sendButtonClick);
	$("#tsubuyaki_input").bind("keydown", tsubuyakiInputKeyDown);
	$("#entry_input").bind("keydown", entryInputKeyDown);
	$("#youtube_button").hover(youtubeButtonOver, youtubeButtonOut)
						.bind("click", youtubeButtonClick);
	$("#help_button").hover(helpButtonOver, helpButtonOut)
					 .bind("click", helpButtonClick);
	$("#send_button").hover(sendButtonOver, sendButtonOut);
				
////////////////////////////////////////////////////////
// web radicon
////////////////////////////////////////////////////////

	// Webラジコンサーバーに接続
	WebRadiconClient.connect({
		connected	: webRadiconClientConnected,
		attached	: webRadiconClientAttached,
		detached	: webRadiconClientDetached,
		tsubuyaki	: webRadiconClientTsubuyaki,
		queue		: webRadiconClientQueue,
		player		: webRadiconClientPlayer,
		error		: webRadiconClientError,
		close		: webRadiconClientClose
	});
	
	// Webラジコンサーバーとの接続成功
	function webRadiconClientConnected(webRadiconClient_) {
		webRadiconClient = webRadiconClient_;
	}
	
	// Webラジコンにアタッチ成功
	function webRadiconClientAttached(webRadicon_, time) {
		webRadicon = webRadicon_;
		enableControl();
		startTimer(time);
	}
	
	// Webラジコンからデタッチ
	function webRadiconClientDetached() {
		webRadiconCloseCommon();
		stopTimer();
	}
	
	// Webラジコンサーバーからつぶやきが送信されたとき
	function webRadiconClientTsubuyaki(tsubuyaki) {
		console.log("つぶやきが届きました:" + tsubuyaki);
		addTsubuyaki(tsubuyaki);
	}
	
	// キューが更新されたとき
	function webRadiconClientQueue(queueList) {
		updateQueueList(queueList);
	}
	
	// プレイヤーが更新されたとき
	function webRadiconClientPlayer(player) {
		updatePlayer(player);
	}
	
	// Webラジコンサーバーとの接続失敗
	function webRadiconClientError() {
		alert("サーバーとの接続に失敗しました");
	}
	
	// Webラジコンサーバーとの接続が閉じられた
	function webRadiconClientClose() {
		webRadiconCloseCommon();
		webRadiconClientCloseCommon();
	}
	
	// Webラジコンとの接続が切れた時の共通処理
	function webRadiconCloseCommon() {
		webRadicon = null;
		disableControl();
		clearView();
		clearTime();
	}
	
	// Webラジコンサーバーとの接続が切れた時の共通処理
	function webRadiconClientCloseCommon() {
		webRadiconClient = null;
	}
	
	$("#view_image").bind("load", function() {
		hideCover();
		reloading = false;
	});
	$("#view_image").bind("error", function() {
		showCover();
		reloading = false;
	});
	
	var hasCover = true;
	// カバーをかける
	function showCover() {
		if ( !hasCover ) {
			$("#cover_image").fadeIn("slow");
			hasCover = false;
		}
	}
	// カバーを外す
	function hideCover() {
		if ( hasCover ) {
			$("#cover_image").fadeOut("slow");
			hasCover = true;
		}
	}
	
	// ハッシュ変更時（ボタンを操作した時に、クリッカブルマップを使用しているため仕方なくハッシュで判断している）
	$(window).bind("forward", forwardButtonClick);
	$(window).bind("stop", stopButtonClick);
	$(window).bind("right", rightForwardButtonClick);
	$(window).bind("left", leftForwardButtonClick);
	$(window).bind("back", backButtonClick);
	
////////////////////////////////////////////////////////
// common method
////////////////////////////////////////////////////////
	
	// タイマーを起動（秒数）
	function startTimer(time) {
		var nowTime = time;
		timer = setInterval(function() {
			nowTime -= 1;
			updateRest(nowTime);
			if ( nowTime == 0 ) {
				clearInterval(timer);
			}
		}, 1000);
	}
	
	// タイマーを停止
	function stopTimer() {
		clearInterval(timer);
		timer = null;
		clearTime();
	}
	
	// Webラジコンサーバーと接続されているかどうかを返す
	function isConnectedWebRadiconClient() {
		return webRadiconClient ? true : false;
	}
	
	// Webラジコンと接続されているかどうかを返す
	function isConnectedWebRadicon() {
		return webRadicon ? true : false;
	}
	
	// Webラジコンを返す
	function getWebRadicon() {
		return webRadicon;
	}
	
	// Webラジコンクライアントを返す
	function getWebRadiconClient() {
		return webRadiconClient;
	}
	
	// Webラジコンに前進命令を送信する
	function forward() {
		if ( isConnectedWebRadicon() ) {
			changeButtonCover("forward");
			getWebRadicon().forward();
		}
	}
	
	// Webラジコンに後退命令を送信する
	function back() {
		if ( isConnectedWebRadicon() ) {
			changeButtonCover("back");
			getWebRadicon().back();
		}
	}
	
	// Webラジコンに右前進命令を送信する
	function rightForward() {
		if ( isConnectedWebRadicon() ) {
			changeButtonCover("right");
			getWebRadicon().rightForward();
		}
	}
	
	// Webラジコンに左前進命令を送信する
	function leftForward() {
		if ( isConnectedWebRadicon() ) {
			changeButtonCover("left");
			getWebRadicon().leftForward();
		}
	}
	
	// キューに追加
	function queue() {
		if ( isConnectedWebRadiconClient() ) {
			var name = getName();
			getWebRadiconClient().queue(name);
		}
	}
	
	// 停止
	function stop() {
		if ( isConnectedWebRadicon() ) {
			changeButtonCover("stop");
			getWebRadicon().stop();
		}
	}
	
	// つぶやき入力欄に入力されたメッセージを送信する
	function sendTsubuyaki() {
		if ( !isConnectedWebRadiconClient() ) return;
		var tsubuyaki = getTsubuyaki();
		if ( tsubuyaki ) 
			getWebRadiconClient().sendTsubuyaki(tsubuyaki);
		clearTsubuyaki();
	}

	// Webラジコンの画像を再取得する
	function reloadViewImage() {
		if ( reloading ) return;
		reloading = true;
		$("#view_image").attr("src", "http://balmysoft.com/picture.jpg?_timestamp=" + new Date().getTime());
	}
	
	// Webラジコンの画像をクリアする
	function clearView() {
		$("#view_image").removeAttr("src");
	}
	
	// 残り時間を更新する
	function updateRest(time) {
		$("#rest_time").text(time + "秒");
	}
	
	// 残り時間をクリアする
	function clearTime() {
		$("#rest_time").text("");
	}
	
	// コントロールを有効化する
	function enableControl() {
		$("#button_image,#button_cover_image").show();
		$("button.control-button").removeAttr("disabled");
		$("button#queue_button").attr("disabled", "disabled");
	}
	
	// コントロールを無効化する
	function disableControl() {
		$("#button_image,#button_cover_image").hide();
		$("button.control-button").attr("disabled", "disabled");
		$("button#queue_button").removeAttr("disabled");
	}
	
	// つぶやきを取得する
	function getTsubuyaki() {
		return $("#tsubuyaki_input").val() || "";
	}
	
	// つぶやきを消す
	function clearTsubuyaki() {
		$("#tsubuyaki_input").val("");
	}
	
	// ボタンカバーを変更する
	function changeButtonCover(type) {
		var src = getButtonImageSrc(type);
		$("#button_cover_image").attr("src", src);
	}
	
	// ボタン画像のURLを返す
	function getButtonImageSrc(type) {
		var src = "";
		if( type == "forward" ) 
			src = "./image/f.png";
		else if( type == "right" )
			src = "./image/r.png";
		else if( type == "back" )
			src = "./image/b.png";
		else if( type == "left" )
			src = "./image/l.png";
		else if( type == "stop" )
			src = "./image/s.png";
		return src;
	}
	
	// 名前を取得
	function getName() {
		return $("#entry_input").val() || "";
	}
	
	// プレイヤー名をセットする
	function updatePlayer(player) {
		$("#queue_list>li.player").text(player.name);
	}
	
	// キューリストを更新する
	function updateQueueList(queueList) {
		$("#queue_list>li").not(".player").text("");
		for(var i=0; i < queueList.length; i++) {
			var queue = queueList[i];
			$($("#queue_list>li").not(".player").get(i)).text(queue.name);
		}
	}
	
	// つぶやきを追加する
	function addTsubuyaki(tsubuyaki) {
		var $tick = $("<div class='tsubuyaki' />").text(tsubuyaki);
		$("#tsubuyaki_ticker_inner").append($tick);
		$tick.animate({ 
			right : $("#tsubuyaki_ticker_inner").width() - $tick.width()
		},
		{
			easing	 : "linear",
			duration : 10000,
			complete : function() {
				$tick.remove();
			}
		});
	}

////////////////////////////////////////////////////////
// event handler
////////////////////////////////////////////////////////
	
	// 前進ボタン
	function forwardButtonClick() {
		forward();
	}
	
	// 後退ボタン
	function backButtonClick() {
		back();
	}
	
	// 右前進ボタン
	function rightForwardButtonClick() {
		rightForward();
	}
	
	// 左前進ボタン
	function leftForwardButtonClick() {
		leftForward();
	}
	
	// 停止ボタン
	function stopButtonClick() {
		stop();
	}
	
	// 画像更新のsetInterval
	function viewImageReloadInterval() {
		reloadViewImage();
	}
	
	// キューに追加ボタンのクリック
	function queueButtonClick() {
		queue();
	}
	
	// メッセージ送信ボタンクリック
	function sendButtonClick() {
		sendTsubuyaki();
	}
	
	// つぶやきインプットのキーボード
	function tsubuyakiInputKeyDown(e) {
		if ( e.keyCode == 13 ) { // Enter
			sendTsubuyaki();
		}
	}
	
	// プレイヤー登録インプットのキーボード
	function entryInputKeyDown(e) {
		if ( e.keyCode == 13 ) { // Enter
			queue();
		}
	}
	
	// YouTubeボタンにホバーしたとき
	function youtubeButtonOver() {
		$(this).attr("src", "./image/youtube-btn-on.jpg");
	}
	
	// YouTubeボタンからホバーがアウトしたとき
	function youtubeButtonOut() {
		$(this).attr("src", "./image/youtube-btn-off.jpg");
	}
	
	// YouTubeボタンをクリックしたとき
	function youtubeButtonClick() {
		// ToDo:
		var $youtube = $('<div><iframe width="420" height="315" src="http://www.youtube.com/embed/8J5xxVJF39Q" frameborder="0" allowfullscreen></iframe></div>');
		$youtube.dialog({
			modal 		: true,
			resizable 	: false,
			width 		: 454
		});
	}
	
	// ヘルプボタンにホバーしたとき
	function helpButtonOver() {
		$(this).attr("src", "./image/help-btn-on.jpg");
	}
	
	// ヘルプボタンからホバーがアウトしたとき
	function helpButtonOut() {
		$(this).attr("src", "./image/help-btn-off.jpg");
	}
	
	// ヘルプボタンをクリックしたとき
	function helpButtonClick() {
		window.open("./help.html", "__helpPage__");
	}
	
	// つぶやきボタンにホバーしたとき
	function sendButtonOver() {
		$(this).attr("src", "./image/tbyk-on.jpg");
	}
	
	// つぶやきボタンからホバーがアウトしたとき
	function sendButtonOut() {
		$(this).attr("src", "./image/tbyk-off.jpg");
	}
	
	
});