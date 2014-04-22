chrome.identity.getAuthToken({'interactive': true}, function (token) {
  console.log(token);
})

var USER_INFO = 'https://picasaweb.google.com/data/feed/api/user/default',
    TEST_ID = 'https://picasaweb.google.com/data/feed/api/user/107068484345384148331/albumid/6004394524595870353',
    ICON_URL = chrome.extension.getURL('img/icon128.png');

/*
 * Reloading list of albums
 */
var reloadAlbums = function (callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', USER_INFO, true);
  xhr.onload = function (e) {
    if (this.status == 200) {
      var id, title,
          albums = [],
          all = e.target.responseXML.getElementsByTagName("entry");
      for (var i = 0, l = all.length; i < l; i++) {
        id = all[i].getElementsByTagName("id")[0].innerHTML;
        title = all[i].getElementsByTagName("title")[0].innerHTML;
        albums.push({id: id, title: title});
      };
      callback(albums);
    }
  };
  xhr.send(null);
};

/*
 * Building context menu for albums that matches
 * patterns
 * @param {array} albums - array of albums
 * @param {function} callback - fired after list filling
 */
var buildMenu = function (albums, callback) {
  chrome.storage.sync.get("isblack", function (it) {
    var toHide = it.isblack;
    chrome.storage.sync.get("patterns", function (it) {
      var patterns = it.patterns;
      for (var i = 0, max = albums.length; i < max; i++) {
        var matched = false;
        for (var x = 0, l = patterns.length; x < l; x++) {
          var reg = new RegExp(patterns[x]);
          if (reg.test(albums[i].title)) {
            matched = true;
            break;
          }
        };
        if (matched != toHide)
          chrome.contextMenus.create({
            title: albums[i].title,
            contexts: ["image"],
            onclick: sendToAlbum
          })
      };
      callback();
    })
  });
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
  chrome.contextMenus.removeAll();
  reloadAlbums(function (albums) {
    buildMenu(albums, function (){
      chrome.contextMenus.create({ type: "separator", contexts: ["image"]});
      chrome.contextMenus.create({ title: chrome.i18n.getMessage("reload"), contexts: ["image"], onclick: createMenu});
    });
  });
};


createMenu();
