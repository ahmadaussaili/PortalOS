/**
 * Module for general desktop config and management
 */

/**
 * Function executed to control the sidebar through its button.
 */
function sideBarButton() {
  if ($("#openSideBar").length) {
    // Add events to the sidebar.
    addSidebarEvents();
    $("#desktopSideBar").css("right", "0");
    $("#openSideBar").attr("id", "closeSideBar");
  } else {
    $("#desktopSideBar").css("right", "-26%");
    $("#closeSideBar").attr("id", "openSideBar");
  }
}

function addSidebarEvents() {
  askWS("getAgenda", {}, (data) => {
    if (data) {
      data.event = data.event.sort((a, b) => {
        if (!a.d) {
          a.d = new Date(a.date);
          let aSplit = a.time.split(":");
          a.d.setUTCHours(aSplit[0]);
          a.d.setUTCMinutes(aSplit[1]);
        }
        if (!b.d) {
          b.d = new Date(b.date);
          let bSplit = b.time.split(":");
          b.d.setUTCHours(bSplit[0]);
          b.d.setUTCMinutes(bSplit[1]);
        }
        return a.d > b.d ? 1 : -1;
      });
      let html = "";
      let lastD = new Date();
      let lastY = -1;
      let lastM = -1;
      let counter = 1;
      data.event.forEach((event) => {
        let d = event.d;
        if (!d) {
          d = new Date(event.date);
          let split = event.time.split(":");
          d.setUTCHours(split[0]);
          d.setUTCMinutes(split[1]);
        }
        let end =  new Date();
        end.setHours(23, 59, 59, 999);
        if (d < new Date() ||  d > end) return;
        if (counter++ > 4) {
          return;
        }
        html += "<div class='sideEvent'>";
        html += `<div>${event.time}</div>`;
        html += `<div class="eventName">${event.name}</div>`;
        let col = [0, 0, "#3dd200", "#f1e000", "#e29420", "#dd2e00"][counter];
        html += `<div class="timelineBall float" style="background-color: ${col}"></div>`;
        html += "</div>";
      });
      if (counter > 1) $(".sidebarEventsTitle").text("Today's Agenda");
      else {
        data.event.forEach((event) => {
          let d = event.d;
          if (!d) {
            d = new Date(event.date);
            let split = event.time.split(":");
            d.setUTCHours(split[0]);
            d.setUTCMinutes(split[1]);
          }
          let end = new Date();
          end.setDate(end.getDate() + (7 - end.getDay()) % 7);
          end.setHours(23, 59, 59, 999);
          if (d < new Date() || d > end) return;
          if (counter++ > 4) {
            return;
          }
          let day = "Sun,Mon,Tue,Wed,Thur,Fri,Sat".split(",")[d.getDay()];
          html += "<div class='sideEvent'>";
          html += `<div>${day} ${event.time}</div>`;
          html += `<div class="eventName">${event.name}</div>`;
          let col = [0, 0, "#3dd200", "#f1e000", "#e29420", "#dd2e00"][counter];
          html += `<div class="timelineBall float" style="background-color: ${col}"></div>`;
          html += "</div>";
        });
        $(".sidebarEventsTitle").text("This Week's Agenda");
        if (counter == 1) {
          html += "<div class='sideEvent'>";
          html += `<div>Add something to this weeks agenda</div>`;
          html += `<div class="timelineBall float"></div>`;
          html += "</div>";
        }
      }
      $(".sidebarEvents").html(html);
    }
  });
}

/**
 * See https://www.w3schools.com/howto/howto_js_draggable.asp
 * Modified for es6, jQuery and to limit to stay on screen
 * @param {DOM} $elmnt
 */
