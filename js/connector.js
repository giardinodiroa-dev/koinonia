var POLL_INTERVAL = 1000; // 1 second
var pollingTimer = null;

function getCredentials(t) {
  return Promise.all([
    t.get('member', 'private', 'apiKey'),
    t.get('member', 'private', 'token')
  ]).then(function(results) {
    return { apiKey: results[0], token: results[1] };
  });
}

async function sortListByVotes(listId, apiKey, token) {
  var resp = await fetch(
    'https://api.trello.com/1/lists/' + listId + '/cards?fields=name,pos,badges&key=' + apiKey + '&token=' + token
  );
  if (!resp.ok) return;
  var cards = await resp.json();
  if (!Array.isArray(cards) || cards.length < 2) return;

  var sorted = cards.slice().sort(function(a, b) {
    return ((b.badges && b.badges.votes) || 0) - ((a.badges && a.badges.votes) || 0);
  });

  // Skip if already in correct order
  var alreadySorted = sorted.every(function(card, i) { return card.id === cards[i].id; });
  if (alreadySorted) return;

  for (var i = 0; i < sorted.length; i++) {
    var newPos = (i + 1) * 65536;
    await fetch(
      'https://api.trello.com/1/cards/' + sorted[i].id + '?pos=' + newPos + '&key=' + apiKey + '&token=' + token,
      { method: 'PUT' }
    );
  }
}

async function runSort(t) {
  var results = await Promise.all([
    getCredentials(t),
    t.get('board', 'shared', 'watchedLists')
  ]);
  var creds = results[0];
  var watchedLists = results[1];

  if (!creds.apiKey || !creds.token) return;
  if (!watchedLists || watchedLists.length === 0) return;

  for (var i = 0; i < watchedLists.length; i++) {
    await sortListByVotes(watchedLists[i], creds.apiKey, creds.token);
  }
}

function startPolling(t) {
  if (pollingTimer) clearInterval(pollingTimer);
  runSort(t);
  pollingTimer = setInterval(function() {
    runSort(t);
  }, POLL_INTERVAL);
}

TrelloPowerUp.initialize({
  'board-buttons': function(t) {
    startPolling(t);
    return [{
      text: 'Sort Votes',
      icon: {
        dark: window.location.origin + '/img/icon.svg',
        light: window.location.origin + '/img/icon.svg'
      },
      callback: function(t) {
        return runSort(t);
      }
    }];
  },
  'show-settings': function(t) {
    return t.popup({
      title: 'Koinonia Settings',
      url: './settings.html',
      height: 450
    });
  }
});
