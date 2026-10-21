document.addEventListener('DOMContentLoaded', () => {
    const chipsEl = document.getElementById('categoryChips');
    const inputValue = document.getElementById('inputValue');
    const swapButton = document.getElementById('swapButton');
    const resultNumber = document.getElementById('resultNumber');
    const resultUnit = document.getElementById('resultUnit');
    const resultSentence = document.getElementById('resultSentence');
    const copyButton = document.getElementById('copyButton');
    const copyLabel = document.getElementById('copyLabel');
    const randomButton = document.getElementById('randomButton');
    const unitInfo = document.getElementById('unitInfo');
    const unitCount = document.getElementById('unitCount');

    const KIND_LABELS = { standard: 'Standard', nerdy: 'Nerdy (but real)', fictional: 'Fictional' };

    // Sensible starting pair for each category.
    const DEFAULTS = {
        length: ['meters', 'feet'],
        weight: ['kilograms', 'pounds'],
        temperature: ['celsius', 'fahrenheit'],
        volume: ['liters', 'gallons_us'],
        speed: ['kilometers_per_hour', 'miles_per_hour'],
        time: ['hours', 'minutes'],
        power: ['kilowatts', 'horsepower'],
        currency: ['galleons', 'knuts'],
        force_sensitivity: ['anakins', 'average_beings'],
    };

    // Curated "Random nerdy conversion" pairs: [category, from, to, value].
    const RANDOM_PAIRS = [
        ['length', 'parsecs', 'smoots', 12],                  // the Kessel Run, in smoots
        ['length', 'smoots', 'meters', 364.4],                // the Harvard Bridge
        ['length', 'lar', 'smoots', 1],
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
    ];

    const state = { category: 'length', from: null, to: null };
    let lastWarning = '';

    const units = () => CATEGORIES[state.category].units;
    const groupName = unit => unit.universe || KIND_LABELS[unit.kind] || 'Other';

    function makeTag(unit) {
        const text = unitTag(unit);
        if (!text) return null;
        const tag = document.createElement('span');
        tag.className = 'tag' + (unit.kind === 'nerdy' ? ' tag-nerdy' : '');
        tag.textContent = text;
        return tag;
    }

    // ---------- Category chips ----------
    const chips = {};
    Object.entries(CATEGORIES).forEach(([key, cat]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chip';
        btn.textContent = cat.label;
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => setCategory(key));
        chipsEl.appendChild(btn);
        chips[key] = btn;
    });

    // ---------- Unit picker (searchable listbox) ----------
    let pickerCount = 0;

    function createPicker(container, labelId, { getOptions, onSelect }) {
        const id = `picker${++pickerCount}`;
        let value = null;
        let open = false;
        let filtered = [];
        let active = -1;

        container.innerHTML = `
            <button type="button" class="picker-btn" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="${labelId} ${id}-value">
                <span class="picker-value" id="${id}-value"></span>
                <span class="picker-tag"></span>
                <svg class="picker-caret" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
            </button>
            <div class="picker-pop" hidden>
                <div class="picker-search">
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.5"/></svg>
                    <input type="text" role="combobox" aria-expanded="true" aria-controls="${id}-list" aria-autocomplete="list"
                           aria-label="Search units" placeholder="Search units or universes" autocomplete="off" spellcheck="false">
                </div>
                <ul class="picker-list" role="listbox" id="${id}-list" aria-labelledby="${labelId}"></ul>
                <div class="picker-hint" aria-hidden="true"><span>↑↓ move</span><span>Enter select</span><span>Esc close</span></div>
            </div>`;

        const button = container.querySelector('.picker-btn');
        const valueEl = container.querySelector('.picker-value');
        const tagSlot = container.querySelector('.picker-tag');
        const pop = container.querySelector('.picker-pop');
        const search = container.querySelector('input');
        const list = container.querySelector('.picker-list');

        function renderButton() {
            const unit = units()[value];
            valueEl.textContent = unit ? unitLabel(value, unit) : '';
            tagSlot.innerHTML = '';
            const tag = unit && makeTag(unit);
            if (tag) tagSlot.appendChild(tag);
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
                empty.textContent = 'No matching units in this category.';
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
                li.className = 'picker-option' + (i === active ? ' is-active' : '');
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
                el.scrollIntoView({ block: 'nearest' });
            }
        }

        function openPop() {
            if (open) return;
            open = true;
            pop.hidden = false;
            button.setAttribute('aria-expanded', 'true');
            search.value = '';
            active = -1;
            renderList();
            search.focus();
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

        return {
            setValue(key) { value = key; renderButton(); },
            get value() { return value; },
        };
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

    function convert() {
        const u = units();
        const from = u[state.from];
        const to = u[state.to];
        const input = parseFloat(inputValue.value);
        lastWarning = '';
        resultSentence.classList.remove('result-warning');

        resultUnit.textContent = to ? unitLabel(state.to, to) : '';
        if (isNaN(input) || !from || !to) {
            resultNumber.textContent = '—';
            resultSentence.textContent = 'Enter a number to convert.';
            return;
        }

        const result = fromBase(to, toBase(from, input));
        if (!isFinite(result)) {
            lastWarning = from.limit || to.limit || 'That value is out of range for these units.';
            resultNumber.textContent = '—';
            resultSentence.textContent = lastWarning;
            resultSentence.classList.add('result-warning');
            return;
        }

        const formatted = formatNumber(result);
        // Restart the small fade-in animation.
        resultNumber.style.animation = 'none';
        void resultNumber.offsetWidth;
        resultNumber.style.animation = '';
        resultNumber.textContent = formatted;
        resultSentence.textContent = `${formatNumber(input)} ${labelFor(input, state.from, from)} = ${formatted} ${labelFor(result, state.to, to)}`;
    }

    // ---------- Unit info ----------
    function infoItem(key) {
        const unit = units()[key];
        const item = document.createElement('div');
        item.className = 'info-item';
        if (!unit) return item;

        const name = document.createElement('div');
        name.className = 'info-name';
        name.textContent = unitLabel(key, unit) + ' ';
        const tag = makeTag(unit);
        if (tag) name.appendChild(tag);

        const desc = document.createElement('p');
        desc.className = 'info-desc';
        desc.textContent = unit.desc + ' ';
        const link = document.createElement('a');
        link.href = unit.source[1];
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Source';
        link.title = unit.source[0];
        desc.appendChild(link);

        item.append(name, desc);
        return item;
    }

    function updateInfo() {
        unitInfo.querySelectorAll('.info-item, .info-note').forEach(el => el.remove());
        unitInfo.appendChild(infoItem(state.from));
        if (state.to !== state.from) unitInfo.appendChild(infoItem(state.to));
        const note = CATEGORIES[state.category].note;
        if (note) {
            const p = document.createElement('p');
            p.className = 'info-note';
            p.textContent = note;
            unitInfo.appendChild(p);
        }
    }

    function update() {
        fromPicker.setValue(state.from);
        toPicker.setValue(state.to);
        convert();
        updateInfo();
    }

    function setCategory(key, from, to) {
        state.category = key;
        const u = units();
        const keys = Object.keys(u);
        const [defFrom, defTo] = DEFAULTS[key] || keys;
        state.from = from && u[from] ? from : (u[defFrom] ? defFrom : keys[0]);
        state.to = to && u[to] ? to : (u[defTo] ? defTo : keys[1]);
        fixToUniverse();
        Object.entries(chips).forEach(([k, btn]) => btn.setAttribute('aria-pressed', String(k === key)));
        update();
    }

    // ---------- Events ----------
    inputValue.addEventListener('input', convert);

    swapButton.addEventListener('click', () => {
        [state.from, state.to] = [state.to, state.from];
        update();
    });

    let lastRandom = -1;
    randomButton.addEventListener('click', () => {
        let i;
        do { i = Math.floor(Math.random() * RANDOM_PAIRS.length); } while (i === lastRandom && RANDOM_PAIRS.length > 1);
        lastRandom = i;
        const [cat, from, to, value] = RANDOM_PAIRS[i];
        inputValue.value = value;
        setCategory(cat, from, to);
    });

    copyButton.addEventListener('click', async () => {
        const text = resultSentence.textContent;
        let ok = false;
        try {
            await navigator.clipboard.writeText(text);
            ok = true;
        } catch (e) {
            // Fallback for browsers/contexts without the async clipboard API.
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
            ta.remove();
        }
        copyLabel.textContent = ok ? 'Copied!' : 'Copy failed';
        setTimeout(() => { copyLabel.textContent = 'Copy'; }, 1500);
    });

    // ---------- Start ----------
    const total = Object.values(CATEGORIES).reduce((n, c) => n + Object.keys(c.units).length, 0);
    unitCount.textContent = `${total} units · ${Object.keys(CATEGORIES).length} categories · every one sourced`;
    setCategory('length');
});
