/*
 * The slide rule: draws two unit scales against each other with a hairline at the value.
 *
 * Every scale is laid out on one shared axis measured in the category's base unit.
 * The axis kind is picked automatically from the two units:
 *   - "linear"      both scales start at zero (most pairs)
 *   - "temperature" a linear window around the value; scales are shifted as well as stretched
 *   - "log"         the units differ by more than 1,000×, so each long tick is 10× the last
 * Non-linear units (warp factors) simply produce unevenly spaced ticks on whichever axis is used.
 */
const SlideRule = (function () {
    const LOG_RATIO = 1000;
    const LABEL_CHAR_PX = 7.8;   // B612 Mono at 13px
    const TEMPERATURE_MARKS = [
        [-40, '−40: same in °C and °F'],
        [0, 'water freezes'],
        [37, 'body temperature'],
        [100, 'water boils'],
    ];

    const toBase = (u, v) => (u.toBase ? u.toBase(v) : v * u.size);
    const fromBase = (u, b) => (u.fromBase ? u.fromBase(b) : b / u.size);

    // Rough size of one unit in base units, used to decide when to go logarithmic.
    function magnitude(u) {
        if (u.size) return u.size;
        return Math.abs(toBase(u, 1) - toBase(u, 0)) || Math.abs(toBase(u, 1));
    }

    // Round up to a "nice" number: 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10 × 10^k.
    function niceUp(x) {
        const mag = Math.pow(10, Math.floor(Math.log10(x)));
        const n = x / mag;
        const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
        return steps.find(s => s >= n - 1e-9) * mag;
    }

    // A tick step that gives roughly `target` major ticks across `span`.
    function niceStep(span, target) {
        const raw = span / target;
        const mag = Math.pow(10, Math.floor(Math.log10(raw)));
        const n = raw / mag;
        return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
    }

    const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    const sup = n => String(n).replace(/./g, ch => SUP[ch] || ch);

    function tickLabel(v) {
        const abs = Math.abs(v);
        if (abs < 1e-9) return '0';
        if (abs >= 1e6 || abs < 1e-3) {
            const exp = Math.floor(Math.log10(abs) + 1e-9);
            const mant = v / Math.pow(10, exp);
            const m = Math.abs(mant - 1) < 1e-6 ? '' : `${Number(mant.toPrecision(2))}×`;
            return `${m}10${sup(exp)}`;
        }
        if (abs >= 10000) return v.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 });
        return Number(v.toPrecision(6)).toLocaleString('en-US', { maximumFractionDigits: 3 });
    }

    // ---------- Axis ----------
    function chooseAxis(categoryKey, from, to, input) {
        const valueBase = toBase(from, input);
        const ratio = Math.max(magnitude(from), magnitude(to)) / Math.min(magnitude(from), magnitude(to));

        if (categoryKey === 'temperature') {
            const span = Math.max(160, niceUp(Math.abs(valueBase) * 1.6 || 160));
            const step = niceStep(span, 8);
            const lo = Math.floor((valueBase - span * 0.55) / step) * step;
            return { kind: 'temperature', lo, hi: lo + span, valueBase, ratio };
        }

        if (ratio > LOG_RATIO && valueBase > 0) {
            const center = Math.log10(valueBase);
            const lo = Math.floor(center) - 4;
            return { kind: 'log', lo, hi: lo + 9, valueBase, ratio };
        }

        // Put the value about 60% along, rounded out to a tidy end value.
        const roundOut = x => { const step = niceStep(x, 8); return Math.ceil(x / step - 1e-9) * step; };
        let lo = 0;
        let hi;
        if (valueBase > 0) hi = roundOut(valueBase / 0.6);
        else if (valueBase < 0) { lo = -roundOut(-valueBase / 0.6); hi = 0; }
        else hi = roundOut(Math.max(magnitude(from), magnitude(to)) * 5);
        return { kind: 'linear', lo, hi, valueBase, ratio };
    }

    function positionOf(axis, base) {
        if (axis.kind === 'log') {
            if (!(base > 0)) return NaN;
            return (Math.log10(base) - axis.lo) / (axis.hi - axis.lo);
        }
        return (base - axis.lo) / (axis.hi - axis.lo);
    }

    // The range of a unit's own values that falls inside the axis.
    function unitRange(u, axis) {
        const loBase = axis.kind === 'log' ? Math.pow(10, axis.lo) : axis.lo;
        const hiBase = axis.kind === 'log' ? Math.pow(10, axis.hi) : axis.hi;
        let a = fromBase(u, loBase);
        let b = fromBase(u, hiBase);
        if (u.domain) {
            if (!isFinite(a)) a = u.domain[0];
            if (!isFinite(b)) b = u.domain[1];
        }
        return [Math.min(a, b), Math.max(a, b)];
    }

    // ---------- Ticks for one scale ----------
    function scaleTicks(u, axis, widthPx) {
        const ticks = [];
        const add = (value, size) => {
            const pos = positionOf(axis, toBase(u, value));
            if (isFinite(pos) && pos >= -1e-6 && pos <= 1 + 1e-6) ticks.push({ value, pos, size });
        };
        const [uLo, uHi] = unitRange(u, axis);

        if (axis.kind === 'log' && u.size) {
            const k0 = Math.floor(Math.log10(uLo)) - 1;
            const k1 = Math.ceil(Math.log10(uHi)) + 1;
            for (let k = k0; k <= k1; k++) {
                const dec = Math.pow(10, k);
                add(dec, 'major');
                for (let m = 2; m <= 9; m++) add(m * dec, m === 5 ? 'mid' : 'minor');
            }
        } else {
            const majorTarget = Math.max(3, Math.round(widthPx / 110));
            const major = niceStep(uHi - uLo, majorTarget);
            const pxPerMajor = widthPx / ((uHi - uLo) / major);
            const minorDiv = pxPerMajor >= 80 ? 10 : pxPerMajor >= 40 ? 5 : 2;
            const minor = major / minorDiv;
            const start = Math.ceil(uLo / minor - 1e-9);
            const end = Math.floor(uHi / minor + 1e-9);
            for (let i = start; i <= end; i++) {
                const v = i * minor;
                const r = Math.round(v / major * 1e6) / 1e6;
                const isMajor = Math.abs(r - Math.round(r)) < 1e-6;
                const isMid = !isMajor && minorDiv >= 5 && Math.abs((v / (major / 2)) - Math.round(v / (major / 2))) < 1e-6;
                add(Math.abs(v) < 1e-12 ? 0 : v, isMajor ? 'major' : isMid ? 'mid' : 'minor');
            }
        }

        // Drop minor ticks that would blur together (uneven scales bunch up at one end).
        ticks.sort((a, b) => a.pos - b.pos);
        let lastX = -Infinity;
        const kept = ticks.filter(t => {
            const x = t.pos * widthPx;
            if (t.size !== 'major' && x - lastX < 3) return false;
            lastX = x;
            return true;
        });
        ticks.length = 0;
        ticks.push(...kept);

        // Label majors, skipping any that would collide with the previous label.
        let lastRight = -Infinity;
        ticks.filter(t => t.size === 'major').sort((a, b) => a.pos - b.pos).forEach(t => {
            const text = tickLabel(t.value);
            const w = text.length * LABEL_CHAR_PX;
            const x = t.pos * widthPx;
            if (x - w / 2 >= lastRight + 10 && x - w / 2 >= -24 && x + w / 2 <= widthPx + 24) {
                t.label = text;
                lastRight = x + w / 2;
            }
        });
        return ticks;
    }

    function marks(categoryKey, axis, from, to) {
        const out = [];
        if (categoryKey === 'temperature') {
            TEMPERATURE_MARKS.forEach(([c, text]) => {
                const pos = positionOf(axis, c);
                if (pos >= 0 && pos <= 1) out.push({ pos, text });
            });
        }
        [from, to].forEach(u => {
            if (u.domain && u.toBase) {
                const pos = positionOf(axis, toBase(u, u.domain[1]));
                if (pos >= 0 && pos < 0.98) out.push({ pos, text: u.domainNote || 'scale ends here' });
            }
        });
        return out.sort((a, b) => a.pos - b.pos);
    }

    function caption(categoryKey, axis, from, to, input, result) {
        if (!isFinite(result)) return from.limit || to.limit || 'That value is off the end of the rule for these units.';
        if (axis.kind === 'temperature') {
            return 'These scales are shifted as well as stretched, so their zeros don\'t line up. The middle strip marks a few familiar temperatures.';
        }
        if (axis.kind === 'log') {
            return `These units differ by a factor of about ${formatNumber(Number(axis.ratio.toPrecision(2)))}, so the rule is logarithmic: each long tick is ten times the one before it, and one scale is slid along the other. That's how a real slide rule multiplies.`;
        }
        if (from.toBase || to.toBase) {
            return 'The warp scale isn\'t proportional. Its ticks spread further apart as speed climbs, because each warp factor is a bigger jump than the one before.';
        }
        return 'Both scales start at zero. The red hairline marks your number on the top scale and the answer on the bottom one.';
    }

    // ---------- DOM ----------
    function renderScale(el, ticks, top) {
        el.innerHTML = '';
        ticks.forEach(t => {
            const tick = document.createElement('span');
            tick.className = `rule-tick rule-tick-${t.size}`;
            tick.style.left = `${t.pos * 100}%`;
            el.appendChild(tick);
            if (t.label) {
                const label = document.createElement('span');
                label.className = 'rule-label';
                label.style.left = `${t.pos * 100}%`;
                label.textContent = t.label;
                el.appendChild(label);
            }
        });
        el.classList.toggle('rule-scale-top', top);
    }

    function render(root, opts) {
        const { categoryKey, fromKey, toKey, from, to, input, result } = opts;
        const fromName = unitLabel(fromKey, from);
        const toName = unitLabel(toKey, to);
        root.querySelector('[data-rule-top-name]').textContent = fromName;
        root.querySelector('[data-rule-bottom-name]').textContent = toName;
        root.querySelectorAll('[data-rule-legend-top]').forEach(el => { el.textContent = `Top: ${fromName}`; });
        root.querySelectorAll('[data-rule-legend-bottom]').forEach(el => { el.textContent = `Bottom: ${toName}`; });

        const track = root.querySelector('.rule-track');
        const topEl = root.querySelector('.rule-scale-upper');
        const bottomEl = root.querySelector('.rule-scale-lower');
        const strip = root.querySelector('.rule-strip-inner');
        const cursor = root.querySelector('.rule-cursor');
        const captionEl = root.querySelector('[data-rule-caption]');

        const usable = isFinite(input);
        const axis = chooseAxis(categoryKey, from, to, usable ? input : 1);
        const width = track.clientWidth || 600;

        renderScale(topEl, scaleTicks(from, axis, width), true);
        renderScale(bottomEl, scaleTicks(to, axis, width), false);

        strip.innerHTML = '';
        let lastRight = -Infinity;
        marks(categoryKey, axis, from, to).forEach(m => {
            const x = m.pos * width;
            const w = m.text.length * 6.6 + 16;
            const right = m.pos > 0.75;
            const left = right ? x - w : x;
            if (left < lastRight + 8) return;
            const el = document.createElement('span');
            el.className = 'rule-mark' + (right ? ' rule-mark-right' : '');
            el.style.left = `${m.pos * 100}%`;
            el.textContent = m.text;
            strip.appendChild(el);
            lastRight = left + w;
        });

        const pos = usable && isFinite(result) ? positionOf(axis, axis.valueBase) : NaN;
        cursor.hidden = !(pos >= 0 && pos <= 1);
        if (!cursor.hidden) cursor.style.left = `${pos * 100}%`;
        root.dataset.axis = axis.kind;

        captionEl.textContent = usable ? caption(categoryKey, axis, from, to, input, result) : 'Enter a number to place it on the rule.';
        captionEl.classList.toggle('is-warning', usable && !isFinite(result));
        return axis;
    }

    return { render, chooseAxis };
})();
