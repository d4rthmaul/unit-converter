/*
 * rule.js — the slide rule
 * ========================
 * Draws the "from" unit as the top scale and the "to" unit as the bottom scale, with a red
 * hairline (the "cursor") at the value being converted. Read straight down from the top
 * scale to the bottom one and you get the answer.
 *
 * HOW IT WORKS
 * Both scales sit on one shared AXIS measured in the category's base unit (meters for length,
 * °C for temperature, and so on — see units.js). Every tick is placed in three steps:
 *
 *     a value in the unit's own terms  (e.g. 200 smoots)
 *        → convert to base units        (200 × 1.7018 = 340.36 m)
 *        → map to a position 0…1        (340.36 m on an axis from 0 to 1,100 m = 0.31)
 *
 * Because both scales go through the same base-unit axis, a value on the top scale always
 * lines up with its equivalent on the bottom scale. That alignment is the whole trick.
 *
 * THE FOUR KINDS OF RULE (picked automatically by chooseAxis)
 *   - "linear"       Both scales start at zero, and one is stretched relative to the other.
 *                    Used for most pairs (smoots/meters, Galleons/Knuts …).
 *   - "temperature"  Still linear, but the window is centred on the value and the scales are
 *                    shifted as well as stretched (0 °C sits over 32 °F). Landmarks such as
 *                    "water freezes" are drawn in the middle strip.
 *   - "log"          When the two units differ by more than LOG_RATIO (1,000×), a linear rule
 *                    is useless: one scale would be a smear of ticks. Positions use log10, so
 *                    each long tick is 10× the last and the second scale is simply slid along
 *                    by log10(ratio). That is exactly how a real slide rule multiplies.
 *   - uneven scales  Not a separate axis kind: non-linear units (warp factors) are placed with
 *                    their own toBase() function, so their ticks naturally come out unevenly
 *                    spaced on whichever axis is in use.
 *
 * Public API: SlideRule.render(rootElement, options) and SlideRule.chooseAxis(...).
 * Depends on units.js for unitLabel(), formatNumber() and SUPERSCRIPT.
 */
