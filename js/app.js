(function () {
  'use strict';

  const COMBO_IDS = ['slack-to-slack', 'slack-to-chat', 'slack-to-teams', 'teams-to-teams', 'teams-to-chat', 'chat-to-chat', 'chat-to-teams'];

  const DATA = {
    features: [],
    limitations: []
  };

  let currentCombo = 'slack-to-chat';
  let currentSection = 'features';
  let searchQuery = { features: '', limitations: '' };
  let activeFamily = { features: '', limitations: '' };

  const panels = {
    features: document.getElementById('panel-features'),
    limitations: document.getElementById('panel-limitations')
  };

  const tableBodies = {
    features: document.getElementById('tableBodyFeatures'),
    limitations: document.getElementById('tableBodyLimitations')
  };

  const filterContainers = {
    features: document.getElementById('filterTagsFeatures'),
    limitations: document.getElementById('filterTagsLimitations')
  };

  const searchInputs = {
    features: document.getElementById('searchInput'),
    limitations: document.getElementById('searchInputLimitations')
  };

  const clearButtons = {
    features: document.getElementById('clearFiltersFeatures'),
    limitations: document.getElementById('clearFiltersLimitations')
  };

  function loadJSON(path) {
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error('Failed to load ' + path);
      return res.json();
    });
  }

  function loadData(combo) {
    var c = combo || currentCombo;
    return Promise.all([
      loadJSON('data/' + c + '/supported-features.json').then(function (arr) {
        DATA.features = Array.isArray(arr) ? arr : [];
      }),
      loadJSON('data/' + c + '/limitations.json').then(function (arr) {
        DATA.limitations = Array.isArray(arr) ? arr : [];
      })
    ]);
  }

  function getFamilies(list) {
    const set = new Set();
    list.forEach(function (item) {
      if (item.family) set.add(item.family);
      if (Array.isArray(item.children)) {
        item.children.forEach(function (child) {
          if (child && child.family) set.add(child.family);
        });
      }
    });
    return Array.from(set).sort();
  }

  function itemMatchesQuery(item, q) {
    if (!q) return true;
    const name = (item.name || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    return name.includes(q) || desc.includes(q);
  }

  function filterItems(list, section) {
    const q = (searchQuery[section] || '').trim().toLowerCase();
    const family = activeFamily[section] || '';

    return list.filter(function (item) {
      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
      const matchFamily = !family || item.family === family;
      if (hasChildren) {
        const childMatchFamily = !family || item.children.some(function (c) { return c.family === family; });
        if (!matchFamily && !childMatchFamily) return false;
        if (!q) return true;
        if (itemMatchesQuery(item, q)) return true;
        return item.children.some(function (c) { return itemMatchesQuery(c, q); });
      }
      if (!matchFamily) return false;
      if (!q) return true;
      return itemMatchesQuery(item, q);
    });
  }

  function renderFilterTags(section) {
    const list = section === 'features' ? DATA.features : DATA.limitations;
    const container = filterContainers[section];
    const families = getFamilies(list);

    container.innerHTML = '';
    families.forEach(function (family) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-tag' + (activeFamily[section] === family ? ' active' : '');
      btn.dataset.family = family;
      btn.textContent = family;
      btn.addEventListener('click', function () {
        setActiveFamily(section, family);
      });
      container.appendChild(btn);
    });
  }

  function setActiveFamily(section, family) {
    activeFamily[section] = family;

    const container = filterContainers[section];
    const allBtn = container.previousElementSibling;
    const clearBtn = section === 'features' ? clearButtons.features : clearButtons.limitations;

    container.querySelectorAll('.filter-tag').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.family === family);
    });
    if (allBtn) allBtn.classList.toggle('active', !family);
    if (clearBtn) clearBtn.classList.toggle('hidden', !family);

    renderTable(section);
  }

  function renderTable(section) {
    const list = section === 'features' ? DATA.features : DATA.limitations;
    const filtered = filterItems(list, section);
    const tbody = tableBodies[section];

    tbody.innerHTML = '';

    if (filtered.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="4" class="empty-state">No items match your search or filter.</td>';
      tbody.appendChild(tr);
      return;
    }

    filtered.forEach(function (item) {
      var hasChildren = Array.isArray(item.children) && item.children.length > 0;
      if (!hasChildren) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-feature-slug', toSlug(item.name));
        var screenshotCell = renderScreenshotCell(item.screenshot, currentCombo, item.name, section);
        tr.innerHTML =
          '<td class="col-name">' + escapeHtml(item.name) + '</td>' +
          '<td class="col-description">' + escapeHtml(item.description) + '</td>' +
          '<td class="col-screenshot">' + screenshotCell + '</td>' +
          '<td class="col-family"><span class="family-badge">' + escapeHtml(item.family || '') + '</span></td>';
        tbody.appendChild(tr);
        return;
      }
      var parentTr = document.createElement('tr');
      parentTr.className = 'parent-row';
      parentTr.setAttribute('data-feature-slug', toSlug(item.name));
      var parentScreenshotCell = renderScreenshotCell(item.screenshot, currentCombo, item.name, section);
      parentTr.innerHTML =
        '<td class="col-name">' + escapeHtml(item.name) + '</td>' +
        '<td class="col-description">' + escapeHtml(item.description) + '</td>' +
        '<td class="col-screenshot">' + parentScreenshotCell + '</td>' +
        '<td class="col-family"><span class="family-badge">' + escapeHtml(item.family || '') + '</span></td>';
      tbody.appendChild(parentTr);
      item.children.forEach(function (child) {
        const childTr = document.createElement('tr');
        childTr.className = 'child-row';
        childTr.setAttribute('data-feature-slug', toSlug(child.name));
        var childScreenshotCell = renderScreenshotCell(child.screenshot, currentCombo, child.name, section);
        childTr.innerHTML =
          '<td class="col-name col-name-child">' + escapeHtml(child.name) + '</td>' +
          '<td class="col-description">' + escapeHtml(child.description || '') + '</td>' +
          '<td class="col-screenshot">' + childScreenshotCell + '</td>' +
          '<td class="col-family"><span class="family-badge">' + escapeHtml(child.family || item.family || '') + '</span></td>';
        tbody.appendChild(childTr);
      });
    });
  }

  function toSlug(name) {
    if (!name || typeof name !== 'string') return '';
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function renderScreenshotCell(screenshot, combo, featureName, section) {
    var slug = toSlug(featureName);
    var screenshotsUrl = 'screenshots.html?combo=' + encodeURIComponent(combo || currentCombo) + '&feature=' + encodeURIComponent(slug);
    if (section) screenshotsUrl += '&section=' + encodeURIComponent(section);
    if (!screenshot || typeof screenshot !== 'string' || screenshot.trim() === '') {
      return '<a href="' + escapeHtml(screenshotsUrl) + '" class="screenshot-link">Screenshots</a>';
    }
    var escaped = escapeHtml(screenshot);
    if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(screenshot)) {
      return '<a href="' + escaped + '" target="_blank" rel="noopener"><img src="' + escaped + '" alt="Screenshot" class="screenshot-thumb" loading="lazy"></a>';
    }
    return '<a href="' + escaped + '" target="_blank" rel="noopener" class="screenshot-link">View</a>';
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function switchSection(section) {
    currentSection = section;

    document.querySelectorAll('.nav-link').forEach(function (a) {
      a.classList.toggle('active', a.dataset.section === section);
    });

    document.querySelectorAll('.content-panel').forEach(function (panel) {
      panel.classList.remove('active');
      panel.hidden = true;
    });
    if (panels[section]) {
      panels[section].classList.add('active');
      panels[section].hidden = false;
    }

    renderTable(section);
    updateBrowserUrl();
  }

  function onSearchInput(section, value) {
    searchQuery[section] = value;
    renderTable(section);
  }

  function initSidebar() {
    var sidebar = document.getElementById('sidebar');
    var toggle = document.getElementById('sidebarToggle');
    var arrowEl = document.getElementById('sidebarArrow');
    var menuBtn = document.getElementById('sidebarMenuBtn');
    function updateArrow() {
      if (arrowEl) arrowEl.textContent = sidebar.classList.contains('collapsed') ? '→' : '←';
    }
    function updateMenuBtn() {
      if (!menuBtn) return;
      var isCollapsed = sidebar.classList.contains('collapsed');
      menuBtn.textContent = isCollapsed ? '☰' : '←';
      menuBtn.setAttribute('aria-label', isCollapsed ? 'Open message combinations' : 'Close message combinations');
    }
    function toggleSidebar() {
      sidebar.classList.toggle('collapsed');
      updateArrow();
      updateMenuBtn();
    }
    if (toggle && sidebar) {
      toggle.addEventListener('click', toggleSidebar);
      updateArrow();
    }
    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', toggleSidebar);
      updateMenuBtn();
    }

    document.querySelectorAll('.combo-link').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var combo = a.dataset.combo;
        if (combo) switchCombo(combo);
      });
    });

    document.querySelectorAll('.nav-link').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var section = a.dataset.section;
        if (section) switchSection(section);
      });
    });
  }

  function initSearch() {
    searchInputs.features.addEventListener('input', function () {
      onSearchInput('features', this.value);
    });
    searchInputs.limitations.addEventListener('input', function () {
      onSearchInput('limitations', this.value);
    });

    var searchTrigger = document.querySelector('.search-trigger');
    if (searchTrigger) {
      searchTrigger.addEventListener('click', function () {
        var input = currentSection === 'features' ? searchInputs.features : searchInputs.limitations;
        input.focus();
      });
    }

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        var input = currentSection === 'features' ? searchInputs.features : searchInputs.limitations;
        if (input) input.focus();
      }
    });
  }

  function initClearFilters() {
    panels.features.querySelector('.filter-tag[data-family=""]').addEventListener('click', function () {
      setActiveFamily('features', '');
    });
    panels.limitations.querySelector('.filter-tag[data-family=""]').addEventListener('click', function () {
      setActiveFamily('limitations', '');
    });
    clearButtons.features.addEventListener('click', function () {
      setActiveFamily('features', '');
    });
    clearButtons.limitations.addEventListener('click', function () {
      setActiveFamily('limitations', '');
    });
  }

  function switchCombo(combo) {
    currentCombo = combo;
    document.querySelectorAll('.combo-link').forEach(function (a) {
      a.classList.toggle('active', a.dataset.combo === combo);
    });
    loadData(combo)
      .then(function () {
        searchQuery.features = '';
        searchQuery.limitations = '';
        activeFamily.features = '';
        activeFamily.limitations = '';
        if (searchInputs.features) searchInputs.features.value = '';
        if (searchInputs.limitations) searchInputs.limitations.value = '';
        renderFilterTags('features');
        renderFilterTags('limitations');
        renderTable('features');
        renderTable('limitations');
        var allFeatures = panels.features && panels.features.querySelector('.filter-tag[data-family=""]');
        var allLimitations = panels.limitations && panels.limitations.querySelector('.filter-tag[data-family=""]');
        if (allFeatures) allFeatures.classList.add('active');
        if (allLimitations) allLimitations.classList.add('active');
        if (clearButtons.features) clearButtons.features.classList.add('hidden');
        if (clearButtons.limitations) clearButtons.limitations.classList.add('hidden');
        updateBrowserUrl();
      })
      .catch(function (err) {
        console.error(err);
        DATA.features = [];
        DATA.limitations = [];
        renderFilterTags('features');
        renderFilterTags('limitations');
        renderTable('features');
        renderTable('limitations');
      });
  }

  function getQueryParams() {
    var params = {};
    var q = (window.location.search || '').slice(1).split('&');
    for (var i = 0; i < q.length; i++) {
      var parts = q[i].split('=');
      if (parts.length >= 2) params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1].replace(/\+/g, ' '));
    }
    return params;
  }

  function buildDocsUrl(combo, section, opts) {
    var params = [];
    if (combo) params.push('combo=' + encodeURIComponent(combo));
    if (section) params.push('section=' + encodeURIComponent(section));
    if (opts && opts.edit) params.push('edit=1');
    return 'index.html' + (params.length ? '?' + params.join('&') : '');
  }

  function updateBrowserUrl() {
    var params = getQueryParams();
    var url = buildDocsUrl(currentCombo, currentSection, params.edit === '1' ? { edit: 1 } : null);
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', url);
    }
  }

  function init() {
    var params = getQueryParams();
    if (params.combo && COMBO_IDS.indexOf(params.combo) !== -1) currentCombo = params.combo;
    if (params.section === 'features' || params.section === 'limitations') currentSection = params.section;
    var scrollToFeature = (params.feature || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');

    loadData(currentCombo)
      .then(function () {
        renderFilterTags('features');
        renderFilterTags('limitations');
        renderTable('features');
        renderTable('limitations');
        document.querySelectorAll('.combo-link').forEach(function (a) {
          a.classList.toggle('active', a.dataset.combo === currentCombo);
        });
        initSidebar();
        initSearch();
        initClearFilters();
        switchSection(currentSection);
        if (scrollToFeature) {
          setTimeout(function () {
            var row = document.querySelector('tr[data-feature-slug="' + scrollToFeature + '"]');
            if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            updateBrowserUrl();
          }, 150);
        } else {
          updateBrowserUrl();
        }
      })
      .catch(function (err) {
        console.error(err);
        tableBodies.features.innerHTML = '<tr><td colspan="4" class="empty-state">Failed to load data. Serve the app from a local server (e.g. live-server) so JSON can be loaded.</td></tr>';
        tableBodies.limitations.innerHTML = '<tr><td colspan="4" class="empty-state">Failed to load data.</td></tr>';
      });
  }

  init();
})();
