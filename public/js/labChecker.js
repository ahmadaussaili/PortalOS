/**
*
* @param {*} $root
*/
function makeLabChecker($root) {
   $root.css({
       "display": "block",
       "overflow": "hidden",
       "transition": "transform 0.3s, background-color 0.7s"
   });
   $root.append($("<div>").attr({id:"labMenuID", class:"labMenu"}));
   // Wipe - flash a light for a short time on the screen. Used when
   // user asks for a specific lab and a specific time.
   let $wipeYes = $("<div>").addClass("wipeLabYes");
   let $wipeNo = $("<div>").addClass("wipeLabNo");
   $root.append($wipeYes);
   $root.append($wipeNo);

   // Select Lab.
   $("#labMenuID").append($("<select>").attr({id:"selectLabID",
       class:"labSelect"}));
   $("#selectLabID").append($("<option>", {
       value: "All",
       text: "All labs"
	   }));
   $("#selectLabID").append($("<option>", {
       value: "LF31",
       text: "LF31"
	   }));
   $("#selectLabID").append($("<option>", {
       value: "G23",
       text: "G23"
	   }));
   $("#selectLabID").append($("<option>", {
       value: "Toot1",
       text: "Tooltil 1"
	   }));


   let today = new Date();
   let dd = today.getDate();
   let mm = today.getMonth()+1; // January is 0!
   let yyyy = today.getFullYear();

   if(dd<10) {
       dd = '0'+dd
       }

   if(mm<10) {
       mm = '0'+mm
       }

   // Select date.
   $("#labMenuID").append(
      $('<input>', {
	id: "selectDateID",
        type: 'date',
	value:  yyyy + "-" + mm + "-" + dd,
        class:"labDate"
    })
   );


   // Select hour.
   $("#labMenuID").append($("<select>").attr({id:"selectHourID",
       class:"hourSelect"}));

   $("#selectHourID").append($("<option>", {
       value: "All",
       text: "All hours"
           }));
   for(hour = 8; hour <= 17; hour++) {
       $("#selectHourID").append($("<option>", {
           value: hour,
           text: hour.toString() + ":00"
	       }));
   } //for

   // Available labs.
   $("#labMenuID").append($("<button>").attr({id:"labButtonID",
       class: "labButton"}).text("Find"));

   // Create a new div for the result.
   $root.append($("<div>").attr({id:"labResultID", class:"labAnswer"}));

   $("#labButtonID").click(function() {
        $root.css({ "backgroundColor": "" });
       let date = $("#selectDateID").val();
       let dateFormatted = new Date(date).setHours(0,0,0,0);
       let today = new Date().setHours(0,0,0,0);
       $("#labResultID").text("");

       if(dateFormatted < today)
       {
           $("#labResultID").text("You have entered a date before today");
       }
       else if(dateFormatted > new Date(2018, 2, 23)
               && dateFormatted < new Date(2018, 3, 16))
       {
           $("#labResultID")
	       .text("During spring break LF31 and Tootill are available");
       }
       else if(dateFormatted > new Date(2018, 4, 11))
       {
           $("#labResultID")
	       .text("You are asking for a date after the study period.");
       }
       else if(new Date(date).getDay() < 1 || new Date(date).getDay() > 5)
       {
           $("#labResultID").text("During weekends all labs are available");
       }
       else if($("#selectLabID").val() == "All" && $("#selectHourID").val() == "All")
       {
         askWS("listLabsAndHours", {date}, (data) => {

           // To store pairs of a lab and the available hours.
           let labHoursPairs = []

           // Get the lab-hours pairs.
           for (i = 0; i < data.split("},{").length - 1 ; i++) {

             // To store a lab-hour pair.
             let labHourPairs = data.split("},{");
             labHourPairs[i] = [labHourPairs[i].split(',')[1].split(':')[1].replace(/"/g, ''), labHourPairs[i].split(',')[0].split(':')[1]];

             // Check if the lab was addded to the arrary before.
             // If not, add it.
             if (!labHoursPairs.includes(labHourPairs[i][0])) {
               labHoursPairs.push(labHourPairs[i][0])
               // Add an array to hold the corresponding available hours.
               labHoursPairs.push([])
             } // if

             // Add the availabe hours to the corresponding lab.
             labHoursPairs[labHoursPairs.length - 1].push(labHourPairs[i][1])

           }; // for

           // Configure the result div to be scrollable.
           $("#labResultID").css({
             "display":"block",
             "height":"230px"
           });

           // Configure a table to hold the lab divs.
           $("#labResultID").append($("<div>").attr({id:"labTableID", class:"labsTable"}));

           // Create the rows for the lab divs and configure them.
           // We iterate in steps of 2 to skip the available hours arrary
           // and go through the lab indexes.
           for (i = 0; i < labHoursPairs.length; i=i+2) {

             // Create a row with a unique ID for it and add it to the table.
             let labRowID = "labRow"+i;
             $("#labTableID").append($("<div>").attr({id:labRowID, class:"labRow"}));

             // Create a lab cell with a unique ID for it and add it to the row.
             let labID = "lab"+i+"ID";
             $("#"+labRowID).append($("<div>").attr({id:labID, class:"labCell"}));

             // Set the name of the lab cell.
             $("#"+labID).text(labHoursPairs[i]);

             // Configure the lab cell.
             $("#"+labID).css({
               "height": "auto",
               "padding": "10px",
               "border":"3px solid #0ca49a",
             });

             // Congifure a table with a unique ID for the hour cells and
             // add it to the lab cell.
             let hourTableID = "hourTable"+i+"ID"
             $("#"+labID).append($("<div>").attr({id:hourTableID, class:"hourTable"}));

             $("#"+hourTableID).css({
               "display":"table",
               "height": "90px",
               "border-spacing": "10px",
               "table-layout": "fixed"
             });

             // Create two rows with 5 hours each and a unique ID.
             let hourRow1ID = "hourRow1ID"+i
             let hourRow2ID = "hourRow2ID"+i

             // Add the rows to the hours table.
             $("#"+hourTableID).append($("<div>").attr({id:hourRow1ID, class:"labHourRow"}));
             $("#"+hourTableID).append($("<div>").attr({id:hourRow2ID, class:"labHourRow"}));

             // Configure the first hours row.
             for (j = 8; j <= 12; j++) {

               // Create a hour cell with a unique ID and add it to the row.
               let hourID = "hour"+(i+j)+"ID"+i;
               $("#"+hourRow1ID).append($("<div>").attr({id:hourID, class:"labHourCell"}));

               // Configure the hour on this cell.
               $("#"+hourID).text(j+":00")

               // Check if lab is available or not and display the correct color.
               let hourCellColor = ""
               if (labHoursPairs[i+1].includes(j.toString())) {

                 // Green
                 hourCellColor = "#00ff00"

               } else {

                 // Red
                 hourCellColor = "#f53224"

               }; // else

               $("#"+hourID).css({
                 "background-color": hourCellColor
               });

             }; // for


             // Configure the second hours row.
             for (j = 13; j <= 17; j++) {

               // Create a hour cell with a unique ID and add it to the row.
               let hourID = "hour"+(i+j)+"ID"+i;
               $("#"+hourRow2ID).append($("<div>").attr({id:hourID, class:"labHourCell"}));

               // Configure the hour on this cell.
               $("#"+hourID).text(j+":00")

               // Check if lab is available or not and display the correct color.
               let hourCellColor = ""
               if (labHoursPairs[i+1].includes(j.toString())) {

                 // Green
                 hourCellColor = "#00ff00"

               } else {

                 // Red
                 hourCellColor = "#f53224"

               }; // else

               $("#"+hourID).css({
                 "background-color": hourCellColor
               });

             }; // for

           } // for

         }); // askWS
       }
       else if($("#selectLabID").val() == "All")
       {
         let time = $("#selectHourID").val();

         askWS("listLabs", {date, time}, (data) => {

           // To store the available lab for this specific hour.
           let availableLabs = [];

           // Store the available labs.
           availableLabs = data.split('}')

           for (i = 0; i < availableLabs.length - 1 ; i++) {
             availableLabs[i] = availableLabs[i].split(':')[1].replace(/"/g, '');
           };
           // Discard the last element "]"
           availableLabs[availableLabs.length - 1] = "";

           // Congifure a table for the lab cells.
           $("#labResultID").css({
             "display":"table",
             "height": "90px",
             "border-spacing": "10px",
             "table-layout": "fixed"
           });

           // Create a row for the labs.
           $("#labResultID").append($("<div>").attr({id:"labRow", class:"labRow"}));

           // Configure the row.
           for (i = 1; i <= 3; i++) {

             let labID = "lab"+i+"ID";

             // Add a lab cell.
             $("#labRow").append($("<div>").attr({id:labID, class:"labCell"}));

             // Assign a lab to the cell.
             let lab = ""
             switch (i) {
               case 1:
                 lab = "LF31"
                 break;
               case 2:
                 lab = "G23"
                 break;
               case 3:
                 lab = "Toot1"
                 break;
               default:
                 break;
             }
             $("#"+labID).text(lab);

             // Check if lab is available or not and display the correct color.
             let labCellColor = ""
             if (availableLabs.includes(lab)) {

               // Green
               labCellColor = "#00ff00"

             } else {

               // Red
               labCellColor = "#f53224"

             }; // else

             $("#"+labID).css({
               "background-color": labCellColor
             });

           }; // for

         }); // askWS
       }
       else if($("#selectHourID").val() == "All")
       {

         let lab = $("#selectLabID").val();

         askWS("listHours", {date, lab}, (data) => {

           // To store the available hours for this specific lab.
           let availableHours = [];

           // Store the available hours.
           availableHours = data.split('}')

           for (i = 0; i < availableHours.length - 1 ; i++) {
             availableHours[i] = availableHours[i].split(':')[1];
           };
           // Discard the last element "]"
           availableHours[availableHours.length - 1] = "";

           // Congifure a table for the hour cells.
           $("#labResultID").css({
             "display":"table",
             "height": "90px",
             "border-spacing": "10px",
             "table-layout": "fixed"
           });

           // Create two rows with 5 hours each.
           $("#labResultID").append($("<div>").attr({id:"hourRow1ID", class:"labHourRow"}));
           $("#labResultID").append($("<div>").attr({id:"hourRow2ID", class:"labHourRow"}));

           // Configure the first row.
           for (i = 8; i <= 12; i++) {

              let hourID = "hour"+i+"ID";

              $("#hourRow1ID").append($("<div>").attr({id:hourID, class:"labHourCell"}));

              $("#"+hourID).text(i+":00")

              // Check if lab is available or not and display the correct color.
              let hourCellColor = ""
              if (availableHours.includes(i.toString())) {

                // Green
                hourCellColor = "#00ff00"

              } else {

                // Red
                hourCellColor = "#f53224"

              }; // else

              $("#"+hourID).css({
                "background-color": hourCellColor
              });

           }; // for

           // Configure the second row.
           for (i = 13; i <= 17; i++) {

              let hourID = "hour"+i+"ID";

              $("#hourRow2ID").append($("<div>").attr({id:hourID, class:"labHourCell"}));

              $("#"+hourID).text(i+":00")

              let hourCellColor = ""
              if (availableHours.includes(i.toString())) {

                // Green
                hourCellColor = "#00ff00"

              } else {

                // Red
                hourCellColor = "#f53224"

              }; // else

              $("#"+hourID).css({
                "background-color": hourCellColor
              });

           }; // for

    	   }); //askWs

       }
       else
       {
	   let time = $("#selectHourID").val();
	   let lab = $("#selectLabID").val();
           askWS("checkLab", {date, lab, time}, (data) => {
	   if(JSON.parse(data)[0] == null)
	   {
                $wipeNo.css({
                    "width": "300%",
                     "height": "300%",
                     "opacity": "0",
                     "right": "-150%",
                     "top": "-150%"
                 });
                 setTimeout(() => {
                    $wipeNo.hide();
                    $wipeNo.css({
                        "width": "",
                        "height": "",
                        "opacity": "",
                        "right": "",
                        "top": ""
                    });
                    setTimeout(() => $wipeNo.show(), 500);
                 }, 500);
         $("#labResultID").html(
           `<img height="60px" src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_close_black_24px.svg">
           <br>Lab is not available`
          );
	   }
	   else
	   {
                $wipeYes.css({
                    "width": "300%",
                     "height": "300%",
                     "opacity": "0",
                     "right": "-150%",
                     "top": "-150%"
                 });
                 setTimeout(() => {
                    $wipeYes.hide();
                    $wipeYes.css({
                        "width": "",
                        "height": "",
                        "opacity": "",
                        "right": "",
                        "top": ""
                    });
                    setTimeout(() => $wipeYes.show(), 500);
                 }, 500);
       $("#labResultID").html(
         `<img height="60px" src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_done_black_24px.svg">
          <br>Lab is available`
       );
	   }
	   });
       } // else
   });
}
