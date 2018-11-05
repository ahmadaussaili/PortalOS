/** Part that deals with creating a coloured bar with different colours for each
 * file extension in the files inside the directory. The amount of each colour
 * displayed depends on the amount of files with that extension
 * that the folder contains.
 * @param {*} name
*/
function createFolderBar(folder) {
  let html = "";
  let totalElements = 0;
  let types = {};

  const col = {
    "docx": "rgb(42, 86, 153)",
    "xlsx": "rgb(32, 114, 69)",
    "pptx": "rgb(220, 127, 104)",
    "java": "rgb(234, 45, 47)",
    "py": "rgb(12, 157, 191)",
    "js": "rgb(240, 219, 79)",
    "mp3": "rgb(160, 3, 252)",
    "css": "rgb(33, 119, 255)",
    "html": "rgb(228, 77, 38)",
    "txt": "rgb(149, 165, 165)",
    "jpg": "rgb(0, 255, 171)",
    "pdf": "rgb(195, 11, 21)"
  };
  if (!folder.dir && folder.mime.split("/")[0] !== "image") {
    html += `<div class="fileBar">`;
    html += `<div class="subFileBar"`;
      let colour;
      let splitName = key = folder.name.split(".");
      key = splitName[splitName.length - 1];
      if (col[key]) {
          colour = col[key];
      } else {
          colour = textToCol(key);
      }
      html += `style="background-color: ${colour};"></div>`;
    html += "</div>";
    return html;
  }
  html += `<div class="folderBar">`;
  folder.children.forEach((file) => {
    if (!file.dir) {
      let splitName = file.name.split(".");
      if (!types[splitName[splitName.length - 1]]) {
        types[splitName[splitName.length - 1]] = 1;
      }
      else {
        types[splitName[splitName.length - 1]] += 1;
      }
      totalElements += 1;
    }
  });
  Object.keys(types).forEach((key) => {
    let height = types[key] / totalElements * 100;
    console.log(key);
    html += `<div title=${key} perc=${height} class="subFolderBar" style="height: ${height}%;`;
    let colour;
    if (col[key]) {
      colour = col[key];
    } else {
      colour = textToCol(key);
    }
    html += `background-color: ${colour};"></div>`;
  });
  html += `</div>`;
  return html;
}
/**
 * Get the img prev (quite dodgey...)
 * @param {*} name
 * @param {*} path
 */
function getImgPrev(name, path) {
    if (!imgPreCache[path + name]) {
        sendWS("imgPre", {name, path});
        pendingReply["img" + btoa(name)] = (file) => {
            let blob = new Blob([new Uint8Array(file.content)]);
            imgPreCache[path + name] = URL.createObjectURL(blob);
            $("#img" + btoa(name).replace(/=/g, "")).attr("src", imgPreCache[path + name]);
        };
        return;
    }
    setTimeout(() => {
        $("#img" + btoa(name).replace(/=/g, "")).attr("src", imgPreCache[path + name]);
    }, 10);
}

/**
 * @param {*} oldPath
 * @param {*} moveFunc
*/
function moveMode(oldPath, moveFunc) {
    let $move = $("<div>").addClass("move");
    $move.append($("<div>").addClass("noPointer").text("Move to"));
    let $moveI = $("<img>").addClass("icon").attr({
        "src": "https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_flip_to_front_white_24px.svg",
        "title": "Move here"
    });
    let $cancelI = $("<img>").addClass("icon").attr({
        "src": "https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_cancel_white_24px.svg",
        "title": "Cancel move"
    });
    $move.append($moveI);
    $move.append($cancelI);
    $(".node-path").append($move);
    $moveI.click(() => {
        moveFunc(oldPath);
        $move.remove();
    });
    $cancelI.click(() => {
        $move.remove();
    });
}

function textToCol(string) {
    let sum = 0;
    for (let i=0; i < string.length; i++) {
        sum += string.charCodeAt(i);
    }
    let r = sum * 3 % 255;
    let g = sum * 10 % 255;
    let b = sum * 2 % 255;
    return "rgb(" + r + ", " + g + ", "+ b + ")";
}

/**
 * Parse the fs producing the appropiate file structure
 * @param {Object} fs
 * @param {*} path
 * @return {HTML}
 */
function parseFS(fs, path) {
    let html = "";
    fs.children.forEach((element) => {
        if (element && element.dir) {
          html += `<div class="node dir">`;
          html += `<span>${element.name}</span>`;
          html += createFolderBar(element);
          html += "</div>";
        } else {
            if (element.mime.split("/")[0] == "image") {
              html += `<div title="${element.name}" class="node file img">`;
              const eName = btoa(element.name).replace(/=/g, "");
              html += `<img id="img${eName}">`;
              getImgPrev(element.name, path);
            } else {
                html += `<div title="${element.name}" class="node file">`;
                html += createFolderBar(element);
            }
            html += `<span>${element.name}</span>`;
            html += "</div>";
          }
    });
    return html;
}

