// Terminal UI — typewriter effects, strategy list, boot sequence

class TerminalUI {
  constructor() {
    this.messagesEl = document.getElementById('terminal-messages');
    this.strategyPanel = document.getElementById('strategy-panel');
    this.strategyList = document.getElementById('strategy-list');
    this.defconEl = document.getElementById('defcon-indicator');
    this.clockEl = document.getElementById('system-clock');
    this.woprStatus = document.getElementById('wopr-status');

    this.selectedIndex = 0;
    this.strategies = [];
    this.onStrategySelect = null; // callback
    this.inputEnabled = false;
    this.typewriterSpeed = 8;

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
          // Insert character before cursor
          const char = document.createTextNode(text[i]);
          line.insertBefore(char, cursor);
          i++;
          this.scrollToBottom();
        } else {
          clearInterval(interval);
          line.removeChild(cursor);
          resolve();
        }
      }, this.typewriterSpeed);
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
          line.removeChild(cursor);
          resolve();
        }
      }, this.typewriterSpeed);
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
    await this.typewrite('AVAILABLE STRATEGIES:', 'dim');
    await this.delay(30);
  }

  // === Strategy List ===
  buildStrategyList(strategies) {
    this.strategies = strategies;
    this.strategyList.innerHTML = '';

    strategies.forEach((name, i) => {
      const item = document.createElement('div');
      item.className = 'strategy-item';
      item.innerHTML = `<span class="number">${i + 1}.</span>${name}`;
      item.dataset.index = i;

      item.addEventListener('click', () => {
        if (!this.inputEnabled) return;
        this.selectIndex(i);
        this.executeSelected();
      });

      this.strategyList.appendChild(item);
    });

    this.strategyPanel.classList.add('visible');
    this.selectIndex(0);
  }

  selectIndex(idx) {
    if (idx < 0) idx = this.strategies.length - 1;
    if (idx >= this.strategies.length) idx = 0;

    // Remove old selection
    const prev = this.strategyList.querySelector('.selected');
    if (prev) prev.classList.remove('selected');

    this.selectedIndex = idx;
    const items = this.strategyList.querySelectorAll('.strategy-item');
    if (items[idx]) {
      items[idx].classList.add('selected');
      // Scroll into view
      items[idx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  executeSelected() {
    if (this.onStrategySelect) {
      this.onStrategySelect(this.strategies[this.selectedIndex], this.selectedIndex);
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

  // === Strategy Execution Log ===
  async showExecutionLog(strategyName, defcon) {
    this.printBlank();
    await this.typewrite(`> STRATEGY SELECTED: ${strategyName}`, 'bright');
    await this.delay(300);
    await this.typewrite(`  DEFCON LEVEL: ${defcon}`, defcon <= 2 ? 'bright' : 'dim');
    await this.delay(200);
    await this.typewrite('  COMPUTING OPTIMAL STRIKE PATTERNS...', 'dim');
    await this.delay(500);
    await this.typewrite('  LAUNCHING PRIMARY STRIKE...', 'bright');
    await this.delay(200);
    await this.typewrite('  MISSILES AWAY.', 'bright');
  }

  async showAftermath(sequence) {
    await this.delay(500);
    this.printBlank();
    const targetNames = [...new Set(sequence.missiles.map(m => m.target.name))];
    await this.typewrite(`  TARGETS HIT: ${targetNames.slice(0, 5).join(', ')}`, 'dim');

    if (targetNames.length > 5) {
      await this.typewrite(`               ...AND ${targetNames.length - 5} MORE`, 'dim');
    }

    const targetPop = [...new Set(sequence.missiles.map(m => m.target))];
    const totalPop = targetPop.reduce((sum, c) => sum + (c.pop || 1), 0);
    const casualties = Math.round(totalPop * (0.3 + Math.random() * 0.4) * 10) / 10;
    await this.typewrite(`  ESTIMATED CASUALTIES: ${casualties}M`, 'dim');
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
    return new Promise(r => setTimeout(r, ms));
  }
}
