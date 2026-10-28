// Fund Data Management: Overview prototype.
// All data is invented. Two scenarios: "populated" (a busy day, checks populated)
// and "nodata" (nothing on the dashboard, checks Not available yet).
(function () {
  var TODAY = '2026-10-27';
  var WINDOW_START = '2026-10-13';
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  var isIso = function (s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && s <= TODAY; };
  var parts = function (iso) { return iso.split('-').map(Number); };
  var fmt = function (iso) { var p = parts(iso); return p[2] + ' ' + MON[p[1] - 1] + ' ' + p[0]; };
  var fmtDay = function (iso) { var p = parts(iso); return p[2] + ' ' + FULL[p[1] - 1]; };
  var fmtLong = function (iso) { var p = parts(iso); return MON[p[1] - 1] + ' ' + p[2] + ', ' + p[0]; };
  var addDays = function (iso, n) { var p = parts(iso); return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10); };

  var q = new URLSearchParams(window.location.search);
  var state = {
    scenario: q.get('scenario') === 'nodata' ? 'nodata' : 'populated',
    date: isIso(q.get('date')) ? q.get('date') : '2026-10-22',
    panel: null
  };

  // ---------- icons (lucide paths) ----------
  var svg = function (d, size, extra) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + ((extra && extra.stroke) || 'currentColor') + '" stroke-width="' + ((extra && extra.w) || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  };
  var P = function (d) { return '<path d="' + d + '"/>'; };
  var I = {
    chevR: P('m9 18 6-6-6-6'), chevL: P('m15 18-6-6 6-6'), arrow: P('M5 12h14M12 5l7 7-7 7'),
    refresh: P('M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5'),
    inbox: P('M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'),
    send: P('m22 2-7 20-4-9-9-4zM22 2 11 13'),
    alert: P('m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01'),
    x: P('M18 6 6 18M6 6l12 12'), download: P('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3'),
    search: '<circle cx="11" cy="11" r="8"/>' + P('m21 21-4.3-4.3'),
    help: '<circle cx="12" cy="12" r="9"/>' + P('M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.7-2.5 2-2.5 3.5M12 17h.01'),
    bell: P('M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0'),
    updown: P('m7 15 5 5 5-5M7 9l5-5 5 5'),
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    globe: '<circle cx="12" cy="12" r="9"/>' + P('M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18'),
    docs: '<rect x="6" y="3" width="14" height="18" rx="2"/>' + P('M3 7v12a2 2 0 0 0 2 2M10 8h6M10 12h6M10 16h4'),
    present: '<rect x="3" y="4" width="18" height="12" rx="2"/>' + P('M12 16v4M8 20h8M7 11l3-3 3 2 4-4'),
    network: '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>' + P('M12 7v5M5 17v-3h14v3M12 12v5'),
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/>' + P('M9 4h6v3H9z'),
    gear: '<circle cx="12" cy="12" r="3"/>' + P('M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z')
  };

  // ---------- data ----------
  var STATUS = { delivered: 'Delivered', pending: 'Pending', failed: 'Failed' };
  function rows() {
    var run = state.date;
    var cause = 'The destination refused our login (SFTP authentication failed).';
    var R = function (id, status, dest, svc, pipe, file, ent, extra) {
      return Object.assign({ id: id, status: status, dest: dest, svc: svc, pipe: pipe, file: file, ent: ent, run: run }, extra || {});
    };
    return [
      R('r1', 'failed', 'Northgate Wealth Platform', 'Monthly factsheets', 'Factsheets, UK retail', 'ngw_factsheets_20261022.zip', 38, { cause: cause }),
      R('r2', 'failed', 'Northgate Wealth Platform', 'KIID documents', 'KIID documents, UK', 'ngw_kiid_20261022.zip', 22, { cause: cause }),
      R('r3', 'pending', 'Corvane Distribution', 'Daily data feed', 'Pricing, daily', 'corvane_pricing_20261022.json', 96),
      R('r4', 'delivered', 'Aldermoor Client Portal', 'Daily data feed', 'Daily data publication', 'aldermoor_feed_20261022.csv', 112),
      R('r5', 'delivered', 'Brightwell Advisory Network', 'KIID documents', 'KIID documents, EU', 'brightwell_kiid_20261022.zip', 27)
    ];
  }

  // ---------- view pieces ----------
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var badge = function (st) { return '<span class="badge b-' + st + '">' + STATUS[st] + '</span>'; };

  function stat(label, v) {
    if (typeof v !== 'number') {
      return '<div class="stat na"><span class="lab">' + label + '</span><span class="val">Not available yet</span></div>';
    }
    var inner = '<span class="num' + (label === 'Failed' && v > 0 ? ' bad' : '') + '">' + v.toLocaleString('en-GB') + '</span><span class="lab">' + label + '</span>';
    return v > 0 ? '<a class="stat" href="#top">' + inner + '</a>' : '<div class="stat">' + inner + '</div>';
  }
  var statGrid = function (labels, vals) { return '<div class="stats">' + labels.map(function (l, i) { return stat(l, vals[i]); }).join('') + '</div>'; };

  function banner() {
    if (state.scenario !== 'populated' || state.date < WINDOW_START) return '';
    return '<div class="banner" role="alert">' + svg(I.alert, 22) +
      '<div class="body"><span class="title">One destination is failing: 2 deliveries to Northgate Wealth Platform</span>' +
      '<span><span class="strong">Cause:</span> The destination refused our login (SFTP authentication failed).</span>' +
      '<span class="strong">We are already on it.</span></div></div>';
  }

  function received(outside) {
    var body;
    if (outside) body = '<div class="msg">We can show files received for the last 14 days. This date is older than that.</div>';
    else if (state.scenario === 'populated') body = statGrid(['Files received', 'Processed', 'Not processed', 'Rejected by us'], [128, 121, 2, 5]);
    else body = statGrid(['Files received', 'Processed', 'Not processed', 'Rejected by us'], [0, 0, 0, 0]) + '<p class="note small">No files arrived on this date.</p>';
    return '<div class="sect"><div class="sect-head">' + svg(I.inbox, 22, { stroke: '#3a4051', w: 1.6 }) + '<h2>Files received on ' + fmtDay(state.date) + '</h2></div>' + body + '</div>';
  }

  function sent(outside) {
    var body;
    var labels = ['Files owed', 'Files delivered', 'Still to send', 'Failed'];
    if (outside) body = '<div class="msg">We can show files sent for the last 14 days. This date is older than that.</div>';
    else {
      var vals = state.scenario === 'populated' ? [null, 41, 1, 2] : [null, 0, 0, 0];
      body = statGrid(labels, vals) + '<p class="note">Figures cover files sent on your behalf on this date.</p>';
    }
    return '<div class="sect"><div class="sect-head">' + svg(I.send, 22, { stroke: '#3a4051', w: 1.6 }) + '<h2>Files sent on ' + fmtDay(state.date) + '</h2></div>' + body + '</div>';
  }

  function deliveries(outside) {
    var head = '<div class="dhead"><h2>Deliveries on ' + fmtDay(state.date) + '</h2></div>';
    var body;
    if (state.scenario === 'populated' && !outside) {
      body = '<div class="table-scroll"><div class="table"><div class="tr th"><span>Destination and file</span><span>Service</span><span>Run date</span><span>Delivery status</span></div>' +
        rows().map(function (r) {
          return '<button class="tr" data-action="open" data-id="' + r.id + '"><span class="dest"><span>' + esc(r.dest) + '</span><span class="file">' + esc(r.file) + '</span></span><span>' + esc(r.svc) + '</span><span class="tnum">' + r.run + '</span><span>' + badge(r.status) + '</span></button>';
        }).join('') + '</div></div>';
    } else {
      var t = outside ? 'Nothing ran on this date' : 'Nothing was due on this date';
      var b = outside ? 'We cannot tell whether anything was due.' : 'Next due: ' + fmt(addDays(state.date, 1));
      body = '<div class="empty">' + svg(I.inbox, 32, { w: 1.4 }) + '<span class="t">' + t + '</span><span class="b">' + b + '</span></div>';
    }
    return '<section class="card">' + head + body + '<div class="dfoot"><a href="#top">See all deliveries ' + svg(I.arrow, 16) + '</a></div></section>';
  }

  function checks() {
    var foot = '<p class="note small">*Some destinations don\'t send their data back to us, so there\'s nothing to compare. That\'s usually down to an agreement with the destination, not a delay on our side.</p>';
    var head = '<h2>Published data checks</h2>';
    if (state.scenario === 'populated') {
      var box = function (n, l) { return '<div class="stat"><span class="num">' + n + '</span><span class="lab">' + l + '</span></div>'; };
      return '<section class="card pad right checks">' + head +
        '<div><div class="big">98.4%</div><div class="cap">of checked values matched</div></div>' +
        box('1,186', 'Checked') + box('14', 'Pending first results') + box('6', 'Not checked*') + foot + '</section>';
    }
    var na = function (l) { return '<div class="cbox"><span class="l">' + l + '</span><span class="v">Not available yet</span></div>'; };
    return '<section class="card pad right checks">' + head +
      '<div><div class="big na">Not available yet</div><div class="cap">of checked values matched</div></div>' +
      na('Checked') + na('Pending first results') + na('Not checked*') + foot + '</section>';
  }

  function panel() {
    var r = rows().filter(function (x) { return x.id === state.panel; })[0];
    if (!r) return '';
    var dl = [['Service', r.svc], ['Publication', r.pipe], ['Run date', fmtLong(r.run)], ['Entities', r.ent], ['File', r.file]];
    if (r.status === 'failed') dl.push(['Cause', r.cause]);
    return '<div class="scrim"><button class="bg" data-action="close" aria-label="Close delivery details"></button>' +
      '<aside class="panel" role="dialog" aria-modal="true" aria-label="Delivery details">' +
      '<div class="phead"><button class="close" id="panel-close" data-action="close" aria-label="Close">' + svg(I.x, 22) + '</button><div><span class="f">' + esc(r.file) + '</span><span class="d">' + esc(r.dest) + '</span></div></div>' +
      '<div class="pbody"><div class="ptitle">Delivery details</div><dl class="dl"><div><dt>Status</dt><dd>' + badge(r.status) + '</dd></div>' +
      dl.map(function (d) { return '<div><dt>' + d[0] + '</dt><dd>' + esc(d[1]) + '</dd></div>'; }).join('') + '</dl>' +
      '</div>' +
      '<div class="pfoot"><button class="btn">View destination</button><button class="btn primary">' + svg(I.download, 18) + 'Download file</button></div>' +
      '</aside></div>';
  }

  function rail() {
    var a = function (label, icon) { return '<a href="#top" aria-label="' + label + '">' + svg(icon, 22, { w: 1.6 }) + '</a>'; };
    return '<nav class="rail" aria-label="Main"><div class="logo">' + svg('<circle cx="12" cy="12" r="6"/>', 20, { stroke: '#fff', w: 3 }) + '</div>' +
      '<div class="collapse">' + svg(I.updown, 16) + '</div>' +
      a('Dashboard', I.grid) + a('Destinations', I.globe) + a('Documents', I.docs) + a('Reports', I.present) + a('Pipelines', I.network) + a('Tasks', I.clip) + a('Settings', I.gear) +
      '<div class="spacer"></div><div class="avatar" aria-label="Account">S</div></nav>';
  }

  function view() {
    var outside = state.date < WINDOW_START;
    var pop = state.scenario === 'populated';
    var next = addDays(state.date, 1) > TODAY;
    return '<div class="proto-bar" role="group" aria-label="Prototype scenario"><span>Prototype view</span>' +
      '<button data-action="scenario" data-value="populated" aria-pressed="' + pop + '">Populated checks</button>' +
      '<button data-action="scenario" data-value="nodata" aria-pressed="' + !pop + '">No data</button></div>' +
      '<div class="shell">' + rail() + '<div class="content">' +
      '<header class="topbar"><div class="crumbs"><span>Kurtosys</span>' + svg(I.chevR, 14) + '<span>Data</span>' + svg(I.chevR, 14) + '<span class="here">Fund Data Management</span></div>' +
      '<div class="tools"><label class="search">' + svg(I.search, 18) + '<input type="search" placeholder="Search" aria-label="Search"></label>' + svg(I.help, 22, { w: 1.6 }) + '<span class="bell">' + svg(I.bell, 22, { w: 1.6 }) + '<i></i></span></div></header>' +
      '<main class="page" id="top"><div class="head"><div><h1>Overview</h1><p class="sub">Everything we sent on your behalf on the working date, and whether it landed.</p></div>' +
      '<div class="date-wrap"><div class="refreshed">Last refreshed at 12:25 ' + svg(I.refresh, 22, { w: 1.6 }) + '</div>' +
      '<div class="date-ctl"><button class="iconbtn" data-action="prev" aria-label="Previous day">' + svg(I.chevL, 18) + '</button><label for="wd">Working date</label>' +
      '<input id="wd" type="date" value="' + state.date + '" min="2026-01-01" max="' + TODAY + '"><button class="iconbtn" data-action="next" aria-label="Next day"' + (next ? ' disabled' : '') + '>' + svg(I.chevR, 18) + '</button></div></div></div>' +
      banner() +
      '<div class="cols"><div class="left"><section class="card pad">' + received(outside) + sent(outside) + '</section>' + deliveries(outside) + '</div>' + checks() + '</div>' +
      '</main></div></div>' + panel();
  }

  // ---------- render + events ----------
  var app = document.getElementById('app');
  function render(focusId) {
    app.innerHTML = view();
    try {
      var u = new URL(window.location.href);
      u.searchParams.set('date', state.date);
      if (state.scenario === 'nodata') u.searchParams.set('scenario', 'nodata'); else u.searchParams.delete('scenario');
      window.history.replaceState(null, '', u);
    } catch (e) {}
    if (focusId) { var el = document.getElementById(focusId); if (el) el.focus(); }
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action]');
    if (!t) return;
    var a = t.getAttribute('data-action');
    if (a === 'scenario') { state.scenario = t.getAttribute('data-value'); state.panel = null; render(); }
    if (a === 'open') { state.panel = t.getAttribute('data-id'); render('panel-close'); }
    if (a === 'close') { state.panel = null; render(); }
    if (a === 'prev') { state.date = addDays(state.date, -1); render(); }
    if (a === 'next') { var n = addDays(state.date, 1); if (n <= TODAY) { state.date = n; render(); } }
  });
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'wd' && isIso(e.target.value)) { state.date = e.target.value; render('wd'); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state.panel) { state.panel = null; render(); }
  });

  render();
})();
