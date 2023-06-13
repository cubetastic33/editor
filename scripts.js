if (!localStorage.getItem('theme')) {
  // Default theme is dark
  localStorage.setItem('theme', 'dark');
}

// Load the theme
document.querySelector('body').className = localStorage.getItem('theme');

// Focus the editor
document.querySelector('#editor').focus();

if (!localStorage.getItem('visited')) {
  // Show the menu if it has never been closed before
  // (usually when the site is visited for the first time)
  document.querySelector('.help').style.display = 'block';
  // Disable the editor
  document.querySelector('#editor').contentEditable = false;
  document.querySelector('#overlay').style.display = 'block';
}

function close_menu() {
  // Hide the menu
  document.querySelector('.help').style.display = 'none';
  // Enable the editor
  localStorage.setItem('visited', true);
  document.querySelector('#editor').contentEditable = true;
  document.querySelector('#overlay').style.display = 'none';
  document.querySelector('#editor').focus();
}

window.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'd') {
    e.preventDefault();
    // Toggle theme
    let new_theme = localStorage.getItem('theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', new_theme);
    document.body.className = new_theme;
  } else if (e.key === 'Escape' || e.key === 'Tab') {
    // Don't unfocus the editor when escape or tab are pressed
    document.querySelector('#editor').focus();
  } else if (e.key === 'F1' || e.ctrlKey && e.key === ',') {
    e.preventDefault();
    // Toggle menu visibility
    if (document.querySelector('.help').style.display === 'block') {
      document.querySelector('.help').style.display = 'none';
    } else {
      document.querySelector('.help').style.display = 'block';
    }
    console.log(document.querySelector('.help').style.display);
    if (document.querySelector('.help').style.display === 'block') {
      // The menu was toggled on, so disable the editor
      document.querySelector('#editor').contentEditable = false;
      document.querySelector('#overlay').style.display = 'block';
    } else {
      // The menu was toggled off, so enable the editor
      localStorage.setItem('visited', true);
      document.querySelector('#editor').contentEditable = true;
      document.querySelector('#overlay').style.display = 'none';
      document.querySelector('#editor').focus();
    }
  } else if (e.key === 'Escape' && document.querySelector('.help').style.display === 'block') {
    e.preventDefault();
    close_menu();
  }
});

document.querySelector('#overlay').addEventListener('click', close_menu);

// Settings
document.querySelector('#font').value = localStorage.getItem('font');
document.querySelector('#editor').style.fontFamily = localStorage.getItem('font');

document.querySelector('#settings').addEventListener('submit', e => {
  e.preventDefault();
  localStorage.setItem('font', document.querySelector('#font').value);
  document.querySelector('#editor').style.fontFamily = document.querySelector('#font').value;
});

// Save

// Credit: stackoverflow
function setEndOfContenteditable(contentEditableElement) {
  var range, selection;
  if (document.createRange) {
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
  } else if (document.selection) {
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

document.querySelector('#editor').innerHTML = localStorage.getItem('content');

// Set the cursor at the end of the editable div
setEndOfContenteditable(document.querySelector('#editor'));
// Scroll to the bottom of the window
window.scrollTo(0, document.body.scrollHeight);

setInterval(() => {
  if (document.querySelector('#editor').innerHTML === '<br>') {
    // Fixes a bug on firefox where deleting all text then reloading and typing would start
    // after a newline
    localStorage.removeItem('content');
  } else {
    localStorage.setItem('content', document.querySelector('#editor').innerHTML);
  }
}, 2000);
