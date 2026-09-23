/* ============================================================================
   PNetLab dashboard — Labs view (folder / lab file manager)
   Reuses the existing engine APIs verbatim (all ride the shared token cookie):
     GET    /api/folders?path=          list folders + labs
     POST   /api/folders/{add,edit,delete}
     POST   /api/labs                   create ({path,name,version}) / clone ({source,name})
     POST   /api/labs/{get,edit,move}
     DELETE /api/labs                   ({path})
     POST   /api/labs/session/factory/create   open → then /legacy/topology
     POST   /api/export                 → download URL
     POST   /api/import (multipart)     file + path
   Every folder/lab object carries its own full `.path`, so we never rebuild paths.
   ============================================================================ */
(function () {
	'use strict';
	var App = window.PnqApp;
	var el = App.el;

	var state = { path: null, sel: {}, view: (localStorage.getItem('pnq-labs-view') || 'list'), data: { folders: [], labs: [] }, sort: readSort() };

	// Persisted column sort for the Workspace list. key: 'name' | 'mtime';
	// dir: 1 asc, -1 desc. Applied CLIENT-side in render() so a header click
	// re-sorts instantly with no refetch (the API already returns umtime + file).
	function readSort() {
		try {
			var s = JSON.parse(localStorage.getItem('pnq-labs-sort'));
			if (s && (s.key === 'name' || s.key === 'mtime') && (s.dir === 1 || s.dir === -1)) return s;
		} catch (e) {}
		return { key: 'name', dir: 1 };
	}
	function cmpName(a, b) { return String(a == null ? '' : a).localeCompare(String(b == null ? '' : b), undefined, { numeric: true, sensitivity: 'base' }); }
	// Folders keep name order (they have no mtime); '..' is pinned first. Labs sort
	// by the active key, tie-breaking mtime ties by name. Returns sorted COPIES so
	// the cached state.data stays in server order.
	function sortItems(folders, labs) {
		var key = state.sort.key, dir = state.sort.dir;
		var parents = [], reals = [];
		(folders || []).forEach(function (f) { (f.name === '..' ? parents : reals).push(f); });
		var fdir = (key === 'name') ? dir : 1;
		reals.sort(function (a, b) { return fdir * cmpName(a.name, b.name); });
		var slabs = (labs || []).slice();
		slabs.sort(function (a, b) {
			if (key === 'mtime') {
				var d = (Number(a.umtime) || 0) - (Number(b.umtime) || 0);
				if (d) return dir * (d < 0 ? -1 : 1);
				return cmpName(a.file, b.file);
			}
			return dir * cmpName(a.file, b.file);
		});
		return { folders: parents.concat(reals), labs: slabs };
	}
	function toggleSort(key) {
		if (state.sort.key === key) state.sort.dir = -state.sort.dir;
		else state.sort = { key: key, dir: key === 'mtime' ? -1 : 1 };   // Modified defaults newest-first
		try { localStorage.setItem('pnq-labs-sort', JSON.stringify(state.sort)); } catch (e) {}
		render(state.data);
	}
	var previewCache = {};   // lab path -> topology data (or 'fail'), so cards don't refetch
	var previewRequests = {}; // lab path -> { generation, promise }, de-duped in-flight requests
	var previewGeneration = {}; // invalidates responses already in flight when a lab mutates
	var topoIO = null;       // IntersectionObserver: lab previews load only when scrolled into view
	var preview = {
		path: null,
		lab: null,
		data: null,
		svg: null,
		status: 'none',
		zoom: 'auto',
		selectionToken: 0,
		debounce: null,
		dom: null
	};

	// Search mode: an overlay on top of the browse view. `token` guards stale
	// async walks (a new search or navigation invalidates in-flight results).
	var search = { active: false, q: '', token: 0 };

	function bumpPreviewGeneration(path) {
		if (!path) return;
		previewGeneration[path] = (previewGeneration[path] || 0) + 1;
		delete previewCache[path];
	}
	function invalidatePreview(path) { bumpPreviewGeneration(path); }
	function invalidatePreviewTree(path) {
		if (!path) return;
		var root = String(path).replace(/\/+$/, '') || '/';
		Object.keys(previewCache).forEach(function (p) { if (p === root || (root !== '/' && p.indexOf(root + '/') === 0)) bumpPreviewGeneration(p); });
		Object.keys(previewRequests).forEach(function (p) { if (p === root || (root !== '/' && p.indexOf(root + '/') === 0)) bumpPreviewGeneration(p); });
	}
	function labPathForName(path, name) {
		var clean = String(name == null ? '' : name).trim().replace(/\.unl$/i, '') + '.unl';
		var slash = String(path || '').lastIndexOf('/');
		var dir = slash <= 0 ? '' : String(path).slice(0, slash);
		return (dir || '/') === '/' ? '/' + clean : dir + '/' + clean;
	}
	function labPathInFolder(path, folder) {
		var file = String(path || '').slice(String(path || '').lastIndexOf('/') + 1);
		var dest = String(folder || '/').replace(/\/+$/, '') || '/';
		return dest === '/' ? '/' + file : dest + '/' + file;
	}

	/* ---- small request helpers -------------------------------------------- */
	function post(url, obj) {
		return App.api(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj || {}) });
	}
	function del(url, obj) {
		return App.api(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj || {}) });
	}
	function ok(res) { var b = res.body || {}; return res.status === 200 && (b.status === 'success' || b.code === 200); }
	function after(res, okMsg) {
		if (ok(res)) { if (okMsg) App.toast(okMsg, 'ok'); load(state.path); }
		else App.toast(App.errMsg(res.body), 'error');
	}
	function parentDir() { return state.path === '/' ? '/' : state.path; }       // dir we're in
	function childPath(name) { return state.path === '/' ? '/' + name : state.path + '/' + name; }

	/* ---- load + render ----------------------------------------------------- */
	// _retried guards against loops: a fresh non-admin whose landing folder is one
	// they can't list gets a 400; we then ask the engine for their effective
	// workspace once and load THAT instead (fixes the empty-dashboard bug).
	function load(path, _retried) {
		// Navigating anywhere leaves search mode (folder-result clicks, breadcrumb
		// clicks and refresh all land here) and invalidates in-flight walks.
		search.active = false; search.q = ''; search.token++;
		state.path = path || '/';
		state.sel = {};
		resetPreviewSelection();
		App.loading(true);
		return App.api('/api/folders?path=' + encodeURIComponent(state.path)).then(function (res) {
			var failed = res.status !== 200 || (res.body && res.body.status === 'fail');
			if (failed && !_retried && !App.isAdmin) {
				return App.api('/users/api.php?action=myworkspace').then(function (r) {
					var ws = (r.body && r.body.workspace) || '/';
					App.loading(false);
					if (ws && ws !== state.path) return load(ws, true);
					render((res.body && res.body.data) || { folders: [], labs: [] });
				}).catch(function () { App.loading(false); render({ folders: [], labs: [] }); });
			}
			App.loading(false);
			render((res.body && res.body.data) || { folders: [], labs: [] });
		}).catch(function () { App.loading(false); });
	}

	function render(data) {
		state.data = data || { folders: [], labs: [] };
		var view = document.getElementById('view');
		clearChildren(view);

		var head = el('div', 'view-head vh-ruled');
		head.appendChild(breadcrumb());
		head.appendChild(toolbar());
		view.appendChild(head);

		view.appendChild(bulkHost());          // empty unless selection

		var sorted = sortItems(data.folders || [], data.labs || []);
		var folders = sorted.folders, labs = sorted.labs;
		if (state.view === 'grid') {
			if (!folders.length && !labs.length) { var ec = el('div', 'card'); ec.appendChild(emptyState()); view.appendChild(ec); }
			else view.appendChild(buildGrid(folders, labs));
		} else {
			var split = el('div', 'fm-split');
			var listPane = el('div', 'fm-split__list');
			listPane.tabIndex = 0;
			listPane.setAttribute('aria-label', 'Lab list');
			if (!folders.length && !labs.length) listPane.appendChild(emptyState());
			else listPane.appendChild(buildTable(folders, labs));
			listPane.addEventListener('keydown', function (e) { handleListKey(e, listPane); });
			split.appendChild(listPane);
			split.appendChild(buildPreviewPane());
			view.appendChild(split);
		}
		markRunning();                         // best-effort: flag labs with an open session
	}

	// Cross-reference the open-session list (same endpoint the Running Labs view
	// polls) and give any lab that maps to a running session the green live cue —
	// reusing the Running Labs badge/edge language. The endpoint scopes regular
	// users to their own pod, so this remains safe for every authenticated user;
	// failures are best-effort and never block the lab listing.
	function runBadge(n) {
		var rb = el('span', 'rl-run-badge'); rb.style.marginLeft = '8px';
		rb.appendChild(el('span', 'rl-pulse'));
		rb.appendChild(document.createTextNode(n + ' running'));
		return rb;
	}
	function markRunning() {
		App.api('/status/api.php?action=sessions').then(function (res) {
			if (res.status !== 200) return;
			var rows = (res.body && res.body.data) || [];
			var map = {};
			rows.forEach(function (r) { if ((r.nodes_running || 0) > 0) map[r.path] = r.nodes_running; });
			document.querySelectorAll('[data-labpath]').forEach(function (node) {
				var n = map[node.getAttribute('data-labpath')];
				if (!n) return;
				node.classList.add('is-live');
				var host = node.querySelector('.js-runhost');
				if (host && !host.querySelector('.rl-run-badge')) host.appendChild(runBadge(n));
			});
		}).catch(function () { /* transient / no access — leave labs unmarked */ });
	}

	function breadcrumb() {
		var bc = el('div', 'breadcrumb2');
		var root = el('span', 'crumb' + (state.path === '/' ? ' is-current' : ''));
		root.appendChild(el('i', 'fa fa-home'));
		root.appendChild(document.createTextNode(' Workspace'));
		if (state.path !== '/') App.clickable(root, function () { load('/'); });
		bc.appendChild(root);
		var acc = '';
		state.path.split('/').filter(Boolean).forEach(function (seg, i, arr) {
			bc.appendChild(el('span', 'crumb-sep', '/'));
			acc += '/' + seg;
			var last = (i === arr.length - 1);
			var c = el('span', 'crumb' + (last ? ' is-current' : ''), seg);
			if (!last) { var tgt = acc; App.clickable(c, function () { load(tgt); }); }
			bc.appendChild(c);
		});
		return bc;
	}

	function toolbar() {
		var tb = el('div', 'toolbar');
		tb.appendChild(btn('fa-folder-open-o', 'New folder', 'btn', newFolder));
		tb.appendChild(btn('fa-flask', 'New lab', 'btn btn-primary', newLab));
		tb.appendChild(btn('fa-download', 'Import', 'btn', importLab));
		tb.appendChild(btn('fa-upload', 'Export', 'btn', exportDialog));
		tb.appendChild(btn('fa-refresh', 'Refresh', 'btn btn-ghost', function () { load(state.path); }));
		tb.appendChild(searchBox());
		tb.appendChild(viewToggle());
		return tb;
	}

	/* ---- search (recursive, client-side) ----------------------------------- */
	// Walks the user's browsable tree via the SAME GET /api/folders the view
	// lists with, so the endpoint's workspace jailing applies unchanged — a
	// user can only ever get results from folders they could browse into.
	function searchBox() {
		var wrap = el('span', 'labs-search');
		wrap.style.cssText = 'display:inline-flex;align-items:center;gap:4px;';
		var inp = el('input', 'input');
		inp.type = 'text';
		inp.placeholder = 'Search labs and folders…';
		inp.value = search.q;
		inp.setAttribute('aria-label', 'Search labs and folders');
		inp.style.cssText = 'width:210px;padding:5px 9px;';
		inp.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') runSearch(inp.value);
			else if (e.key === 'Escape' && search.active) exitSearch();
		});
		var go = btn('fa-search', '', 'btn', function () { runSearch(inp.value); });
		go.title = 'Search';
		wrap.appendChild(inp);
		wrap.appendChild(go);
		if (search.active) {
			var x = btn('fa-times', 'Exit search', 'btn btn-ghost', exitSearch);
			x.title = 'Back to folder view';
			wrap.appendChild(x);
		}
		return wrap;
	}

	function exitSearch() {
		search.active = false; search.q = ''; search.token++;
		load(state.path);                       // restore the browse view where we were
	}

	function runSearch(qRaw) {
		var q = String(qRaw == null ? '' : qRaw).trim();
		if (!q) { if (search.active) exitSearch(); return; }
		search.active = true; search.q = q;
		var token = ++search.token;
		renderSearchShell({ loading: true });
		// Root the walk at the user's effective workspace (admin's is '/');
		// fall back to '/' if the endpoint is unavailable.
		App.api('/users/api.php?action=myworkspace').then(function (r) {
			return (r.body && r.body.workspace) || '/';
		}).catch(function () { return '/'; }).then(function (root) {
			return searchWalk(root, q.toLowerCase(), token);
		}).then(function (res) {
			if (token !== search.token || !search.active) return;   // stale
			renderSearchShell(res);
		});
	}

	// Bounded breadth-first walk with a small in-flight pool. De-dupes by path.
	// Caps keep a huge workspace from hammering the API: hitting one marks the
	// result set truncated so the UI can say results may be incomplete.
	function searchWalk(root, ql, token) {
		var MAX_VISITED = 300, MAX_DEPTH = 12, POOL = 5;
		var visited = {}, seenF = {}, seenL = {};
		var out = { folders: [], labs: [], truncated: false };
		var queue = [{ path: root, depth: 0 }];
		visited[root] = true;
		var visitedCount = 0, inFlight = 0;
		return new Promise(function (resolve) {
			function pump() {
				if (token !== search.token) { resolve(out); return; }   // superseded
				while (inFlight < POOL && queue.length && visitedCount < MAX_VISITED) visit(queue.shift());
				if (queue.length && visitedCount >= MAX_VISITED) out.truncated = true;
				if (!inFlight && (!queue.length || out.truncated)) resolve(out);
			}
			function visit(cur) {
				visitedCount++; inFlight++;
				App.api('/api/folders?path=' + encodeURIComponent(cur.path)).then(function (res) {
					var okRes = res.status === 200 && res.body && res.body.status !== 'fail';
					var d = (okRes && res.body.data) || {};
					(d.folders || []).forEach(function (f) {
						if (f.name === '..') return;
						if (String(f.name).toLowerCase().indexOf(ql) >= 0 && !seenF[f.path]) { seenF[f.path] = true; out.folders.push(f); }
						if (!visited[f.path]) {
							visited[f.path] = true;
							if (cur.depth + 1 < MAX_DEPTH) queue.push({ path: f.path, depth: cur.depth + 1 });
							else out.truncated = true;
						}
					});
					(d.labs || []).forEach(function (l) {
						if (String(l.file).replace(/\.unl$/, '').toLowerCase().indexOf(ql) >= 0 && !seenL[l.path]) { seenL[l.path] = true; out.labs.push(l); }
					});
				}).catch(function () { /* unreadable subtree — skip it */ })
					.then(function () { inFlight--; pump(); });
			}
			pump();
		});
	}

	// Name with the matched substring emphasized (DOM-built, CSP-safe).
	function highlightName(name, q) {
		var span = el('span');
		var i = name.toLowerCase().indexOf(q.toLowerCase());
		if (i < 0) { span.textContent = name; return span; }
		if (i > 0) span.appendChild(document.createTextNode(name.slice(0, i)));
		var hit = el('strong', null, name.slice(i, i + q.length));
		hit.style.cssText = 'color:var(--pnq-accent);font-weight:700;';
		span.appendChild(hit);
		if (i + q.length < name.length) span.appendChild(document.createTextNode(name.slice(i + q.length)));
		return span;
	}

	// Result row: icon + emphasized name, full path as muted subtext. Folder
	// click navigates there (load() exits search); lab click opens it via the
	// SAME openLab() the normal list uses.
	function searchRow(item, isFolder) {
		var tr = el('tr', 'fm-search-row');
		var td = el('td');
		td.style.padding = '8px 12px';
		var name = el('span', 'fm-name');
		name.appendChild(el('i', 'fa ' + (isFolder ? (item.shared ? 'fa-share-alt' : 'fa-folder') : 'fa-flask')));
		name.appendChild(document.createTextNode(' '));
		name.appendChild(highlightName(isFolder ? item.name : item.file.replace(/\.unl$/, ''), search.q));
		if (isFolder) { name.title = 'Go to this folder'; App.clickable(name, function () { load(item.path); }); }
		else { name.title = 'Open in topology editor'; App.clickable(name, function () { openLab(item.path); }); }
		td.appendChild(name);
		var sub = el('div', 'muted', item.path);
		sub.style.cssText = 'font-size:11px;margin:2px 0 0 22px;';
		td.appendChild(sub);
		tr.appendChild(td);
		var td2 = el('td', 'fm-mtime', isFolder ? 'Folder' : (item.mtime || 'Lab'));
		td2.style.whiteSpace = 'nowrap';
		tr.appendChild(td2);
		return tr;
	}

	// Draw the search overlay (loading / results) in place of the folder list.
	// The header (breadcrumb + toolbar with the search control) stays, so the
	// user can refine the query or exit back to browsing.
	function renderSearchShell(res) {
		var view = document.getElementById('view');
		clearChildren(view);
		var head = el('div', 'view-head vh-ruled');
		head.appendChild(breadcrumb());
		head.appendChild(toolbar());
		view.appendChild(head);

		var card = el('div', 'card');
		if (res.loading) {
			var ld = el('div', 'empty');
			ld.appendChild(el('i', 'fa fa-spinner spin'));
			ld.appendChild(el('div', null, 'Searching…'));
			card.appendChild(ld);
			view.appendChild(card);
			return;
		}
		var folders = res.folders.slice().sort(function (a, b) { return cmpName(a.name, b.name); });
		var labs = res.labs.slice().sort(function (a, b) { return cmpName(a.file, b.file); });
		var n = folders.length + labs.length;
		if (!n) {
			var e = el('div', 'empty');
			e.appendChild(el('i', 'fa fa-search'));
			e.appendChild(el('div', null, 'No labs or folders match "' + search.q + '".'));
			card.appendChild(e);
			view.appendChild(card);
			if (res.truncated) view.appendChild(searchTruncatedNote());
			return;
		}
		card.style.padding = '0';
		var t = el('table', 'fm-table');
		var thead = el('thead');
		var hr = el('tr');
		var th = el('th', null, n + ' result' + (n === 1 ? '' : 's') + ' for "' + search.q + '"');
		th.colSpan = 2;
		hr.appendChild(th);
		thead.appendChild(hr);
		t.appendChild(thead);
		var tb = el('tbody');
		folders.forEach(function (f) { tb.appendChild(searchRow(f, true)); });
		labs.forEach(function (l) { tb.appendChild(searchRow(l, false)); });
		t.appendChild(tb);
		card.appendChild(t);
		view.appendChild(card);
		if (res.truncated) view.appendChild(searchTruncatedNote());
	}

	function searchTruncatedNote() {
		var note = el('div', 'alert alert-warning');
		note.style.cssText = 'margin-top:8px;font-size:12px;';
		note.textContent = 'Search stopped before checking the whole workspace. Results may be incomplete; a missing lab may be in an unsearched folder.';
		return note;
	}

	function viewToggle() {
		var wrap = el('div', 'view-toggle');
		[['list', 'fa-list', 'List view'], ['grid', 'fa-th-large', 'Card view']].forEach(function (p) {
			var b = el('button'); b.type = 'button'; b.title = p[2];
			if (state.view === p[0]) b.className = 'active';
			b.appendChild(el('i', 'fa ' + p[1]));
			b.addEventListener('click', function () {
				if (state.view === p[0]) return;
				state.view = p[0]; localStorage.setItem('pnq-labs-view', p[0]); load(state.path);
			});
			wrap.appendChild(b);
		});
		return wrap;
	}

	function emptyState() {
		var e = el('div', 'empty');
		e.appendChild(el('i', 'fa fa-folder-open-o'));
		e.appendChild(el('div', null, 'This folder is empty.'));
		var a = el('div', 'muted'); a.style.marginTop = '8px'; a.textContent = 'Create a lab or folder, or import one.';
		e.appendChild(a);
		return e;
	}

	/* ---- table ------------------------------------------------------------- */
	// Sortable column header: click to sort by `key`, click again to flip. Shows a
	// caret on the active column. Drives both list + grid (render() sorts before
	// dispatch), so a header click reorders whichever view is showing.
	function sortTh(label, key) {
		var th = el('th', 'fm-sortth');
		var wrap = el('span', 'fm-sort');
		wrap.style.userSelect = 'none';
		wrap.appendChild(document.createTextNode(label));
		if (state.sort.key === key) {
			var car = el('span', 'fm-sort-caret');
			car.textContent = state.sort.dir === 1 ? ' ▲' : ' ▼';
			wrap.appendChild(car);
		}
		th.appendChild(wrap);
		th.title = 'Sort by ' + label.toLowerCase();
		App.clickable(th, function () { toggleSort(key); });
		return th;
	}
	function buildTable(folders, labs) {
		var t = el('table', 'fm-table');
		var thead = el('thead');
		var hr = el('tr');
		hr.appendChild(el('th', 'fm-check'));
		hr.appendChild(sortTh('Name', 'name'));
		hr.appendChild(sortTh('Modified', 'mtime'));
		hr.appendChild(el('th'));
		thead.appendChild(hr);
		t.appendChild(thead);
		var tb = el('tbody');

		folders.forEach(function (f) {
			if (f.name === '..') tb.appendChild(parentRow(f));
			else tb.appendChild(folderRow(f));
		});
		labs.forEach(function (l) { tb.appendChild(labRow(l)); });
		t.appendChild(tb);
		return t;
	}

	function parentRow(f) {
		var tr = el('tr', 'fm-row');
		tr.appendChild(el('td', 'fm-check'));
		var td = el('td');
		var name = el('span', 'fm-name');
		name.appendChild(el('i', 'fa fa-level-up'));
		name.appendChild(document.createTextNode(' ..'));
		App.clickable(name, function () { load(f.path); });
		td.appendChild(name);
		tr.appendChild(td);
		tr.appendChild(el('td'));
		tr.appendChild(el('td'));
		return tr;
	}

	function folderRow(f) {
		var id = 'Fo_' + f.name;
		var tr = el('tr', 'fm-row');
		tr.appendChild(checkCell(id, { kind: 'folder', path: f.path, name: f.name }));
		var td = el('td');
		var name = el('span', 'fm-name');
		name.appendChild(el('i', 'fa ' + (f.shared ? 'fa-share-alt' : 'fa-folder')));
		name.appendChild(document.createTextNode(' ' + f.name));
		App.clickable(name, function () { load(f.path); });
		td.appendChild(name);
		tr.appendChild(td);
		tr.appendChild(el('td'));
		tr.appendChild(actionCell([
			act('fa-pencil', 'Rename', function () { renameFolder(f); }),
			act('fa-arrows', 'Move', function () { moveItems([{ kind: 'folder', path: f.path, name: f.name }]); }),
			act('fa-trash-o', 'Delete', function () { delFolder(f); }, 'danger')
		]));
		return tr;
	}

	function labRow(l) {
		var id = 'Fi_' + l.file;
		var tr = el('tr', 'fm-row' + (preview.path === l.path ? ' is-selected' : ''));
		tr.dataset.labpath = l.path;
		tr.tabIndex = 0;
		tr.setAttribute('aria-selected', preview.path === l.path ? 'true' : 'false');
		tr._pnqLab = l;
		tr.appendChild(checkCell(id, { kind: 'lab', path: l.path, name: l.file }));
		var td = el('td');
		var name = el('span', 'fm-name');
		name.appendChild(el('i', 'fa fa-flask'));
		name.appendChild(document.createTextNode(' ' + l.file.replace(/\.unl$/, '')));
		name.title = 'Select lab';
		td.appendChild(name);
		td.appendChild(el('span', 'js-runhost'));   // running badge slot (filled by markRunning)
		tr.appendChild(td);
		tr.appendChild(el('td', 'fm-mtime', l.mtime || ''));
		tr.appendChild(actionCell([
			act('fa-external-link', 'Open', function () { openLab(l.path); }, 'accent'),
			act('fa-cog', 'Edit lab & permissions', function () { editLab(l); }),
			act('fa-clone', 'Clone', function () { cloneLab(l); }),
			act('fa-pencil', 'Rename', function () { renameLab(l); }),
			act('fa-arrows', 'Move', function () { moveItems([{ kind: 'lab', path: l.path, name: l.file }]); }),
			act('fa-download', 'Export', function () { exportItems([{ path: l.path }]); }),
			act('fa-trash-o', 'Delete', function () { delLab(l); }, 'danger')
		]));
		tr.addEventListener('click', function (e) {
			if (isInteractiveRowTarget(e.target, tr)) return;
			selectLab(l);
		});
		tr.addEventListener('keydown', function (e) {
			if (isInteractiveRowTarget(e.target, tr)) return;
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				e.preventDefault(); e.stopPropagation(); moveLabFocus(tr, e.key === 'ArrowDown' ? 1 : -1);
			} else if (e.key === 'Enter') {
				e.preventDefault(); e.stopPropagation();
				if (preview.path !== l.path) selectLab(l);
				openLab(l.path);
			}
		});
		return tr;
	}

	function isInteractiveRowTarget(target, row) {
		var n = target;
		while (n && n !== row) {
			var tag = String(n.tagName || '').toLowerCase();
			if (tag === 'input' || tag === 'button' || tag === 'a' || tag === 'select' || tag === 'textarea' || tag === 'label') return true;
			n = n.parentNode;
		}
		return false;
	}

	function checkCell(id, meta) {
		var td = el('td', 'fm-check');
		var cb = el('input'); cb.type = 'checkbox';
		cb.checked = !!state.sel[id];
		cb.addEventListener('change', function () {
			if (cb.checked) state.sel[id] = meta; else delete state.sel[id];
			refreshBulk();
		});
		td.appendChild(cb);
		return td;
	}
	function actionCell(buttons) {
		var td = el('td', 'fm-actions');
		buttons.forEach(function (b) { td.appendChild(b); });
		return td;
	}

	/* ---- row selection + preview pane -------------------------------------- */
	function resetPreviewSelection() {
		if (preview.debounce) { clearTimeout(preview.debounce); preview.debounce = null; }
		preview.selectionToken++;
		preview.path = null;
		preview.lab = null;
		preview.data = null;
		preview.svg = null;
		preview.status = 'none';
		preview.zoom = 'auto';
		preview.dom = null;
	}

	function previewIsCurrent(token, path) {
		return preview.selectionToken === token && preview.path === path;
	}

	function selectLab(l) {
		if (state.view !== 'list' || !l || !l.path) return;
		var path = String(l.path);
		if (preview.path === path) {
			updateRowSelection();
			return;
		}
		if (preview.debounce) { clearTimeout(preview.debounce); preview.debounce = null; }
		preview.selectionToken++;
		var token = preview.selectionToken;
		preview.path = path;
		preview.lab = l;
		preview.data = null;
		preview.svg = null;
		preview.status = 'loading';
		preview.zoom = 'auto';
		updateRowSelection();
		renderPreviewPane();
		preview.debounce = setTimeout(function () {
			preview.debounce = null;
			if (!previewIsCurrent(token, path)) return;
			getPreview(path).then(function (data) {
				if (!previewIsCurrent(token, path)) return;
				preview.data = data;
				preview.svg = data === 'fail' ? null : buildTopoSvg(data);
				preview.status = data === 'fail' ? 'error' : (preview.svg ? 'ready' : 'empty');
				renderPreviewPane();
			});
		}, 90);
	}

	function updateRowSelection() {
		document.querySelectorAll('.fm-split__list tr.fm-row[data-labpath]').forEach(function (row) {
			var selected = row.getAttribute('data-labpath') === preview.path;
			row.classList.toggle('is-selected', selected);
			row.setAttribute('aria-selected', selected ? 'true' : 'false');
		});
	}

	function labRows(listPane) {
		return Array.prototype.slice.call(listPane.querySelectorAll('tr.fm-row[data-labpath]'));
	}

	function labForPath(path) {
		var labs = state.data && state.data.labs || [];
		for (var i = 0; i < labs.length; i++) if (labs[i].path === path) return labs[i];
		return null;
	}

	function moveLabFocus(row, delta) {
		var listPane = row.parentNode && row.parentNode.parentNode;
		while (listPane && !listPane.classList.contains('fm-split__list')) listPane = listPane.parentNode;
		if (!listPane) return;
		var rows = labRows(listPane);
		if (!rows.length) return;
		var idx = rows.indexOf(row);
		if (idx < 0) idx = rows.findIndex(function (r) { return r.getAttribute('data-labpath') === preview.path; });
		if (idx < 0) idx = delta > 0 ? -1 : rows.length;
		var next = rows[Math.max(0, Math.min(rows.length - 1, idx + delta))];
		if (!next) return;
		var l = next._pnqLab || labForPath(next.getAttribute('data-labpath'));
		if (l) { next.focus(); selectLab(l); }
	}

	function handleListKey(e, listPane) {
		if (e.target !== listPane) return;
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			var rows = labRows(listPane);
			if (!rows.length) return;
			var idx = rows.findIndex(function (r) { return r.getAttribute('data-labpath') === preview.path; });
			var delta = e.key === 'ArrowDown' ? 1 : -1;
			if (idx < 0) idx = delta > 0 ? -1 : rows.length;
			var next = rows[Math.max(0, Math.min(rows.length - 1, idx + delta))];
			var l = next && (next._pnqLab || labForPath(next.getAttribute('data-labpath')));
			if (next && l) { next.focus(); selectLab(l); }
		} else if (e.key === 'Enter' && preview.path) {
			e.preventDefault(); openLab(preview.path);
		}
	}

	function clearChildren(node) {
		while (node && node.firstChild) node.removeChild(node.firstChild);
	}

	function previewButton(cls, label, handler) {
		var b = el('button', 'lab-preview__btn ' + cls);
		b.type = 'button'; b.textContent = label;
		b.addEventListener('click', function () {
			if (!b.disabled) handler();
		});
		return b;
	}

	function buildPreviewPane() {
		var aside = el('aside', 'fm-split__preview');
		var root = el('div', 'lab-preview');
		var stage = el('div', 'lab-preview__stage');
		var zoom = el('div', 'lab-preview__zoom');
		[['3', 'x3'], ['2', 'x2'], ['1', 'x1']].forEach(function (z) {
			var b = el('button', 'lab-preview__zoom-stop');
			b.type = 'button'; b.dataset.zoom = z[0]; b.textContent = z[1];
			b.addEventListener('click', function () { setPreviewZoom(z[0]); });
			zoom.appendChild(b);
		});
		var auto = el('button', 'lab-preview__zoom-auto');
		auto.type = 'button'; auto.dataset.zoom = 'auto'; auto.textContent = 'Auto';
		auto.addEventListener('click', function () { setPreviewZoom('auto'); });
		zoom.appendChild(auto);
		var info = el('div', 'lab-preview__info');
		[['path', 'Lab Path'], ['version', 'Version'], ['uuid', 'UUID'], ['author', 'Author']].forEach(function (f) {
			var row = el('div', 'lab-preview__row'); row.dataset.field = f[0];
			row.appendChild(el('b', null, f[1] + ':'));
			row.appendChild(document.createTextNode(' '));
			row.appendChild(el('span'));
			info.appendChild(row);
		});
		var actions = el('div', 'lab-preview__actions');
		actions.appendChild(previewButton('lab-preview__btn--open', 'OPEN', function () { if (preview.path) openLab(preview.path); }));
		actions.appendChild(previewButton('lab-preview__btn--edit', 'EDIT', function () { if (preview.lab) editLab(preview.lab); }));
		actions.appendChild(previewButton('lab-preview__btn--delete', 'DELETE', function () { if (preview.lab) delLab(preview.lab); }));
		root.appendChild(stage); root.appendChild(zoom); root.appendChild(info); root.appendChild(actions);
		aside.appendChild(root);
		preview.dom = { root: root, stage: stage, zoom: zoom, info: info, actions: actions };
		renderPreviewPane();
		return aside;
	}

	function previewValue(value) {
		return value == null || String(value).trim() === '' ? '—' : String(value);
	}

	function renderPreviewPane() {
		if (!preview.dom) return;
		var dom = preview.dom;
		dom.root.className = 'lab-preview lab-preview--' + preview.status;
		clearChildren(dom.stage);
		if (preview.status === 'none') dom.stage.appendChild(el('span', null, 'Select a lab to preview it.'));
		else if (preview.svg) { dom.stage.appendChild(preview.svg); applyPreviewZoom(); }

		var labinfo = preview.data && preview.data !== 'fail' && preview.data.labinfo || {};
		var values = { path: preview.path, version: labinfo.version, uuid: labinfo.id, author: labinfo.author };
		dom.info.querySelectorAll('.lab-preview__row').forEach(function (row) {
			var value = row.querySelector('span');
			if (value) value.textContent = previewValue(values[row.dataset.field]);
		});
		var enabled = preview.status === 'ready' || preview.status === 'empty' || preview.status === 'error';
		dom.actions.querySelectorAll('button').forEach(function (b) { b.disabled = !enabled; });
		dom.zoom.querySelectorAll('button').forEach(function (b) {
			b.disabled = !enabled;
			b.classList.toggle('is-active', enabled && b.dataset.zoom === preview.zoom);
		});
	}

	function setPreviewZoom(value) {
		if (value !== 'auto' && value !== '1' && value !== '2' && value !== '3') value = 'auto';
		if (preview.status !== 'ready') return;
		preview.zoom = value;
		renderPreviewPane();
	}


	/* ---- bulk bar ---------------------------------------------------------- */
	function bulkHost() { var d = el('div'); d.id = 'fm-bulk'; fill(d); return d; }
	function refreshBulk() { var d = document.getElementById('fm-bulk'); if (d) { clearChildren(d); fill(d); } }
	function fill(d) {
		var keys = Object.keys(state.sel);
		if (!keys.length) return;
		var bar = el('div', 'bulkbar');
		bar.appendChild(el('span', 'count', keys.length + ' selected'));
		bar.appendChild((function () { var s = el('span', 'spacer'); return s; })());
		bar.appendChild(btn('fa-arrows', 'Move', 'btn btn-sm', function () { moveItems(selList()); }));
		bar.appendChild(btn('fa-download', 'Export', 'btn btn-sm', function () { exportItems(selList().map(function (m) { return { path: m.path }; })); }));
		bar.appendChild(btn('fa-trash-o', 'Delete', 'btn btn-sm btn-danger', delSelected));
		bar.appendChild(btn('fa-times', 'Clear', 'btn btn-sm btn-ghost', function () { state.sel = {}; load(state.path); }));
		d.appendChild(bar);
	}
	function selList() { return Object.keys(state.sel).map(function (k) { return state.sel[k]; }); }

	/* ---- actions ----------------------------------------------------------- */
	function openLab(path) {
		App.loading(true);
		post('/api/labs/session/factory/create', { path: path }).then(function (res) {
			App.loading(false);
			if (ok(res)) window.location.href = '/legacy/topology';
			else App.toast(App.errMsg(res.body) || 'Could not open the lab.', 'error');
		}).catch(function () { App.loading(false); });
	}

	function newFolder() {
		App.prompt({ title: 'New folder', okLabel: 'Create', fields: [{ name: 'name', label: 'Folder name', required: true, value: 'New Folder' }] })
			.then(function (v) {
				if (!v) return;
				App.loading(true);
				post('/api/folders/add', { path: parentDir(), name: v.name.trim() }).then(function (res) { App.loading(false); after(res, 'Folder created'); });
			});
	}

	function newLab() {
		App.prompt({
			title: 'New lab', okLabel: 'Create', fields: [
				{ name: 'name', label: 'Lab name', required: true, placeholder: 'My lab' },
				{ name: 'version', label: 'Version', value: '1' }
			]
		}).then(function (v) {
			if (!v) return;
			App.loading(true);
			post('/api/labs', { path: parentDir(), name: v.name.trim(), version: v.version || '1' }).then(function (res) { App.loading(false); after(res, 'Lab created'); });
		});
	}

	function cloneLab(l) {
		App.loading(true);
		var newName = l.file.replace(/\.unl$/, '') + '_' + Date.now();
		post('/api/labs', { source: l.path, name: newName }).then(function (res) { App.loading(false); after(res, 'Lab cloned'); });
	}

	function renameFolder(f) {
		App.prompt({ title: 'Rename folder', okLabel: 'Rename', fields: [{ name: 'name', label: 'New name', required: true, value: f.name }] })
			.then(function (v) {
				if (!v || v.name === f.name) return;
				var newPath = childPath(v.name.trim());
				App.loading(true);
				post('/api/folders/edit', { path: f.path, new_path: newPath }).then(function (res) {
					App.loading(false);
					if (ok(res)) { invalidatePreviewTree(f.path); invalidatePreviewTree(newPath); after(res, 'Renamed'); }
					else App.toast(App.errMsg(res.body), 'error');
				});
			});
	}

	function renameLab(l) {
		var cur = l.file.replace(/\.unl$/, '');
		App.prompt({ title: 'Rename lab', okLabel: 'Rename', fields: [{ name: 'name', label: 'New name', required: true, value: cur }] })
			.then(function (v) {
				if (!v || v.name === cur) return;
				var newPath = labPathForName(l.path, v.name);
				App.loading(true);
				post('/api/labs/edit', { path: l.path, data: { name: v.name.trim() } }).then(function (res) {
					App.loading(false);
					if (ok(res)) { invalidatePreview(l.path); invalidatePreview(newPath); after(res, 'Renamed'); }
					else App.toast(App.errMsg(res.body), 'error');
				});
			});
	}

	/* ---- edit lab metadata + permissions ---------------------------------- */
	// Cache of {value,label} user entries for the "specific users" pickers, so the
	// modal only hits /users/api.php once per session (admin-only source).
	var usersCache = null;
	function fetchUsers() {
		if (usersCache) return Promise.resolve(usersCache);
		if (!App.isAdmin) { usersCache = []; return Promise.resolve(usersCache); }
		return App.api('/users/api.php?action=users').then(function (res) {
			var list = (res.body && res.body.data) || [];
			usersCache = list.map(function (u) {
				var val = (u.email && u.email !== '') ? u.email : String(u.pod);
				return { value: val, label: u.username + (u.email ? ' (' + u.email + ')' : ' (pod ' + u.pod + ')') };
			});
			return usersCache;
		}).catch(function () { usersCache = []; return usersCache; });
	}

	// One permission group: radio triple (Admin only / Everyone / Specific users)
	// + a users picker (checkbox list when admin) + a free-text extras input,
	// both shown only when "Specific users" is selected. Returns an accessor
	// object with .flag() -> 0|1|2 and .emails() -> [entries].
	function permGroup(title, flag, emails, users) {
		var wrap = el('div', 'field');
		wrap.appendChild(el('label', null, title));
		var group = 'perm_' + Math.random().toString(36).slice(2);
		var cur = String(flag == null ? 0 : flag);
		if (cur !== '0' && cur !== '1' && cur !== '2') cur = '0';
		var radios = {};
		var radioRow = el('div', 'perm-grid');
		[['0', 'Admin only'], ['1', 'Everyone'], ['2', 'Specific users']].forEach(function (o) {
			var lab = el('label', 'perm-item');
			var r = el('input'); r.type = 'radio'; r.name = group; r.value = o[0]; r.checked = (cur === o[0]);
			radios[o[0]] = r;
			lab.appendChild(r); lab.appendChild(el('span', null, o[1]));
			radioRow.appendChild(lab);
		});
		wrap.appendChild(radioRow);

		var picker = el('div', 'checklist'); picker.style.marginTop = '8px';
		var boxes = [];
		var preset = (emails || []).filter(function (e) { return String(e).trim() !== ''; });
		var known = {};
		(users || []).forEach(function (u) {
			var row = el('label', 'checklist-item');
			var cb = el('input'); cb.type = 'checkbox'; cb.value = u.value;
			cb.checked = preset.indexOf(u.value) >= 0; boxes.push(cb); known[u.value] = true;
			row.appendChild(cb);
			row.appendChild(el('span', 'ci-name', u.label));
			picker.appendChild(row);
		});
		// Free-text extras: any preset entry not covered by a checkbox, plus room
		// for pod numbers / emails of users the admin can't see (or non-admin use).
		var extras = preset.filter(function (e) { return !known[e]; });
		var extraI = el('input', 'input'); extraI.type = 'text';
		extraI.placeholder = 'extra emails or pod numbers, comma-separated';
		extraI.value = extras.join(', ');
		var extraField = el('div', 'field'); extraField.style.marginTop = '6px';
		extraField.appendChild(extraI);
		picker.appendChild(extraField);
		wrap.appendChild(picker);

		function sync() { picker.style.display = radios['2'].checked ? '' : 'none'; }
		Object.keys(radios).forEach(function (k) { radios[k].addEventListener('change', sync); });
		sync();

		return {
			node: wrap,
			flag: function () { return radios['1'].checked ? 1 : (radios['2'].checked ? 2 : 0); },
			emails: function () {
				var out = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
				extraI.value.split(',').forEach(function (s) { s = s.trim(); if (s && out.indexOf(s) < 0) out.push(s); });
				return out;
			}
		};
	}

	function editLab(l) {
		App.loading(true);
		Promise.all([
			post('/api/labs/get', { path: l.path }),
			fetchUsers()
		]).then(function (arr) {
			App.loading(false);
			var res = arr[0], users = arr[1];
			if (!ok(res) || !res.body || !res.body.data) { App.toast(App.errMsg(res.body) || 'Could not load the lab.', 'error'); return; }
			var d = res.body.data;
			var form = el('div');

			var nameI = el('input', 'input'); nameI.value = (d.name != null ? d.name : l.file.replace(/\.unl$/, ''));
			form.appendChild(fieldRow('Name', nameI));
			var verI = el('input', 'input'); verI.value = (d.version != null ? d.version : '1');
			var authI = el('input', 'input'); authI.value = d.author || '';
			var grid1 = el('div', 'form-grid');
			grid1.appendChild(fieldRow('Version', verI));
			grid1.appendChild(fieldRow('Author', authI));
			form.appendChild(grid1);
			var descI = el('textarea', 'input'); descI.rows = 3; descI.value = d.description || '';
			form.appendChild(fieldRow('Description', descI));
			var stI = el('input', 'input'); stI.type = 'number'; stI.min = '0'; stI.value = (d.scripttimeout != null ? d.scripttimeout : 300);
			var cdI = el('input', 'input'); cdI.type = 'number'; cdI.min = '0'; cdI.value = (d.countdown != null ? d.countdown : 0);
			var grid2 = el('div', 'form-grid');
			grid2.appendChild(fieldRow('Config script timeout (s)', stI));
			grid2.appendChild(fieldRow('Countdown timer (s)', cdI));
			form.appendChild(grid2);

			form.appendChild(el('div', 'muted', 'Access control')).style.margin = '10px 0 2px';
			var gOpen = permGroup('Who can open this lab', d.openable, d.openable_emails, users);
			var gJoin = permGroup('Who can join this lab', d.joinable, d.joinable_emails, users);
			var gEdit = permGroup('Who can edit this lab', d.editable, d.editable_emails, users);
			form.appendChild(gOpen.node);
			form.appendChild(gJoin.node);
			form.appendChild(gEdit.node);

			var origName = (d.name != null ? d.name : l.file.replace(/\.unl$/, ''));
			var dlg = App.modal({
				title: 'Edit lab & permissions', wide: true, body: form, dismissable: true, buttons: [
					{ label: 'Cancel', kind: 'ghost', onClick: function (c) { c(); } },
					{ label: 'Save', kind: 'primary', onClick: function () { submit(); } }
				]
			});

			function submit() {
				var data = {
					version: verI.value, author: authI.value, description: descI.value,
					scripttimeout: stI.value, countdown: cdI.value,
					openable: gOpen.flag(), joinable: gJoin.flag(), editable: gEdit.flag(),
					openable_emails: gOpen.emails(), joinable_emails: gJoin.emails(), editable_emails: gEdit.emails()
				};
				var newName = nameI.value.trim();
				if (newName && newName !== origName) data.name = newName;   // rename moves the file
				var newPath = data.name ? labPathForName(l.path, data.name) : l.path;
				App.loading(true);
				post('/api/labs/edit', { path: l.path, data: data }).then(function (r) {
					App.loading(false);
					if (ok(r)) { invalidatePreview(l.path); invalidatePreview(newPath); dlg.close(); App.toast('Lab updated', 'ok'); load(state.path); }
					else App.toast(App.errMsg(r.body) || 'Could not save the lab.', 'error');
				});
			}
		}).catch(function () { App.loading(false); App.toast('Could not load the lab.', 'error'); });
	}

	// small labelled-field builder (mirrors the prompt/users field() helper)
	function fieldRow(label, inp) { var f = el('div', 'field'); if (label) f.appendChild(el('label', null, label)); f.appendChild(inp); return f; }

	/* ---- destructive-confirm blast radius ---------------------------------- */
	// Breadth-first inventory of a folder subtree (labs + subfolders) via the
	// same GET /api/folders the view lists with, so the delete confirm can say
	// how much it actually removes. Caps mirror walkFolders so a huge tree
	// can't stall the dialog; `truncated` marks a hit cap so the copy can say
	// "at least". Rejects on the FIRST listing failure — the caller falls back
	// to the old generic wording, because a wrong or partial count is worse
	// than none, and the safety copy must never block the delete itself.
	function folderInventory(rootPath) {
		var MAX_DEPTH = 4, MAX_ITEMS = 200;
		var inv = { labs: [], folders: 0, truncated: false };
		var queue = [{ path: rootPath, depth: 0 }];
		function step() {
			if (!queue.length) return Promise.resolve(inv);
			if (inv.labs.length + inv.folders >= MAX_ITEMS) { inv.truncated = true; return Promise.resolve(inv); }
			var cur = queue.shift();
			return App.api('/api/folders?path=' + encodeURIComponent(cur.path)).then(function (res) {
				if (res.status !== 200 || !res.body || res.body.status === 'fail') throw new Error('inventory');
				var d = (res.body.data) || {};
				(d.labs || []).forEach(function (l) { inv.labs.push({ name: l.file.replace(/\.unl$/, ''), path: l.path }); });
				(d.folders || []).filter(function (sub) { return sub.name !== '..'; }).forEach(function (sub) {
					inv.folders++;
					if (cur.depth + 1 < MAX_DEPTH) queue.push({ path: sub.path, depth: cur.depth + 1 });
					else inv.truncated = true;   // unvisited subtree: counts below are a floor
				});
				return step();
			});
		}
		return step();
	}

	// Paths of labs with an open session and nodes running (same endpoint +
	// same "running" definition markRunning uses). Resolves [] on any failure
	// and for non-admins (the endpoint returns their pod's rows only) — the
	// confirm still shows without blocking the folder operation.
	function runningPaths() {
		return App.api('/status/api.php?action=sessions').then(function (res) {
			if (res.status !== 200) return [];
			return ((res.body && res.body.data) || [])
				.filter(function (r) { return (r.nodes_running || 0) > 0; })
				.map(function (r) { return r.path; });
		}).catch(function () { return []; });
	}

	// Confirm body for a recursive delete: lead line, bold counts, a sample of
	// lab names, and an explicit running-lab warning (the genuinely dangerous
	// case — those labs have live nodes right now).
	function blastBody(lead, inv, runningNames) {
		var body = el('div');
		body.appendChild(el('p', null, lead)).style.margin = '0 0 8px';
		var p = el('p'); p.style.margin = '0 0 8px';
		if (inv.labs.length + inv.folders === 0) {
			p.textContent = 'It is empty — nothing else is removed.';
		} else {
			var parts = [inv.labs.length + ' lab' + (inv.labs.length === 1 ? '' : 's')];
			if (inv.folders) parts.push(inv.folders + ' subfolder' + (inv.folders === 1 ? '' : 's'));
			var strong = el('strong', null, (inv.truncated ? 'at least ' : '') + parts.join(' and '));
			p.appendChild(strong);
			p.appendChild(document.createTextNode(' will be permanently deleted.'));
		}
		body.appendChild(p);
		var sample = inv.labs.slice(0, 5);
		if (sample.length) {
			var ul = el('ul'); ul.style.cssText = 'margin:0 0 8px;padding-left:20px;';
			sample.forEach(function (l) { ul.appendChild(el('li', null, l.name)); });
			body.appendChild(ul);
			var more = inv.labs.length - sample.length;
			if (more > 0 || inv.truncated) {
				body.appendChild(el('p', 'muted', '…and ' + (more > 0 ? more : '') + (inv.truncated ? '+' : '') + ' more.')).style.margin = '0 0 8px';
			}
		}
		if (runningNames.length) {
			var warn = el('p'); warn.style.cssText = 'margin:0;color:var(--pnq-danger);font-weight:600;';
			warn.textContent = runningNames.length === 1
				? '"' + runningNames[0] + '" is OPEN with nodes running.'
				: runningNames.length + ' of these labs are OPEN with nodes running.';
			body.appendChild(warn);
		}
		return body;
	}

	function delFolder(f) {
		// Resolve the real blast radius first — the old copy said "everything
		// inside it" without saying how much that is. Escalate to a typed
		// confirmation (same DESTROY-style gate the Running view uses) when the
		// subtree is big or contains a running lab.
		App.loading(true);
		Promise.all([folderInventory(f.path), runningPaths()]).then(function (arr) {
			App.loading(false);
			var inv = arr[0], live = arr[1];
			var running = inv.labs.filter(function (l) { return live.indexOf(l.path) >= 0; }).map(function (l) { return l.name; });
			var opts = { danger: true, okLabel: 'Delete', title: 'Delete folder' };
			if (inv.labs.length + inv.folders > 5 || inv.truncated || running.length) opts.requireType = 'DELETE';
			return App.confirm(blastBody('Delete folder "' + f.name + '"?', inv, running), opts);
		}).catch(function () {
			// Inventory failed — never let the safety copy block the action.
			App.loading(false);
			return App.confirm('Delete folder "' + f.name + '" and everything inside it?', { danger: true, okLabel: 'Delete' });
		}).then(function (yes) {
			if (!yes) return;
			App.loading(true);
			post('/api/folders/delete', { path: f.path }).then(function (res) {
				App.loading(false);
				if (ok(res)) { invalidatePreviewTree(f.path); after(res, 'Folder deleted'); }
				else App.toast(App.errMsg(res.body), 'error');
			});
		});
	}

	function delLab(l) {
		App.confirm('Delete lab "' + l.file.replace(/\.unl$/, '') + '"?', { danger: true, okLabel: 'Delete' })
			.then(function (yes) {
				if (!yes) return;
				App.loading(true);
				del('/api/labs', { path: l.path }).then(function (res) {
					App.loading(false);
					if (ok(res)) { invalidatePreview(l.path); after(res, 'Lab deleted'); }
					else App.toast(App.errMsg(res.body), 'error');
				});
			});
	}

	function delSelected() {
		var items = selList();
		if (!items.length) return;
		var labItems = items.filter(function (m) { return m.kind === 'lab'; });
		var folderItems = items.filter(function (m) { return m.kind === 'folder'; });
		// Resolve what the selection actually contains before asking: folders
		// delete recursively, so "3 selected" can mean 3 empty folders or a
		// hundred labs. Same fallback rule as delFolder on any listing failure.
		App.loading(true);
		Promise.all([
			Promise.all(folderItems.map(function (m) { return folderInventory(m.path); })),
			runningPaths()
		]).then(function (arr) {
			App.loading(false);
			var merged = {
				labs: labItems.map(function (m) { return { name: m.name.replace(/\.unl$/, ''), path: m.path }; }),
				folders: folderItems.length,
				truncated: false
			};
			arr[0].forEach(function (inv) {
				merged.labs = merged.labs.concat(inv.labs);
				merged.folders += inv.folders;
				if (inv.truncated) merged.truncated = true;
			});
			var running = merged.labs.filter(function (l) { return arr[1].indexOf(l.path) >= 0; }).map(function (l) { return l.name; });
			var lead = 'Delete ' + items.length + ' selected item' + (items.length === 1 ? '' : 's') + '?';
			var opts = { danger: true, okLabel: 'Delete', title: 'Delete selected' };
			if (merged.labs.length + merged.folders > 5 || merged.truncated || running.length) opts.requireType = 'DELETE';
			return App.confirm(blastBody(lead, merged, running), opts);
		}).catch(function () {
			App.loading(false);
			return App.confirm('Delete ' + items.length + ' selected item(s)?', { danger: true, okLabel: 'Delete' });
		}).then(function (yes) {
			if (!yes) return;
			App.loading(true);
			var ops = items.map(function (m) {
				var name = m.kind === 'lab' ? m.name.replace(/\.unl$/, '') : m.name + ' (folder)';
				return (m.kind === 'lab' ? del('/api/labs', { path: m.path }) : post('/api/folders/delete', { path: m.path }))
					.then(function (r) { return { name: name, path: m.path, kind: m.kind, ok: ok(r), error: ok(r) ? null : App.errMsg(r.body) }; },
						function () { return { name: name, path: m.path, kind: m.kind, ok: false, error: 'request failed' }; });
			});
			Promise.all(ops).then(function (results) {
				App.loading(false);
				var bad = results.filter(function (r) { return !r.ok; });
				// All-good keeps the toast; any failure gets the persistent
				// per-item report (a 3.6s toast destroyed the evidence).
				if (bad.length) App.batchReport(bad.length + ' of ' + results.length + ' item' + (results.length === 1 ? '' : 's') + ' could not be deleted', results);
				else App.toast('Deleted', 'ok');
				results.forEach(function (r) { if (r.ok) { if (r.kind === 'lab') invalidatePreview(r.path); else invalidatePreviewTree(r.path); } });
				load(state.path);
			});
		});
	}

	// Breadth-first walk of the folder tree via GET /api/folders, so the Move
	// dialog can offer a real dropdown instead of a free-text path. Depth-capped
	// and count-capped so a huge workspace can't stall the modal. Resolves to a
	// list of {path,depth} (always includes '/'); rejects on the FIRST listing
	// failure so the caller can fall back to the free-text prompt.
	function walkFolders(startPath) {
		var MAX_DEPTH = 4, MAX_FOLDERS = 200;
		var out = [{ path: '/', depth: 0 }];
		var seen = { '/': true };
		var queue = [{ path: startPath || '/', depth: 0 }];
		if (startPath && startPath !== '/' && !seen[startPath]) { out.push({ path: startPath, depth: 0 }); seen[startPath] = true; }
		function step() {
			if (!queue.length || out.length >= MAX_FOLDERS) return Promise.resolve(out);
			var cur = queue.shift();
			return App.api('/api/folders?path=' + encodeURIComponent(cur.path)).then(function (res) {
				if (res.status !== 200 || !res.body || res.body.status === 'fail') throw new Error('walk');
				var folders = ((res.body.data && res.body.data.folders) || []).filter(function (f) { return f.name !== '..'; });
				folders.forEach(function (f) {
					if (seen[f.path] || out.length >= MAX_FOLDERS) return;
					seen[f.path] = true;
					out.push({ path: f.path, depth: cur.depth + 1 });
					if (cur.depth + 1 < MAX_DEPTH) queue.push({ path: f.path, depth: cur.depth + 1 });
				});
				return step();
			});
		}
		return step();
	}

	function performMove(items, dest) {
		dest = String(dest).trim().replace(/\/+$/, '');
		if (dest === '') dest = '/';
		App.loading(true);
		var ops = items.map(function (m) {
			if (m.kind === 'lab') return post('/api/labs/move', { path: m.path, new_path: dest });
			var destChild = (dest === '/' ? '/' : dest + '/') + m.name;
			return post('/api/folders/edit', { path: m.path, new_path: destChild });
		});
		Promise.all(ops).then(function (results) {
			App.loading(false);
			var bad = results.filter(function (r) { return !ok(r); });
			results.forEach(function (r, i) {
				if (!ok(r)) return;
				var item = items[i];
				if (item.kind === 'lab') {
					invalidatePreview(item.path);
					invalidatePreview(labPathInFolder(item.path, dest));
				} else {
					var movedFolder = (dest === '/' ? '/' : dest + '/') + item.name;
					invalidatePreviewTree(item.path);
					invalidatePreviewTree(movedFolder);
				}
			});
			if (bad.length) App.toast(bad.length + ' could not be moved (' + App.errMsg(bad[0].body) + ')', 'error');
			else App.toast('Moved', 'ok');
			load(state.path);
		});
	}

	function movePromptFreeText(items) {
		App.prompt({ title: 'Move ' + items.length + ' item(s)', okLabel: 'Move', fields: [{ name: 'dest', label: 'Destination folder', required: true, value: parentDir(), placeholder: '/path/to/folder' }] })
			.then(function (v) { if (v) performMove(items, v.dest); });
	}

	function moveItems(items) {
		if (!items.length) return;
		// Folders being moved (and their subtrees) can't be their own destination.
		var movingFolders = items.filter(function (m) { return m.kind === 'folder'; }).map(function (m) { return m.path; });
		function excluded(p) {
			for (var i = 0; i < movingFolders.length; i++) {
				var mf = movingFolders[i];
				if (p === mf || p.indexOf(mf + '/') === 0) return true;
			}
			return false;
		}
		App.loading(true);
		// Non-admins may not list '/'; fall back to their workspace, then state.path.
		walkFolders('/').catch(function () {
			return App.api('/users/api.php?action=myworkspace').then(function (r) {
				var ws = (r.body && r.body.workspace) || state.path || '/';
				return walkFolders(ws);
			});
		}).then(function (folders) {
			App.loading(false);
			var opts = folders.filter(function (f) { return !excluded(f.path); }).map(function (f) {
				var label = f.path === '/' ? '/ (Workspace root)' : (new Array(f.depth + 1).join('   ') + f.path);
				return { value: f.path, label: label };
			});
			if (!opts.length) { movePromptFreeText(items); return; }
			var def = (opts.filter(function (o) { return o.value === parentDir(); })[0] || opts[0]).value;
			App.prompt({
				title: 'Move ' + items.length + ' item(s)', okLabel: 'Move',
				fields: [{ name: 'dest', label: 'Destination folder', type: 'select', value: def, options: opts }]
			}).then(function (v) { if (v) performMove(items, v.dest); });
		}).catch(function () { App.loading(false); movePromptFreeText(items); });
	}

	// Toolbar Export: pick folders + labs from the current folder (with select-all)
	// and export them. Reuses exportItems() → /api/export → download.
	function exportDialog() {
		App.loading(true);
		App.api('/api/folders?path=' + encodeURIComponent(state.path)).then(function (res) {
			App.loading(false);
			var data = (res.body && res.body.data) || { folders: [], labs: [] };
			var folders = (data.folders || []).filter(function (f) { return f.name !== '..'; });
			var labs = data.labs || [];
			if (!folders.length && !labs.length) { App.toast('Nothing to export in this folder.', 'error'); return; }

			var body = el('div');
			body.appendChild(el('p', 'muted', 'Select folders and labs to export' + (state.path !== '/' ? ' from ' + state.path : '') + '.'));
			var cl = el('div', 'checklist');
			var head = el('div', 'checklist-head');
			head.appendChild(el('span', null, 'Workspace items'));
			var saWrap = el('label'); saWrap.style.cssText = 'font-weight:400;text-transform:none;display:flex;align-items:center;gap:6px;cursor:pointer;';
			var sa = el('input'); sa.type = 'checkbox';
			saWrap.appendChild(sa); saWrap.appendChild(document.createTextNode('select all'));
			head.appendChild(saWrap); cl.appendChild(head);
			var listBody = el('div', 'checklist-body'); listBody.style.maxHeight = '46vh';
			var boxes = [];
			function addRow(icon, color, label, path) {
				var row = el('div', 'checklist-item');
				var cb = el('input'); cb.type = 'checkbox'; cb.dataset.path = path; boxes.push(cb);
				row.appendChild(cb);
				var nm = el('span', 'ci-name');
				var ic = el('i', 'fa ' + icon); ic.style.color = color; nm.appendChild(ic);
				nm.appendChild(document.createTextNode(' ' + label));
				row.appendChild(nm);
				listBody.appendChild(row);
			}
			folders.forEach(function (f) { addRow('fa-folder', 'var(--pnq-folder)', f.name, f.path); });
			labs.forEach(function (l) { addRow('fa-flask', 'var(--pnq-accent)', l.file.replace(/\.unl$/, ''), l.path); });
			cl.appendChild(listBody);
			body.appendChild(cl);
			sa.addEventListener('change', function () { boxes.forEach(function (b) { b.checked = sa.checked; }); });

			var dlg = App.modal({
				title: 'Export', wide: true, body: body, dismissable: true, buttons: [
					{ label: 'Cancel', kind: 'ghost', onClick: function (c) { c(); } },
					{
						label: 'Export', kind: 'primary', onClick: function () {
							var items = boxes.filter(function (b) { return b.checked; }).map(function (b) { return { path: b.dataset.path }; });
							if (!items.length) { App.toast('Select at least one item to export.', 'error'); return; }
							dlg.close();
							exportItems(items);
						}
					}
				]
			});
		});
	}

	function exportItems(items) {
		if (!items.length) return;
		var payload = { path: parentDir() };
		items.forEach(function (it, i) { payload[String(i)] = it.path; });
		App.loading(true);
		post('/api/export', payload).then(function (res) {
			App.loading(false);
			var url = res.body && res.body.data;
			if (ok(res) && url) {
				var a = el('a'); a.href = url; a.download = ''; document.body.appendChild(a); a.click(); a.remove();
				App.toast('Export ready', 'ok');
			} else App.toast(App.errMsg(res.body) || 'Export failed.', 'error');
		});
	}

	function importLab() {
		var inp = el('input'); inp.type = 'file'; inp.multiple = true;
		inp.accept = '.unl,.zip,.tar,.gz,.tgz';
		inp.style.display = 'none';
		document.body.appendChild(inp);
		inp.addEventListener('change', function () {
			var files = Array.prototype.slice.call(inp.files || []);
			inp.remove();
			if (files.length) runImport(files);
		});
		inp.click();
	}

	// Upload lab file(s) via XHR with a compact progress bar (replaces the
	// full-screen spinner) — real upload progress, then a brief done/error state.
	function runImport(files) {
		var totalBytes = files.reduce(function (s, f) { return s + (f.size || 0); }, 0) || 1;
		var loaded = files.map(function () { return 0; });
		var done = 0, good = 0;

		var panel = el('div', 'import-progress');
		var head = el('div', 'import-progress-title');
		head.appendChild(el('i', 'fa fa-download'));
		head.appendChild(document.createTextNode(' Importing ' + files.length + ' lab' + (files.length > 1 ? 's' : '') + '…'));
		var bar = el('div', 'progress'); var fill = el('div', 'progress-bar'); bar.appendChild(fill);
		var label = el('div', 'import-progress-label muted', 'Starting…');
		panel.appendChild(head); panel.appendChild(bar); panel.appendChild(label);
		document.body.appendChild(panel);

		function redraw() {
			var sum = loaded.reduce(function (a, b) { return a + b; }, 0);
			if (done >= files.length) {
				fill.style.width = '100%';
				label.textContent = good + ' of ' + files.length + ' imported';
			} else if (sum >= totalBytes) {
				fill.style.width = '99%';
				label.textContent = 'Processing on server…';
			} else {
				fill.style.width = Math.round(sum / totalBytes * 99) + '%';
				label.textContent = Math.round(sum / totalBytes * 100) + '%';
			}
		}
		redraw();

		files.forEach(function (f, i) {
			var fd = new FormData();
			fd.append('path', parentDir());
			fd.append('file', f);
			var xhr = new XMLHttpRequest();
			xhr.open('POST', '/api/import', true);
			xhr.withCredentials = true;
			if (xhr.upload) xhr.upload.onprogress = function (e) { if (e.lengthComputable) { loaded[i] = e.loaded; redraw(); } };
			xhr.onload = function () {
				loaded[i] = f.size || 0; done++;
				var b = {}; try { b = JSON.parse(xhr.responseText); } catch (e) {}
				if (b && (b.status === 'success' || b.code === 200)) good++;
				else App.toast((b && b.message) ? f.name + ': ' + App.errMsg(b) : 'Import failed: ' + f.name, 'error');
				finish();
			};
			xhr.onerror = function () { done++; App.toast('Import failed: ' + f.name, 'error'); finish(); };
			xhr.send(fd);
		});

		function finish() {
			if (done < files.length) { redraw(); return; }
			fill.className = 'progress-bar ' + (good ? 'done' : 'err');
			redraw();
			if (good) App.toast(good + ' lab(s) imported', 'ok');
			setTimeout(function () { panel.remove(); }, 1600);
			load(state.path);
		}
	}

	/* ---- card / grid view -------------------------------------------------- */
	function buildGrid(folders, labs) {
		if (topoIO) { topoIO.disconnect(); topoIO = null; }
		var grid = el('div', 'cards');
		folders.forEach(function (f) { grid.appendChild(f.name === '..' ? parentCard(f) : folderCard(f)); });
		labs.forEach(function (l) { grid.appendChild(labCard(l)); });
		return grid;
	}

	function parentCard(f) {
		var card = el('div', 'folder-card');
		var body = el('div', 'card-body');
		body.appendChild(el('i', 'fa fa-level-up'));
		body.appendChild(el('div', 'nm', '..'));
		App.clickable(body, function () { load(f.path); });
		card.appendChild(body);
		return card;
	}

	function folderCard(f) {
		var card = el('div', 'folder-card');
		card.appendChild(cardCheck('Fo_' + f.name, { kind: 'folder', path: f.path, name: f.name }));
		card.appendChild(cardActions([
			act('fa-pencil', 'Rename', function () { renameFolder(f); }),
			act('fa-arrows', 'Move', function () { moveItems([{ kind: 'folder', path: f.path, name: f.name }]); }),
			act('fa-trash-o', 'Delete', function () { delFolder(f); }, 'danger')
		]));
		var body = el('div', 'card-body');
		body.appendChild(el('i', 'fa ' + (f.shared ? 'fa-share-alt' : 'fa-folder')));
		body.appendChild(el('div', 'nm', f.name));
		App.clickable(body, function () { load(f.path); });
		card.appendChild(body);
		return card;
	}

	function labCard(l) {
		var card = el('div', 'lab-card'); card.dataset.labpath = l.path;
		card.appendChild(cardCheck('Fi_' + l.file, { kind: 'lab', path: l.path, name: l.file }));
		card.appendChild(cardActions([
			act('fa-external-link', 'Open', function () { openLab(l.path); }, 'accent'),
			act('fa-cog', 'Edit lab & permissions', function () { editLab(l); }),
			act('fa-clone', 'Clone', function () { cloneLab(l); }),
			act('fa-pencil', 'Rename', function () { renameLab(l); }),
			act('fa-arrows', 'Move', function () { moveItems([{ kind: 'lab', path: l.path, name: l.file }]); }),
			act('fa-download', 'Export', function () { exportItems([{ path: l.path }]); }),
			act('fa-trash-o', 'Delete', function () { delLab(l); }, 'danger')
		]));
		var prev = el('div', 'card-preview'); prev.dataset.path = l.path; prev.title = 'Open in topology editor';
		prev.appendChild(el('i', 'fa fa-spinner spin ph'));
		App.clickable(prev, function () { openLab(l.path); });
		prev.setAttribute('aria-label', 'Open ' + l.file.replace(/\.unl$/, '') + ' in topology editor');
		card.appendChild(prev);
		var meta = el('div', 'card-meta');
		var nm = el('span', 'nm', l.file.replace(/\.unl$/, ''));
		App.clickable(nm, function () { openLab(l.path); });
		meta.appendChild(nm);
		meta.appendChild(el('span', 'js-runhost'));   // running badge slot (filled by markRunning)
		card.appendChild(meta);
		if (l.mtime) card.appendChild(el('div', 'card-sub', l.mtime));
		observePreview(prev);
		return card;
	}

	function cardCheck(id, meta) {
		var wrap = el('label', 'card-check' + (state.sel[id] ? ' on' : ''));
		var cb = el('input'); cb.type = 'checkbox'; cb.checked = !!state.sel[id];
		cb.addEventListener('click', function (e) { e.stopPropagation(); });
		cb.addEventListener('change', function () {
			if (cb.checked) { state.sel[id] = meta; wrap.classList.add('on'); }
			else { delete state.sel[id]; wrap.classList.remove('on'); }
			refreshBulk();
		});
		wrap.appendChild(cb);
		return wrap;
	}
	function cardActions(buttons) { var d = el('div', 'card-actions'); buttons.forEach(function (b) { d.appendChild(b); }); return d; }

	/* ---- lazy lab-topology thumbnails -------------------------------------- */
	function observePreview(prevEl) {
		if (!('IntersectionObserver' in window)) { loadPreview(prevEl); return; }
		if (!topoIO) {
			topoIO = new IntersectionObserver(function (entries) {
				entries.forEach(function (e) { if (e.isIntersecting) { topoIO.unobserve(e.target); loadPreview(e.target); } });
			}, { rootMargin: '150px' });
		}
		topoIO.observe(prevEl);
	}
	function loadPreview(prevEl) {
		var path = prevEl.dataset.path;
		getPreview(path).then(function (data) { renderThumb(prevEl, data); });
	}
	function getPreview(path) {
		var generation = previewGeneration[path] || 0;
		if (Object.prototype.hasOwnProperty.call(previewCache, path)) return Promise.resolve(previewCache[path]);
		if (previewRequests[path] && previewRequests[path].generation === generation) return previewRequests[path].promise;
		var request = App.api('/api/labs/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: path }) })
			.then(function (res) {
				var body = res.body || {};
				var d = res.status === 200 && body.status !== 'fail' && body.data && typeof body.data === 'object' ? body.data : 'fail';
				if ((previewGeneration[path] || 0) === generation) previewCache[path] = d;
				return d;
			}, function () {
				if ((previewGeneration[path] || 0) === generation) previewCache[path] = 'fail';
				return 'fail';
			});
		var entry = { generation: generation, promise: request };
		previewRequests[path] = entry;
		request.then(function () { if (previewRequests[path] === entry) delete previewRequests[path]; });
		return request;
	}
	function renderThumb(host, data) {
		clearChildren(host);
		var svg = (data && data !== 'fail') ? buildTopoSvg(data) : null;
		host.appendChild(svg || el('i', 'fa fa-sitemap ph'));
	}

	function svgNode(tag, attrs) { var e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
	function sanitizeIcon(ic) {
		ic = String(ic || '').split(/[\\/]/).pop();
		ic = ic.replace(/[^A-Za-z0-9._ -]/g, '');
		return ic && ic !== '.' && ic !== '..' ? ic : 'Router-2D-Gen-White-S.svg';
	}
	function svgNumber(value, fallback, min, max) {
		var s = String(value == null ? '' : value).trim();
		if (/%\s*$/.test(s)) return fallback;
		var n = parseFloat(s.replace(/px\s*$/i, ''));
		if (!isFinite(n)) return fallback;
		if (min != null && n < min) n = min;
		if (max != null && n > max) n = max;
		return n;
	}
	function safeColor(value, fallback) {
		var s = String(value == null ? '' : value).trim();
		if (/^#[0-9a-f]{3,8}$/i.test(s) || /^(?:rgb|hsl)a?\([0-9a-f%.,\s+\-]+\)$/i.test(s) || /^[a-z]{1,32}$/i.test(s)) return s;
		return fallback;
	}
	function safeWeight(value) {
		var s = String(value == null ? '' : value).trim().toLowerCase();
		return /^(?:normal|bold|bolder|lighter|[1-9]00)$/.test(s) ? s : 'normal';
	}
	function safeDecoration(value) {
		var s = String(value == null ? '' : value).trim().toLowerCase();
		return /^(?:none|underline|overline|line-through)$/.test(s) ? s : 'none';
	}
	function parseInlineStyle(style) {
		var out = {};
		String(style || '').split(';').forEach(function (part) {
			var i = part.indexOf(':');
			if (i < 0) return;
			var key = part.slice(0, i).trim().toLowerCase();
			if (key) out[key] = part.slice(i + 1).trim();
		});
		return out;
	}
	function collectionItems(collection) {
		if (!collection) return [];
		if (Array.isArray(collection)) return collection.slice();
		if (typeof collection !== 'object') return [];
		return Object.keys(collection).map(function (key) { return collection[key]; });
	}
	function collectionEntries(collection) {
		if (!collection) return [];
		if (Array.isArray(collection)) return collection.map(function (value, index) { return { value: value, id: value && value.id != null ? value.id : index }; });
		if (typeof collection !== 'object') return [];
		return Object.keys(collection).map(function (key) { return { value: collection[key], id: key }; });
	}
	function decorationId(object, fallback) {
		var id = object && object.id != null ? object.id : fallback;
		return id == null || id === '' ? 'unknown' : String(id);
	}
	function warnDecorationParse(kind, object, fallback, reason) {
		if (typeof console === 'undefined' || typeof console.warn !== 'function') return;
		console.warn('[labs preview] Could not parse ' + kind + ' decoration id=' + decorationId(object, fallback) + (reason ? ': ' + reason : ''));
	}
	function decodeBase64Decoration(raw) {
		var encoded = String(raw || '').replace(/\s+/g, '');
		// atob() is only a candidate decoder here. A failed candidate must leave
		// the original raw markup available to the inert DOMParser path.
		if (!encoded || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(encoded) || encoded.length % 4 === 1) return '';
		try {
			encoded = encoded.replace(/-/g, '+').replace(/_/g, '/');
			while (encoded.length % 4) encoded += '=';
			var binary = atob(encoded), bytes = new Uint8Array(binary.length);
			for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
			if (typeof TextDecoder === 'function') {
				try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch (e) {}
			}
			if (/%[0-9a-f]{2}/i.test(binary)) {
				try { return decodeURIComponent(binary); } catch (e2) {}
			}
			if (typeof escape === 'function') {
				try { return decodeURIComponent(escape(binary)); } catch (e3) {}
			}
			return binary;
		} catch (e4) { return ''; }
	}
	function decodeDecorationBlob(raw) {
		if (typeof raw !== 'string') return [];
		var direct = raw.trim();
		if (!direct) return [];
		var candidates = [], decoded = decodeBase64Decoration(direct);
		if (decoded) candidates.push(decoded);
		candidates.push(direct);
		return candidates;
	}
	function parseTextDecoration(object, fallbackId) {
		// The API groups shape objects with text objects. Shapes are a separate
		// renderer concern; do not misreport their valid SVG markup as a failed
		// text decoration just because it has no textContent.
		if (object && object.type && String(object.type).toLowerCase() !== 'text') return null;
		var candidates = decodeDecorationBlob(object && object.data), root = null;
		if (typeof DOMParser === 'function') {
			candidates.some(function (markup) {
				var doc;
				try { doc = new DOMParser().parseFromString(markup, 'text/html'); } catch (e) { return false; }
				root = doc && doc.body && doc.body.firstElementChild;
				return !!root;
			});
		}
		if (!root) { warnDecorationParse('text', object, fallbackId, 'markup unavailable'); return null; }
		var style = parseInlineStyle(root.getAttribute('style'));
		var text = String(root.textContent || '').replace(/\s+/g, ' ').trim();
		if (!text) { warnDecorationParse('text', object, fallbackId, 'no text content'); return null; }
		var fontSize = svgNumber(style['font-size'], 16, 1, 200);
		var width = svgNumber(style.width, Math.max(fontSize * 2, text.length * fontSize * 0.62), 1, 1000000);
		var height = svgNumber(style.height, fontSize * 1.35, 1, 1000000);
		var x = svgNumber(style.left, 0, -1000000, 1000000);
		var y = svgNumber(style.top, 0, -1000000, 1000000);
		var rotate = 0, rotateMatch = /rotate\(\s*(-?\d+(?:\.\d+)?)\s*deg\s*\)/i.exec(style.transform || '');
		if (rotateMatch) rotate = svgNumber(rotateMatch[1], 0, -360, 360);
		return {
			text: text, x: x, y: y, width: width, height: height,
			fontSize: fontSize, color: safeColor(style.color || style.fill, '#1d1d1f'),
			weight: safeWeight(style['font-weight']), decoration: safeDecoration(style['text-decoration']),
			align: String(style['text-align'] || '').toLowerCase(), rotate: rotate,
			z: svgNumber(style['z-index'], 0, -1000000, 1000000)
		};
	}
	function safeStrokeDasharray(value) {
		var s = String(value == null ? '' : value).trim().toLowerCase();
		if (s === 'none') return s;
		return /^(?:\d+(?:\.\d+)?)(?:\s*(?:,|\s)\s*\d+(?:\.\d+)?)*$/.test(s) ? s : '';
	}
	function safeShapeEnum(value, allowed, fallback) {
		var s = String(value == null ? '' : value).trim().toLowerCase();
		return allowed.indexOf(s) >= 0 ? s : fallback;
	}
	function parseShapeDecoration(object, fallbackId) {
		if (object && object.type && String(object.type).toLowerCase() !== 'shape') return null;
		var candidates = decodeDecorationBlob(object && object.data), root = null, innerSvg = null, shape = null;
		if (typeof DOMParser === 'function') {
			candidates.some(function (markup) {
				var doc;
				try { doc = new DOMParser().parseFromString(markup, 'text/html'); } catch (e) { return false; }
				var first = doc && doc.body && doc.body.firstElementChild;
				if (!first) return false;
				var tag = String(first.tagName || '').toLowerCase();
				var svg = tag === 'svg' ? first : first.querySelector('svg');
				if (!svg) return false;
				var children = Array.prototype.slice.call(svg.children || []);
				var candidate = children.find(function (child) {
					var childTag = String(child.tagName || '').toLowerCase();
					return childTag === 'rect' || childTag === 'ellipse';
				});
				if (!candidate) return false;
				root = first; innerSvg = svg; shape = candidate;
				return true;
			});
		}
		if (!root || !innerSvg || !shape) { warnDecorationParse('shape', object, fallbackId, 'SVG shape unavailable'); return null; }
		var style = parseInlineStyle(root.getAttribute('style'));
		var x = svgNumber(style.left, NaN, -1000000, 1000000), y = svgNumber(style.top, NaN, -1000000, 1000000);
		var width = svgNumber(style.width, NaN, 0.001, 1000000), height = svgNumber(style.height, NaN, 0.001, 1000000);
		if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height)) {
			warnDecorationParse('shape', object, fallbackId, 'invalid position or size'); return null;
		}
		var vb = String(innerSvg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(function (value) { return parseFloat(value); });
		if (vb.length !== 4 || !vb.every(function (value) { return isFinite(value); }) || vb[2] <= 0 || vb[3] <= 0) {
			var svgWidth = svgNumber(innerSvg.getAttribute('width'), NaN, 0.001, 1000000);
			var svgHeight = svgNumber(innerSvg.getAttribute('height'), NaN, 0.001, 1000000);
			if (!isFinite(svgWidth) || !isFinite(svgHeight)) { warnDecorationParse('shape', object, fallbackId, 'invalid viewBox'); return null; }
			vb = [0, 0, svgWidth, svgHeight];
		}
		var shapeTag = String(shape.tagName || '').toLowerCase(), attrs = {};
		function requiredNumber(name, fallback) {
			var value = svgNumber(shape.getAttribute(name), fallback, -1000000, 1000000);
			return value;
		}
		if (shapeTag === 'rect') {
			attrs.x = requiredNumber('x', 0); attrs.y = requiredNumber('y', 0);
			attrs.width = requiredNumber('width', NaN); attrs.height = requiredNumber('height', NaN);
			if (!isFinite(attrs.width) || !isFinite(attrs.height) || attrs.width <= 0 || attrs.height <= 0) {
				warnDecorationParse('shape', object, fallbackId, 'invalid rect geometry'); return null;
			}
			['rx', 'ry'].forEach(function (name) { if (shape.hasAttribute(name)) attrs[name] = requiredNumber(name, 0); });
		} else {
			attrs.cx = requiredNumber('cx', 0); attrs.cy = requiredNumber('cy', 0);
			attrs.rx = requiredNumber('rx', NaN); attrs.ry = requiredNumber('ry', NaN);
			if (!isFinite(attrs.rx) || !isFinite(attrs.ry) || attrs.rx <= 0 || attrs.ry <= 0) {
				warnDecorationParse('shape', object, fallbackId, 'invalid ellipse geometry'); return null;
			}
		}
		attrs.fill = safeColor(shape.getAttribute('fill'), 'none');
		attrs.stroke = safeColor(shape.getAttribute('stroke'), 'none');
		attrs['stroke-width'] = svgNumber(shape.getAttribute('stroke-width'), 1, 0, 100);
		['fill-opacity', 'stroke-opacity', 'opacity'].forEach(function (name) {
			if (shape.hasAttribute(name)) attrs[name] = svgNumber(shape.getAttribute(name), 1, 0, 1);
		});
		var dash = safeStrokeDasharray(shape.getAttribute('stroke-dasharray'));
		if (dash) attrs['stroke-dasharray'] = dash;
		if (shape.hasAttribute('stroke-linecap')) attrs['stroke-linecap'] = safeShapeEnum(shape.getAttribute('stroke-linecap'), ['butt', 'round', 'square'], 'butt');
		if (shape.hasAttribute('stroke-linejoin')) attrs['stroke-linejoin'] = safeShapeEnum(shape.getAttribute('stroke-linejoin'), ['miter', 'round', 'bevel'], 'miter');
		if (shape.hasAttribute('vector-effect')) attrs['vector-effect'] = safeShapeEnum(shape.getAttribute('vector-effect'), ['none', 'non-scaling-stroke'], 'none');
		var rotate = 0, rotateMatch = /rotate\(\s*(-?\d+(?:\.\d+)?)\s*deg\s*\)/i.exec(style.transform || '');
		if (rotateMatch) rotate = svgNumber(rotateMatch[1], 0, -360, 360);
		return { x: x, y: y, width: width, height: height, rotate: rotate, z: svgNumber(style['z-index'], 0, -1000000, 1000000), tag: shapeTag, attrs: attrs, vb: { x: vb[0], y: vb[1], w: vb[2], h: vb[3] } };
	}
	// getLineObjects() is returned as an object keyed by id; each value already
	// carries direct x1/y1/x2/y2, paintstyle, color, width and label fields. It
	// is not a base64 decoration blob and needs no markup decoding.
	function parseDecorativeLine(line, fallbackId) {
		if (!line || typeof line !== 'object') { warnDecorationParse('line', line, fallbackId, 'invalid object'); return null; }
		var x1 = svgNumber(line.x1, NaN, -1000000, 1000000), y1 = svgNumber(line.y1, NaN, -1000000, 1000000);
		var x2 = svgNumber(line.x2, NaN, -1000000, 1000000), y2 = svgNumber(line.y2, NaN, -1000000, 1000000);
		if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) { warnDecorationParse('line', line, fallbackId, 'invalid geometry'); return null; }
		var paintstyle = String(line.paintstyle || 'solid').toLowerCase();
		var dash = { solid: null, dashed: '5,5', dotted: '1,5', dotdash: '1,5,10,5' }[paintstyle];
		var label = String(line.label == null ? '' : line.label).replace(/\s+/g, ' ').trim();
		return { x1: x1, y1: y1, x2: x2, y2: y2, color: safeColor(line.color, '#0066aa'), width: svgNumber(line.width, 2, 0.5, 100), dash: dash, label: label };
	}

	// Render the same SVG scene for card thumbnails and the selected-row pane.
	// Decoration blobs are parsed in an inert document and reduced to plain text
	// plus numeric/allowlisted SVG attributes; decoded markup never enters this DOM.
	function buildTopoSvg(data) {
		data = data || {};
		var nodes = data.nodes || {}, nets = data.networks || {};
		var pts = {}, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		function ext(x, y) { if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; }
		var nIds = Object.keys(nodes);
		nIds.forEach(function (id) {
			var n = nodes[id] || {}, x = svgNumber(n.left, 0, -1000000, 1000000), y = svgNumber(n.top, 0, -1000000, 1000000);
			pts['n' + id] = { x: x, y: y, kind: 'node', icon: n.icon }; ext(x, y);
		});
		var conn = {};
		nIds.forEach(function (id) { var ifs = (nodes[id] && nodes[id].interfaces) || {}; Object.keys(ifs).forEach(function (k) { var nid = +ifs[k].network_id; if (nid > 0) (conn[nid] = conn[nid] || []).push(id); }); });
		var collapsedP2p = {};
		Object.keys(nets).forEach(function (nid) {
			var members = conn[nid] || [], nw = nets[nid] || {};
			// Only a typed bridge with exactly two interface memberships on two
			// different nodes is a direct cable. Missing/other types stay visible.
			if (String(nw.type || '').toLowerCase() === 'bridge' && members.length === 2 && members[0] !== members[1]) {
				collapsedP2p[nid] = ['n' + members[0], 'n' + members[1]];
			}
		});
		Object.keys(nets).forEach(function (nid) {
			if (collapsedP2p[nid]) return;
			var nw = nets[nid] || {}, x = svgNumber(nw.left, 0, -1000000, 1000000), y = svgNumber(nw.top, 0, -1000000, 1000000);
			if (!x && !y && conn[nid] && conn[nid].length) {
				var sx = 0, sy = 0; conn[nid].forEach(function (id) { sx += pts['n' + id].x; sy += pts['n' + id].y; });
				x = sx / conn[nid].length; y = sy / conn[nid].length;
			}
			pts['w' + nid] = { x: x, y: y, kind: 'net' }; ext(x, y);
		});
		var links = [];
		nIds.forEach(function (id) { var ifs = (nodes[id] && nodes[id].interfaces) || {}; Object.keys(ifs).forEach(function (k) { var nid = +ifs[k].network_id; if (nid > 0 && !collapsedP2p[nid] && pts['w' + nid]) links.push(['n' + id, 'w' + nid]); }); });
		Object.keys(collapsedP2p).forEach(function (nid) { links.push(collapsedP2p[nid]); });

		var decoLines = collectionEntries(data.lines).map(function (entry) { return parseDecorativeLine(entry.value, entry.id); }).filter(function (line) { return !!line; });
		var decoTexts = collectionEntries(data.textObjects).map(function (entry) { return parseTextDecoration(entry.value, entry.id); }).filter(function (text) { return !!text; });
		var decoShapes = collectionEntries(data.textObjects).map(function (entry) { return parseShapeDecoration(entry.value, entry.id); }).filter(function (shape) { return !!shape; });
		decoTexts.sort(function (a, b) { return a.z - b.z; });
		decoShapes.sort(function (a, b) { return a.z - b.z; });
		decoLines.forEach(function (line) {
			ext(line.x1, line.y1); ext(line.x2, line.y2);
			if (line.label) {
				var lx = (line.x1 + line.x2) / 2, ly = (line.y1 + line.y2) / 2;
				ext(lx - line.label.length * 4, ly - 8); ext(lx + line.label.length * 4, ly + 8);
			}
		});
		decoTexts.forEach(function (text) { ext(text.x, text.y); ext(text.x + text.width, text.y + text.height); });
		decoShapes.forEach(function (shape) {
			var angle = shape.rotate * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle), cx = shape.width / 2, cy = shape.height / 2;
			[[0, 0], [shape.width, 0], [shape.width, shape.height], [0, shape.height]].forEach(function (corner) {
				var dx = corner[0] - cx, dy = corner[1] - cy;
				ext(shape.x + cx + dx * cos - dy * sin, shape.y + cy + dx * sin + dy * cos);
			});
		});
		if (minX === Infinity) return null;
		var w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
		var icon = Math.min(Math.max(Math.max(w, h) / 11, 36), 120), pad = icon;
		var base = { x: minX - pad, y: minY - pad, w: w + 2 * pad, h: h + 2 * pad };
		var svg = svgNode('svg', { class: 'topo', viewBox: base.x + ' ' + base.y + ' ' + base.w + ' ' + base.h, preserveAspectRatio: 'xMidYMid meet' });
		svg.__topoBaseViewBox = base;
		links.forEach(function (lk) { var a = pts[lk[0]], b = pts[lk[1]]; svg.appendChild(svgNode('line', { class: 'topo__link', x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#9fb0aa', 'stroke-width': Math.max(1, icon / 16) })); });
		decoLines.forEach(function (line) {
			var attrs = { class: 'topo__deco-line', x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, stroke: line.color, 'stroke-width': line.width, fill: 'none' };
			if (line.dash) attrs['stroke-dasharray'] = line.dash;
			svg.appendChild(svgNode('line', attrs));
		});
		decoShapes.forEach(function (shape) {
			var sx = shape.width / shape.vb.w, sy = shape.height / shape.vb.h;
			var transform = 'translate(' + shape.x + ' ' + shape.y + ') rotate(' + shape.rotate + ' ' + (shape.width / 2) + ' ' + (shape.height / 2) + ') scale(' + sx + ' ' + sy + ') translate(' + (-shape.vb.x) + ' ' + (-shape.vb.y) + ')';
			var group = svgNode('g', { class: 'topo__deco-shape', transform: transform });
			// Rebuild from the allowlisted tag/attributes; decoded DOM nodes never enter this DOM.
			group.appendChild(svgNode(shape.tag, shape.attrs));
			svg.appendChild(group);
		});
		Object.keys(pts).forEach(function (k) { var p = pts[k]; if (p.kind === 'net') svg.appendChild(svgNode('circle', { class: 'topo__net', cx: p.x, cy: p.y, r: icon / 4, fill: '#c2d0ca' })); });
		Object.keys(pts).forEach(function (k) {
			var p = pts[k]; if (p.kind !== 'node') return;
			var url = '/images/icons/' + sanitizeIcon(p.icon);
			var im = svgNode('image', { class: 'topo__node', x: p.x - icon / 2, y: p.y - icon / 2, width: icon, height: icon });
			im.setAttribute('href', url);
			im.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url);
			svg.appendChild(im);
		});
		decoTexts.forEach(function (text) {
			var x = text.x, anchor = 'start';
			if (text.align === 'center') { x += text.width / 2; anchor = 'middle'; }
			else if (text.align === 'right' || text.align === 'end') { x += text.width; anchor = 'end'; }
			var attrs = { class: 'topo__deco-text', x: x, y: text.y + text.fontSize, fill: text.color, 'font-size': text.fontSize, 'font-weight': text.weight, 'text-decoration': text.decoration, 'text-anchor': anchor };
			var t = svgNode('text', attrs);
			if (text.rotate) t.setAttribute('transform', 'rotate(' + text.rotate + ' ' + (text.x + text.width / 2) + ' ' + (text.y + text.height / 2) + ')');
			t.textContent = text.text;
			svg.appendChild(t);
		});
		decoLines.forEach(function (line) {
			if (!line.label) return;
			var lx = (line.x1 + line.x2) / 2, ly = (line.y1 + line.y2) / 2;
			var label = svgNode('text', { class: 'topo__deco-label', x: lx, y: ly - 4, fill: line.color, 'font-size': Math.max(10, Math.min(24, line.width * 4)), 'text-anchor': 'middle' });
			label.textContent = line.label;
			svg.appendChild(label);
		});
		return svg;
	}

	function applyPreviewZoom() {
		if (!preview.svg || !preview.svg.__topoBaseViewBox) return;
		var b = preview.svg.__topoBaseViewBox;
		var factor = preview.zoom === 'auto' ? 1 : (+preview.zoom || 1);
		var w = b.w / factor, h = b.h / factor;
		preview.svg.setAttribute('viewBox', (b.x + (b.w - w) / 2) + ' ' + (b.y + (b.h - h) / 2) + ' ' + w + ' ' + h);
	}

	/* ---- ui atoms ---------------------------------------------------------- */
	function btn(icon, label, cls, onClick) {
		var b = el('button', cls); b.type = 'button';
		b.appendChild(el('i', 'fa ' + icon));
		if (label) b.appendChild(document.createTextNode(' ' + label));
		b.addEventListener('click', onClick);
		return b;
	}
	function act(icon, title, onClick, kind) {
		var b = el('button', 'btn btn-sm btn-icon' + (kind ? ' btn-' + kind : ' btn-ghost'));
		b.type = 'button'; b.title = title;
		b.appendChild(el('i', 'fa ' + icon));
		b.addEventListener('click', function (e) { e.stopPropagation(); onClick(); });
		return b;
	}

	/* ---- register ---------------------------------------------------------- */
	App.register('labs', {
		title: 'Labs', icon: 'fa-sitemap',
		render: function () {
			if (state.path === null) state.path = (App.user && App.user.folder) ? App.user.folder : '/';
			load(state.path);
		}
	});
})();
