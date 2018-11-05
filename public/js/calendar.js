/**
 *
 * @param {*} $root
 */
function makeCalendar($root) {
    $root.css({
        "display": "block",
        "overflow": "hidden"
    });
    let $events = $("<div>").addClass("events");
    //<div class=events></div>
    $root.append($events);
    askWS("getSchedule", {}, (data) => {
      if (data) {
          data.event.push({d: new Date(), sep: true});
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
          let hideEvents = cookies.get("hideEvents") || false;
          data.event.forEach((event) => {
              let d = event.d;
              if (hideEvents && d < new Date()) return;
              let day = "Sun,Mon,Tue,Wed,Thur,Fri,Sat".split(",")[d.getDay()];
              let date = day + " " + d.getDate() + nth(d.getDate());
              d.setHours(0, 0, 0, 0);
              if (d.getTime() !== lastD.getTime()) {
                if (d.getFullYear() != lastY) {
                    lastY = d.getFullYear();
                    lastM = -1;
                    html += `<div class="year">${lastY}</div>`;
                }
                if (d.getMonth() != lastM) {
                    lastM = d.getMonth();
                    let month = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec"
                        .split(",")[d.getMonth()];
                    html += `<div class="month">${month}</div>`;
                }
                html += `<div class="day">${date}</div>`;
                lastD = event.d;
              }
              if (event.sep) {
                  html += "<div class='now'></div>";
                  return;
              }
              html += "<div class='event'>";
              html += `<div class="eventName">${event.name}</div>`;
              html += `<div>${event.time}</div>`;
              html += "</div>";
          });
          $events.html(html);
          $(".gotoNow").click();
      }
    });
    let $addevents = $("<div>").addClass("addevents")
        .append($("<img>").attr("src", "https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_add_white_24px.svg"))
        .click(() => {
            makeEventDialog($root);
        });
    let $now = $("<div>").addClass("gotoNow")
        .append($("<img>").attr("src", "https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_event_white_24px.svg"))
        .click(() => {
            // Scroll to now
            $(".now")[0].scrollIntoView({behavior: "smooth"});
        });
    $root.append($addevents);
    $root.append($now);
}
//adding dialog function
function makeEventDialog($root) {
    const $dialog = $("<div>").addClass("dialog");
    $dialog.append($("<h3>").text("New Event"))
    $dialog.append(`<input id="new-event" placeholder="Event Name" style = "text-align: center"/>`);
    $dialog.append($("<h4>").text("Date"))
    $dialog.append( $('<input>', {
    id: "date",
    type: 'date'
    })
    );
    $dialog.append($("<h4>").text("Time"));
    $dialog.append(`<input id="time"  type = "time"/>`);
    $dialog.append($("<div>").attr("id", "AddEvent").text("Create"));
    $root.children().addClass("blur");
    $dialog.click((e) => {
        e.stopPropagation();
    });
    $root.append($dialog);
    setTimeout(() => {
        $("#AddEvent").click(() => {
            let name = $("#new-event").val();
            let time = $("#time").val();
            let date = $("#date").val();
            if (!name || !time || !date) {
                errorUI.newError("You must enter an event name, date and time.");
                return;
            }
            sendWS("addEvent",{
              date,
              time,
              name
            });
            $root.click();
        });
        $root.click(() => {
            $root.children().removeClass("blur");
            $root.find(".dialog").remove();
            $root.unbind("click");
        });
    }, 100);
}