/**
 * Create list of fs
 * @param {*} fs
 * @param {*} path Inital "/"
 * @return {String}
 */
function parseDir(fs, path = "/") {
    let html = "<ul>";
    html += `<li data-path="${path}">`;
    html += fs.name;
    fs.children.forEach((element) => {
        if (element && element.dir) {
            html += parseDir(element, path + element.name + "/");
        }
    });
    html += "</li>";
    html += "</ul>";
    return html;
}

/**
 * Create list of favourites
 * @param {*} fs
 * @param {*} path
 */
function parseFav(fs, path = "/") {
    let html = "";
    if (fs.fav) {
        html += `<li data-path="${path}">`;
        html += fs.name;
        html += "</li>";
    }
    fs.children.forEach((element) => {
        if (element && element.dir) {
            html += parseFav(element, path + element.name + "/");
        }
    });
    return html;
}

/**
 * Generate the HTML for a given path
 * @param {*} fs
 * @param {*} path
 * @param {*} fullPath
 * @return {String}
 */
function pathToHTML(fs, path, fullPath) {
    fullPath = fullPath || path;
    if (path === "/") return parseFS(fs, fullPath);
    let pathSplit = [
        path.substring(1, path.indexOf("/", 1)),
        path.substring(path.indexOf("/", 1), path.length)
    ];
    let j = -1;
    for (let i = 0; i < fs.children.length; i++) {
        if (fs.children[i]["name"] === pathSplit[0]) {
            j = i;
        }
    }
    return pathToHTML(fs.children[j], pathSplit[1], fullPath);
}

/**
 * Return whether a given path is faved
 * @param {*} fs
 * @param {*} path
 * @return {Boolean}
 */
function pathFav(fs, path) {
    if (path === "/") return fs.fav || false;
    let pathSplit = [
        path.substring(1, path.indexOf("/", 1)),
        path.substring(path.indexOf("/", 1), path.length)
    ];
    let j = -1;
    for (let i = 0; i < fs.children.length; i++) {
        if (fs.children[i]["name"] === pathSplit[0]) {
            j = i;
        }
    }
    return pathFav(fs.children[j], pathSplit[1]);
}

/**
 * Generate the HTML for a given search term. Currently a very poor search
 * @param {*} fs
 * @param {*} search
 * @return {String}
 */
function searchToHTML(fs, search, path = "/") {
    let html = "";
    fs.children.forEach((element) => {
        if (element && element.dir) {
            html += searchToHTML(element, search, path + element.name + "/");
        }
        if (element.name.search(new RegExp(search, "i")) !== -1) {
            if (element.dir) {
                let thisPath = path + element.name + "/";
                html += `<div class="node dir sRes" path="${thisPath}">`;
                html += `<span>${element.name}</span>`;
                html += "</div>";
            } else {
                if (element.mime.split("/")[0] == "image") {
                    html += `<div title="${element.name}"
                        class="node file img sRes"
                        path="${path}">`;
                    const eName = btoa(element.name).replace(/=/g, "");
                    html += `<img id="img${eName}">`;
                    getImgPrev(element.name, path);
                } else {
                    html += `<div title="${element.name}" class="node file sRes"
                        path="${path}">`;
                }
                html += `<span>${element.name}</span>`;
                html += "</div>";
            }
        }
    });
    return html;
}

/**
 * Load the DOM for a given path
 * @param {*} path
 */
function loadPath($root, path, data) {
    let pathSplit = path.split("/");
    $(".node-path-cur").text(pathSplit[pathSplit.length - 2] || "Home");
    if ($(".node-path-cur").text() !== "Home") {
        $(".node-path-prev")
            .text(pathSplit[pathSplit.length - 3] || "Home");
    } else {
        $(".node-path-prev").text("/");
    }
    $(`li[data-path="${path}"]`).css("fontWeight", "bold");
    $(`li:not([data-path="${path}"])`).css("fontWeight", "normal");
    $root.children(".nodes").html(pathToHTML(data, path));
    if (pathFav(data, path)) {
        $(".node-fav").addClass("faved");
    } else {
        $(".node-fav").removeClass("faved");
    }
}

/**
 * Keep the FS element upto date
 * @param {JQuery} $root Jquery reference to the root element of FS
 * @param {*} apps
 */
