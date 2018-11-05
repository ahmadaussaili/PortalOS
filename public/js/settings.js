/**
 * 
 * @param {*} $root
 */
function makeSettings($root) {
    let settings = {};
    $root.css({
        "display": "block",
        "overflow": "hidden"
    });
    let $button = $("<div>").addClass("controls");
    let $content = $("<div>").addClass("contents");
    $button.append($("<div>").attr("id", "cancel").text("Revert to Default").click((e) => {
        const $this = $(e.currentTarget);
        if ($this.hasClass("disabled")) return;
        // Set the settings
        settings.background = "/assets/images/bg.png";
        sendWS("setSettings", settings);
        cookies.delete("editorTheme");
        errorUI.newInfo("Refresh to view changes", () => {
            location.reload();
        });
    }));
    $button.append($("<div>").attr("id", "apply").text("Apply").addClass("disabled").click((e) => {
        const $this = $(e.currentTarget);
        if ($this.hasClass("disabled")) return;
        // Set the settings
        if ($(".backgroundInp").val()) {
            settings.background = $(".backgroundInp").val();
            sendWS("setSettings", settings);
        }
        if ($(".locationInp").val()) {
            cookies.create("location", $(".locationInp").val(), 365);
        }
        cookies.create("editorTheme", $(".editorInp").val(), 365);
        cookies.create("temp", $(".tempInp").val(), 365);
        cookies.create("hideEvents", $(".eventsInp").val(), 365);
        errorUI.newInfo("Refresh to finish applying changes", () => {
            location.reload();
        });
    }));
    $root.append($button);
   
    askWS("getSettings", {}, (gotSettings) => {
        // Do stuff with settings
        settings = gotSettings;
        settings.editorTheme = cookies.get("editorTheme");
        settings.loc = cookies.get("location") || "Manchester, UK";
        settings.temp = cookies.get("temp");
        settings.hideEvents = cookies.get("hideEvents");
        $content.html("");
        $content.append($("<h3>").text("Calendar"));
        $content.append($("<h4>").text("Show past events"));
        $content.append($("<select>").addClass("eventsInp").append(`
            <option value="">Yes</option>
            <option value="No">No</option>
        `).val(settings.hideEvents));
        $content.append($("<h3>").text("Weather"));
        $content.append($("<div>").text("Location"));
        $content.append($("<input>").addClass("locationInp").attr("placeholder", settings.loc));
        $content.append($("<div>").text("Temperature units"));
        $content.append($("<select>").addClass("tempInp").append(`
            <option value="">&#176;C</option>
            <option value="F">&#176;F</option>
        `).val(settings.temp));
        $content.append($("<h3>").text("Theme"));
        $content.append($("<div>").text("Background"));
        $content.append($("<h6>").text("The URL of the image to use as a desktop background"));
        $content.append($("<input>").addClass("backgroundInp").attr("placeholder", settings.background));
        $content.append($("<div>").text("Editor Colour Theme"));
        $content.append($("<h6>").text("The colour theme varient to use in the text editor"));
        $content.append($("<select>").addClass("editorInp").append(`
            <option value="">Light</option>
            <option value="Dark">Dark</option>
        `).val(settings.editorTheme));

        $content.append($("<h3>").text("Account"));
        $content.append($("<div>").addClass("button").text("Log Out").click(() => {
            cookies.delete("sid");
            location.reload();
        }));
    });
    $(document).on("change", ".contents input, .contents select", () => {
        $("#apply").removeClass("disabled");
    });
    $root.append($content);
}
