if (!localStorage.getItem("theme")) {
    // Default theme is dark
    localStorage.setItem("theme", "dark");
}

// Load the theme
$("body").attr("class", localStorage.getItem("theme"));

if (!localStorage.getItem("visited")) {
    // Show the menu if it has never been closed before
    // (usually when the site is visited for the first time)
    $(".help").css("display", "block");
}

// Focus the editor
$("#editor").focus();

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

$(document).keydown(e => {
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
    } else if (e.key === "F1") {
        // Toggle menu visibility
        $(".help").toggle();
        localStorage.setItem("visited", true);
        $("#editor").focus();
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