function getFileSystem($root, apps) {
    let path = "/";
    $root.append($("<div>").addClass("node-controls"));
    $root.append($("<div>").addClass("nodes"));
    $root.append($("<div>").addClass("node-path"));
    $root.children(".node-controls").append(
        $("<input>").addClass("search-bar").attr("placeholder", "Search")
    );
    $root.children(".node-controls").append(
        $("<div>").addClass("node-fav i").click(() => {
            sendWS("fav", {path});
        })
    );
    $root.children(".node-controls").append(
        $("<div>").addClass("i node-add").click(() => {
            const $this = $(".node-add");
            makeContextMenu($this.offset().left, $this.offset().top,
                [
                    {
                        "name": "Upload File",
                        "callback": () => {
                            makeUploadDialog($root.parent(), path);
                        }
                    },
                    {
                        "name": "New Folder",
                        "callback": () => {
                            makeNodeDialog($root.parent(), path, true);
                        }
                    },
                    {
                        "name": "New File",
                        "callback": () => {
                            makeNodeDialog($root.parent(), path, false);
                        }
                    }
                ]
            );
        })
    );
    $root.children(".node-path")
        .append($("<div>").addClass("node-path-prev").text("/"));
    $root.children(".node-path")
        .append($("<div>").addClass("node-path-cur").text("Home"));
    askWS("fileList", {}, (data) => {
        $root.children(".nodes").html(pathToHTML(data, path));
        $(".folder-struct").html(parseDir(data));
        $(".favs").html(parseFav(data));
        $(`li[data-path="${path}"]`).css("fontWeight", "bold");
        $(`li:not([data-path="${path}"])`).css("fontWeight", "normal");

        if (pathFav(data, path)) {
            $(".node-fav").addClass("faved");
        } else {
            $(".node-fav").removeClass("faved");
        }

        $(document).off("click", ".node.dir");
        $(document).off("dblclick", ".node.file");
        $(document).on("click", ".folderBar", (e) => {
            const $this = $(e.currentTarget);
            let html = "";
            $this.children().each((i, elm) => {
                html += "<div class='circle' style='background-color: "
                    + $(elm).css("background-color") + "'></div>";
                let perc = Math.round($(elm).attr("perc") * 100) / 100;
                html += "<span>" + $(elm).attr("title") + " - " + perc + "%</span>";
                html += "</br>";
            });
            makeContextMenu($this.offset().left, $this.offset().top, [], html);
            return false;
        })
        $(document).on("click", ".node.dir", (e) => {
            const $this = $(e.currentTarget);
            if ($this.hasClass("sRes")) return;
            path += $this.children("span").text() + "/";
            loadPath($root, path, data);
        });
        $(document).on("click", ".sRes", (e) => {
            const $this = $(e.currentTarget);
            path = $this.attr("path");
            loadPath($root, path, data);
        });
        $(document).on("dblclick", ".node.file", (e) => {
            const $this = $(e.currentTarget);
            const name = $(e.target).children("span").text();
            if ($this.hasClass("sRes")) return;
            const title = "File Editor (" + path + name + ")";
            makeApp($("#apps"), title, apps);
            editFile(apps[title], path, name);
            apps[title].removeClass("hide");
            apps[title].click();
            apps[title].find(".app-control.minimise").remove();
        });
        $(".node-path-prev").unbind("click");
        $(".node-path-prev").click(() => {
            if (path === "/") return;
            path = path.substring(0,
                    path.lastIndexOf("/", path.length - 2) + 1);
            loadPath($root, path, data);
        });
        $(".folder-struct li, .favs li").unbind("click");
        $(".folder-struct li, .favs li").click((e) => {
            const $this = $(e.currentTarget);
            path = $this.attr("data-path");
            loadPath($root, path, data);
            return false; // Stop propergation
        });

        $(".search-bar").unbind("keyup");
        $(".search-bar").keyup((e) => {
            let search = $(".search-bar").val();
            $root.children(".nodes").html(searchToHTML(data, search)
                || "<h4>No files could be found</h4>");
            $(".node-path-prev").text("Search results for");
            $(".node-path-cur").text(search);
            if (!search) {
                path = "/";
                $root.children(".nodes").html(pathToHTML(data, path));
                $(".node-path-prev").text("/");
                $(".node-path-cur").text("Home");
            }
        });
        $root.parent().unbind("contextmenu");
        $root.parent().contextmenu((e) => {
            $(document).click();
            let settings = [];
            const name = $(e.target).children("span").text();
            if ($(e.target).hasClass("node")) {
                settings = [
                    {
                        "name": "Rename",
                        "callback": () => {
                            makeRenameDialog($root, path, name);
                        }
                    },
                    {
                        "name": "Delete",
                        "callback": () => {
                            sendWS("removeNode", {path, name});
                        }
                    },
                    {
                        "name": "Move",
                        "callback": () => {
                            moveMode(path, (oldPath) => {
                                if (oldPath !== path) {
                                    sendWS("moveFile", {
                                        "path": oldPath,
                                        "newPath": path,
                                        name
                                    });
                                } else {
                                    errorUI.newError("Cannot move to the same folder");
                                }
                            });
                        }
                    }
                ];
                if ($(e.target).hasClass("file")) {
                    settings.push(
                        {
                            "name": "Download",
                            "callback": () => {
                                errorUI.newInfo("Download Started");
                                askWS("getFile", {path, name}, (file) => {
                                    const pom = document.createElement("a");
                                    document.body.appendChild(pom);
                                    const blob = new Blob(
                                        [new Uint8Array(file.content)],
                                        { type: file.mime }
                                    );
                                    let url = window.URL.createObjectURL(blob);
                                    pom.setAttribute("href", url);
                                    pom.setAttribute("download", file.name);
                                    pom.click();
                                    errorUI.newInfo("Downloading " + file.name);
                                    window.URL.revokeObjectURL(url);
                                });
                            }
                        },
                        {
                            "name": "Duplicate",
                            "callback": () => {
                                sendWS("duplicateNode", {path, name});
                            }
                        },
                        {
                            "name": "Edit/View",
                            "callback": () => {
                                let title = "File Editor (" + path + name + ")";
                                makeApp($("#apps"), title, apps);
                                editFile(apps[title], path, name);
                                apps[title].removeClass("hide");
                                apps[title].click();
                                apps[title].find(".app-control.minimise").remove();
                            }
                        }
                    );
                }
            } else {
                settings = [
                    {
                        "name": "Upload File",
                        "callback": () => {
                            makeUploadDialog($root.parent(), path);
                        }
                    },
                    {
                        "name": "New Folder",
                        "callback": () => {
                            makeNodeDialog($root.parent(), path, true);
                        }
                    },
                    {
                        "name": "New File",
                        "callback": () => {
                            makeNodeDialog($root.parent(), path, false);
                        }
                    }
                ];
            }
            makeContextMenu(e.clientX, e.clientY, settings);
            return false;
        });
    });
}

