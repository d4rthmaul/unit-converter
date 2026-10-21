document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('category');
    const fromUnit = document.getElementById('fromUnit');
    const toUnit = document.getElementById('toUnit');
    const inputValue = document.getElementById('inputValue');
    const outputValue = document.getElementById('outputValue');
    const swapButton = document.getElementById('swapButton');
    const tooltip = document.getElementById('unitTooltip');

    const KIND_LABELS = { standard: 'Standard', nerdy: 'Nerdy (but real)', fictional: 'Fictional' };

    // ---------- Category list ----------
    Object.entries(CATEGORIES).forEach(([key, cat]) => {
        categorySelect.appendChild(new Option(cat.label, key));
    });

    function currentUnits() {
        return CATEGORIES[categorySelect.value].units;
    }

    // Group units into <optgroup>s: by universe for currency, by kind otherwise.
    function groupKey(unit) {
        return unit.universe || KIND_LABELS[unit.kind] || 'Other';
    }

    function fillSelect(select, filter) {
        const units = currentUnits();
        const previous = select.value;
        select.innerHTML = '';
        const groups = new Map();
        Object.entries(units).forEach(([key, unit]) => {
            if (filter && !filter(unit)) return;
            const g = groupKey(unit);
            if (!groups.has(g)) {
                const og = document.createElement('optgroup');
                og.label = g;
                groups.set(g, og);
                select.appendChild(og);
            }
            groups.get(g).appendChild(new Option(unitLabel(key, unit), key));
        });
        if (previous && select.querySelector(`option[value="${CSS.escape(previous)}"]`)) {
            select.value = previous;
        }
    }

    // Currency: the "to" list only shows units from the same universe as "from".
    function refreshToUnits() {
        const from = currentUnits()[fromUnit.value];
        const universe = from && from.universe;
        fillSelect(toUnit, universe ? (u => u.universe === universe) : null);
        if (toUnit.value === fromUnit.value && toUnit.options.length > 1) {
            toUnit.selectedIndex = [...toUnit.options].findIndex(o => o.value !== fromUnit.value);
        }
    }

    function populateUnits() {
        fromUnit.innerHTML = '';
        toUnit.innerHTML = '';
        fillSelect(fromUnit);
        fromUnit.selectedIndex = 0;
        refreshToUnits();
        update();
    }

    // ---------- Conversion ----------
    function toBase(unit, v) {
        return unit.toBase ? unit.toBase(v) : v * unit.size;
    }
    function fromBase(unit, b) {
        return unit.fromBase ? unit.fromBase(b) : b / unit.size;
    }

    let lastError = '';

    function convert() {
        const units = currentUnits();
        const from = units[fromUnit.value];
        const to = units[toUnit.value];
        const input = parseFloat(inputValue.value);
        lastError = '';

        if (isNaN(input) || !from || !to) {
            outputValue.value = '';
            return;
        }

        const result = fromBase(to, toBase(from, input));
        if (!isFinite(result)) {
            outputValue.value = '—';
            lastError = (from.limit || to.limit || 'This value is out of range for these units.');
            return;
        }
        outputValue.value = formatNumber(result);
    }

    // ---------- Unit info panel ----------
    function unitInfo(prefix, key) {
        const unit = currentUnits()[key];
        const block = document.createElement('div');
        block.className = 'unit-info';
        if (!unit) return block;

        const title = document.createElement('strong');
        title.textContent = `${prefix}: ${unitLabel(key, unit)}`;
        block.appendChild(title);
        block.appendChild(document.createTextNode(` — ${unit.desc} `));

        if (unit.source) {
            const link = document.createElement('a');
            link.href = unit.source[1];
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = '[source]';
            link.title = unit.source[0];
            block.appendChild(link);
        }
        return block;
    }

    function updateTooltip() {
        tooltip.innerHTML = '';
        tooltip.appendChild(unitInfo('From', fromUnit.value));
        tooltip.appendChild(unitInfo('To', toUnit.value));

        const cat = CATEGORIES[categorySelect.value];
        const notes = [lastError, cat.note].filter(Boolean);
        notes.forEach(text => {
            const p = document.createElement('div');
            p.className = 'unit-note' + (text === lastError ? ' unit-warning' : '');
            p.textContent = text;
            tooltip.appendChild(p);
        });
    }

    function update() {
        convert();
        updateTooltip();
    }

    // ---------- Events ----------
    categorySelect.addEventListener('change', populateUnits);
    fromUnit.addEventListener('change', () => { refreshToUnits(); update(); });
    toUnit.addEventListener('change', update);
    inputValue.addEventListener('input', update);
    swapButton.addEventListener('click', () => {
        const oldFrom = fromUnit.value;
        const oldTo = toUnit.value;
        fromUnit.value = oldTo;
        refreshToUnits();
        toUnit.value = oldFrom;
        update();
    });

    populateUnits();
});
