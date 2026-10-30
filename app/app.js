'use strict';
/* ──────────────────────────────────────────────────────────────
   Thumbnail Maker — engine
   Không thư viện ngoài. Canvas 2D thuần, mọi thao tác < 16ms.
   ────────────────────────────────────────────────────────────── */
(function () {

  /* ── Helpers ──────────────────────────────────────────────── */
  var $ = function (s) { return document.querySelector(s); };
  var clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  var bridge = (window.chrome && window.chrome.webview) ? window.chrome.webview : null;

  function post(msg) {
    if (bridge) { bridge.postMessage(JSON.stringify(msg)); }
  }
  function logLine(text, level) {
    if (bridge) post({ type: 'log', text: String(text), level: level || 'info' });
  }
  window.addEventListener('error', function (e) {
    logLine((e.message || 'error') + ' @' + (e.filename || '') + ':' + (e.lineno || 0), 'error');
  });
  window.addEventListener('unhandledrejection', function (e) {
    logLine('promise: ' + (e.reason && e.reason.message ? e.reason.message : e.reason), 'error');
  });

  /* ── Bố cục ───────────────────────────────────────────────── */
  var LAYOUTS = [
    { id: '2-col', n: 2, name: 'Trái · Phải', rects: [{ x: 0, y: 0, w: .5, h: 1 }, { x: .5, y: 0, w: .5, h: 1 }] },
    { id: '2-row', n: 2, name: 'Trên · Dưới', rects: [{ x: 0, y: 0, w: 1, h: .5 }, { x: 0, y: .5, w: 1, h: .5 }] },
    { id: '2-hero-l', n: 2, name: 'Lớn · Nhỏ', rects: [{ x: 0, y: 0, w: .62, h: 1 }, { x: .62, y: 0, w: .38, h: 1 }] },
    { id: '2-hero-r', n: 2, name: 'Nhỏ · Lớn', rects: [{ x: 0, y: 0, w: .38, h: 1 }, { x: .38, y: 0, w: .62, h: 1 }] },

    { id: '3-col', n: 3, name: '3 cột', rects: [
        { x: 0, y: 0, w: 1 / 3, h: 1 }, { x: 1 / 3, y: 0, w: 1 / 3, h: 1 }, { x: 2 / 3, y: 0, w: 1 / 3, h: 1 }] },
    { id: '3-row', n: 3, name: '3 hàng', rects: [
        { x: 0, y: 0, w: 1, h: 1 / 3 }, { x: 0, y: 1 / 3, w: 1, h: 1 / 3 }, { x: 0, y: 2 / 3, w: 1, h: 1 / 3 }] },
    { id: '3-hero-l', n: 3, name: 'Lớn | 2', rects: [
        { x: 0, y: 0, w: .58, h: 1 }, { x: .58, y: 0, w: .42, h: .5 }, { x: .58, y: .5, w: .42, h: .5 }] },
    { id: '3-hero-r', n: 3, name: '2 | Lớn', rects: [
        { x: 0, y: 0, w: .42, h: .5 }, { x: 0, y: .5, w: .42, h: .5 }, { x: .42, y: 0, w: .58, h: 1 }] },
    { id: '3-hero-t', n: 3, name: 'Lớn trên', rects: [
        { x: 0, y: 0, w: 1, h: .58 }, { x: 0, y: .58, w: .5, h: .42 }, { x: .5, y: .58, w: .5, h: .42 }] },
    { id: '3-hero-b', n: 3, name: 'Lớn dưới', rects: [
        { x: 0, y: 0, w: .5, h: .42 }, { x: .5, y: 0, w: .5, h: .42 }, { x: 0, y: .42, w: 1, h: .58 }] },

    { id: '4-grid', n: 4, name: 'Lưới 2×2', rects: [
        { x: 0, y: 0, w: .5, h: .5 }, { x: .5, y: 0, w: .5, h: .5 },
        { x: 0, y: .5, w: .5, h: .5 }, { x: .5, y: .5, w: .5, h: .5 }] },
    { id: '4-col', n: 4, name: '4 cột', rects: [
        { x: 0, y: 0, w: .25, h: 1 }, { x: .25, y: 0, w: .25, h: 1 },
        { x: .5, y: 0, w: .25, h: 1 }, { x: .75, y: 0, w: .25, h: 1 }] },
    { id: '4-row', n: 4, name: '4 hàng', rects: [
        { x: 0, y: 0, w: 1, h: .25 }, { x: 0, y: .25, w: 1, h: .25 },
        { x: 0, y: .5, w: 1, h: .25 }, { x: 0, y: .75, w: 1, h: .25 }] },
    { id: '4-hero-l', n: 4, name: 'Lớn | 3', rects: [
        { x: 0, y: 0, w: .52, h: 1 }, { x: .52, y: 0, w: .48, h: 1 / 3 },
        { x: .52, y: 1 / 3, w: .48, h: 1 / 3 }, { x: .52, y: 2 / 3, w: .48, h: 1 / 3 }] },
    { id: '4-hero-r', n: 4, name: '3 | Lớn', rects: [
        { x: 0, y: 0, w: .48, h: 1 / 3 }, { x: 0, y: 1 / 3, w: .48, h: 1 / 3 },
        { x: 0, y: 2 / 3, w: .48, h: 1 / 3 }, { x: .48, y: 0, w: .52, h: 1 }] },
    { id: '4-hero-t', n: 4, name: 'Lớn trên', rects: [
        { x: 0, y: 0, w: 1, h: .52 }, { x: 0, y: .52, w: 1 / 3, h: .48 },
        { x: 1 / 3, y: .52, w: 1 / 3, h: .48 }, { x: 2 / 3, y: .52, w: 1 / 3, h: .48 }] }
  ];

  var LAYOUT_BY_ID = {};
  LAYOUTS.forEach(function (l) { LAYOUT_BY_ID[l.id] = l; });

  var FORMATS = {
    png: { mime: 'image/png', ext: '.png' },
    jpg: { mime: 'image/jpeg', ext: '.jpg' },
    webp: { mime: 'image/webp', ext: '.webp' }
  };

  var PRESETS = {
    '1280x720': [1280, 720], '1920x1080': [1920, 1080], '2560x1440': [2560, 1440],
    '1080x1080': [1080, 1080], '1080x1350': [1080, 1350], '1080x1920': [1080, 1920],
    '1200x630': [1200, 630]
  };

  /* ── State ────────────────────────────────────────────────── */
  var state = {
    W: 1280, H: 720,
    count: 4,
    layout: '4-grid',
    layoutByCount: { 2: '2-col', 3: '3-hero-l', 4: '4-grid' },
    gap: 8,
    radius: 14,
    bg: '#0b0d11',
    cells: [],
    sel: 0,
    format: 'png',
    quality: 92,
    filename: 'thumbnail'
  };

  var images = new Map();   // id → { id, name, bitmap, w, h }
  var seq = 0;
  var rafId = 0;
  var hoverCell = -1;
  var drag = null;
  var pendingPick = null;
  var exporting = false;

  var cv = $('#cv');
  var ctx = cv.getContext('2d', { alpha: false });

  /* ── Persist ──────────────────────────────────────────────── */
  var LS_KEY = 'tm.v1';
  function saveState() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        W: state.W, H: state.H, count: state.count, layout: state.layout,
        layoutByCount: state.layoutByCount, gap: state.gap, radius: state.radius,
        bg: state.bg, format: state.format, quality: state.quality, filename: state.filename
      }));
    } catch (e) { }
  }
  function restoreState() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      ['W', 'H', 'count', 'gap', 'radius', 'quality'].forEach(function (k) {
        if (typeof s[k] === 'number' && isFinite(s[k])) state[k] = s[k];
      });
      ['layout', 'bg', 'format', 'filename'].forEach(function (k) {
        if (typeof s[k] === 'string' && s[k]) state[k] = s[k];
      });
      if (s.layoutByCount) {
        for (var n in s.layoutByCount) {
          var lid = s.layoutByCount[n];
          if (LAYOUT_BY_ID[lid]) state.layoutByCount[n] = lid;
        }
      }
      if (!LAYOUT_BY_ID[state.layout]) state.layout = state.layoutByCount[state.count] || '4-grid';
    } catch (e) { }
  }

  /* ── Hình học ─────────────────────────────────────────────── */
  // Rect của từng khung theo đơn vị 0..1 (đã trừ khoảng cách gap)
  function cellFracs() {
    var lay = LAYOUT_BY_ID[state.layout] || LAYOUTS[0];
    var gx = state.gap / state.W;
    var gy = state.gap / state.H;
    var eps = 1e-6;
    return lay.rects.map(function (r) {
      var x = r.x, y = r.y, w = r.w, h = r.h;
      var L = r.x > eps, R = r.x + r.w < 1 - eps, T = r.y > eps, B = r.y + r.h < 1 - eps;
      if (L) { x += gx / 2; w -= gx / 2; }
      if (R) { w -= gx / 2; }
      if (T) { y += gy / 2; h -= gy / 2; }
      if (B) { h -= gy / 2; }
      return { x: x, y: y, w: w, h: h };
    });
  }

  function newCell() { return { imgId: null, zoom: 1, panX: 0, panY: 0, mode: 'cover' }; }

  var MAX_SLOTS = 4;
  function activeCount() { return (LAYOUT_BY_ID[state.layout] || LAYOUTS[0]).rects.length; }
  function resetTransform(c) { c.zoom = 1; c.panX = 0; c.panY = 0; }

  // Luôn giữ 4 "ngăn" để đổi 4 → 2 → 4 không mất ảnh đã canh
  function syncCells() {
    while (state.cells.length < MAX_SLOTS) state.cells.push(newCell());
    state.count = activeCount();
    if (state.sel >= state.count) state.sel = state.count - 1;
    if (state.sel < 0) state.sel = 0;
  }

  // Tự lấp các ngăn trống bằng ảnh chưa dùng trong thư viện
  function autoFill() {
    var n = activeCount();
    var inUse = {};
    for (var i = 0; i < n; i++) { if (state.cells[i].imgId) inUse[state.cells[i].imgId] = true; }
    var free = [];
    images.forEach(function (img) { if (!inUse[img.id]) free.push(img.id); });
    if (!free.length) return false;
    var changed = false;
    for (var k = 0; k < n && free.length; k++) {
      if (state.cells[k].imgId) continue;
      var id = free.shift();
      for (var j = 0; j < state.cells.length; j++) { if (state.cells[j].imgId === id) state.cells[j].imgId = null; }
      state.cells[k].imgId = id;
      resetTransform(state.cells[k]);
      changed = true;
    }
    return changed;
  }

  function imageOf(cell) {
    return (cell && cell.imgId) ? images.get(cell.imgId) : null;
  }

  // Giữ ảnh không bị hở mép: pan tối đa = phần dư / 2
  function clampCell(cell, r) {
    if (!cell || !r) return;
    var img = imageOf(cell);
    if (!img) { cell.panX = 0; cell.panY = 0; return; }
    var cw = r.w * state.W, ch = r.h * state.H;
    if (cw <= 0 || ch <= 0) return;
    var s0 = cell.mode === 'contain'
      ? Math.min(cw / img.w, ch / img.h)
      : Math.max(cw / img.w, ch / img.h);
    var s = s0 * cell.zoom;
    var dw = img.w * s, dh = img.h * s;
    var mx = Math.max(0, (dw / cw - 1) / 2);
    var my = Math.max(0, (dh / ch - 1) / 2);
    cell.panX = clamp(cell.panX, -mx, mx);
    cell.panY = clamp(cell.panY, -my, my);
  }

  function roundRectPath(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath();
    if (c.roundRect) { c.roundRect(x, y, w, h, r); return; }
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* ── Vẽ ───────────────────────────────────────────────────── */
  function drawScene(c, W, H, isExport) {
    var scale = W / state.W;
    var rects = cellFracs();

    c.fillStyle = state.bg;
    c.fillRect(0, 0, W, H);

    for (var i = 0; i < rects.length; i++) {
      drawCell(c, rects[i], i, W, H, scale, isExport);
    }
  }

  function drawCell(c, r, i, W, H, scale, isExport) {
    var x = r.x * W, y = r.y * H, w = r.w * W, h = r.h * H;
    if (w <= 0 || h <= 0) return;
    var rad = Math.min(state.radius * scale, w / 2, h / 2);
    var cell = state.cells[i];
    var img = imageOf(cell);

    c.save();
    roundRectPath(c, x, y, w, h, rad);
    c.clip();

    if (img) {
      var bmp = img.bitmap;
      var s0 = cell.mode === 'contain'
        ? Math.min(w / bmp.width, h / bmp.height)
        : Math.max(w / bmp.width, h / bmp.height);
      var s = s0 * cell.zoom;
      var dw = bmp.width * s, dh = bmp.height * s;
      var cx = x + w / 2 + cell.panX * w;
      var cy = y + h / 2 + cell.panY * h;
      c.drawImage(bmp, cx - dw / 2, cy - dh / 2, dw, dh);
    } else if (!isExport) {
      drawPlaceholder(c, x, y, w, h, i, rad);
    }
    c.restore();

    if (!isExport) {
      if (i === state.sel) {
        var lw = Math.max(3, 2.2 * dprScale());
        var ri = Math.max(0, rad - lw);
        // vòng sáng
        c.save();
        c.shadowColor = 'rgba(123,104,255,.75)';
        c.shadowBlur = 14 * dprScale();
        roundRectPath(c, x + lw / 2, y + lw / 2, w - lw, h - lw, ri);
        c.strokeStyle = '#9d8cff';
        c.lineWidth = lw;
        c.stroke();
        c.restore();
        // viền tối bên trong để tách khỏi ảnh
        roundRectPath(c, x + lw + .5, y + lw + .5, w - lw * 2 - 1, h - lw * 2 - 1, Math.max(0, ri - 1));
        c.strokeStyle = 'rgba(0,0,0,.28)';
        c.lineWidth = 1.2;
        c.stroke();
      } else if (i === hoverCell && !drag) {
        roundRectPath(c, x + 1, y + 1, w - 2, h - 2, Math.max(0, rad - 1));
        c.strokeStyle = 'rgba(255,255,255,.18)';
        c.lineWidth = 1.5;
        c.stroke();
      } else if (img) {
        roundRectPath(c, x + .75, y + .75, w - 1.5, h - 1.5, Math.max(0, rad - .75));
        c.strokeStyle = 'rgba(255,255,255,.07)';
        c.lineWidth = 1.5;
        c.stroke();
      }
    }
  }

  function drawPlaceholder(c, x, y, w, h, i, rad) {
    c.fillStyle = 'rgba(255,255,255,.035)';
    c.fillRect(x, y, w, h);

    var lw = Math.max(1.4, 1.4 * dprScale());
    roundRectPath(c, x + lw, y + lw, w - lw * 2, h - lw * 2, Math.max(0, rad - lw));
    c.setLineDash([5 * dprScale(), 5 * dprScale()]);
    c.lineWidth = lw;
    c.strokeStyle = 'rgba(255,255,255,.16)';
    c.stroke();
    c.setLineDash([]);

    var mid = Math.min(w, h);
    var plus = Math.max(7, Math.min(mid * .09, 18));
    c.strokeStyle = 'rgba(255,255,255,.24)';
    c.lineWidth = Math.max(1.5, plus * .12);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x + w / 2 - plus, y + h / 2); c.lineTo(x + w / 2 + plus, y + h / 2);
    c.moveTo(x + w / 2, y + h / 2 - plus); c.lineTo(x + w / 2, y + h / 2 + plus);
    c.stroke();

    var fs = Math.max(9, Math.min(mid * .1, 13));
    c.fillStyle = 'rgba(255,255,255,.3)';
    c.font = '600 ' + fs + 'px "Segoe UI", system-ui, sans-serif';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(String(i + 1), x + fs * .9, y + fs * .8);
  }

  function dprScale() {
    var ratio = cv.width / Math.max(1, cv.clientWidth || cv.width);
    return ratio > 0 ? ratio : 1;
  }

  /* ── Khung vẽ: kích thước & vòng lặp ──────────────────────── */
  function fitCanvas() {
    var box = $('#stageInner').getBoundingClientRect();
    var padX = 44, padY = 40;
    var availW = Math.max(80, box.width - padX);
    var availH = Math.max(60, box.height - padY);
    var ar = state.W / state.H;
    var w = availW, h = w / ar;
    if (h > availH) { h = availH; w = h * ar; }
    w = Math.max(60, Math.floor(w));
    h = Math.max(40, Math.floor(h));
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var bw = Math.max(1, Math.round(w * dpr));
    var bh = Math.max(1, Math.round(h * dpr));
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
  }

  function requestRender() {
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      rafId = 0;
      var W = cv.width, H = cv.height;
      if (W && H) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        drawScene(ctx, W, H, false);
      }
    });
  }

  /* ── Ảnh: nhập & giải mã ──────────────────────────────────── */
  var MAX_EDGE = 3200;

  function isImageFile(f) {
    if (!f) return false;
    if (f.type && f.type.indexOf('image/') === 0) return true;
    return /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(f.name || '');
  }

  function decodeFile(file) {
    var opts = { imageOrientation: 'from-image' };
    return createImageBitmap(file, opts).catch(function () {
      return createImageBitmap(file);
    }).then(function (bmp) {
      var long = Math.max(bmp.width, bmp.height);
      if (long <= MAX_EDGE) return bmp;
      var k = MAX_EDGE / long;
      return createImageBitmap(bmp, {
        resizeWidth: Math.max(1, Math.round(bmp.width * k)),
        resizeHeight: Math.max(1, Math.round(bmp.height * k)),
        resizeQuality: 'high'
      }).then(function (small) {
        try { bmp.close(); } catch (e) { }
        return small;
      }).catch(function () { return bmp; });
    });
  }

  async function addFiles(list, targetIdx) {
    var files = Array.prototype.slice.call(list).filter(isImageFile);
    if (!files.length) { toast('Không tìm thấy ảnh hợp lệ', true); return; }

    var nextTarget = (typeof targetIdx === 'number') ? targetIdx : null;
    var added = 0;

    for (var i = 0; i < files.length; i++) {
      try {
        var bmp = await decodeFile(files[i]);
        var id = 'i' + (++seq);
        images.set(id, { id: id, name: files[i].name || ('ảnh-' + seq), bitmap: bmp, w: bmp.width, h: bmp.height });
        added++;
        if (nextTarget !== null) { assignImage(id, nextTarget); nextTarget = null; }
      } catch (err) {
        logLine('decode fail ' + (files[i].name || '') + ': ' + err, 'error');
        toast('Không đọc được: ' + (files[i].name || 'ảnh'), true);
      }
    }

    if (added) {
      autoFill();
      renderRail();
      requestRender();
      updateStatus();
      updateSelectionUI();
      toast('Đã thêm ' + added + ' ảnh');
    }
    saveState();
  }

  function assignImage(imgId, cellIdx) {
    if (cellIdx === null || cellIdx === undefined) return;
    var ci = cellIdx;
    var target = state.cells[ci];
    var n = activeCount();
    var prevId = target.imgId;
    var src = -1;
    for (var i = 0; i < n; i++) {
      if (i !== ci && state.cells[i].imgId === imgId) { src = i; break; }
    }
    // bỏ bản trùng trong các ngăn không hiển thị
    for (var j = n; j < state.cells.length; j++) {
      if (state.cells[j].imgId === imgId) { state.cells[j].imgId = null; resetTransform(state.cells[j]); }
    }
    // đổi chỗ nếu ảnh đã nằm trong khung khác
    if (src >= 0) { state.cells[src].imgId = prevId; resetTransform(state.cells[src]); }

    target.imgId = imgId;
    resetTransform(target);
    state.sel = ci;
    clampCell(target, cellFracs()[ci]);
    renderRail();
    requestRender();
    updateStatus();
    updateSelectionUI();
  }

  function removeImage(imgId) {
    var img = images.get(imgId);
    if (img && img.bitmap && img.bitmap.close) { try { img.bitmap.close(); } catch (e) { } }
    images.delete(imgId);
    for (var i = 0; i < state.cells.length; i++) {
      if (state.cells[i].imgId === imgId) {
        state.cells[i].imgId = null;
        state.cells[i].zoom = 1; state.cells[i].panX = 0; state.cells[i].panY = 0;
      }
    }
    renderRail();
    requestRender();
    updateStatus();
    updateSelectionUI();
  }

  /* ── Thư viện ảnh ─────────────────────────────────────────── */
  function makeThumbCanvas(bmp, px) {
    var c = document.createElement('canvas');
    c.width = c.height = px;
    var g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    var s = Math.max(px / bmp.width, px / bmp.height);
    var w = bmp.width * s, h = bmp.height * s;
    g.drawImage(bmp, (px - w) / 2, (px - h) / 2, w, h);
    return c;
  }

  function renderRail() {
    var grid = $('#railGrid');
    var empty = $('#railEmpty');
    var countEl = $('#railCount');
    countEl.textContent = String(images.size);
    $('#btnClear').disabled = images.size === 0;

    Array.prototype.slice.call(grid.querySelectorAll('.thumb')).forEach(function (n) { n.remove(); });

    if (!images.size) {
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';

    var used = {};
    var n = activeCount();
    for (var gi = 0; gi < n; gi++) {
      var c = state.cells[gi];
      if (c.imgId) { (used[c.imgId] = used[c.imgId] || []).push(gi + 1); }
    }

    var frag = document.createDocumentFragment();
    images.forEach(function (img) {
      var d = document.createElement('div');
      d.className = 'thumb';
      d.draggable = true;
      d.dataset.id = img.id;
      d.title = img.name + ' · ' + img.w + '×' + img.h;

      d.appendChild(makeThumbCanvas(img.bitmap, 168));

      var badges = used[img.id];
      if (badges && badges.length) {
        var b = document.createElement('span');
        b.className = 'badge';
        b.textContent = badges.join(',');
        d.appendChild(b);
      }

      var nm = document.createElement('span');
      nm.className = 'nm';
      nm.textContent = img.name;
      d.appendChild(nm);

      var kill = document.createElement('button');
      kill.className = 'kill';
      kill.textContent = '×';
      kill.title = 'Xoá ảnh';
      d.appendChild(kill);

      frag.appendChild(d);
    });
    grid.appendChild(frag);
  }

  /* ── Trạng thái / UI ──────────────────────────────────────── */
  function updateStatus() {
    var n = activeCount();
    var cell = state.cells[state.sel] || null;
    var img = imageOf(cell);
    $('#statusText').textContent = 'Khung ' + (state.sel + 1) + '/' + n + (img ? ' · ' + img.name : ' · trống');
    $('#statusZoom').textContent = Math.round((cell ? cell.zoom : 1) * 100) + '%';
    $('#statusSize').textContent = state.W + ' × ' + state.H;
  }

  function updateSelectionUI() {
    var cell = state.cells[state.sel] || null;
    var has = !!(cell && cell.imgId);
    $('#btnUnassign').disabled = !has;
    $('#btnReset').disabled = !has;
    $('#btnFitMode').disabled = !has;
    $('#btnFitMode').textContent = (cell && cell.mode === 'contain') ? 'Lấp đầy' : 'Vừa khung';
  }

  function toast(text, isError, actionLabel, actionFn, subText) {
    var wrap = $('#toasts');
    var el = document.createElement('div');
    el.className = 'toast' + (isError ? ' err' : '');

    var icon = document.createElement('span');
    icon.className = 'ti';
    icon.innerHTML = isError
      ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 8v5M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>'
      : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>';
    el.appendChild(icon);

    var tx = document.createElement('span');
    tx.className = 'tx';
    tx.textContent = text;
    if (subText) {
      var sub = document.createElement('small');
      sub.textContent = subText;
      tx.appendChild(sub);
    }
    el.appendChild(tx);

    if (actionLabel) {
      var act = document.createElement('button');
      act.className = 'act';
      act.textContent = actionLabel;
      act.onclick = function () { actionFn(); remove(); };
      el.appendChild(act);
    }

    wrap.appendChild(el);
    var timer = setTimeout(remove, isError ? 5200 : (actionLabel ? 4200 : 2600));
    function remove() {
      clearTimeout(timer);
      if (!el.parentNode) return;
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 190);
    }
    return el;
  }

  /* ── Tương tác trên canvas ────────────────────────────────── */
  function pointNorm(ev) {
    var r = cv.getBoundingClientRect();
    return { x: (ev.clientX - r.left) / r.width, y: (ev.clientY - r.top) / r.height };
  }

  function hitCell(nx, ny) {
    var rects = cellFracs();
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (nx >= r.x && nx <= r.x + r.w && ny >= r.y && ny <= r.y + r.h) return i;
    }
    return -1;
  }

  cv.addEventListener('pointerdown', function (ev) {
    if (ev.button !== 0) return;
    var p = pointNorm(ev);
    var idx = hitCell(p.x, p.y);
    if (idx < 0) {
      state.sel = -1;
      updateStatus(); updateSelectionUI(); requestRender();
      return;
    }
    if (idx !== state.sel) { state.sel = idx; updateStatus(); updateSelectionUI(); }
    var cell = state.cells[idx];
    var img = imageOf(cell);
    if (!img) {
      // khung trống → mở hộp thoại chọn ảnh cho đúng khung này
      requestRender();
      pickFiles(idx);
      return;
    }

    drag = {
      idx: idx, sx: ev.clientX, sy: ev.clientY,
      panX0: cell.panX, panY0: cell.panY, moved: false, pid: ev.pointerId
    };
    try { cv.setPointerCapture(ev.pointerId); } catch (e) { }
    cv.classList.add('grabbing');
    requestRender();
  });

  cv.addEventListener('pointermove', function (ev) {
    if (!drag) {
      var p = pointNorm(ev);
      var idx = hitCell(p.x, p.y);
      if (idx !== hoverCell) {
        hoverCell = idx;
        cv.classList.toggle('pointing', idx >= 0 && !imageOf(state.cells[idx]));
        requestRender();
      }
      return;
    }
    var r = cv.getBoundingClientRect();
    var dx = (ev.clientX - drag.sx) / r.width;
    var dy = (ev.clientY - drag.sy) / r.height;
    if (Math.abs(ev.clientX - drag.sx) + Math.abs(ev.clientY - drag.sy) > 2) drag.moved = true;

    var rects = cellFracs();
    var rect = rects[drag.idx];
    var cell = state.cells[drag.idx];
    cell.panX = drag.panX0 + dx / rect.w;
    cell.panY = drag.panY0 + dy / rect.h;
    clampCell(cell, rect);
    updateStatus();
    requestRender();
  });

  function endDrag(ev) {
    if (!drag) return;
    var wasClick = !drag.moved;
    var idx = drag.idx;
    drag = null;
    cv.classList.remove('grabbing');
    try { cv.releasePointerCapture(ev.pointerId); } catch (e) { }
    requestRender();
    if (wasClick) { /* giữ nguyên khung đang chọn */ }
  }
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);

  cv.addEventListener('pointerleave', function () {
    if (hoverCell !== -1 && !drag) { hoverCell = -1; requestRender(); }
  });

  cv.addEventListener('dblclick', function (ev) {
    var p = pointNorm(ev);
    var idx = hitCell(p.x, p.y);
    if (idx < 0) return;
    resetCell(idx);
    toast('Đã đặt lại khung ' + (idx + 1));
  });

  cv.addEventListener('wheel', function (ev) {
    if (!state.cells.length) return;
    var p = pointNorm(ev);
    var idx = hitCell(p.x, p.y);
    if (idx < 0) return;
    var cell = state.cells[idx];
    if (!imageOf(cell)) return;
    ev.preventDefault();

    state.sel = idx;
    var rects = cellFracs();
    var r = rects[idx];
    var fx = (p.x - r.x) / r.w;
    var fy = (p.y - r.y) / r.h;
    var factor = Math.exp(-ev.deltaY * 0.0016);
    var nz = clamp(cell.zoom * factor, 0.15, 12);
    var k = nz / cell.zoom;
    cell.panX = fx - 0.5 - (fx - 0.5 - cell.panX) * k;
    cell.panY = fy - 0.5 - (fy - 0.5 - cell.panY) * k;
    cell.zoom = nz;
    clampCell(cell, r);
    updateStatus(); updateSelectionUI(); requestRender();
  }, { passive: false });

  function resetCell(idx) {
    var cell = state.cells[idx];
    if (!cell) return;
    cell.zoom = 1; cell.panX = 0; cell.panY = 0; cell.mode = 'cover';
    state.sel = idx;
    updateStatus(); updateSelectionUI(); requestRender();
  }

  function nudge(dx, dy) {
    var cell = state.cells[state.sel];
    if (!cell || !cell.imgId) return;
    var r = cellFracs()[state.sel];
    cell.panX += dx / (r.w * state.W);
    cell.panY += dy / (r.h * state.H);
    clampCell(cell, r);
    updateStatus(); requestRender();
  }

  /* ── Kéo thả file ─────────────────────────────────────────── */
  var dragDepth = 0;
  function hasFiles(e) {
    if (!e.dataTransfer) return false;
    var t = e.dataTransfer.types;
    if (!t) return false;
    for (var i = 0; i < t.length; i++) if (t[i] === 'Files') return true;
    return false;
  }

  window.addEventListener('dragenter', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth++;
    $('#dropVeil').classList.add('on');
  });
  window.addEventListener('dragover', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  window.addEventListener('dragleave', function (e) {
    if (!hasFiles(e)) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) $('#dropVeil').classList.remove('on');
  });
  window.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0;
    $('#dropVeil').classList.remove('on');

    var target = null;
    var r = cv.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      var nx = (e.clientX - r.left) / r.width;
      var ny = (e.clientY - r.top) / r.height;
      var idx = hitCell(nx, ny);
      if (idx >= 0) target = idx;
    }
    addFiles(e.dataTransfer.files, target);
  });

  // Kéo ảnh có sẵn trong thư viện vào khung
  var internalDragId = null;
  document.addEventListener('dragstart', function (e) {
    var t = e.target.closest ? e.target.closest('.thumb') : null;
    if (!t) return;
    internalDragId = t.dataset.id;
    try {
      e.dataTransfer.setData('text/plain', internalDragId);
      e.dataTransfer.effectAllowed = 'copy';
    } catch (err) { }
  });
  document.addEventListener('dragend', function () { internalDragId = null; });

  cv.addEventListener('dragover', function (e) {
    if (!internalDragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    var p = pointNorm(e);
    var idx = hitCell(p.x, p.y);
    if (idx !== hoverCell) { hoverCell = idx; requestRender(); }
  });
  cv.addEventListener('drop', function (e) {
    if (!internalDragId) return;
    e.preventDefault();
    e.stopPropagation();
    var p = pointNorm(e);
    var idx = hitCell(p.x, p.y);
    if (idx >= 0) assignImage(internalDragId, idx);
    internalDragId = null;
    hoverCell = -1;
    requestRender();
  });

  /* Dán ảnh từ clipboard */
  document.addEventListener('paste', function (e) {
    if (!e.clipboardData) return;
    var files = [];
    var items = e.clipboardData.items || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        var f = items[i].getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) { e.preventDefault(); addFiles(files, null); }
  });

  /* ── Xuất ảnh ─────────────────────────────────────────────── */
  function blobToBase64(blob) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () {
        var s = String(fr.result);
        res(s.substring(s.indexOf(',') + 1));
      };
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  }

  function cleanName() {
    var n = (state.filename || 'thumbnail').trim().replace(/[\\/:*?"<>|]+/g, '-');
    return n || 'thumbnail';
  }

  async function doExport(devPath) {
    if (exporting) return;
    if (!state.cells.some(function (c, i) { return i < activeCount() && c.imgId; })) {
      toast('Chưa có ảnh nào trong khung', true);
      return;
    }
    exporting = true;
    var btn = $('#btnExport2');
    btn.classList.add('busy');
    var t0 = performance.now();

    try {
      var W = state.W, H = state.H;
      var c = document.createElement('canvas');
      c.width = W; c.height = H;
      var g = c.getContext('2d', { alpha: state.format === 'png' });
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'high';
      drawScene(g, W, H, true);

      var fmt = FORMATS[state.format] || FORMATS.png;
      var q = state.format === 'png' ? undefined : state.quality / 100;
      var blob = await new Promise(function (res) { c.toBlob(res, fmt.mime, q); });
      if (!blob) { toast('Trình duyệt không hỗ trợ định dạng này', true); return; }

      var name = cleanName();

      if (bridge) {
        var b64 = await blobToBase64(blob);
        if (typeof devPath === 'string' && devPath) {
          post({ type: 'saveTo', path: devPath, name: name, mime: fmt.mime, data: b64 });
        } else {
          post({ type: 'save', name: name, mime: fmt.mime, data: b64 });
        }
      } else {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name + fmt.ext;
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
        toast('Đã tải xuống ' + name + fmt.ext);
      }
      logLine('export ' + W + 'x' + H + ' ' + state.format + ' ' + Math.round(performance.now() - t0) + 'ms');
    } catch (err) {
      logLine('export fail: ' + err, 'error');
      toast('Xuất ảnh thất bại', true);
    } finally {
      exporting = false;
      btn.classList.remove('busy');
    }
  }

  /* ── Nối UI ───────────────────────────────────────────────── */
  function buildLayouts() {
    var wrap = $('#layouts');
    var list = LAYOUTS.filter(function (l) { return l.n === state.count; });
    var html = '';
    list.forEach(function (l) {
      var mini = '';
      l.rects.forEach(function (r) {
        mini += '<i style="left:' + (r.x * 100) + '%;top:' + (r.y * 100) + '%;width:' +
          (r.w * 100) + '%;height:' + (r.h * 100) + '%;box-shadow:0 0 0 1px #0b0e13"></i>';
      });
      html += '<button class="lay' + (l.id === state.layout ? ' on' : '') + '" data-id="' + l.id + '" title="' + l.name + '">' +
        '<span class="mini">' + mini + '</span><span>' + l.name + '</span></button>';
    });
    wrap.innerHTML = html;

    Array.prototype.forEach.call(wrap.querySelectorAll('.lay'), function (b) {
      b.onclick = function () { setLayout(b.dataset.id); };
    });
  }

  function setLayout(id) {
    if (!LAYOUT_BY_ID[id]) return;
    state.layout = id;
    state.layoutByCount[LAYOUT_BY_ID[id].n] = id;
    syncCells();
    autoFill();
    var rects = cellFracs();
    for (var i = 0; i < rects.length; i++) clampCell(state.cells[i], rects[i]);
    renderRail();
    buildLayouts();
    updateSegCount();
    updateStatus(); updateSelectionUI(); requestRender(); saveState();
  }

  function setCount(n) {
    var prev = state.layoutByCount[n] || (LAYOUTS.filter(function (l) { return l.n === n; })[0] || {}).id;
    setLayout(prev);
  }

  function updateSegCount() {
    Array.prototype.forEach.call($('#segCount').children, function (b) {
      b.classList.toggle('on', Number(b.dataset.n) === state.count);
    });
  }

  function setRangeFill(el) {
    var min = Number(el.min), max = Number(el.max), v = Number(el.value);
    el.style.setProperty('--pct', ((v - min) / (max - min) * 100) + '%');
  }

  function syncInputs() {
    $('#inW').value = state.W;
    $('#inH').value = state.H;
    var presetKey = state.W + 'x' + state.H;
    $('#sizePreset').value = PRESETS[presetKey] ? presetKey : 'custom';

    $('#inGap').value = state.gap; $('#gapVal').textContent = state.gap;
    $('#inRadius').value = state.radius; $('#radiusVal').textContent = state.radius;
    $('#inBg').value = state.bg;
    $('#inQuality').value = state.quality; $('#qualityVal').textContent = state.quality + '%';
    $('#inName').value = state.filename;

    setRangeFill($('#inGap')); setRangeFill($('#inRadius')); setRangeFill($('#inQuality'));

    Array.prototype.forEach.call($('#segFormat').children, function (b) {
      b.classList.toggle('on', b.dataset.f === state.format);
    });
    $('#qualityWrap').style.display = state.format === 'png' ? 'none' : '';

    var sw = $('#swatches');
    if (!sw.children.length) {
      ['#0b0d11', '#000000', '#ffffff', '#1a1a1a', '#0f2b46', '#2b1030'].forEach(function (col) {
        var b = document.createElement('button');
        b.className = 'sw';
        b.dataset.c = col;
        b.style.background = col;
        b.onclick = function () { state.bg = col; syncInputs(); requestRender(); saveState(); };
        sw.appendChild(b);
      });
    }
    Array.prototype.forEach.call(sw.children, function (b) {
      b.classList.toggle('on', b.dataset.c.toLowerCase() === state.bg.toLowerCase());
    });

    updateSegCount();
    updateStatus();
    updateSelectionUI();
  }

  function bindUI() {
    $('#btnAdd').onclick = function () { pickFiles(null); };
    $('#btnAdd2').onclick = function () { pickFiles(null); };
    $('#btnExport').onclick = function () { doExport(); };
    $('#btnExport2').onclick = function () { doExport(); };

    $('#fileInput').addEventListener('change', function (e) {
      var files = e.target.files;
      addFiles(files, pendingPick);
      pendingPick = null;
      e.target.value = '';
    });

    $('#segCount').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) setCount(Number(b.dataset.n));
    });
    $('#segFormat').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      state.format = b.dataset.f;
      syncInputs(); saveState();
    });

    $('#sizePreset').addEventListener('change', function (e) {
      var v = e.target.value;
      if (PRESETS[v]) {
        state.W = PRESETS[v][0]; state.H = PRESETS[v][1];
        $('#inW').value = state.W; $('#inH').value = state.H;
        applySize();
      }
    });

    function applySize() {
      var w = clamp(parseInt($('#inW').value, 10) || state.W, 64, 4096);
      var h = clamp(parseInt($('#inH').value, 10) || state.H, 64, 4096);
      state.W = Math.round(w / 2) * 2;
      state.H = Math.round(h / 2) * 2;
      var rects = cellFracs();
      state.cells.forEach(function (c, i) { clampCell(c, rects[i]); });
      fitCanvas(); updateStatus(); requestRender(); saveState();
    }
    $('#inW').addEventListener('change', function () { $('#sizePreset').value = 'custom'; applySize(); });
    $('#inH').addEventListener('change', function () { $('#sizePreset').value = 'custom'; applySize(); });

    $('#inGap').addEventListener('input', function (e) {
      state.gap = Number(e.target.value);
      $('#gapVal').textContent = state.gap;
      setRangeFill(e.target);
      var rects = cellFracs();
      state.cells.forEach(function (c, i) { clampCell(c, rects[i]); });
      requestRender(); saveState();
    });
    $('#inRadius').addEventListener('input', function (e) {
      state.radius = Number(e.target.value);
      $('#radiusVal').textContent = state.radius;
      setRangeFill(e.target);
      requestRender(); saveState();
    });
    $('#inQuality').addEventListener('input', function (e) {
      state.quality = Number(e.target.value);
      $('#qualityVal').textContent = state.quality + '%';
      setRangeFill(e.target);
      saveState();
    });
    $('#inBg').addEventListener('input', function (e) {
      state.bg = e.target.value;
      syncInputs(); requestRender(); saveState();
    });
    $('#inName').addEventListener('input', function (e) {
      state.filename = e.target.value;
      saveState();
    });

    $('#btnFitMode').onclick = function () {
      var cell = state.cells[state.sel];
      if (!cell || !cell.imgId) return;
      cell.mode = cell.mode === 'contain' ? 'cover' : 'contain';
      cell.panX = 0; cell.panY = 0;
      clampCell(cell, cellFracs()[state.sel]);
      updateSelectionUI(); requestRender();
    };
    $('#btnReset').onclick = function () { resetCell(state.sel); };
    $('#btnUnassign').onclick = function () {
      var cell = state.cells[state.sel];
      if (!cell || !cell.imgId) return;
      cell.imgId = null; cell.zoom = 1; cell.panX = 0; cell.panY = 0;
      renderRail(); updateStatus(); updateSelectionUI(); requestRender();
    };
    $('#btnClear').onclick = function () {
      if (!images.size) return;
      images.forEach(function (img) { if (img.bitmap && img.bitmap.close) { try { img.bitmap.close(); } catch (e) { } } });
      images.clear();
      state.cells.forEach(function (c) { c.imgId = null; c.zoom = 1; c.panX = 0; c.panY = 0; });
      renderRail(); updateStatus(); updateSelectionUI(); requestRender();
      toast('Đã xoá toàn bộ ảnh');
    };

    $('#railGrid').addEventListener('click', function (e) {
      var thumbs = Array.prototype.slice.call(document.querySelectorAll('.thumb'));
      var t = e.target.closest('.thumb');
      if (!t) return;
      var id = t.dataset.id;
      if (e.target.classList.contains('kill')) {
        removeImage(id);
        return;
      }
      var target = state.sel;
      if (target < 0) target = 0;
      assignImage(id, target);
    });

    // phím tắt
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      var step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-step, 0); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); nudge(step, 0); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); nudge(0, -step); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); nudge(0, step); }
      else if (e.key === 'Delete') { $('#btnUnassign').click(); }
      else if (e.key === '+' || e.key === '=') { zoomSel(1.1); }
      else if (e.key === '-') { zoomSel(1 / 1.1); }
      else if (e.key === '0') { resetCell(state.sel); }
      else if (e.key === 'o' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); pickFiles(null); }
      else if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doExport(); }      else if (e.key === 'f' || e.key === 'F') { $('#btnFitMode').click(); }
      else if (e.key === '2' || e.key === '3' || e.key === '4') { setCount(Number(e.key)); }
      else if (e.key === 'Tab') {
        e.preventDefault();
        var cn = activeCount();
        state.sel = (state.sel + (e.shiftKey ? -1 : 1) + cn) % cn;
        updateStatus(); updateSelectionUI(); requestRender();
      }
    });

    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { fitCanvas(); requestRender(); });
      ro.observe($('#stageInner'));
    } else {
      window.addEventListener('resize', function () { fitCanvas(); requestRender(); });
    }
    window.addEventListener('resize', function () { fitCanvas(); requestRender(); });
  }

  function zoomSel(factor) {
    var cell = state.cells[state.sel];
    if (!cell || !cell.imgId) return;
    cell.zoom = clamp(cell.zoom * factor, 0.15, 12);
    clampCell(cell, cellFracs()[state.sel]);
    updateStatus(); requestRender();
  }

  function pickFiles(targetIdx) {
    pendingPick = (typeof targetIdx === 'number') ? targetIdx : null;
    $('#fileInput').click();
  }

  /* ── Thông điệp từ host ───────────────────────────────────── */
  if (bridge) {
    bridge.addEventListener('message', function (e) {
      var d = e.data;
      if (typeof d === 'string') { try { d = JSON.parse(d); } catch (err) { return; } }
      if (!d || typeof d.ok !== 'boolean') return;

      if (d.ok) {
        var p = d.path || '';
        var cut = p.lastIndexOf('\\');
        var fname = cut >= 0 ? p.substring(cut + 1) : p;
        var dir = cut > 0 ? p.substring(0, cut) : '';
        toast('Đã lưu ' + fname, false, 'Mở thư mục', function () {
          post({ type: 'reveal', path: p });
        }, dir);
      } else if (d.canceled) {
        toast('Đã huỷ lưu');
      } else {
        toast('Không lưu được ảnh', true);
      }
    });
  }

  /* ── Khởi động ────────────────────────────────────────────── */
  function init() {
    restoreState();
    syncCells();
    bindUI();
    syncInputs();
    buildLayouts();
    renderRail();
    fitCanvas();
    requestRender();
    updateStatus();
    post({ type: 'ready' });
    logLine('init ok · ' + cv.width + 'x' + cv.height);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // cho phép test qua console
  window.__tm = {
    state: state, images: images, addFiles: addFiles, setLayout: setLayout,
    setCount: setCount, render: requestRender, exportTo: doExport,
    syncInputs: syncInputs, fitCanvas: fitCanvas,
    renderSync: function () {
      var t0 = performance.now();
      drawScene(ctx, cv.width, cv.height, false);
      return performance.now() - t0;
    },
    setSize: function (w, h) {
      state.W = w; state.H = h;
      var rects = cellFracs();
      state.cells.forEach(function (c, i) { clampCell(c, rects[i]); });
      fitCanvas(); syncInputs(); requestRender();
    }
  };
})();
