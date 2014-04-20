var picasaApiUrl = "https://picasaweb.google.com/data/feed/api/user/default/albumid/";

var oauth = ChromeExOAuth.initBackgroundPage({
  'request_url': 'https://www.google.com/accounts/OAuthGetRequestToken',
  'authorize_url': 'https://www.google.com/accounts/OAuthAuthorizeToken',
  'access_url': 'https://www.google.com/accounts/OAuthGetAccessToken',
  'consumer_key': 'anonymous',
  'consumer_secret': 'anonymous',
  'scope': 'https://picasaweb.google.com/data/',
  'app_name': 'Image+'
});

document.addEventListener("DOMContentLoaded", function () {

	var objects = document.getElementsByTagName('*'), i;
	for (i = 0; i < objects.length; i++) {
		if (objects[i].dataset && objects[i].dataset.message) {
			console.log(objects[i].dataset.message);

			objects[i].innerHTML = chrome.i18n.getMessage(objects[i].dataset.message);
		}
	}

	oauth.authorize(function() {
		reloadAlbumList();
	});

	$("#patterns").dblclick(removePattern);

	$("#albums").dblclick(function (ev) {
		addPattern(ev.srcElement.text);
	});

	$("#pattern-input").keydown(function (ev) {
		if (ev.which == 13) {
			addPattern($(this).val());
			$(this).val("");
		}
	});

	$("input[type=radio]").click(saveListType);

});

function addPattern(pt) {
	$("#patterns").append($("<option></option>").attr("value", pt).text(pt));
	showMatched();
	save();
};

function removePattern(ev) {
	$(ev.srcElement).remove();
	showMatched();
	save();
};

function getAlbums() {
	oauth.sendSignedRequest('https://picasaweb.google.com/data/feed/api/user/default', function(response) {
		buildAlbumList(response);
		load();
	});
}

function buildAlbumList(xml) {
	var list = $("#albums");
	$("entry", xml).each(function () {
		var title = $(this).find("title").text();
		list.append($("<option></option>").attr("value", title).text(title));
	});
}

function reloadAlbumList() {
	$("#albums")[0].innerHTML = "";
	getAlbums();
};

function showMatched() {
	var result = $("#matched");
	result.text("");

	var patterns = $("#patterns")[0].children;
	var all = $("#albums")[0].children;

	for (var i=0; i<patterns.length; i++) {
		var reg = new RegExp(patterns[i].innerText);
		for (var x=0; x<all.length; x++) {
			var el = all[x];
			if (reg.test(all[x].text))
				result.append(all[x].text + "<br/>");
		};
	};
	chrome.extension.getBackgroundPage().getAlbums();
}

function save() {
	var pts = $("#patterns")[0];
	pts = pts.children;
	var patterns = [];
	for (var i=0; i<pts.length; i++) {
		patterns.push(pts[i].text);
	};
	chrome.storage.sync.set({ 'patterns': patterns });
}

function saveListType() {
    var isBlack;
    $("#black").attr("checked") == "checked" ? isBlack = true : isBlack = false;
    chrome.storage.sync.set({ 'isblack': isBlack });
}

function loadListType() {
    chrome.storage.sync.get("isblack", function (it) {
        if (it.isblack)
            $("#black").attr("checked", "checked");
        else
            $("#white").attr("checked", "checked");
    });
}

function load() {
	var list = $("#patterns");
	list.text("");
	chrome.storage.sync.get("patterns", function (items) {
		var pts = items.patterns;

		for (var i=0; i<pts.length; i++) {
			list.append($("<option></option>").attr("value", pts[i]).text(pts[i]));
		};
		showMatched();
	});
	loadListType();
}
