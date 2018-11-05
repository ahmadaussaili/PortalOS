/**
 *
 * @param {*} $root
 */
function makeMusicPlayer($root) {
    $root.css({
        "display": "block",
        "overflow": "hidden"
    });

  /*  let music = false;
    let $playButton = $("<div>").addClass("playButton noselect")
            .append($("<img>").attr({"id": "playButtonImage", "src": "https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_play_arrow_white_24px.svg"}))
            .click(() => {
                if (music == false)
                {
                $("#playButtonImage").attr("src", "https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_pause_white_24px.svg");
                music = true;
                }
                else
            {
                $("#playButtonImage").attr("src", "https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_play_arrow_white_24px.svg");
                music = false;
            }
        });

        $root.append($playButton); */

       let $files = $("<div>").addClass("music");
       $root.append($files);

       askWS("musicList", {}, (data) => {
           $files.html(searchMusic(data) || "No audio files found");
           $(".playButton").html(`<img src=https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_play_arrow_white_24px.svg></img>`);
        });

        $(document).on("click", ".aud .playButton", (e) => {
            let $this = $(e.currentTarget).parent();
            let path = $this.attr("path");
            let name = $this.attr("title");
            const title = "File Editor (" + path + name + ")";
            makeApp($("#apps"), title, apps);
            editFile(apps[title], path, name);
            apps[title].removeClass("hide");
            apps[title].click();
            $(".app").removeClass("active");
            apps[title].addClass("active");
            apps[title].find(".app-control.minimise").remove();
            return false;
        });
    }

    /**
     * find all music files in the users file system
     * @param {*} fs
     * @param {*} path
     * @return {String}
     */
    function searchMusic(fs, path = "/") {
        let html = "";
        fs.children.forEach((element) => {
        if (element && element.dir) {
            html += searchMusic(element, path + element.name + "/");
        } else if (element && element.mime.split("/")[0] == "audio") {
            let name = element.name.split(".")[0];
            html += `<div title="${element.name}"
                class="aud"
                path="${path}"><div class="playButton noselect"></div><span>${name}</span></div>`;
        }
    });
    return html;
}
