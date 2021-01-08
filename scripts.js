if (!localStorage.getItem("theme")) {
    // Default theme is dark
    localStorage.setItem("theme", "dark");
}

// Load the theme
$("body").attr("class", localStorage.getItem("theme"));

// Focus the editor
$("#editor").focus();

if (!localStorage.getItem("visited")) {
    // Show the menu if it has never been closed before
    // (usually when the site is visited for the first time)
    $(".help").show();
    // Disable the editor
    $("#editor").attr("contenteditable", false);
    $("#overlay").show();
}

$(window).keydown(e => {
    if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        // Toggle theme
        let new_theme = localStorage.getItem("theme") === "dark" ? "light" : "dark";
        localStorage.setItem("theme", new_theme);
        $("body").attr("class", new_theme);
    } else if (e.key === "Escape" || e.key === "Tab") {
        // Don't unfocus the editor when escape or tab are pressed
        e.preventDefault();
        $("#editor").focus();
    } else if (e.key === "F1" || e.ctrlKey && e.key === ",") {
        e.preventDefault();
        // Toggle menu visibility
        $(".help").toggle();
        if ($(".help").is(":visible")) {
            // The menu was toggled on, so disable the editor
            $("#editor").attr("contenteditable", false);
            $("#overlay").show();
        } else {
            // The menu was toggled off, so enable the editor
            localStorage.setItem("visited", true);
            $("#editor").attr("contenteditable", true);
            $("#overlay").hide();
            $("#editor").focus();
        }
    }
});

// Settings
$("#font").val(localStorage.getItem("font"));
$("#editor").css("fontFamily", localStorage.getItem("font"));

$("#settings").submit(e => {
    console.log("fejoiwfjew");
    e.preventDefault();
    localStorage.setItem("font", $("#font").val());
    $("#editor").css("fontFamily", $("#font").val());
})

$(".form-input input").each(function() {
    if ($(this).val() !== "") {
        $("#"+this.id+" + label").animate({
            "fontSize": "0.8rem",
            "top": "-0.8rem",
            "padding": "0.25rem"
        }, 80);
    }
    $(this).focusin(() => {
        $("#"+this.id+" + label").animate({
            "fontSize": "0.8rem",
            "top": "-0.8rem",
            "padding": "0.25rem"
        }, 80);
    });
    $(this).focusout(function() {
        if ($(this).val() === "") {
            $("#"+this.id+" + label").animate({
                "fontSize": "1rem",
                "top": ".5rem",
                "padding": 0
            }, 80);
        }
    });
});

// Save

// Credit: stackoverflow
function setEndOfContenteditable(contentEditableElement) {
    var range,selection;
    if(document.createRange) {
        // Firefox, Chrome, Opera, Safari, IE 9+
        // Create a range (a range is a like the selection but invisible)
        range = document.createRange();
        // Select the entire contents of the element with the range
        range.selectNodeContents(contentEditableElement);
        // Collapse the range to the end point. false means collapse to end rather than the start
        range.collapse(false);
        // Get the selection object (allows you to change selection)
        selection = window.getSelection();
        // Remove any selections already made
        selection.removeAllRanges();
        // Make the range you have just created the visible selection
        selection.addRange(range);
    } else if(document.selection) {
        // IE 8 and lower
        // Create a range (a range is a like the selection but invisible)
        range = document.body.createTextRange();
        // Select the entire contents of the element with the range
        range.moveToElementText(contentEditableElement);
        // Collapse the range to the end point. false means collapse to end rather than the start
        range.collapse(false);
        // Select the range (make it the visible selection
        range.select();
    }
}

$("#editor").html(localStorage.getItem("content"));

setEndOfContenteditable($("#editor")[0]);
$(window).scrollTop(document.body.scrollHeight);

setInterval(() => {
    localStorage.setItem("content", $("#editor").html());
}, 2000);