/**
 * Read files passed via the upload dialog
 * Modified from https://www.html5rocks.com/en/tutorials/file/dndfiles/
 * @param {*} evt
 * @param {*} path
 */
function readFiles(evt, path) {
    let files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    let output = [];
    for (let i = 0, f; f = files[i]; i++) {
        output.push(
            "<div class='node dir'><span>",
            f.name,
            "</span></div>"
        );
    }
    $(".files").append(output.join(""));
    $("#upload").click(() => {
        $("#upload").unbind();
        let filesDone = 0;
        let numFiles = $("#file")[0].files.length;
        let q = [];
        pendingReply["uploadDone"] = () => {
            filesDone++;
            errorUI.newInfo(filesDone + " of " + numFiles + " files finished uploading.");
            try {
                q.pop()();
            } catch (e) {
                let $root = $(".dialog").parent();
                pendingReply["uploadDone"] = undefined;
                $root.children().removeClass("blur");
                $root.find(".dialog").remove();
                $root.unbind("click");
            }
        }
        $(".dialog").html(htmlTemplates.spinner);
        for (let i = 0, f; f = files[i]; i++) {
            let reader = new FileReader();
            reader.onload = ((file) => {
                return (e) => {
                    if (file.size > 15 * Math.pow(10, 6)) {
                        errorUI.newError("Files may not yet exceed 15MB");
                        let $root = $(".dialog").parent();
                        pendingReply["uploadDone"] = undefined;
                        $root.children().removeClass("blur");
                        $root.find(".dialog").remove();
                        $root.unbind("click");
                        return;
                    }
                    let content = new Uint8Array(e.target.result);
                    content = Array.from(content);
                    q.push(() => {
                        askWS("addNode", {
                            "name": file.name,
                            content,
                            "path": path,
                            "mime": file.type
                        });
                    });
                    if (i == 0) {
                        q.pop()();
                    }
                };
            })(f);

            reader.readAsArrayBuffer(f);
        }
        $("#upload").parent().click();
    });
}

/**
 * Attatch the HTML for an upload dialog to the root param
 * @param {*} $root
 * @param {*} path
 */
