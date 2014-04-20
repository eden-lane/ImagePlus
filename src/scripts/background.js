var picasaApiUrl = "https://picasaweb.google.com/data/feed/api/user/default/albumid/";

chrome.storage.sync.get("patterns", function(it) {
	if (it.patterns == undefined) {
		var pts = ['\\d{4}-\\d{2}-\\d{2}'];
		chrome.storage.sync.set({'patterns' : pts});
	}
});


var oauth = ChromeExOAuth.initBackgroundPage({
  'request_url': 'https://www.google.com/accounts/OAuthGetRequestToken',
  'authorize_url': 'https://www.google.com/accounts/OAuthAuthorizeToken',
  'access_url': 'https://www.google.com/accounts/OAuthGetAccessToken',
  'consumer_key': 'anonymous',
  'consumer_secret': 'anonymous',
  'scope': 'https://picasaweb.google.com/data/',
  'app_name': 'Image+'
});

oauth.authorize(function() {
	getAlbums();
});


function getAlbums() {
	chrome.contextMenus.removeAll();
	oauth.sendSignedRequest('https://picasaweb.google.com/data/feed/api/user/default', function(response) {
		buildAlbumList(response);
	});
};

function buildAlbumList(xml) {
	var web_albums = [];
	$("entry", xml).each(function () {
		var album = {};
		album.title = $(this).find("title").text();
		album.id = $(this).find("id").text().replace("entry","feed");
		web_albums.push(album);
	});
	moderateMenu(web_albums);
}

function moderateMenu(web_albums) {
	buildMenu(web_albums);
}

function buildMenu(albums) {
    chrome.storage.sync.get("isblack", function (it) {
        var toHide = it.isblack;
        console.log(toHide);
        chrome.storage.sync.get("patterns", function (items) {
            var pts = items.patterns;
            for (var i = 0; i < albums.length; i++) {
                var matched = false;
                for (var x = 0; x < pts.length; x++) {
                    var reg = new RegExp(pts[x]);
                    if (reg.test(albums[i].title)) {
                        matched = true;
                        break;
                    }
                }
                if (matched != toHide)
                    chrome.contextMenus.create({ "title": albums[i].title, "contexts": ["image"], "onclick": onClick, "id": albums[i].id });
            };
            chrome.contextMenus.create({ "type": "separator", "contexts": ["image"] });
            chrome.contextMenus.create({ "title": "Reload", "contexts": ["image"], "onclick": getAlbums });
        });
    });
}

function onClick (info) {
  alert();
	//sendToPicasa(info.srcUrl, info.menuItemId);
}

function sendToPicasa(url, album_id) {
	var xhr = new XMLHttpRequest();
	var arr = url.split("/");
	var name = arr[arr.length-1];
	xhr.open('GET', url, true);
	xhr.responseType = 'blob';
	xhr.onload = function (e) {
		if (this.status == 200) {
			var blob = new Blob([this.response], {type: 'image/png'});
			var xhr = new XMLHttpRequest();
			xhr.open('POST', album_id, true);
			xhr.setRequestHeader("GData-Version", '3.0');
			xhr.setRequestHeader("Content-Type", 'image/jpeg');
			xhr.setRequestHeader("Slug", name);
			xhr.setRequestHeader("Authorization", oauth.getAuthorizationHeader(album_id, 'POST', ''));

			xhr.onload = function () {
				if (xhr.status == 201) {
					var notification = webkitNotifications.createNotification(
					url,
					'Saving complete',  "");
					notification.show();
					setTimeout(function() {notification.cancel() }, 8000);
				} else {
					var notification = webkitNotifications.createNotification(
					url,
					'Saving failed',  "");
					notification.show();
					setTimeout(function() {notification.cancel() }, 8000);
				}
			}
			xhr.send(blob);
		}
	};
	xhr.send();
}

