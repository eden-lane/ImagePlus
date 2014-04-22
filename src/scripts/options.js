var picasaApiUrl = "https://picasaweb.google.com/data/feed/api/user/default/albumid/";

document.addEventListener("DOMContentLoaded", function () {

  var objects = document.getElementsByTagName('*'), i;
  for (i = 0; i < objects.length; i++) {
    if (objects[i].dataset && objects[i].dataset.message) {
      objects[i].innerHTML = chrome.i18n.getMessage(objects[i].dataset.message);
    }
  }

  $("#patterns").dblclick(removePattern);

  $("#albums").dblclick(function (ev) {
    addPattern(ev.srcElement.innerText);
  });

  $("#pattern-input").keydown(function (ev) {
    if (ev.which == 13) {
      addPattern($(this).val());
      $(this).val("");
    }
  });

  $("input[type=radio]").click(saveListType);
  load();
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

/*
 * Getting list of albums from picasa's user profile
 */
function buildAlbums(callback) {
  var bp = chrome.extension.getBackgroundPage(),
      $list = $("#albums");
  bp.reloadAlbums(function (albums) {
    for (var i = 0, max = albums.length; i < max; i++) {
      $list.append($("<option></option>").attr("value", albums[i].title).text(albums[i].title));
    };
    if (callback && typeof callback == 'function')
      callback();
  });
}

function reloadAlbumList() {
	$("#albums")[0].innerHTML = "";
	buildAlbums(showMatched);
};

function showMatched() {
  var result = $("#matched");
  result.text("");

  var patterns = $("#patterns")[0].children;
  var all = $("#albums")[0].children;

  for (var i=0; i<patterns.length; i++) {
    var reg = new RegExp(patterns[i].innerText);
    for (var x = 0; x < all.length; x++) {
      var el = all[x];
      if (reg.test(all[x].text))
          result.append(all[x].text + "<br/>");
    };
  };
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

    for (var i = 0; i < pts.length; i++) {
      list.append($("<option></option>").attr("value", pts[i]).text(pts[i]));
    };
    reloadAlbumList();
  });
  loadListType();
}
