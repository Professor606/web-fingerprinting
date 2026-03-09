// ─── State ─────────────────────────────────────────────────────────────────
let authToken = localStorage.getItem('admin_token') || '';
let map = null;
let timelineChart = null;
let browserChart = null;
let currentPage = 1;

function logout() {
    authToken = '';
    localStorage.removeItem('admin_token');
    window.location.href = '/api/admin/logout';
}

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});


// ─── API Helper ────────────────────────────────────────────────────────────
function api(path) {
    return fetch(path, {
        headers: { 'Authorization': `Bearer ${authToken}` },
    }).then(r => {
        if (r.status === 401) { logout(); throw new Error('Session expired'); }
        return r.json();
    });
}

// ─── Init ──────────────────────────────────────────────────────────────────
function initDashboard() {
    loadStats();
    loadVisits(1);
    loadMap();
    loadTimeline();

    // Search on Enter
    document.getElementById('search-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loadVisits(1);
    });

    document.getElementById('last-updated').textContent =
        'Updated ' + new Date().toLocaleTimeString();
}

// ─── Stats ─────────────────────────────────────────────────────────────────
async function loadStats() {
    try {
        const data = await api('/api/admin/stats');

        document.getElementById('stat-total').textContent = data.totalVisits.toLocaleString();
        document.getElementById('stat-users').textContent = data.uniqueUsers.toLocaleString();
        document.getElementById('stat-ips').textContent = data.uniqueIPs.toLocaleString();
        document.getElementById('stat-country').textContent =
            data.topCountries.length > 0 ? data.topCountries[0]._id : '—';

        // Browser chart
        renderBrowserChart(data.browserStats);
    } catch (err) {
        console.error('Stats error:', err);
    }
}

// ─── Browser Chart ─────────────────────────────────────────────────────────
function renderBrowserChart(browserStats) {
    const ctx = document.getElementById('browser-chart').getContext('2d');

    if (browserChart) browserChart.destroy();

    const colors = ['#6c5ce7', '#00cec9', '#fd79a8', '#fdcb6e', '#636e72'];

    browserChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: browserStats.map(b => b._id),
            datasets: [{
                data: browserStats.map(b => b.count),
                backgroundColor: colors.slice(0, browserStats.length),
                borderColor: '#1a1a2e',
                borderWidth: 3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#8888a0',
                        font: { family: 'Inter', size: 11 },
                        padding: 12,
                    }
                }
            },
            cutout: '65%',
        }
    });
}

