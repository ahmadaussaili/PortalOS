/**
 *
 * @param {*} $root
 */
function makeCalculator($root) {
    $root.css({
        "display": "block",
        "overflow": "hidden"
    });
    let $screenA = $("<div>").addClass("calc-screen-a");
    let $screenB = $("<div>").addClass("calc-screen-b");
    let $buttons = $("<div>").addClass("calc-buttons");
    let $wipe = $("<div>").addClass("wipe");
    let buttons = ["(", ")", "^", ".", "DEL", 7, 8, 9, "+", "-", 4, 5, 6, "x", "/", 1, 2, 3, 0, "="];
    $root.append($screenB);
    $root.append($screenA);
    $root.append($wipe);

    let expression = "";
    let result = "";

    for (let i = 0; i < buttons.length; i++) {
        let a = buttons[i];
        buttons[i] =
            $("<div>").addClass("calc-button noselect").text(a).click(() => {
                if (a == "DEL") {
                    expression = expression.substring(0, expression.length - 1);
                    if (result) {
                        expression = "";
                        result = "";
                        $wipe.css({
                            "width": "300%",
                            "height": "300%",
                            "opacity": "0",
                            "right": "-150%",
                            "top": "-150%"
                        });
                        setTimeout(() => {
                            $wipe.hide();
                            $wipe.css({
                                "width": "",
                                "height": "",
                                "opacity": "",
                                "right": "",
                                "top": ""
                            });
                            setTimeout(() => $wipe.show(), 500);
                        }, 500);
                    }
                } else if (a == "=") {
                    // Its bad, but it works...
                    try {
                        result = "" + eval(expression.replace(/\^/g, "**").replace(/x/g, "*"));
                        if (result.length > 10) {
                            result = Number.parseFloat(result).toExponential(7);
                        }
                    } catch (e) {
                        result = "ERR";
                    }
                    if (result == "Infinity") {
                        result = "ERR";
                    }
                } else {
                    expression += a;
                }
                $screenB.text(expression);
                $screenA.text(result);
            });
        $buttons.append(buttons[i]);
    }
    buttons[2].css({
      "padding-top": "10px",
      "height": "30px"
    });
    $(document).on("keydown", (e) => {
        if (!$root.hasClass("active")) return;
        if (e.which > 47 && e.which < 58 && !e.shiftKey) {
            expression += e.which - 48;
        } else if (e.which > 95 && e.which < 106 && !e.shiftKey) {
            expression += e.which - 96;
        } else if (e.which === 8) {
            buttons[4].click();
        } else if (e.which === 189 || e.which == 109) {
            expression += "-";
        } else if (e.which === 191 || e.which == 220 || e.which == 111) {
            expression += "/";
        } else if (e.which === 110 || e.which == 190) {
            expression += ".";
        } else if (e.which === 187 && e.shiftKey || e.which == 107) {
            expression += "+";
        } else if (e.which === 8 + 48 && e.shiftKey || e.which == 106) {
            expression += "x";
        } else if (e.which === 6 + 48 && e.shiftKey) {
            expression += "^";
        } else if (e.which === 9 + 48 && e.shiftKey) {
            expression += "(";
        } else if (e.which === 0 + 48 && e.shiftKey) {
            expression += ")";
        } else if (e.which === 13 || e.which === 187) {
            buttons[19].click();
        }
        $screenB.text(expression);
        $screenA.text(result);
    });

    $root.append($buttons);
}