const SlideRule = (function () {
    /** Unit pairs further apart than this get a logarithmic rule. */
    const LOG_RATIO = 1000;

    /** Approximate width of one character of a tick label (B612 Mono at 13px), for collision checks. */
    const LABEL_CHAR_PX = 7.8;

    /** Approximate width of one character in a middle-strip landmark (B612 at 12px). */
    const MARK_CHAR_PX = 6.6;

    /** Where the value should land along a linear rule (0 = left edge, 1 = right edge). */
    const VALUE_POSITION = 0.6;

    /** Landmarks for temperature rules, in °C (the temperature base unit). */
    const TEMPERATURE_MARKS = [
        [-40, '−40: same in °C and °F'],
        [0, 'water freezes'],
        [37, 'body temperature'],
        [100, 'water boils'],
    ];

    // Conversions to and from the category's base unit. Linear units multiply by `size`;
    // non-linear units (temperature scales, warp factors) supply their own functions.
    const toBase = (u, v) => (u.toBase ? u.toBase(v) : v * u.size);
    const fromBase = (u, b) => (u.fromBase ? u.fromBase(b) : b / u.size);

    /**
     * Roughly how big one of this unit is, in base units. Only used to compare two units and
     * decide whether the rule should be logarithmic. For non-linear units we measure the step
     * from 0 to 1 (e.g. one degree), falling back to the value at 1 (warp 1 = c).
     */
    function magnitude(u) {
        if (u.size) return u.size;
        return Math.abs(toBase(u, 1) - toBase(u, 0)) || Math.abs(toBase(u, 1));
    }

    /** Round up to a tidy number: 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8 or 10 × a power of ten. */
    function niceUp(x) {
        const mag = Math.pow(10, Math.floor(Math.log10(x)));
        const n = x / mag;
        const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
        return steps.find(s => s >= n - 1e-9) * mag;
    }

    /**
     * A tick spacing of 1, 2 or 5 × a power of ten that gives roughly `target` ticks across
     * `span`. This is the classic "nice numbers" approach used by most chart axes.
     */
    function niceStep(span, target) {
        const raw = span / target;
        const mag = Math.pow(10, Math.floor(Math.log10(raw)));
        const n = raw / mag;
        return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
    }

    /** Turn digits into superscript characters, e.g. -16 → ⁻¹⁶ (table lives in units.js). */
    const sup = n => String(n).replace(/./g, ch => SUPERSCRIPT[ch] || ch);

    /**
     * Short text for a tick label. Labels have to fit between ticks, so very large or small
     * values use powers of ten (10¹⁶, 2×10⁻⁴) and big-but-ordinary ones use compact notation (10K).
     */
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

    // ------------------------------------------------------------------ Axis

    /**
     * Decide which kind of rule to draw and what stretch of the base-unit axis it covers.
     *
     * Returns { kind, lo, hi, valueBase, ratio }:
     *   kind       "linear" | "temperature" | "log"
     *   lo, hi     the axis ends — in base units, or in log10(base units) for "log"
     *   valueBase  the value being converted, in base units (where the hairline goes)
     *   ratio      how many times bigger the larger unit is than the smaller one
     */
    function chooseAxis(categoryKey, from, to, input) {
        const valueBase = toBase(from, input);
        const ratio = Math.max(magnitude(from), magnitude(to)) / Math.min(magnitude(from), magnitude(to));

        // Temperature: a window of at least 160 °C, centred a little left of the value, so
        // everyday temperatures and the landmarks are visible. Zero isn't special here.
        if (categoryKey === 'temperature') {
            const span = Math.max(160, niceUp(Math.abs(valueBase) * 1.6 || 160));
            const step = niceStep(span, 8);
            const lo = Math.floor((valueBase - span * 0.55) / step) * step;
            return { kind: 'temperature', lo, hi: lo + span, valueBase, ratio };
        }

        // Very different units: show nine decades (powers of ten), with the value roughly in
        // the middle. Logs only work for positive values, so zero/negatives stay linear.
        if (ratio > LOG_RATIO && valueBase > 0) {
            const center = Math.log10(valueBase);
            const lo = Math.floor(center) - 4;
            return { kind: 'log', lo, hi: lo + 9, valueBase, ratio };
        }

        // Linear, starting at zero. Choose the far end so the value lands about 60% along,
        // then round it out to a tidy number so the end of the rule isn't an odd value.
        const roundOut = x => { const step = niceStep(x, 8); return Math.ceil(x / step - 1e-9) * step; };
        let lo = 0;
        let hi;
        if (valueBase > 0) hi = roundOut(valueBase / VALUE_POSITION);
        else if (valueBase < 0) { lo = -roundOut(-valueBase / VALUE_POSITION); hi = 0; }
        else hi = roundOut(Math.max(magnitude(from), magnitude(to)) * 5);   // value is 0: show a few units
        return { kind: 'linear', lo, hi, valueBase, ratio };
    }

    /** Where a base-unit value falls along the axis: 0 = left edge, 1 = right edge. */
    function positionOf(axis, base) {
        if (axis.kind === 'log') {
            if (!(base > 0)) return NaN;   // zero and negatives have no place on a log scale
            return (Math.log10(base) - axis.lo) / (axis.hi - axis.lo);
        }
        return (base - axis.lo) / (axis.hi - axis.lo);
    }

    /**
     * The stretch of a unit's OWN values that the axis covers, e.g. "0 to 646 smoots".
     * Some units run backwards (Delisle gets smaller as it gets hotter), hence the min/max.
     * A unit with a `domain` (TNG warp: 0 to 9) is clipped where its formula stops working.
     */
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

    // ----------------------------------------------------------------- Ticks

    /**
     * Build the ticks for one scale. Each tick is { value, pos, size, label? }, where size is
     * "major" (long, labelled), "mid" (halfway marks) or "minor" (short).
     *
     * Linear units on a log rule get the classic slide-rule layout: a long tick at every power
     * of ten, short ticks at 2–9 times it. Everything else gets evenly spaced values in the
     * unit's own terms. Those values are then placed via toBase, which is what makes warp
     * factors come out uneven, without any special case.
     */
    function scaleTicks(u, axis, widthPx) {
        const ticks = [];
        const add = (value, size) => {
            const pos = positionOf(axis, toBase(u, value));
            if (isFinite(pos) && pos >= -1e-6 && pos <= 1 + 1e-6) ticks.push({ value, pos, size });
        };
        const [uLo, uHi] = unitRange(u, axis);

        if (axis.kind === 'log' && u.size) {
            // One decade either side of the visible range, so the ends are fully ticked.
            const k0 = Math.floor(Math.log10(uLo)) - 1;
            const k1 = Math.ceil(Math.log10(uHi)) + 1;
            for (let k = k0; k <= k1; k++) {
                const dec = Math.pow(10, k);
                add(dec, 'major');
                for (let m = 2; m <= 9; m++) add(m * dec, m === 5 ? 'mid' : 'minor');
            }
        } else {
            // About one long tick per 110px, then as many short ticks between them as will fit
            // comfortably (10, 5 or 2 divisions).
            const majorTarget = Math.max(3, Math.round(widthPx / 110));
            const major = niceStep(uHi - uLo, majorTarget);
            const pxPerMajor = widthPx / ((uHi - uLo) / major);
            const minorDiv = pxPerMajor >= 80 ? 10 : pxPerMajor >= 40 ? 5 : 2;
            const minor = major / minorDiv;
            // Walk in whole multiples of the minor step (integers avoid floating-point drift).
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

        // Drop short ticks that would sit closer than 3px to the previous tick. Uneven scales
        // bunch up at one end, and without this the start of a warp scale is a solid smear.
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

        // Label long ticks from left to right, skipping any label that would overlap the
        // previous one or hang too far off either end of the rule.
        let lastRight = -Infinity;
        ticks.filter(t => t.size === 'major').forEach(t => {
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

    // --------------------------------------------------- Landmarks and caption

    /**
     * Labels for the middle strip: temperature landmarks, plus a note wherever a unit's
     * formula stops (e.g. "TNG formula stops at warp 9"). Returns [{ pos, text }] left to right.
     */
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

    /** One plain-language sentence under the rule explaining how to read this particular rule. */
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

    // ------------------------------------------------------------------- DOM

    /**
     * Draw one scale's ticks and labels into `el`. Positions are percentages, so the rule
     * stretches with its container; render() is called again on resize to re-space the ticks.
     */
    function renderScale(el, ticks) {
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
    }

    /**
     * Redraw the whole rule inside `root` (the <figure id="rule"> in index.html).
     *
     * options: { categoryKey, fromKey, toKey, from, to, input, result }
     *   from/to are unit objects from units.js; input is the number typed in (NaN if empty);
     *   result is the converted value (NaN/Infinity when the conversion isn't possible).
     *
     * Sets data-axis on `root` to the chosen kind (handy for styling and tests) and returns the axis.
     */
    function render(root, opts) {
        const { categoryKey, fromKey, toKey, from, to, input, result } = opts;
        const fromName = unitLabel(fromKey, from);
        const toName = unitLabel(toKey, to);
        // Unit names at the left end of each scale (desktop) and in the legend (phones).
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

        // With no number typed, still draw a sensible rule (as if converting 1).
        const usable = isFinite(input);
        const axis = chooseAxis(categoryKey, from, to, usable ? input : 1);
        const width = track.clientWidth || 600;

        renderScale(topEl, scaleTicks(from, axis, width));
        renderScale(bottomEl, scaleTicks(to, axis, width));

        // Middle-strip landmarks. Ones in the right quarter hang to the left of their mark so
        // they don't run off the end; any that would overlap the previous label are skipped.
        strip.innerHTML = '';
        let lastRight = -Infinity;
        marks(categoryKey, axis, from, to).forEach(m => {
            const x = m.pos * width;
            const w = m.text.length * MARK_CHAR_PX + 16;
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

        // The hairline. Hidden when there is no valid answer (e.g. a TNG warp above 9).
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
