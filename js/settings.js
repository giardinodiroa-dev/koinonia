var t = TrelloPowerUp.iframe();

var listsContainer = document.getElementById('lists-container');
var apiKeyInput = document.getElementById('apiKey');
var tokenInput = document.getElementById('token');
var saveBtn = document.getElementById('save-btn');
var statusEl = document.getElementById('status');
var errorEl = document.getElementById('error');

var allLists = [];

// Load existing settings and board lists in parallel
Promise.all([
  t.lists('id', 'name'),
  t.get('board', 'shared', 'watchedLists'),
  t.get('member', 'private', 'apiKey'),
  t.get('member', 'private', 'token')
]).then(function(results) {
  allLists = results[0];
  var watchedLists = results[1] || [];
  var savedKey = results[2] || '';
  var savedToken = results[3] || '';

  apiKeyInput.value = savedKey;
  tokenInput.value = savedToken;

  if (allLists.length === 0) {
    listsContainer.innerHTML = '<p class="loading">No lists found on this board.</p>';
    return;
  }

  listsContainer.innerHTML = '';
  allLists.forEach(function(list) {
    var label = document.createElement('label');
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = list.id;
    checkbox.checked = watchedLists.indexOf(list.id) !== -1;

    var span = document.createElement('span');
    span.className = 'list-name';
    span.textContent = list.name;

    label.appendChild(checkbox);
    label.appendChild(span);
    listsContainer.appendChild(label);
  });

  t.sizeTo(document.body);
}).catch(function(err) {
  listsContainer.innerHTML = '<p class="loading">Error loading lists.</p>';
  console.error(err);
});

saveBtn.addEventListener('click', function() {
  var apiKey = apiKeyInput.value.trim();
  var token = tokenInput.value.trim();

  if (!apiKey || !token) {
    showError('Please enter both API Key and Token.');
    return;
  }

  var checked = Array.from(document.querySelectorAll('#lists-container input[type="checkbox"]:checked'))
    .map(function(cb) { return cb.value; });

  Promise.all([
    t.set('board', 'shared', 'watchedLists', checked),
    t.set('member', 'private', 'apiKey', apiKey),
    t.set('member', 'private', 'token', token)
  ]).then(function() {
    showStatus('Settings saved!');
  }).catch(function(err) {
    showError('Failed to save: ' + err.message);
  });
});

function showStatus(msg) {
  errorEl.style.display = 'none';
  statusEl.textContent = msg;
  statusEl.style.display = 'block';
  setTimeout(function() { statusEl.style.display = 'none'; }, 3000);
}

function showError(msg) {
  statusEl.style.display = 'none';
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}
