if (!localStorage.getItem('theme')) {
  // Default theme is dark
  localStorage.setItem('theme', 'dark');
}

// Load the theme
document.querySelector('body').className = localStorage.getItem('theme');

const supabaseUrl = 'https://qmhtxbgzidqwysoanqur.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtaHR4Ymd6aWRxd3lzb2FucXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY2NjMyNzYsImV4cCI6MjAwMjIzOTI3Nn0.H49CGjgay-RUIqCnkRUwKfHNQIXW2Una4mZXsbLvp8g';
const client = supabase.createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data, error } = await client.auth.getSession();
  console.log('session:', data, error);
  await setAuthView(data, true);
})();

async function setAuthView(data, hideLoggedInMenu) {
  // Used to set the menu view based on whether the user is logged in
  document.querySelector('#login-form').reset();
  document.querySelector('#signup-form').reset();
  if (data.session) {
    // The user is logged in
    document.querySelector('#login-form').classList.add('hidden');
    document.querySelector('#signup-form').classList.add('hidden');
    document.querySelector('#settings').classList.remove('hidden');
    document.querySelector('#account-info span').textContent = data.session.user.email;
    if (hideLoggedInMenu) document.querySelector('#menu').close();
    else document.querySelector('#menu').showModal();
  } else {
    // The user is not logged in
    document.querySelector('#editor').innerHTML = ''; // Empty the editor
    document.querySelector('#account-info span').textContent = ''; // Empty the user's email
    document.querySelector('#login-form').classList.remove('hidden');
    document.querySelector('#signup-form').classList.remove('hidden');
    document.querySelector('#settings').classList.add('hidden');
    document.querySelector('#menu').showModal();
  }
}

// TODO write function to download data and call it once logged in and in the async funct call on line 13
// Don't put it inside setAuthView because that's also called on keypress

// Handle switching between login and signup forms
document.querySelectorAll('.buttons .text').forEach(elem => elem.addEventListener('click', e => {
  e.preventDefault();
  document.querySelector('#login-form').classList.toggle('hidden');
  document.querySelector('#signup-form').classList.toggle('hidden');
}));

// Handle login form submit
document.querySelector('#login-form').addEventListener('submit', async evt => {
  evt.preventDefault();
  // Clear any error messages
  document.querySelector('#login-error').textContent = '';
  const { data, error } = await client.auth.signInWithPassword({
    email: document.querySelector('#email').value.trim(),
    password: document.querySelector('#password').value,
  });
  console.log(data, error);
  if (error) document.querySelector('#login-error').textContent = error.message;
  // Update the dialog to the logged in view
  else await setAuthView(data, false);
});

// Handle signup form submit
document.querySelector('#signup-form').addEventListener('submit', async evt => {
  evt.preventDefault();
  // Check if password matches with confirm password
  if (document.querySelector('#new-password').value !== document.querySelector('#confirm-password').value) {
    document.querySelector('#signup-error').textContent = 'Passwords don\'t match!';
    return;
  }
  // Clear any error messages
  document.querySelector('#signup-error').textContent = '';
  const { data, error } = await client.auth.signUp({
    email: document.querySelector('#new-email').value.trim(),
    password: document.querySelector('#new-password').value,
    options: {
      emailRedirectTo: location.href
    }
  });
  console.log(data, error);
  if (error) document.querySelector('#signup-error').textContent = error.message;
  else alert('Check your inbox for a verification email!');
  document.querySelector('#signup-form').reset();
  document.querySelector('#login-form').classList.remove('hidden');
  document.querySelector('#signup-form').classList.add('hidden');
});

// Sign out
document.querySelector('#signout').addEventListener('click', async evt => {
  evt.preventDefault();
  // Sign out the user
  const { error } = await client.auth.signOut();
  console.error(error);
  if (error) alert(error.message);
  else await setAuthView({ session: null }, false);
});

window.addEventListener('keydown', async e => {
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
    const { data } = await client.auth.getSession(); // Only allow them to close the menu if they're logged in
    if (document.querySelector('#menu').open && data.session) document.querySelector('#menu').close();
    else await setAuthView(data, false);
  }
});

// Settings
document.querySelector('#font').value = localStorage.getItem('font');
document.querySelector('#editor').style.fontFamily = localStorage.getItem('font');

document.querySelector('#settings').addEventListener('submit', evt => {
  evt.preventDefault();
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
