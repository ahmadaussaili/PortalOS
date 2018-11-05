const errorUI = {};

errorUI.newError = (msg, action) => {
    let $errorMsg = $("<div>").addClass("toast");
    $errorMsg.append($("<div>").addClass("error"));
    $errorMsg.append($("<div>").text(msg));
    $errorMsg.click((e) => {
        $errorMsg.css("right", "-350px");
        setTimeout(() => $errorMsg.remove(), 1000);
        if (action) {
            action();
        }
    });
    $("#toasts").append($errorMsg);
};

errorUI.newInfo = (msg, action) => {
    let $errorMsg = $("<div>").addClass("toast");
    $errorMsg.append($("<div>").addClass("info"));
    $errorMsg.append($("<div>").text(msg));
    $errorMsg.click((e) => {
        $errorMsg.css("right", "-350px");
        e.currentTarget.remove();
        if (action) {
            action();
        }
    });
    // Slide off after 10 seconds
    setTimeout(() => {
        $errorMsg.css("right", "-350px");
        setTimeout(() => $errorMsg.remove(), 1000);
    }, 10000);
    $("#toasts").append($errorMsg);
};