function dragElement($elmnt) {
  let pos1 = 0;
  let pos2 = 0;
  let pos3 = 0;
  let pos4 = 0;
  $elmnt.find(".title-bar")[0].onmousedown = dragMouseDown;
  let elmnt = $elmnt[0];

  function dragMouseDown(e) {
    e = e || window.event;
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
    $(".app").removeClass("active");
    $elmnt.addClass("active");
  }

  /**
   * Called every time the cursor moves
   * @param {*} e Drag Event
   */
  function elementDrag(e) {
    e = e || window.event;
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    if (elmnt.offsetTop - pos2 < 0) pos2 = 0;
    if (elmnt.offsetTop - pos2 + elmnt.offsetHeight > window.innerHeight) pos2 = 0;
    if (elmnt.offsetLeft - pos1 < 0) pos1 = 0;
    if (elmnt.offsetLeft - pos1 + elmnt.offsetWidth > window.innerWidth) pos1 = 0;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

/**
 * Add app frame to the root
 * @param {*} $root
 * @param {*} title
 * @param {*} apps
 */
function makeApp($root, title, apps) {
  const $app = $("<div>").addClass("app").addClass("hide");
  const $titleBar = $("<div>").addClass("title-bar");
  // $titleBar.append($("<div>").text(title).addClass("title"));

  const $minimise = $("<div>").addClass("app-control minimise");
  $minimise.click(() => {
    $app.addClass("hide");
  });

  const $close = $("<div>").addClass("app-control close");
  $close.click(() => {
    $app.remove();
    apps[title] = undefined;
  });
  $titleBar.append($close);
  $titleBar.append($minimise);
  $app.append($titleBar);
  $root.append($app);
  dragElement($app);
  apps[title] = $app;
}

/**
 * From https://stackoverflow.com/questions/15397372/javascript-new-date-ordinal-st-nd-rd-th
 * @param {*} d2
 * @return {String}
 */
function nth(d2) {
  if (d2 > 3 && d2 < 21) return "th";
  switch (d2 % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/**
 * Recursively keep the sidebar date/time upto date
 */
function updateDateTime() {
  var d = new Date();
  let hour = d.getHours();
  let min = d.getMinutes();
  if (min < 10) min = "0" + min;
  if (hour < 10) hour = "0" + hour;
  let date = "";
  let month = "January,February,March,April,May,June,July,August,September,October,November,December"
    .split(",")[d.getMonth()];

  date = d.getDate() + nth(d.getDate()) + " " +
    month + " " + d.getFullYear();
  let html = `<div class="time noselect">${hour}:${min}</div>`;
  html += `<div class="date noselect">${date}</div>`;
  $(".dateTime").html(html);
  setTimeout(updateDateTime, 1000);
}

function getWeather() {
  let location = cookies.get("location") || "Manchester, UK";
  let url = `https://query.yahooapis.com/v1/public/yql?q=select%20item.condition%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22${location}%2C%20tx%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`;
  $.ajax(url, {
    "success": (res) => {
      let icon = "";
      temp = res.query.results.channel.item.condition.temp;
      text = res.query.results.channel.item.condition.text;
      switch (res.query.results.channel.item.condition.code) {
        case "0":
          icon = "/assets/images/weather/windy-weather.png";
          break;
        case "1":
          icon = "/assets/images/weather/storm-weather.png";
          break;
        case "2":
          icon = "/assets/images/weather/windy-weather.png";
          break;
        case "3":
          icon = "/assets/images/weather/storm-weather.png";
          break;
        case "4":
          icon = "/assets/images/weather/thunder-weather.png";
          break;
        case "5":
          icon = "/assets/images/weather/rain-snow.png";
          break;
        case "6":
          icon = "/assets/images/weather/rain-snow.png";
          break;
        case "7":
          icon = "/assets/images/weather/rain-snow.png";
          break;
        case "8":
          icon = "/assets/images/weather/rain-snow.png";
          break;
        case "9":
          icon = "/assets/images/weather/rainy-weather.png";
          break;
        case "10":
          icon = "/assets/images/weather/rain-snow.png";
          break;
        case "11":
          icon = "/assets/images/weather/rainy-weather.png";
          break;
        case "12":
          icon = "/assets/images/weather/rainy-weather.png";
          break;
        case "13":
          icon = "/assets/images/weather/snow-weather.png";
          break;
        case "14":
          icon = "/assets/images/weather/snow-weather.png";
          break;
        case "15":
          icon = "/assets/images/weather/snow-weather.png";
          break;
        case "16":
          icon = "/assets/images/weather/snow-weather.png";
          break;
        case "17":
          icon = "/assets/images/weather/snow-weather.png";
          break;
        case "18":
          icon = "/assets/images/weather/snow-weather.png";
          break;
        case "19":
          icon = "/assets/images/weather/windy-weather.png";
          break;
        case "20":
          icon = "/assets/images/weather/haze-weather.png";
          break;
        case "21":
          icon = "/assets/images/weather/haze-weather.png";
          break;
        case "22":
          icon = "/assets/images/weather/haze-weather.png";
          break;
        case "23":
          icon = "/assets/images/weather/windy-weather.png";
          break;
        case "24":
          icon = "/assets/images/weather/windy-weather.png";
          break;
        case "25":
          icon = "/assets/images/weather/unknown.png";
          break;
        case "26":
          icon = "/assets/images/weather/cloudy-weather.png";
          break;
        case "27":
          icon = "/assets/images/weather/mostly-cloudy-night.png";
          break;
        case "28":
          icon = "/assets/images/weather/mostly-cloudy.png";
          break;
        case "29":
          icon = "/assets/images/weather/partly-cloudy-night.png";
          break;
        case "30":
          icon = "/assets/images/weather/partly-cloudy.png";
          break;
        case "31":
          icon = "/assets/images/weather/clear-night.png";
          break;
        case "32":
          icon = "/assets/images/weather/clear-day.png";
          break;
        case "33":
          icon = "/assets/images/weather/clear-night.png";
          break;
        case "34":
          icon = "/assets/images/weather/clear-day.png";
          break;
        case "35":
          icon = "/assets/images/weather/rain-snow.png";
          break;
        case "36":
          icon = "/assets/images/weather/unknown.png";
          break;
        case "37":
          icon = "/assets/images/weather/thunder-weather.png";
          break;
        case "38":
          icon = "/assets/images/weather/thunder-weather.png";
          break;
        case "39":
          icon = "/assets/images/weather/thunder-weather.png";
          break;
        case "40":
          icon = "/assets/images/weather/rainy-weather.png";
          break;
        case "41":
          icon = "/assets/images/weather/snow-weather.png";
          break;
        case "42":
          icon = "/assets/images/weather/snow-weather.png";
          break;
        case "43":
          icon = "/assets/images/weather/snow-weather.png";
          break;
        case "44":
          icon = "/assets/images/weather/cloudy-weather.png";
          break;
        case "45":
          icon = "/assets/images/weather/storm-weather.png";
          break;
        case "46":
          icon = "/assets/images/weather/snow-weather.png";
          break;
        case "47":
          icon = "/assets/images/weather/storm-weather.png";
          break;
        case "3200":
          icon = "/assets/images/weather/unknown.png";
          break;
        default:
          icon = "/assets/images/weather/unknown.png";
          break;
      }
      // Add weather to the sidebar.
      let html = `<img title="Weather Icon" src=${icon} id="weatherPic" class="noselect">`;
      if (cookies.get("temp")) {
        html += `<div><div class="weatherDescription noselect">${temp}</div>`;
        html += `<div class="unit noselect">&deg;F</div></div>`;
      } else {
        temp = Math.round((temp - 32) * 5 / 9);
        html += `<div><div class="weatherDescription noselect">${temp}</div>`;
        html += `<div class="unit noselect">&deg;C</div></div>`;
      }
      $(".weather").html(html);
      setTimeout(getWeather, 600000);
    }
  });
}

/**
 * First method called after login, begins the desktop generation.
 */
function loggedIn() {
  const apps = {};
  $("#content").html(htmlTemplates.desktop);
  $("html").css("overflow", "hidden");

  askWS("getBackground", {}, (data) => {
    getWeather();
    const bg = data.background;
    $("#desktop").css("background-image", "url('" + bg + "')");
  });

  $("#desktop").append($("<div>").attr("id", "desktopSideBar"));
  $("#desktopSideBar").append($("<div>").addClass("sideBarHeader"));
  $(".sideBarHeader").append($("<div>").addClass("dateTime"));
  updateDateTime();

  // Add the weather to sidebar.
  $(".sideBarHeader").append($("<div>").addClass("weather"));
  getWeather();

  // Add logout button to sidebar.
  $("#desktopSideBar").append($("<div>").addClass("logoutSideBar noselect").text("Log Out").click(() => {
    cookies.delete("sid");
    location.reload();
  }));

  // Add events to sidebar.
  $("#desktopSideBar").append($("<div>").addClass("sidebarEventsTitle").text("Agenda"));
  $("#desktopSideBar").append($("<div>").addClass("timeline"));
  $("#desktopSideBar").append($("<div>").addClass("timelineBall"));
  $("#desktopSideBar").append($("<div>").addClass("sidebarEvents"));

  $("#launch-fm").click(() => {
    if (!apps["File Manager"]) {
      makeApp($("#apps"), "File Manager", apps);
      let $controls = $("<div>").addClass("sidebar");
      $controls.append($("<div>").html("<h4>Favorites</h4>"));
      $controls.append($("<div>").html("<ul class='favs'></ul>"));
      $controls.append($("<div>").html("<h4>Folders</h4>"));
      $controls.append($("<div>").addClass("folder-struct"));
      apps["File Manager"].append($controls);
      apps["File Manager"].append($("<div>").addClass("app-content"));
      getFileSystem(apps["File Manager"].find(".app-content"), apps);
      apps["File Manager"].css({
        "top": 40,
        "left": (window.innerWidth - apps["File Manager"].width()) / 2
      });
      apps["File Manager"].removeClass("hide");
    } else {
      if (apps["File Manager"].hasClass("active")) {
        apps["File Manager"].addClass("hide");
        apps["File Manager"].removeClass("active");
      } else {
        apps["File Manager"].removeClass("hide");
        $(".app").removeClass("active");
        apps["File Manager"].addClass("active");
      }
    }
  });

  $("#openSideBar").click(() => {
    sideBarButton();
  });

  $("#calculator").click(() => {
    if (!apps["Calculator"]) {
      makeApp($("#apps"), "Calculator", apps);
      apps["Calculator"].css({
        "height": 400,
        "width": 300,
        "top": 40,
        "left": (window.innerWidth - apps["Calculator"].width()) / 2
      });
      makeCalculator(apps["Calculator"]);
      apps["Calculator"].removeClass("hide");
      $(".app").removeClass("active");
      apps["Calculator"].addClass("active");
    } else {
      if (apps["Calculator"].hasClass("active")) {
        apps["Calculator"].addClass("hide");
        apps["Calculator"].removeClass("active");
      } else {
        apps["Calculator"].removeClass("hide");
        $(".app").removeClass("active");
        apps["Calculator"].addClass("active");
      }
    }
  });
  //calendar
  $("#calendar").click(() => {
    if (!apps["Calendar"]) {
      makeApp($("#apps"), "Calendar", apps);
      apps["Calendar"].css({
        "top": 40,
        "left": (window.innerWidth - apps["Calendar"].width()) / 2
      });
      makeCalendar(apps["Calendar"]);
      apps["Calendar"].removeClass("hide");
      $(".app").removeClass("active");
      apps["Calendar"].addClass("active");
    } else {
      if (apps["Calendar"].hasClass("active")) {
        apps["Calendar"].addClass("hide");
        apps["Calendar"].removeClass("active");
      } else {
        apps["Calendar"].removeClass("hide");
        $(".app").removeClass("active");
        apps["Calendar"].addClass("active");
      }
    }
  });

  //end calendar
  $("#labChecker").click(() => {
    if (!apps["LabChecker"]) {
      makeApp($("#apps"), "LabChecker", apps);
      apps["LabChecker"].css({
        "height": 400,
        "width": 600,
        "top": 40,
        "left": (window.innerWidth - apps["LabChecker"].width()) / 2
      });
      makeLabChecker(apps["LabChecker"]);
      apps["LabChecker"].removeClass("hide");
      $(".app").removeClass("active");
      apps["LabChecker"].addClass("active");
    } else {
      if (apps["LabChecker"].hasClass("active")) {
        apps["LabChecker"].addClass("hide");
        apps["LabChecker"].removeClass("active");
      } else {
        apps["LabChecker"].removeClass("hide");
        $(".app").removeClass("active");
        apps["LabChecker"].addClass("active");
      }
    }
  });

  $("#musicPlayer").click(() => {
    if (!apps["MusicPlayer"]) {
      makeApp($("#apps"), "MusicPlayer", apps);
      let $controls = $("<div>").addClass("musicSidebar");
      let $files = $("<div>").addClass("music");
      $files.append($files);

      askWS("musicList", {}, (data) => {
        $files.html(searchMusic(data));
      });
      apps["MusicPlayer"].append($controls);
      apps["MusicPlayer"].css({
        "height": 400,
        "width": 600,
        "top": 40,
        "left": (window.innerWidth - apps["MusicPlayer"].width()) / 2
      });
      makeMusicPlayer(apps["MusicPlayer"]);
//    apps["MusicPlayer"].append($playList);
      apps["MusicPlayer"].removeClass("hide");
      $(".app").removeClass("active");
      apps["MusicPlayer"].addClass("active");
    } else {
      if (apps["MusicPlayer"].hasClass("active")) {
        apps["MusicPlayer"].addClass("hide");
        apps["MusicPlayer"].removeClass("active");
      } else {
        apps["MusicPlayer"].removeClass("hide");
        $(".app").removeClass("active");
        apps["MusicPlayer"].addClass("active");
      }
    }
  });

  $("#settings").click(() => {
    if (!apps["Settings"]) {
      makeApp($("#apps"), "Settings", apps);
      apps["Settings"].css({
        "top": 40,
        "left": (window.innerWidth - apps["Settings"].width()) / 2
      });
      makeSettings(apps["Settings"]);
      apps["Settings"].removeClass("hide");
    } else {
      if (apps["Settings"].hasClass("active")) {
        apps["Settings"].addClass("hide");
        apps["Settings"].removeClass("active");
      } else {
        apps["Settings"].removeClass("hide");
        $(".app").removeClass("active");
        apps["Settings"].addClass("active");
      }
    }
  });
}

$(document).on("click", ".app", (e) => {
  const $this = $(e.currentTarget);
  if ($this.hasClass("active")) return;
  $(".app").removeClass("active");
  $this.addClass("active");
});
