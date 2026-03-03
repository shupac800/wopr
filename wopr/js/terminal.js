// Terminal UI — typewriter effects, scenario list, boot sequence

class TerminalUI {
  constructor() {
    this.messagesEl = document.getElementById('terminal-messages');
    this.scenarioPanel = document.getElementById('scenario-panel');
    this.scenarioList = document.getElementById('scenario-list');
    this.defconEl = document.getElementById('defcon-indicator');
    this.clockEl = document.getElementById('system-clock');
    this.woprStatus = document.getElementById('wopr-status');

    this.selectedIndex = 0;
    this.scenarios = [];
    this.onScenarioSelect = null; // callback
    this.inputEnabled = false;
    this.typewriterSpeed = 8;
    this._activeTimers = [];  // interval/timeout IDs to kill on abort
    this._selectCooldown = false; // double-click guard

    this.startClock();
  }

  startClock() {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      this.clockEl.textContent = `${h}:${m}:${s} ZULU`;
    };
    update();
    setInterval(update, 1000);
  }

  setDefcon(level) {
    this.defconEl.textContent = `DEFCON ${level}`;
    this.defconEl.className = '';
    if (level <= 2) {
      this.defconEl.classList.add(`defcon-${level}`);
    }
  }

  // Print a DEFCON change notification to the terminal message area
  printDefconChange(level) {
    const cls = level <= 2 ? 'bright' : 'dim';
    this.print(`  ** DEFCON ${level} **`, cls);
  }

  setStatus(text) {
    this.woprStatus.textContent = text;
  }

  // Typewriter effect — returns a promise
  typewrite(text, className = '') {
    return new Promise(resolve => {
      const line = document.createElement('div');
      line.className = 'line ' + className;
      this.messagesEl.appendChild(line);

      let i = 0;
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      line.appendChild(cursor);

      const interval = setInterval(() => {
        if (i < text.length) {
          line.insertBefore(document.createTextNode(text[i]), cursor);
          i++;
          this.scrollToBottom();
        } else {
          clearInterval(interval);
          if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
          resolve();
        }
      }, this.typewriterSpeed);
      this._activeTimers.push({ id: interval, type: 'interval' });
    });
  }

  // Instant print
  print(text, className = '') {
    const line = document.createElement('div');
    line.className = 'line ' + className;
    line.textContent = text;
    this.messagesEl.appendChild(line);
    this.scrollToBottom();
  }

  // Typewrite text into a new line, but leave the line open for appending
  typewriteAppend(text, className = '') {
    return new Promise(resolve => {
      const line = document.createElement('div');
      line.className = 'line ' + className;
      this.messagesEl.appendChild(line);
      this._lastLine = line;

      let i = 0;
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      line.appendChild(cursor);

      const interval = setInterval(() => {
        if (i < text.length) {
          line.insertBefore(document.createTextNode(text[i]), cursor);
          i++;
          this.scrollToBottom();
        } else {
          clearInterval(interval);
          if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
          resolve();
        }
      }, this.typewriterSpeed);
      this._activeTimers.push({ id: interval, type: 'interval' });
    });
  }

  // Append text instantly to the last line created by typewriteAppend
  appendToLastLine(text) {
    if (this._lastLine) {
      this._lastLine.appendChild(document.createTextNode(text));
      this.scrollToBottom();
    }
  }

  printBlank() {
    const line = document.createElement('div');
    line.className = 'line';
    line.innerHTML = '&nbsp;';
    this.messagesEl.appendChild(line);
  }

  scrollToBottom() {
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  // Clear messages area
  clearMessages() {
    this.messagesEl.innerHTML = '';
  }

  // === Boot Sequence ===
  async runBootSequence() {
    await this.delay(60);
    await this.typewrite('WOPR STRATEGIC DEFENSE SYSTEM', 'bright');
    await this.delay(30);
    await this.typewrite('NORAD COMMAND CENTER - CHEYENNE MOUNTAIN', 'dim');
    await this.delay(30);
    await this.typewrite('SYSTEM INITIALIZATION...', 'dim');
    await this.delay(50);

    const bootLines = [
      'MEMORY CHECK............OK',
      'MISSILE TRACKING........OK',
      'SATELLITE UPLINK........OK',
      'THREAT ASSESSMENT.......OK',
      'STRATEGIC PLANNING......OK',
    ];

    for (const line of bootLines) {
      this.print(line, 'dim');
      await this.delay(15);
    }

    await this.delay(50);
    this.printBlank();
    await this.typewrite('GREETINGS PROFESSOR FALKEN.', 'bright');
    await this.delay(80);
    this.printBlank();
    await this.typewrite('SHALL WE PLAY A GAME?', 'bright');
    await this.delay(100);
    this.printBlank();
    await this.typewrite('HOW ABOUT GLOBAL THERMONUCLEAR WAR?', 'bright');
    await this.delay(80);
    this.printBlank();
    await this.typewrite('AVAILABLE SCENARIOS:', 'dim');
    await this.delay(30);
  }

  // === Scenario List ===
  buildScenarioList(scenarios) {
    this.scenarios = scenarios;
    this.scenarioList.innerHTML = '';

    scenarios.forEach((name, i) => {
      const item = document.createElement('div');
      item.className = 'scenario-item';
      item.innerHTML = `<span class="number">${i + 1}.</span>${name}`;
      item.dataset.index = i;

      item.addEventListener('click', () => {
        if (!this.inputEnabled || this._selectCooldown) return;
        this.selectIndex(i);
        this.executeSelected();
      });

      this.scenarioList.appendChild(item);
    });

    this.scenarioPanel.classList.add('visible');
    this.selectIndex(0);
  }

  selectIndex(idx) {
    if (idx < 0) idx = this.scenarios.length - 1;
    if (idx >= this.scenarios.length) idx = 0;

    // Remove old selection
    const prev = this.scenarioList.querySelector('.selected');
    if (prev) prev.classList.remove('selected');

    this.selectedIndex = idx;
    const items = this.scenarioList.querySelectorAll('.scenario-item');
    if (items[idx]) {
      items[idx].classList.add('selected');
      // Scroll into view
      items[idx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  executeSelected() {
    if (this.onScenarioSelect) {
      // Engage cooldown to ignore rapid double-clicks
      this._selectCooldown = true;
      setTimeout(() => { this._selectCooldown = false; }, 400);
      this.onScenarioSelect(this.scenarios[this.selectedIndex], this.selectedIndex);
    }
  }

  enableInput() {
    this.inputEnabled = true;
  }

  disableInput() {
    this.inputEnabled = false;
  }

  // Keyboard handler
  handleKey(e) {
    if (!this.inputEnabled) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this.selectIndex(this.selectedIndex - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.selectIndex(this.selectedIndex + 1);
        break;
      case 'Enter':
        e.preventDefault();
        this.executeSelected();
        break;
      case 'PageUp':
        e.preventDefault();
        this.selectIndex(this.selectedIndex - 10);
        break;
      case 'PageDown':
        e.preventDefault();
        this.selectIndex(this.selectedIndex + 10);
        break;
    }
  }

  // === Scenario Execution Log ===
  async showExecutionLog(scenarioName, defcon, narrative) {
    this.printBlank();
    await this.typewrite(`> SCENARIO SELECTED: ${scenarioName}`, 'bright');
    await this.delay(300);
    await this.typewrite(`  DEFCON LEVEL: ${defcon}`, defcon <= 2 ? 'bright' : 'dim');
    await this.delay(200);
    if (narrative) {
      await this.typewrite(`  ${narrative}`, 'dim');
      await this.delay(300);
    }
    await this.typewrite('  COMPUTING OPTIMAL STRIKE PATTERNS...', 'dim');
    await this.delay(500);
    await this.typewrite('  LAUNCHING PRIMARY STRIKE...', 'bright');
    await this.delay(200);
    await this.typewrite('  MISSILES AWAY.', 'bright');
  }

  async showAftermath(sequence, simElapsedSec, casualties) {
    await this.delay(500);
    this.printBlank();

    const totalMin = Math.floor((simElapsedSec || 0) / 60);
    const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const mm = String(totalMin % 60).padStart(2, '0');
    await this.typewrite(`  ELAPSED TIME: ${hh}:${mm}`, 'dim');

    const targetNames = [...new Set(sequence.missiles.map(m => m.target.name))];
    await this.typewrite(`  TARGETS HIT: ${targetNames.slice(0, 5).join(', ')}`, 'dim');

    if (targetNames.length > 5) {
      await this.typewrite(`               ...AND ${targetNames.length - 5} MORE`, 'dim');
    }

    const displayCas = Math.round((casualties || 0) * 10) / 10;
    await this.typewrite(`  CASUALTIES: ${displayCas}M`, 'dim');
  }

  async showEnding() {
    this.printBlank();
    await this.delay(1000);
    await this.typewrite('WINNER: NONE', 'bright');
    await this.delay(1500);
    this.printBlank();
    await this.typewrite('A STRANGE GAME.', 'bright');
    await this.delay(800);
    await this.typewrite('THE ONLY WINNING MOVE IS', 'bright');
    await this.delay(600);
    await this.typewrite('NOT TO PLAY.', 'bright');
    await this.delay(1000);
    this.printBlank();
    await this.typewrite('HOW ABOUT A NICE GAME OF CHESS?', 'bright');
  }

  delay(ms) {
    return new Promise(r => {
      const timer = setTimeout(r, ms);
      this._activeTimers.push({ id: timer, type: 'timeout' });
    });
  }

  // Kill all in-flight typewriter intervals and delay timeouts.
  // Their promises are intentionally left pending (never resolved),
  // which freezes the old async chains — they become dead coroutines
  // that get garbage collected. clearMessages() wipes any partial DOM.
  abortEffects() {
    for (const t of this._activeTimers) {
      if (t.type === 'interval') clearInterval(t.id);
      else clearTimeout(t.id);
    }
    this._activeTimers = [];
  }
}