function makeUploadDialog($root, path) {
    const $dialog = $("<div>").addClass("dialog");
    $dialog.append($("<h3>").text("File Upload"));
    $dialog.append(`<div class="closeButton"></div>`);
    $dialog.append($("<div>").addClass("files"));
    $dialog.append(`<input type="file" id="file" name="files[]" multiple />`);
    $dialog.append(`<label for="file" id="file-label">
    <strong>Browse</strong> for files.
    </label>`);
    $dialog.append($("<div>").attr("id", "upload").text("Upload"));
    $root.children().addClass("blur");
    $dialog.click((e) => {
        e.stopPropagation();
    });
    $root.append($dialog);
    setTimeout(() => {
        $("#file")[0].addEventListener("change", (evt) => {
            readFiles(evt, path);
        }, false);
        const clickFunc = () => {
            pendingReply["uploadDone"] = undefined;
            $root.children().removeClass("blur");
            $root.find(".dialog").remove();
            $root.unbind("click");
        };
        $root.click(clickFunc);
        $(".closeButton").click(clickFunc);
    }, 100);
}

/**
 * Attatch the HTML for an rename dialog to the root param
 * @param {*} $root
 * @param {*} path
 * @param {*} name Current name
 */
function makeRenameDialog($root, path, name) {
    const $dialog = $("<div>").addClass("dialog");
    $dialog.append($("<h3>").text("Rename"));
    $dialog.append($("<h5>").text("Current Name: " + name));
    $dialog.append(`<input id="new-name" placeholder="New Name"/>`);
    $dialog.append($("<div>").attr("id", "rename").text("Rename"));
    $root.children().addClass("blur");
    $dialog.click((e) => {
        e.stopPropagation();
    });
    $root.append($dialog);
    setTimeout(() => {
        $("#rename").click(() => {
            let newName = $("#new-name").val();
            if (newName.length > 2 && newName.length < 32 && newName !== "Home"
                && newName !== name) {
                askWS("renameFile", {
                    oldName: name,
                    newName,
                    path,
                    "dir": true
                });
                $root.children().removeClass("blur");
                $root.find(".dialog").remove();
                $root.unbind("click");
            } else {
                errorUI.newError("Invalid Name");
            }
        });
        $root.click(() => {
            $root.children().removeClass("blur");
            $root.find(".dialog").remove();
            $root.unbind("click");
        });
    }, 100);
}

/**
 * Attatch the HTML for an new folder or file dialog to the root param
 * @param {*} $root
 * @param {*} path
 * @param {*} dir
 */
function makeNodeDialog($root, path, dir) {
    const $dialog = $("<div>").addClass("dialog");
    if (dir) {
        $dialog.append($("<h3>").text("New Folder"));
    } else {
        $dialog.append($("<h3>").text("New File"));
    }
    $dialog.append(`<div class="closeButton"></div>`);
    $dialog.append(`<input id="folder-name" placeholder="Name"/>`);
    $dialog.append($("<div>").attr("id", "create").text("Create"));
    $root.children().addClass("blur");
    $dialog.click((e) => {
        e.stopPropagation();
    });
    $root.append($dialog);
    setTimeout(() => {
        $("#create").click(() => {
            let name = $("#folder-name").val();
            if (name.length > 2 && name.length < 32 && name !== "Home") {
                let req = {
                    name,
                    path,
                    dir
                };
                if (!dir) {
                    req.content = [];
                }
                askWS("addNode", req);
                $root.children().removeClass("blur");
                $root.find(".dialog").remove();
                $root.unbind("click");
            } else {
                errorUI.newError("Invalid Name");
            }
        });
        const clickFunc = () => {
            $root.children().removeClass("blur");
            $root.find(".dialog").remove();
            $root.unbind("click");
        };
        $root.click(clickFunc);
        $(".closeButton").click(clickFunc);
    }, 100);
}

/**
 * Creates a context menu of the given config at the x, y
 * @param {int} x
 * @param {int} y
 * @param {Array} config An array of objects of names and the click callbacks
 *  eg: [{"name": string, "callback": function}]
 * @param {String} html Optional
 */
function makeContextMenu(x, y, config, html) {
    const $menu = $("<div>").addClass("menu");
    while (x + 150 > $(document).width()) {
        x--;
    }
    while (y + 200 > $(document).height()) {
        y--;
    }
    $menu.css({
        "left": x,
        "top": y
    });
    if (html) {
        $menu.html(html);
        $menu.css("padding", "5px");
    } else {
        for (let i = 0; i < config.length; i++) {
            const $elm = $("<div>").text(config[i].name).click(config[i].callback);
            $menu.append($elm);
        }
    }
    $("#content").append($menu);
    setTimeout(() => {
        $(document).click((e) => {
            $(document).unbind(e);
            $menu.remove();
        });
    }, 100);
}