// ─── Timeline Chart ────────────────────────────────────────────────────────
async function loadTimeline() {
    try {
        const data = await api('/api/admin/timeline?days=30');

        const ctx = document.getElementById('timeline-chart').getContext('2d');
        if (timelineChart) timelineChart.destroy();

        timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: [
                    {
                        label: 'Visits',
                        data: data.map(d => d.visits),
                        borderColor: '#6c5ce7',
                        backgroundColor: 'rgba(108, 92, 231, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#6c5ce7',
                    },
                    {
                        label: 'Unique Users',
                        data: data.map(d => d.uniqueUsers),
                        borderColor: '#00cec9',
                        backgroundColor: 'rgba(0, 206, 201, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: '#00cec9',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: '#55556a', font: { size: 10 } },
                        grid: { color: 'rgba(42, 42, 62, 0.5)' },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#55556a',
                            font: { size: 10 },
                            stepSize: 1,
                        },
                        grid: { color: 'rgba(42, 42, 62, 0.5)' },
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#8888a0',
                            font: { family: 'Inter', size: 11 },
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error('Timeline error:', err);
    }
}

// ─── Map ───────────────────────────────────────────────────────────────────
async function loadMap() {
    try {
        if (!map) {
            map = L.map('map', {
                center: [30, 35],
                zoom: 3,
                zoomControl: true,
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CartoDB',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(map);
        }

        const locations = await api('/api/admin/locations');

        locations.forEach(loc => {
            if (!loc._id) return;
            const [lat, lng] = loc._id.split(',').map(Number);
            if (isNaN(lat) || isNaN(lng)) return;

            const marker = L.circleMarker([lat, lng], {
                radius: Math.min(6 + loc.count * 2, 18),
                color: '#6c5ce7',
                fillColor: '#6c5ce7',
                fillOpacity: 0.6,
                weight: 1,
            }).addTo(map);

            marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;font-size:13px;">
          <strong>${loc.city || 'Unknown'}, ${loc.country || 'Unknown'}</strong><br>
          <span style="color:#666">Visits: ${loc.count}</span>
        </div>
      `);
        });
    } catch (err) {
        console.error('Map error:', err);
    }
}

// ─── Visits Table ──────────────────────────────────────────────────────────
async function loadVisits(page) {
    currentPage = page;
    const search = document.getElementById('search-input').value.trim();
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';

    try {
        const data = await api(`/api/admin/visits?page=${page}&limit=25${searchParam}`);
        const tbody = document.getElementById('visits-tbody');

        if (data.visits.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty">No visits found</td></tr>';
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        tbody.innerHTML = data.visits.map(v => {
            const time = new Date(v.timestamp).toLocaleString();
            const ip = v.info?.ip || '—';
            const country = v.info?.ipLocation?.country || '—';
            const city = v.info?.ipLocation?.city || '—';
            const platform = v.info?.platform || '—';

            return `<tr>
        <td>${time}</td>
        <td><span class="user-id-badge">${v.userID}</span></td>
        <td><span class="net-id-badge">${v.networkID}</span></td>
        <td style="font-family:var(--font-mono);font-size:0.8rem">${ip}</td>
        <td>${country}</td>
        <td>${city}</td>
        <td>${platform}</td>
        <td>
          <button class="btn-action" onclick="showUserDetail(${v.userID})">👤 User</button>
          <button class="btn-action match" onclick="showMatch('${v._id}')">🔗 Match</button>
        </td>
      </tr>`;
        }).join('');

        // Pagination
        renderPagination(data.page, data.totalPages);
    } catch (err) {
        console.error('Visits error:', err);
    }
}

function renderPagination(current, total) {
    const container = document.getElementById('pagination');
    if (total <= 1) { container.innerHTML = ''; return; }

    let html = '';
    const start = Math.max(1, current - 3);
    const end = Math.min(total, current + 3);

    if (current > 1) html += `<button class="page-btn" onclick="loadVisits(${current - 1})">← Prev</button>`;
    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="loadVisits(${i})">${i}</button>`;
    }
    if (current < total) html += `<button class="page-btn" onclick="loadVisits(${current + 1})">Next →</button>`;

    container.innerHTML = html;
}

// ─── User Detail Modal ─────────────────────────────────────────────────────
async function showUserDetail(userID) {
    openModal(`👤 User #${userID} — Visit History`);

    try {
        const data = await api(`/api/admin/user/${userID}`);

        let html = `<div class="detail-grid">
      <div class="detail-item">
        <span class="label">User ID</span>
        <span class="value">${userID}</span>
      </div>
      <div class="detail-item">
        <span class="label">Total Visits</span>
        <span class="value">${data.totalVisits}</span>
      </div>
    </div>`;

        // Latest visit fingerprints
        const latest = data.visits[0];
        if (latest && latest.fingerprints) {
            html += '<h4 class="section-title">🔑 Latest Fingerprints (17 Hashes)</h4>';
            html += '<div class="hash-list">';
            for (const [key, value] of Object.entries(latest.fingerprints)) {
                if (key === '_id') continue;
                html += `<div class="hash-row">
          <span class="hash-name">${formatHashName(key)}</span>
          <span class="hash-value" title="${value}">${value || '—'}</span>
        </div>`;
            }
            html += '</div>';
        }

        // Latest visit info
        if (latest && latest.info) {
            html += '<h4 class="section-title">📱 Device Info</h4>';
            html += '<div class="detail-grid">';
            html += detailItem('IP', latest.info.ip);
            html += detailItem('Location', `${latest.info.ipLocation?.city || '?'}, ${latest.info.ipLocation?.country || '?'}`);
            html += detailItem('Platform', latest.info.platform);
            html += detailItem('User Agent', latest.info.userAgent);
            html += detailItem('Do Not Track', latest.info.doNotTrack);
            html += detailItem('Language', latest.info.language);
            html += detailItem('Timezone', latest.info.timezone);
            html += detailItem('Screen', latest.info.screen ? `${latest.info.screen.width}×${latest.info.screen.height}` : '—');
            html += detailItem('CPU Cores', latest.info.hardwareConcurrency);
            html += detailItem('Memory', latest.info.deviceMemory ? `${latest.info.deviceMemory} GB` : '—');
            html += '</div>';

            // Fonts
            if (latest.info.fonts && latest.info.fonts.detectedFonts) {
                html += `<h4 class="section-title">🔤 Fonts Detected (${latest.info.fonts.fontCount})</h4>`;
                html += `<p style="font-size:0.8rem;color:var(--text-secondary);word-break:break-word">${latest.info.fonts.detectedFonts.join(', ')}</p>`;
            }

            // WebGL
            if (latest.info.webgl && latest.info.webgl.renderer) {
                html += '<h4 class="section-title">🎮 GPU</h4>';
                html += '<div class="detail-grid">';
                html += detailItem('Vendor', latest.info.webgl.vendor);
                html += detailItem('Renderer', latest.info.webgl.renderer);
                html += '</div>';
            }

            // WebRTC
            if (latest.info.webrtc && latest.info.webrtc.localIPs) {
                html += '<h4 class="section-title">📡 WebRTC Local IPs</h4>';
                html += `<p style="font-size:0.85rem;font-family:var(--font-mono);color:var(--accent-alt)">${latest.info.webrtc.localIPs.join(', ') || 'None detected'}</p>`;
            }
        }

        // Visit timeline
        html += '<h4 class="section-title">🕐 Visit Timeline</h4>';
        html += '<div class="visit-timeline">';
        data.visits.forEach(v => {
            const time = new Date(v.timestamp).toLocaleString();
            const ip = v.info?.ip || '—';
            const country = v.info?.ipLocation?.country || '';
            html += `<div class="timeline-item">
        <div class="timeline-dot"></div>
        <div>
          <strong>${time}</strong>
          <span style="color:var(--text-muted);margin-left:0.5rem">${ip} ${country}</span>
        </div>
      </div>`;
        });
        html += '</div>';

        document.getElementById('modal-body').innerHTML = html;
    } catch (err) {
        document.getElementById('modal-body').innerHTML =
            `<p style="color:var(--danger)">Error loading user data: ${err.message}</p>`;
    }
}

// ─── Match Modal ───────────────────────────────────────────────────────────
async function showMatch(visitId) {
    openModal('🔗 Cross-Session Matching');

    try {
        const data = await api(`/api/admin/match/${visitId}`);

        let html = `<div class="detail-grid">
      <div class="detail-item">
        <span class="label">Source User ID</span>
        <span class="value">${data.sourceVisit.userID}</span>
      </div>
      <div class="detail-item">
        <span class="label">Matches Found</span>
        <span class="value">${data.matches.length}</span>
      </div>
    </div>`;

        if (data.matches.length === 0) {
            html += '<p style="color:var(--text-muted);text-align:center;padding:2rem">No matching users found. This visitor appears to be unique.</p>';
        } else {
            html += '<h4 class="section-title">🎯 Similar Users (sorted by confidence)</h4>';

            data.matches.forEach(m => {
                const badgeClass = m.confidence >= 70 ? 'match-high' :
                    m.confidence >= 40 ? 'match-medium' : 'match-low';

                html += `<div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:0.8rem">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem">
            <div>
              <span class="user-id-badge">${m.userID}</span>
              <span style="color:var(--text-muted);font-size:0.8rem;margin-left:0.5rem">${m.ip || ''} ${m.country || ''}</span>
            </div>
            <span class="match-badge ${badgeClass}">${m.confidence}% (${m.matchedHashes}/${m.totalHashes})</span>
          </div>
          <div class="hash-list" style="font-size:0.75rem">
            ${Object.entries(m.details).map(([key, same]) =>
                    `<div class="hash-row">
                <span class="hash-name">${formatHashName(key)}</span>
                <span class="match-detail-icon">${same ? '✅' : '❌'}</span>
              </div>`
                ).join('')}
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.4rem">
            Last seen: ${new Date(m.lastSeen).toLocaleString()}
          </div>
        </div>`;
            });
        }

        document.getElementById('modal-body').innerHTML = html;
    } catch (err) {
        document.getElementById('modal-body').innerHTML =
            `<p style="color:var(--danger)">Error computing matches: ${err.message}</p>`;
    }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function openModal(title) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem">Loading...</p>';
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

function formatHashName(key) {
    return key.replace(/Fingerprint$/, '').replace(/([A-Z])/g, ' $1').trim();
}

function detailItem(label, value) {
    return `<div class="detail-item">
    <span class="label">${label}</span>
    <span class="value">${value || '—'}</span>
  </div>`;
}

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});
