chrome.identity.getAuthToken({'interactive': true}, function (token) {
  console.log(token);
})

var USER_INFO = 'https://picasaweb.google.com/data/feed/api/user/default',
    TEST_ID = 'https://picasaweb.google.com/data/feed/api/user/107068484345384148331/albumid/6004394524595870353',
    ICON_URL = chrome.extension.getURL('img/icon128.png');
    //https://picasaweb.google.com/data/feed/api/user/userID/albumid/albumID

/*
 * Reloading list of albums
 */
var reloadAlbums = function () {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', USER_INFO, true);
  xhr.onload = function (e) {
    if (this.status == 200) {
      var id, title,
          all = e.target.responseXML.getElementsByTagName("entry");
      for (var i = 0, l = all.length; i < l; i++) {
        id = all[i].getElementsByTagName("id")[0].innerHTML;
        title = all[i].getElementsByTagName("title")[0].innerHTML;
      };
    }
  };
  xhr.send(null);
};


var notificate = function (isSuccess, imageUrl) {
  chrome.notifications.create("", {
    type: isSuccess ? 'image' : 'basic',
    title: 'Image+',
    message: isSuccess ? chrome.i18n.getMessage("savingOK") : chrome.i18n.getMessage("savingError"),
    iconUrl: ICON_URL,
    imageUrl: imageUrl
  }, function () {});
}

var sendToAlbum = function (params) {
  var albumId = TEST_ID,
      url = params.srcUrl;

  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.onload = function (e) {
    if (this.status == 200) {
      var blob = new Blob([this.response], {type: 'image/png'});
      var xhr = new XMLHttpRequest();
      xhr.open('POST', albumId, true);
      xhr.setRequestHeader("GData-Version", '3.0');
      xhr.setRequestHeader("Content-Type", 'image/jpeg');
      xhr.setRequestHeader("Slug", "MyTestImage");
      xhr.onload = function () {
        if (xhr.status == 201) {
          notificate(true, url);
        } else {
          notificate(false);
        }
      }
      chrome.identity.getAuthToken({'interactive': true}, function (token) {
        xhr.setRequestHeader("Authorization", "Bearer " + token);
        xhr.send(blob);
      })
    }
  };
  xhr.send(null);
};

var createMenu = function () {
  var id = chrome.contextMenus.create({ title: "Image+", contexts: ["image"]});
  chrome.contextMenus.create({ title: "Image+ Test", contexts: ["image"], "onclick": sendToAlbum, parentId: id });

  chrome.contextMenus.create({ title: "Reload", contexts: ["image"], onclick: reloadAlbums, parentId: id });
};


createMenu();
