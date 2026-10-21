document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('categoryNav');
    const inputValue = document.getElementById('inputValue');
    const resultEl = document.getElementById('result');
    const ruleEl = document.getElementById('rule');
    const sourcesEl = document.getElementById('sources');
    const swapButton = document.getElementById('swapButton');
    const copyButton = document.getElementById('copyButton');
    const copyStatus = document.getElementById('copyStatus');
    const randomButton = document.getElementById('randomButton');
    const unitCount = document.getElementById('unitCount');

    const KIND_LABELS = { standard: 'Standard', nerdy: 'Nerdy, but real', fictional: 'Fictional' };

    // Sensible starting pair for each category.
    const DEFAULTS = {
        length: ['smoots', 'meters'],
        weight: ['kilograms', 'pounds'],
        temperature: ['celsius', 'fahrenheit'],
        volume: ['liters', 'gallons_us'],
        speed: ['warp_factor_tng', 'speed_of_light'],
        time: ['yen', 'years'],
        power: ['kilowatts', 'horsepower'],
        currency: ['galleons', 'knuts'],
        force_sensitivity: ['anakins', 'average_beings'],
    };

    // Curated pairs for "Surprise me": [category, from, to, value].
    const SURPRISES = [
        ['length', 'parsecs', 'smoots', 12],                  // the Kessel Run, in smoots
        ['length', 'smoots', 'meters', 364.4],                // the Harvard Bridge
        ['length', 'lar', 'smoots', 1],
        ['length', 'light_years', 'meters', 4.24],            // to Proxima Centauri
        ['length', 'attoparsecs', 'beard_seconds', 1],
        ['time', 'microcenturies', 'minecraft_days', 1],
        ['time', 'yen', 'microcenturies', 1],
        ['speed', 'deloreans', 'mach', 1],
        ['speed', 'warp_factor_tng', 'deloreans', 9],
        ['power', 'flux_capacitor_charges', 'horsepower', 1],
        ['weight', 'gold_pieces', 'stones_of_barenziah', 100],
        ['volume', 'minecraft_blocks', 'cups_us', 1],
        ['currency', 'galleons', 'pounds_sterling_rowling', 100],
        ['force_sensitivity', 'anakins', 'average_beings', 1],
        ['temperature', 'celsius', 'fahrenheit', -40],
    ];

    const state = { category: 'length', from: null, to: null };
    const units = () => CATEGORIES[state.category].units;
    const groupName = unit => unit.universe || KIND_LABELS[unit.kind] || 'Other';

    function makeTag(unit) {
        const text = unitTag(unit);
        if (!text) return null;
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = text;
        return tag;
    }

    // ---------- Categories ----------
    const catButtons = {};
    Object.entries(CATEGORIES).forEach(([key, cat]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cat';
        btn.textContent = cat.label.charAt(0) + cat.label.slice(1).toLowerCase();
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => setCategory(key));
        nav.appendChild(btn);
        catButtons[key] = btn;
    });

    // ---------- Unit picker (searchable listbox) ----------
    let pickerCount = 0;

    function createPicker(container, labelId, { getOptions, onSelect }) {
        const id = `picker${++pickerCount}`;
        const footnote = container.dataset.footnote;
        let value = null;
        let open = false;
        let filtered = [];
        let active = -1;

        container.innerHTML = `
            <button type="button" class="picker-btn" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="${labelId} ${id}-value">
                <span class="picker-value" id="${id}-value"></span><span class="footnote-ref" aria-hidden="true">${footnote}</span>
            </button>
            <div class="picker-pop" hidden>
                <div class="picker-search">
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.5"/></svg>
                    <input type="text" role="combobox" aria-expanded="true" aria-controls="${id}-list" aria-autocomplete="list"
                           aria-label="Search units" placeholder="Search units or universes" autocomplete="off" spellcheck="false">
                </div>
                <ul class="picker-list" role="listbox" id="${id}-list" aria-labelledby="${labelId}"></ul>
                <p class="picker-hint" aria-hidden="true">Arrow keys to move, Enter to choose, Esc to close</p>
            </div>`;

        const button = container.querySelector('.picker-btn');
        const valueEl = container.querySelector('.picker-value');
        const pop = container.querySelector('.picker-pop');
        const search = container.querySelector('input');
        const list = container.querySelector('.picker-list');

        function renderButton() {
            const unit = units()[value];
            valueEl.textContent = unit ? unitLabel(value, unit) : '';
        }

        function renderList() {
            const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
            filtered = getOptions().filter(({ key, unit }) => {
                const hay = `${unitLabel(key, unit)} ${key} ${unitTag(unit)} ${groupName(unit)}`.toLowerCase();
                return words.every(w => hay.includes(w));
            });
            if (active >= filtered.length) active = filtered.length - 1;
            if (active < 0 && filtered.length) active = Math.max(0, filtered.findIndex(o => o.key === value));

            list.innerHTML = '';
            if (!filtered.length) {
                const empty = document.createElement('li');
                empty.className = 'picker-empty';
                empty.setAttribute('role', 'presentation');
                empty.textContent = 'No units in this category match. Try a universe, like "tolkien".';
                list.appendChild(empty);
                search.removeAttribute('aria-activedescendant');
                return;
            }
            let lastGroup = null;
            filtered.forEach(({ key, unit }, i) => {
                const g = groupName(unit);
                if (g !== lastGroup) {
                    const head = document.createElement('li');
                    head.className = 'picker-group';
                    head.setAttribute('role', 'presentation');
                    head.textContent = g;
                    list.appendChild(head);
                    lastGroup = g;
                }
                const li = document.createElement('li');
                li.className = 'picker-option';
                li.id = `${id}-opt-${i}`;
                li.setAttribute('role', 'option');
                li.setAttribute('aria-selected', String(key === value));
                const name = document.createElement('span');
                name.textContent = unitLabel(key, unit);
                li.appendChild(name);
                // Inside a universe group the tag would just repeat the heading.
                const tag = !unit.universe && unit.kind === 'fictional' ? makeTag(unit) : null;
                if (tag) li.appendChild(tag);
                li.addEventListener('mousemove', () => { if (active !== i) { active = i; highlight(); } });
                li.addEventListener('mousedown', e => e.preventDefault());
                li.addEventListener('click', () => choose(i));
                list.appendChild(li);
            });
            highlight();
        }

        function highlight() {
            list.querySelectorAll('.picker-option').forEach(li => {
                li.classList.toggle('is-active', li.id === `${id}-opt-${active}`);
            });
            const el = document.getElementById(`${id}-opt-${active}`);
            if (el) {
                search.setAttribute('aria-activedescendant', el.id);
                // Scroll only the list (scrollIntoView would also scroll the page sideways).
                if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop - 6;
                else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight + 6;
            }
        }

        // Keep the popover on screen when the picker sits near the right edge.
        function placePop() {
            const box = container.getBoundingClientRect();
            const width = pop.offsetWidth;
            let left = Math.min(0, (window.innerWidth - 16) - (box.left + width));
            left = Math.max(left, 16 - box.left);
            pop.style.left = `${left}px`;
        }

        function openPop() {
            if (open) return;
            open = true;
            pop.hidden = false;
            button.setAttribute('aria-expanded', 'true');
            search.value = '';
            active = -1;
            placePop();
            renderList();
            search.focus({ preventScroll: true });
        }

        function closePop(refocus) {
            if (!open) return;
            open = false;
            pop.hidden = true;
            button.setAttribute('aria-expanded', 'false');
            if (refocus) button.focus();
        }

        function choose(i) {
            const opt = filtered[i];
            if (!opt) return;
            value = opt.key;
            renderButton();
            closePop(true);
            onSelect(value);
        }

        button.addEventListener('click', () => (open ? closePop(false) : openPop()));
        button.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openPop(); }
        });
        search.addEventListener('input', () => { active = 0; renderList(); });
        search.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, filtered.length - 1); highlight(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); highlight(); }
            else if (e.key === 'Home') { e.preventDefault(); active = 0; highlight(); }
            else if (e.key === 'End') { e.preventDefault(); active = filtered.length - 1; highlight(); }
            else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
            else if (e.key === 'Escape') { e.preventDefault(); closePop(true); }
            else if (e.key === 'Tab') { closePop(false); }
        });
        document.addEventListener('mousedown', e => {
            if (open && !container.contains(e.target)) closePop(false);
        });

        return { setValue(key) { value = key; renderButton(); } };
    }

    const allOptions = () => Object.entries(units()).map(([key, unit]) => ({ key, unit }));

    const fromPicker = createPicker(document.getElementById('fromPicker'), 'fromLabel', {
        getOptions: allOptions,
        onSelect: key => { state.from = key; fixToUniverse(); update(); },
    });

    // Currency: "to" only offers units from the same universe as "from".
    const toPicker = createPicker(document.getElementById('toPicker'), 'toLabel', {
        getOptions: () => {
            const universe = units()[state.from]?.universe;
            return allOptions().filter(o => !universe || o.unit.universe === universe);
        },
        onSelect: key => { state.to = key; update(); },
    });

    function fixToUniverse() {
        const u = units();
        const universe = u[state.from]?.universe;
        if (universe && u[state.to]?.universe !== universe) {
            state.to = Object.keys(u).find(k => u[k].universe === universe && k !== state.from);
        }
    }

    // ---------- Conversion ----------
    const toBase = (unit, v) => (unit.toBase ? unit.toBase(v) : v * unit.size);
    const fromBase = (unit, b) => (unit.fromBase ? unit.fromBase(b) : b / unit.size);

    let lastSentence = '';

    function sizeInput() {
        const len = Math.max(2, String(inputValue.value || '').length);
        inputValue.style.setProperty('--chars', Math.min(len, 14));
    }

    function convert() {
        const u = units();
        const from = u[state.from];
        const to = u[state.to];
        const input = parseFloat(inputValue.value);
        sizeInput();

        const result = !isNaN(input) && from && to ? fromBase(to, toBase(from, input)) : NaN;
        if (isNaN(input)) {
            resultEl.textContent = '—';
            lastSentence = '';
        } else if (!isFinite(result)) {
            resultEl.textContent = '—';
            lastSentence = '';
        } else {
            const formatted = formatNumber(result);
            resultEl.textContent = formatted;
            lastSentence = `${formatNumber(input)} ${labelFor(input, state.from, from)} = ${formatted} ${labelFor(result, state.to, to)}`;
        }

        SlideRule.render(ruleEl, {
            categoryKey: state.category,
            fromKey: state.from, toKey: state.to,
            from, to,
            input: isNaN(input) ? NaN : input,
            result,
        });
    }

    // ---------- Footnotes ----------
    function footnote(num, key) {
        const unit = units()[key];
        const p = document.createElement('p');
        p.className = 'footnote';
        if (!unit) return p;
        const n = document.createElement('span');
        n.className = 'footnote-num';
        n.textContent = num;
        const name = document.createElement('b');
        name.textContent = `${unitLabel(key, unit)}.`;
        p.append(n, name);
        const tag = makeTag(unit);
        if (tag) p.appendChild(tag);
        p.append(` ${unit.desc} `);
        const link = document.createElement('a');
        link.href = unit.source[1];
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = unit.source[0];
        p.appendChild(link);
        return p;
    }

    function updateSources() {
        sourcesEl.innerHTML = '';
        sourcesEl.append(footnote(1, state.from), footnote(2, state.to));
        const note = CATEGORIES[state.category].note;
        if (note) {
            const p = document.createElement('p');
            p.className = 'sources-note';
            p.textContent = note;
            sourcesEl.appendChild(p);
        }
    }

    function update() {
        fromPicker.setValue(state.from);
        toPicker.setValue(state.to);
        convert();
        updateSources();
    }

    function setCategory(key, from, to) {
        state.category = key;
        const u = units();
        const keys = Object.keys(u);
        const [defFrom, defTo] = DEFAULTS[key] || keys;
        state.from = from && u[from] ? from : (u[defFrom] ? defFrom : keys[0]);
        state.to = to && u[to] ? to : (u[defTo] ? defTo : keys[1]);
        fixToUniverse();
        Object.entries(catButtons).forEach(([k, btn]) => btn.setAttribute('aria-pressed', String(k === key)));
        update();
    }

    // ---------- Events ----------
    inputValue.addEventListener('input', convert);

    swapButton.addEventListener('click', () => {
        [state.from, state.to] = [state.to, state.from];
        update();
    });

    let lastSurprise = -1;
    randomButton.addEventListener('click', () => {
        let i;
        do { i = Math.floor(Math.random() * SURPRISES.length); } while (i === lastSurprise && SURPRISES.length > 1);
        lastSurprise = i;
        const [cat, from, to, value] = SURPRISES[i];
        inputValue.value = value;
        setCategory(cat, from, to);
    });

    copyButton.addEventListener('click', async () => {
        if (!lastSentence) {
            copyStatus.textContent = 'Nothing to copy yet.';
            return;
        }
        let ok = false;
        try {
            await navigator.clipboard.writeText(lastSentence);
            ok = true;
        } catch (e) {
            // Fallback for browsers or pages without the async clipboard API.
            const ta = document.createElement('textarea');
            ta.value = lastSentence;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
            ta.remove();
        }
        copyButton.textContent = ok ? 'Copied' : 'Copy failed';
        copyStatus.textContent = ok ? `Copied: ${lastSentence}` : 'Copy failed.';
        setTimeout(() => { copyButton.textContent = 'Copy result'; }, 1500);
    });

    // Redraw the rule when its width changes (tick density depends on width).
    let resizeTimer;
    new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(convert, 80);
    }).observe(ruleEl.querySelector('.rule-track'));

    // ---------- Start ----------
    const total = Object.values(CATEGORIES).reduce((n, c) => n + Object.keys(c.units).length, 0);
    unitCount.textContent = `${total} units in ${Object.keys(CATEGORIES).length} categories, each with a cited source.`;
    inputValue.value = 364.4;
    setCategory('length');
});
