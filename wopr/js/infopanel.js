// Info Panel — right-side attack assessment and strategic forces readout

class InfoPanel {
  constructor() {
    this.attackLog = document.getElementById('attack-log');
    this.warheadsEl = document.getElementById('warheads-deployed');
    this.targetsEl = document.getElementById('targets-destroyed');
    this.casualtiesEl = document.getElementById('est-casualties');

    this.natoIcbm = document.getElementById('nato-icbm');
    this.natoSlbm = document.getElementById('nato-slbm');
    this.natoBombers = document.getElementById('nato-bombers');
    this.natoTotal = document.getElementById('nato-total');
    this.natoStatus = document.getElementById('nato-status');

    this.pactIcbm = document.getElementById('pact-icbm');
    this.pactSlbm = document.getElementById('pact-slbm');
    this.pactBombers = document.getElementById('pact-bombers');
    this.pactTotal = document.getElementById('pact-total');
    this.pactStatus = document.getElementById('pact-status');

    this.forcesDefcon = document.getElementById('forces-defcon');
    this.threatLevel = document.getElementById('threat-level');
    this.exchangeType = document.getElementById('exchange-type');

    this.warheads = 0;
    this.targets = 0;
    this.casualties = 0;
    this.destroyedCities = new Set();
    this._scrollDirty = false; // throttle scroll to rAF

    // Graph state
    this.graphCanvas = document.getElementById('attack-graph');
    this.graphCtx = this.graphCanvas.getContext('2d');
    const savedMetrics = localStorage.getItem('wopr_graphMetrics');
    this.selectedMetrics = savedMetrics
      ? new Set(JSON.parse(savedMetrics))
      : new Set(['warheads', 'targets', 'casualties']);
    this.metricColors = { warheads: '#33ff33', targets: '#ffffaa', casualties: '#ff5555' };
    this.timeSeries = []; // [{t, warheads, targets, casualties}, ...]
    this._graphDirty = false;

    // Click handlers for metric toggle
    const rows = document.querySelectorAll('#attack-summary-labels .summary-row');
    // Sync CSS classes with loaded state
    rows.forEach(row => {
      if (this.selectedMetrics.has(row.dataset.metric)) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    });
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const metric = row.dataset.metric;
        if (this.selectedMetrics.has(metric)) {
          this.selectedMetrics.delete(metric);
          row.classList.remove('selected');
        } else {
          this.selectedMetrics.add(metric);
          row.classList.add('selected');
        }
        localStorage.setItem('wopr_graphMetrics', JSON.stringify([...this.selectedMetrics]));
        this._drawGraph();
      });
    });

    // 1983-era baseline numbers
    this.baseForces = {
      nato: { icbm: 1054, slbm: 640, bombers: 297, total: 11000 },
      pact: { icbm: 1398, slbm: 980, bombers: 150, total: 10000 },
    };

    this.currentForces = {
      nato: { ...this.baseForces.nato },
      pact: { ...this.baseForces.pact },
    };
  }

  reset() {
    this.warheads = 0;
    this.targets = 0;
    this.casualties = 0;
    this.destroyedCities.clear();
    this.attackLog.innerHTML = '';
    this.timeSeries = [];
    this._drawGraph();
    this.updateCounters();

    // Reset forces
    this.currentForces.nato = { ...this.baseForces.nato };
    this.currentForces.pact = { ...this.baseForces.pact };
    this.updateForces();

    this.threatLevel.textContent = 'NOMINAL';
    this.threatLevel.className = 'value';
    this.exchangeType.textContent = '---';
    this.exchangeType.className = 'value';

    this.natoStatus.textContent = 'READY';
    this.natoStatus.className = 'value active';
    this.pactStatus.textContent = 'READY';
    this.pactStatus.className = 'value active';
  }

  // Called when a scenario begins
  beginScenario(sequence) {
    this.reset();

    // Determine exchange type from missile data
    const regions = new Set(sequence.missiles.map(m => m.origin.region));
    const targetRegions = new Set(sequence.missiles.map(m => m.target.region));

    if (regions.has('us') && regions.has('ussr')) {
      this.exchangeType.textContent = 'FULL EXCHANGE';
      this.exchangeType.className = 'value warning';
    } else if (regions.has('us') || regions.has('ussr')) {
      this.exchangeType.textContent = 'FIRST STRIKE';
      this.exchangeType.className = 'value warning';
    } else {
      this.exchangeType.textContent = 'REGIONAL';
      this.exchangeType.className = 'value active';
    }

    // Record initial zero point for graph
    this._recordDataPoint(0);

    // Launches are now logged via onLaunch callback from missile systems
  }

  setDefcon(level) {
    this.forcesDefcon.textContent = level;
    if (level <= 2) {
      this.forcesDefcon.className = 'value warning';
      this.threatLevel.textContent = level === 1 ? 'MAXIMUM' : 'SEVERE';
      this.threatLevel.className = 'value warning';
    } else if (level <= 3) {
      this.forcesDefcon.className = 'value active';
      this.threatLevel.textContent = 'ELEVATED';
      this.threatLevel.className = 'value active';
    } else {
      this.forcesDefcon.className = 'value';
      this.threatLevel.textContent = 'NOMINAL';
      this.threatLevel.className = 'value';
    }
  }

  formatTimestamp(simSec) {
    const totalMin = Math.floor(simSec / 60);
    const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const mm = String(totalMin % 60).padStart(2, '0');
    return hh + ':' + mm;
  }

  logLaunch(originName, targetName, simSec) {
    this.warheads++;
    this.updateCounters();
    this.degradeForces(originName);
    this._recordDataPoint(simSec);
    const ts = this.formatTimestamp(simSec);
    this.attackLog.insertAdjacentHTML('beforeend',
      '<span class="ts">' + ts + '</span> <span class="launch">LAUNCH ' + originName + ' &gt; ' + targetName + '</span>\n');
    this._scheduleScroll();
  }

  logDetonation(targetCity, simSec) {
    if (!targetCity) return;
    const name = targetCity.name;
    const ts = this.formatTimestamp(simSec);
    const pop = targetCity.pop ? targetCity.pop + 'M POP' : 'MILITARY';
    this.attackLog.insertAdjacentHTML('beforeend',
      '<span class="ts">' + ts + '</span> <span class="impact">IMPACT ' + name + ' ' + pop + '</span>\n');
    this._scheduleScroll();

    if (!this.destroyedCities.has(name)) {
      this.destroyedCities.add(name);
      this.targets++;
      if (targetCity.pop) {
        this.casualties += targetCity.pop * (0.3 + Math.random() * 0.4);
      }
    }

    this.updateCounters();
    this.updateForceStatus();
    this._recordDataPoint(simSec);
  }

  _scheduleScroll() {
    if (!this._scrollDirty) {
      this._scrollDirty = true;
      requestAnimationFrame(() => {
        this.attackLog.scrollTop = this.attackLog.scrollHeight;
        this._scrollDirty = false;
      });
    }
  }

  _recordDataPoint(simSec) {
    this.timeSeries.push({
      t: simSec,
      warheads: this.warheads,
      targets: this.targets,
      casualties: this.casualties,
    });
    this._scheduleGraph();
  }

  _scheduleGraph() {
    if (!this._graphDirty) {
      this._graphDirty = true;
      requestAnimationFrame(() => {
        this._drawGraph();
        this._graphDirty = false;
      });
    }
  }

  _drawGraph() {
    const canvas = this.graphCanvas;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = this.graphCtx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);

    const data = this.timeSeries;
    if (data.length < 2) return;
    if (data[data.length - 1].t < 600) return; // wait until 0:10 elapsed

    const tMin = data[0].t;
    const tMax = data[data.length - 1].t;
    const tRange = tMax - tMin || 1;
    const pad = 2;
    // Hour tick marks along the bottom
    const hourSec = 3600;
    const firstTick = Math.ceil(tMin / hourSec) * hourSec;
    ctx.fillStyle = '#33ff33';
    for (let t = firstTick; t <= tMax; t += hourSec) {
      const x = pad + ((t - tMin) / tRange) * (w - pad * 2);
      ctx.fillRect(Math.round(x), h - pad + 1, 1, 1);
    }

    const metrics = ['warheads', 'targets', 'casualties'];

    for (const key of metrics) {
      if (!this.selectedMetrics.has(key)) continue;

      let maxVal = 0;
      for (const d of data) {
        if (d[key] > maxVal) maxVal = d[key];
      }
      if (maxVal === 0) continue;

      ctx.beginPath();
      ctx.strokeStyle = this.metricColors[key];
      ctx.lineWidth = 1.5;
      for (let i = 0; i < data.length; i++) {
        const x = pad + ((data[i].t - tMin) / tRange) * (w - pad * 2);
        const y = (h - pad) - (data[i][key] / maxVal) * (h - pad * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  updateCounters() {
    this.warheadsEl.textContent = this.warheads;
    this.targetsEl.textContent = this.targets;
    this.casualtiesEl.textContent = Math.round(this.casualties * 10) / 10;
  }

  // Reduce force counts as warheads are expended
  degradeForces(originName) {
    const city = CITIES.find(c => c.name === originName);
    if (!city) return;

    const side = (city.region === 'us' || city.region === 'uk' || city.region === 'france' || city.region === 'nato')
      ? 'nato' : 'pact';

    const f = this.currentForces[side];

    // Each launch expends from the pool
    if (f.icbm > 0) {
      f.icbm = Math.max(0, f.icbm - 1);
      f.total = Math.max(0, f.total - 3); // ~3 warheads per ICBM
    }

    this.updateForces();
  }

  updateForces() {
    const nf = this.currentForces.nato;
    const pf = this.currentForces.pact;

    this.natoIcbm.textContent = nf.icbm.toLocaleString();
    this.natoSlbm.textContent = nf.slbm.toLocaleString();
    this.natoBombers.textContent = nf.bombers.toLocaleString();
    this.natoTotal.textContent = nf.total.toLocaleString();

    this.pactIcbm.textContent = pf.icbm.toLocaleString();
    this.pactSlbm.textContent = pf.slbm.toLocaleString();
    this.pactBombers.textContent = pf.bombers.toLocaleString();
    this.pactTotal.textContent = pf.total.toLocaleString();
  }

  updateForceStatus() {
    // If enough cities destroyed, mark force status as degraded
    const natoHits = [...this.destroyedCities].filter(name => {
      const c = CITIES.find(ci => ci.name === name);
      return c && (c.region === 'us' || c.region === 'uk' || c.region === 'france');
    }).length;

    const pactHits = [...this.destroyedCities].filter(name => {
      const c = CITIES.find(ci => ci.name === name);
      return c && c.region === 'ussr';
    }).length;

    if (natoHits >= 5) {
      this.natoStatus.textContent = 'DEGRADED';
      this.natoStatus.className = 'value warning';
    } else if (natoHits >= 2) {
      this.natoStatus.textContent = 'ENGAGED';
      this.natoStatus.className = 'value active';
    }

    if (pactHits >= 5) {
      this.pactStatus.textContent = 'DEGRADED';
      this.pactStatus.className = 'value warning';
    } else if (pactHits >= 2) {
      this.pactStatus.textContent = 'ENGAGED';
      this.pactStatus.className = 'value active';
    }
  }
}
