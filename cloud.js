// JQuery-like aliases
// We're using getElementById instead of querySelector because it's much faster
const $ = id => document.getElementById(id);
const $toast = $('toast');
const $editor = $('editor');
const $menu = $('menu');
const $loginForm = $('login-form');
const $signupForm = $('signup-form');
let globalInterval; // Keep track of the running setInterval

if (!localStorage.getItem('theme')) {
  // Default theme is dark
  localStorage.setItem('theme', 'dark');
}

// Load the theme
document.querySelector('body').className = localStorage.getItem('theme');

function showToast(message, type='success') {
  $toast.style.opacity = '1';
  $toast.innerText = message;
  $toast.className = type;
  setTimeout(() => $toast.style.opacity = '0', 5000);
}

const supabaseUrl = 'https://qmhtxbgzidqwysoanqur.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtaHR4Ymd6aWRxd3lzb2FucXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODY2NjMyNzYsImV4cCI6MjAwMjIzOTI3Nn0.H49CGjgay-RUIqCnkRUwKfHNQIXW2Una4mZXsbLvp8g';
const client = supabase.createClient(supabaseUrl, supabaseKey);

async function setAuthView(data, hideLoggedInMenu) {
  // Used to set the menu view based on whether the user is logged in
  $loginForm.reset();
  $signupForm.reset();
  if (data.session) {
    // The user is logged in
    $loginForm.classList.add('hidden');
    $signupForm.classList.add('hidden');
    $('settings').classList.remove('hidden');
    $('account-email').textContent = data.session.user.email;
    $editor.setAttribute('contenteditable', 'true');
    $editor.focus();
    if (hideLoggedInMenu) $menu.close();
    else $menu.showModal();
  } else {
    // The user is not logged in
    localStorage.removeItem('page[default]'); // Clear the stored page from localStorage
    $editor.innerHTML = ''; // Empty the editor
    $('account-email').textContent = ''; // Empty the user's email
    $loginForm.classList.remove('hidden');
    $signupForm.classList.add('hidden');
    $('settings').classList.add('hidden');
    $menu.showModal();
  }
}

function initLocalStorage() {
  // Loads content from local storage
  // Right now we load the hardcoded page name of `default`. In the future we should let the user choose what page they want
  $editor.innerHTML = localStorage.getItem('page[default]');
  // Set the cursor at the end of the editable div
  setEndOfContenteditable($editor);
  // Scroll to the bottom of the window
  window.scrollTo(0, document.body.scrollHeight);
  // Clear any existing setInterval
  if (globalInterval) clearInterval(globalInterval);
  globalInterval = setInterval(() => {
    if ($editor.innerHTML === '<br>') {
      // Fixes a bug on firefox where deleting all text then reloading and typing would start
      // after a newline
      localStorage.removeItem('page[default]');
    } else {
      localStorage.setItem('page[default]', $editor.innerHTML);
    }
  }, 2000);
}

async function uploadData() {
  // Load all the pages the user already has
  const pages = await client.from('pages').select().eq('name', 'default');
  let errorMessage;
  if (pages.error) {
    console.log(pages);
    showToast(pages.error);
    return;
  } else if (pages.data.length === 0) {
    // The user doesn't have any pages yet, so we need to insert
    const { data } = await client.auth.getSession(); // To get the user ID
    let { error } = await client.from('pages').insert({
      user_id: data.session.user.id,
      name: 'default',
      content: $editor.innerHTML,
    });
    if (error) {
      console.log(error);
      errorMessage = error.message;
    }
  } else {
    // The user already has pages, so just update
    let { error } = await client.from('pages')
      .update({ content: $editor.innerHTML, updated_at: 'now()' })
      // We don't need to filter by user_id because of rls
      .eq('name', 'default');
    if (error) {
      console.log(error);
      errorMessage = error.message;
    }
  }
  if (errorMessage) showToast(errorMessage, 'error');
  else showToast('Saved data to cloud!');
}

async function downloadData() {
  // Overwrites the content in localStorage from the database
  // For now we hard-code the name of the page to `default`. This should be selectable by the user in the future
  const { data, error } = await client.from('pages').select('content').eq('name', 'default');
  if (error) {
    console.error(error);
    showToast(error.message, 'error');
  } else if (data.length) {
    // Save the content to localStorage
    // Format is page[`page name`]
    localStorage.setItem(`page[default]`, data[0].content);
    showToast('Loaded from cloud!');
    initLocalStorage();
  } else {
    showToast('No pages found!', '');
  }
}

$('download').addEventListener('click', downloadData);
$('upload').addEventListener('click', uploadData);

(async () => {
  const { data, error } = await client.auth.getSession();
  console.log('session:', data, error);
  await setAuthView(data, true);
  if (data.session) initLocalStorage();
})();

// Handle switching between login and signup forms
document.querySelectorAll('.buttons .text').forEach(elem => elem.addEventListener('click', e => {
  e.preventDefault();
  $loginForm.classList.toggle('hidden');
  $signupForm.classList.toggle('hidden');
}));

// Handle login form submit
$loginForm.addEventListener('submit', async evt => {
  evt.preventDefault();
  // Clear any error messages
  $('login-error').textContent = '';
  const { data, error } = await client.auth.signInWithPassword({
    email: $('email').value.trim(),
    password: $('password').value,
  });
  console.log(data, error);
  if (error) $('login-error').textContent = error.message;
  else {
    // Update the dialog to the logged in view
    await setAuthView(data, false);
    // Set the page content from the database
    await downloadData();
  }
});

// Handle signup form submit
$signupForm.addEventListener('submit', async evt => {
  evt.preventDefault();
  // Check if password matches with confirm password
  const password = $('new-password').value;
  if (password !== $('confirm-password').value) {
    $('signup-error').textContent = 'Passwords don\'t match!';
    return;
  }
  // Clear any error messages
  $('signup-error').textContent = '';
  const { data, error } = await client.auth.signUp({
    email: $('new-email').value.trim(),
    password,
    options: {
      emailRedirectTo: location.href
    }
  });
  console.log(data, error);
  if (error) $('signup-error').textContent = error.message;
  else alert('Check your inbox for a verification email!');
  $signupForm.reset();
  $('#login-form').classList.remove('hidden');
  $signupForm.classList.add('hidden');
});

// Sign out
$('signout').addEventListener('click', async evt => {
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
    $editor.focus();
  } else if (e.key === 'F1' || e.ctrlKey && e.key === ',') {
    e.preventDefault();
    // Toggle menu visibility
    const { data } = await client.auth.getSession(); // Only allow them to close the menu if they're logged in
    if ($menu.open && data.session) $menu.close();
    else await setAuthView(data, false);
  } else if (e.ctrlKey && e.key === 'b' && !$menu.open) {
    e.preventDefault();
    // Download data from cloud
    await downloadData();
  } else if (e.ctrlKey && e.key === 's' && !$menu.open) {
    e.preventDefault()
    // Save data to cloud
    await uploadData();
  }
});

// Settings
const $font = $('font');
$font.value = localStorage.getItem('font');
$editor.style.fontFamily = localStorage.getItem('font');

$('settings').addEventListener('submit', evt => {
  evt.preventDefault();
  localStorage.setItem('font', $font.value);
  $('#editor').style.fontFamily = $font.value;
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
