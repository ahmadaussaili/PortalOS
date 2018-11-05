/**
 * Edit file
 * @param {*} $root
 * @param {*} path
 * @param {*} name
 */
function editFile($root, path, name) {
    $root.parent().unbind("contextmenu");
    let $editor = $("<div>").attr("id", "editor");
    $editor.html(htmlTemplates.spinner);
    $root.append($editor);
    askWS("editFile", {path, name}, (file) => {
        if (file.mime.split("/")[0] == "text" || file.mime.split("/") == "application/javascript") {
            // Text editor
            $editor.text(new TextDecoder("utf-8").decode(
                    new Uint8Array(file.content))
            );
            let editor = ace.edit($editor[0]);
            let theme = cookies.get("editorTheme") ? "ace/theme/tomorrow_night" : "ace/theme/xcode";
            editor.setTheme(theme);
            let modelist = ace.require("ace/ext/modelist");
            editor.setOption("dragEnabled", false);
            editor.session.setMode(modelist.getModeForPath(name).mode);
            $editor.focus();
            editor.commands.addCommand({
                name: "save",
                bindKey: {"win": "Ctrl-S", "mac": "Cmd-S"},
                exec: function (editor) {
                    // Save the file...
                    const enc = new TextEncoder("utf-8");
                    let content = enc.encode(editor.session.getValue());
                    content = Array.from(content);
                    sendWS("editNode", {path, name, content});
                    setTimeout(() => $(".modified").remove(), 400);
                }
            });
            $editor.keyup((e) => {
                // Doc has been changed
                if ($(".modified").length === 0) {
                    $editor.append($("<div>").addClass("modified").click(() => {
                        //editor.commands["save"](editor);
                        editor.commands.commands.save.exec(editor);
                    }));
                }
            });
        } else if (file.mime.split("/")[0] == "image") {
            // Image preview
            let blob = new Blob([new Uint8Array(file.content)]);
            let $img = $("<div>").css("background-image", "url(" + URL.createObjectURL(blob) + ")");
            $img.addClass("imgPreview");
            $editor.html($img);
        } else if (file.mime.split("/")[0] == "audio") {
            $editor.parent().css({
                "background-color": "#F5F5F5",
                "width": 600,
                "height": 100
            });
            let blob = new Blob([new Uint8Array(file.content)]);
            let $audio = $("<audio>").attr("src", URL.createObjectURL(blob));
            $editor.html($audio);
            let $audioControls = $("<div>").addClass("audio-controls");
            let madeVis = false;
            let $playerButton = $("<div>").addClass("audio-pp");
            let $canvas = $("<canvas>").addClass("audio-canvas");
            $editor.append($canvas);
            $playerButton.click(() => {
                if ($audio[0].paused) {
                    $audio[0].play();
                    $playerButton.css("background-image", "url('https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_pause_white_24px.svg')");
                    if (!madeVis) {
                        vis($canvas[0], $audio[0]);
                        madeVis = true;
                    }
                } else {
                    $audio[0].pause();
                    $playerButton.css("background-image", "url('https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_play_arrow_white_24px.svg')");
                }
            });
            let $audioProg = $("<div>").addClass("audio-prog");
            $audioControls.append($("<div>").addClass("audio-prog-out").append(
                $audioProg
            ));
            
            $editor.append($playerButton);
            $editor.append($audioControls);
            $editor.append($("<div>").addClass("audio-name").text(file.name.split(".")[0]));
            $audio.on("timeupdate", () => {
                $audioProg.css("width", $audio[0].currentTime * 100 / $audio[0].duration + "%");
            });
        } else if (file.mime == "application/pdf") {
            let blob = new Blob([new Uint8Array(file.content)], {"type": "application/pdf"});
            let $pdfViewer = $("<iframe>").addClass("pdf");
            $pdfViewer.attr("type", "application/pdf");
            $pdfViewer.attr("src", URL.createObjectURL(blob));
            $editor.append($pdfViewer);
        } else {
            $editor.text("File type not yet supported");
        }
    });
}
