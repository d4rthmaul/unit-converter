/*
 * Unit data for the Nerdy Unit Converter.
 * Shared by the converter (index.html) and the reference page (references.html).
 *
 * Each linear unit has a `size`: how many of the category's base unit one of it equals.
 * Non-linear units (temperature scales, warp factors) define toBase/fromBase instead;
 * `domain` limits the values a non-linear unit is defined for.
 * Every unit cites a source: [title, url].
 * `kind`: "standard" (real, official), "nerdy" (real but humorous), "fictional" (from a fictional universe).
 * Currency units also have a `universe`: conversions are only allowed within the same universe.
 * Fictional units have a `tag` naming their universe (shown as a label in the unit picker).
 */

const SRC = {
    nist: ["NIST Guide to the SI, Appendix B: Conversion Factors",
        "https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors"],
    lightYear: ["Light-year (Wikipedia)", "https://en.wikipedia.org/wiki/Light-year"],
    parsec: ["Parsec (Wikipedia)", "https://en.wikipedia.org/wiki/Parsec"],
    au: ["Astronomical unit (Wikipedia)", "https://en.wikipedia.org/wiki/Astronomical_unit"],
    cubit: ["Cubit (Wikipedia)", "https://en.wikipedia.org/wiki/Cubit"],
    hand: ["Hand (unit) (Wikipedia)", "https://en.wikipedia.org/wiki/Hand_(unit)"],
    furlong: ["Furlong (Wikipedia)", "https://en.wikipedia.org/wiki/Furlong"],
    ranga: ["Ranga — Tolkien Gateway (citing Unfinished Tales, \"Númenórean Linear Measures\")",
        "https://tolkiengateway.net/wiki/Ranga"],
    lar: ["Lár — Tolkien Gateway (citing Unfinished Tales)", "https://tolkiengateway.net/wiki/Lar"],
    smoot: ["Smoot (Wikipedia)", "https://en.wikipedia.org/wiki/Smoot"],
    humorous: ["List of humorous units of measurement (Wikipedia)",
        "https://en.wikipedia.org/wiki/List_of_humorous_units_of_measurement"],
    mcBlock: ["Minecraft Wiki — Measuring distance",
        "https://minecraft.gamepedia.com/File:Measuring_distance_green_line.png"],
    mcDay: ["Minecraft (Wikipedia) — \"one full cycle lasting 20 real-time minutes\"",
        "https://en.wikipedia.org/wiki/Minecraft"],
    carat: ["Carat (mass) (Wikipedia)", "https://en.wikipedia.org/wiki/Carat_(mass)"],
    dram: ["Dram (unit) (Wikipedia)", "https://en.wikipedia.org/wiki/Dram_(unit)"],
    dnd: ["D&D 5e SRD — Equipment: Coins (Roll20 Compendium)",
        "https://roll20.net/compendium/dnd5e/Rules:Equipment"],
    barenziah: ["Stone of Barenziah — Skyrim Wiki", "https://skyrim.gamepedia.com/Stone_of_Barenziah"],
    skyrimWeight: ["Skyrim: Carry Weight — UESP", "https://content1.uesp.net/wiki/Skyrim:Encumbrance"],
    celsius: ["Celsius (Wikipedia)", "https://en.wikipedia.org/wiki/Celsius"],
    fahrenheit: ["Fahrenheit (Wikipedia)", "https://en.wikipedia.org/wiki/Fahrenheit"],
    kelvin: ["Kelvin (Wikipedia)", "https://en.wikipedia.org/wiki/Kelvin"],
    rankine: ["Rankine scale (Wikipedia)", "https://en.wikipedia.org/wiki/Rankine_scale"],
    delisle: ["Delisle scale (Wikipedia)", "https://en.wikipedia.org/wiki/Delisle_scale"],
    reaumur: ["Réaumur scale (Wikipedia)", "https://en.wikipedia.org/wiki/R%C3%A9aumur_scale"],
    romer: ["Rømer scale (Wikipedia)", "https://en.wikipedia.org/wiki/R%C3%B8mer_scale"],
    speedOfLight: ["NIST CODATA — speed of light in vacuum", "https://physics.nist.gov/cgi-bin/cuu/Value?c"],
    sound: ["Speed of sound (Wikipedia) — ~343 m/s in dry air at 20 °C", "https://en.wikipedia.org/wiki/Speed_of_sound"],
    knot: ["Knot (unit) (Wikipedia)", "https://en.wikipedia.org/wiki/Knot_(unit)"],
    delorean: ["DeLorean time machine (Wikipedia)", "https://en.wikipedia.org/wiki/DeLorean_time_machine"],
    warp: ["Warp factor — Memory Alpha", "https://memory-alpha.fandom.com/wiki/Warp_factor"],
    julianYear: ["Julian year (astronomy) (Wikipedia)", "https://en.wikipedia.org/wiki/Julian_year_(astronomy)"],
    yen: ["Calendar of Imladris — Tolkien Gateway (citing LotR Appendix D)",
        "https://tolkiengateway.net/wiki/Calendar_of_Imladris"],
    horsepower: ["Horsepower (Wikipedia)", "https://en.wikipedia.org/wiki/Horsepower"],
    hpWizard: ["Wizarding currency — Harry Potter Wiki (citing Philosopher's Stone ch. 5 and J.K. Rowling)",
        "https://harrypotter.fandom.com/wiki/Wizarding_currency"],
    ncr: ["NCR dollar — Fallout Wiki", "https://fallout.fandom.com/wiki/NCR_dollar"],
    cap: ["Bottle cap — Fallout Wiki", "https://fallout.fandom.com/wiki/Bottle_cap"],
    midichlorian: ["Midi-chlorian — Wookieepedia (canon)", "https://starwars.fandom.com/wiki/Midi-chlorian"],
};

const LB = 0.45359237;          // kg, exact
const MILE = 1609.344;          // m, exact
const C = 299792458;            // m/s, exact
const DAY = 86400;              // s
const JULIAN_YEAR = 365.25 * DAY;

const CATEGORIES = {
    length: {
        label: "Length",
        base: "meters",
        units: {
            meters:         { size: 1, kind: "standard", desc: "SI base unit of length.", source: SRC.nist },
            kilometers:     { size: 1000, kind: "standard", desc: "1 km = 1,000 m.", source: SRC.nist },
            centimeters:    { size: 0.01, kind: "standard", desc: "1 m = 100 cm.", source: SRC.nist },
            millimeters:    { size: 0.001, kind: "standard", desc: "1 m = 1,000 mm.", source: SRC.nist },
            micrometers:    { size: 1e-6, kind: "standard", desc: "1 m = 1,000,000 μm.", source: SRC.nist },
            nanometers:     { size: 1e-9, kind: "standard", desc: "1 m = 1 billion nm.", source: SRC.nist },
            inches:         { size: 0.0254, kind: "standard", desc: "Exactly 2.54 cm.", source: SRC.nist },
            feet:           { size: 0.3048, kind: "standard", desc: "Exactly 30.48 cm.", source: SRC.nist },
            yards:          { size: 0.9144, kind: "standard", desc: "Exactly 91.44 cm.", source: SRC.nist },
            miles:          { size: MILE, kind: "standard", desc: "Exactly 1,609.344 m.", source: SRC.nist },
            nautical_miles: { size: 1852, kind: "standard", desc: "Exactly 1,852 m.", source: SRC.nist },
            astronomical_units: { size: 149597870700, kind: "standard", desc: "Mean Earth–Sun distance, fixed at 149,597,870,700 m.", source: SRC.au },
            light_years:    { label: "light-years", size: 9460730472580800, kind: "standard", desc: "Distance light travels in a Julian year (~9.46 trillion km).", source: SRC.lightYear },
            parsecs:        { size: 3.0856775814913673e16, kind: "standard", desc: "~3.26 light-years. Han Solo made the Kessel Run in less than twelve of them.", source: SRC.parsec },
            cubits:         { size: 0.4572, kind: "standard", desc: "Ancient forearm length (~45.72 cm, the common English cubit).", source: SRC.cubit },
            hands:          { size: 0.1016, kind: "standard", desc: "Exactly 4 inches; used for horse height.", source: SRC.hand },
            furlongs:       { size: 201.168, kind: "standard", desc: "One-eighth of a mile (220 yards).", source: SRC.furlong },
            smoots:         { size: 1.7018, kind: "nerdy", desc: "Oliver Smoot's height in 1958 (5 ft 7 in). The Harvard Bridge is 364.4 smoots ± 1 ear.", source: SRC.smoot },
            attoparsecs:    { size: 3.0856775814913673e16 * 1e-18, kind: "nerdy", desc: "10⁻¹⁸ parsecs, about 3.09 cm.", source: SRC.humorous },
            beard_seconds:  { label: "beard-seconds", size: 5e-9, kind: "nerdy", desc: "How far a beard grows in one second: 5 nm (Google's value; Kolb defines it as 10 nm).", source: SRC.humorous },
            rangar:         { tag: "Tolkien", label: "rangar", size: 38 * 0.0254, kind: "fictional", desc: "Tolkien: Númenórean measure of 38 inches, slightly longer than a yard — about the height of a hobbit.", source: SRC.ranga },
            lar:            { tag: "Tolkien", label: "lár", size: 5000 * 38 * 0.0254, kind: "fictional", desc: "Tolkien: the Númenórean league, 5,000 rangar (~4.83 km).", source: SRC.lar },
            minecraft_blocks: { label: "Minecraft blocks", tag: "Minecraft", size: 1, kind: "fictional", desc: "Minecraft: each block side is 1 meter.", source: SRC.mcBlock },
        },
    },

    weight: {
        label: "Weight",
        base: "kilograms",
        units: {
            kilograms:  { size: 1, kind: "standard", desc: "SI base unit of mass.", source: SRC.nist },
            grams:      { size: 0.001, kind: "standard", desc: "1 kg = 1,000 g.", source: SRC.nist },
            milligrams: { size: 1e-6, kind: "standard", desc: "1 kg = 1 million mg.", source: SRC.nist },
            micrograms: { size: 1e-9, kind: "standard", desc: "1 kg = 1 billion μg.", source: SRC.nist },
            tonnes:     { size: 1000, kind: "standard", desc: "Metric ton: 1,000 kg.", source: SRC.nist },
            pounds:     { size: LB, kind: "standard", desc: "Avoirdupois pound, exactly 0.45359237 kg.", source: SRC.nist },
            ounces:     { size: LB / 16, kind: "standard", desc: "1/16 pound (~28.35 g).", source: SRC.nist },
            stone:      { size: 14 * LB, kind: "standard", desc: "14 pounds (~6.35 kg).", source: SRC.nist },
            carats:     { size: 0.0002, kind: "standard", desc: "Exactly 200 mg; used for gemstones.", source: SRC.carat },
            grains:     { size: 6.479891e-5, kind: "standard", desc: "Exactly 64.79891 mg.", source: SRC.nist },
            drams:      { size: LB / 256, kind: "standard", desc: "Avoirdupois dram, 1/16 ounce (~1.77 g). (The apothecary dram is 3.89 g.)", source: SRC.dram },
            gold_pieces: { tag: "D&D", size: LB / 50, kind: "fictional", desc: "D&D 5e: 50 coins weigh 1 lb, so one is ~9.07 g.", source: SRC.dnd },
            stones_of_barenziah: { label: "Stones of Barenziah", tag: "Skyrim", size: 0.5 * LB, kind: "fictional", desc: "Skyrim: each stone weighs 0.5. The game never names its weight unit; this assumes the common fan reading of 1 unit = 1 lb.", source: SRC.barenziah },
        },
    },

    temperature: {
        label: "Temperature",
        base: "celsius",
        units: {
            celsius:    { label: "Celsius", kind: "standard", toBase: v => v, fromBase: c => c, desc: "Water freezes at 0 °C and boils at 100 °C.", source: SRC.celsius },
            fahrenheit: { label: "Fahrenheit", kind: "standard", toBase: v => (v - 32) * 5 / 9, fromBase: c => c * 9 / 5 + 32, desc: "Water freezes at 32 °F and boils at 212 °F.", source: SRC.fahrenheit },
            kelvin:     { kind: "standard", toBase: v => v - 273.15, fromBase: c => c + 273.15, desc: "Absolute scale: 0 K = −273.15 °C.", source: SRC.kelvin },
            rankine:    { label: "Rankine", kind: "standard", toBase: v => (v - 491.67) * 5 / 9, fromBase: c => (c + 273.15) * 9 / 5, desc: "Absolute Fahrenheit: 0 °R = −459.67 °F.", source: SRC.rankine },
            delisle:    { label: "Delisle", kind: "standard", toBase: v => 100 - v * 2 / 3, fromBase: c => (100 - c) * 3 / 2, desc: "Historical, inverted: 0 °De = boiling, 150 °De = freezing.", source: SRC.delisle },
            reaumur:    { label: "Réaumur", kind: "standard", toBase: v => v * 1.25, fromBase: c => c * 0.8, desc: "Historical: 0 °Ré = freezing, 80 °Ré = boiling.", source: SRC.reaumur },
            romer:      { label: "Rømer", kind: "standard", toBase: v => (v - 7.5) * 40 / 21, fromBase: c => c * 21 / 40 + 7.5, desc: "Historical: 7.5 °Rø = freezing, 60 °Rø = boiling.", source: SRC.romer },
        },
    },

    volume: {
        label: "Volume",
        base: "liters",
        units: {
            liters:            { size: 1, kind: "standard", desc: "1 L = 1 cubic decimeter.", source: SRC.nist },
            milliliters:       { size: 0.001, kind: "standard", desc: "1 L = 1,000 mL.", source: SRC.nist },
            cubic_meters:      { size: 1000, kind: "standard", desc: "1 m³ = 1,000 L.", source: SRC.nist },
            cubic_centimeters: { size: 0.001, kind: "standard", desc: "Same as a milliliter.", source: SRC.nist },
            cubic_inches:      { size: 0.016387064, kind: "standard", desc: "Exactly 16.387064 cm³.", source: SRC.nist },
            gallons_us:        { label: "gallons (US)", size: 3.785411784, kind: "standard", desc: "US liquid gallon, exactly 231 in³.", source: SRC.nist },
            quarts_us:         { label: "quarts (US)", size: 3.785411784 / 4, kind: "standard", desc: "1/4 US gallon.", source: SRC.nist },
            pints_us:          { label: "pints (US)", size: 3.785411784 / 8, kind: "standard", desc: "1/8 US gallon.", source: SRC.nist },
            cups_us:           { label: "cups (US)", size: 3.785411784 / 16, kind: "standard", desc: "1/16 US gallon (~236.6 mL).", source: SRC.nist },
            fluid_ounces_us:   { label: "fluid ounces (US)", size: 3.785411784 / 128, kind: "standard", desc: "1/128 US gallon (~29.57 mL).", source: SRC.nist },
            tablespoons_us:    { label: "tablespoons (US)", size: 3.785411784 / 256, kind: "standard", desc: "1/2 US fl oz (~14.79 mL).", source: SRC.nist },
            teaspoons_us:      { label: "teaspoons (US)", size: 3.785411784 / 768, kind: "standard", desc: "1/3 tablespoon (~4.93 mL).", source: SRC.nist },
            gallons_uk:        { label: "gallons (imperial)", size: 4.54609, kind: "standard", desc: "Imperial gallon, exactly 4.54609 L.", source: SRC.nist },
            bushels_us:        { label: "bushels (US)", size: 35.23907016688, kind: "standard", desc: "US dry bushel (~35.24 L).", source: SRC.nist },
            minecraft_blocks:  { label: "Minecraft blocks", tag: "Minecraft", size: 1000, kind: "fictional", desc: "Minecraft: a block is 1 m³, so one block of water is 1,000 L.", source: SRC.mcBlock },
        },
    },

    speed: {
        label: "Speed",
        base: "meters per second",
        units: {
            meters_per_second:     { size: 1, kind: "standard", desc: "SI unit of speed.", source: SRC.nist },
            kilometers_per_hour:   { size: 1 / 3.6, kind: "standard", desc: "1 m/s = 3.6 km/h.", source: SRC.nist },
            miles_per_hour:        { size: MILE / 3600, kind: "standard", desc: "Exactly 0.44704 m/s.", source: SRC.nist },
            feet_per_second:       { size: 0.3048, kind: "standard", desc: "Exactly 0.3048 m/s.", source: SRC.nist },
            knots:                 { size: 1852 / 3600, kind: "standard", desc: "One nautical mile per hour.", source: SRC.knot },
            mach:                  { label: "Mach", size: 343, kind: "standard", desc: "Speed of sound, ~343 m/s in dry air at 20 °C (it varies with temperature).", source: SRC.sound },
            speed_of_light:        { label: "speed of light (c)", size: C, kind: "standard", desc: "c, exactly 299,792,458 m/s.", source: SRC.speedOfLight },
            deloreans:             { label: "DeLoreans", tag: "Back to the Future", size: 88 * MILE / 3600, kind: "fictional", desc: "Back to the Future: 88 mph, the speed the DeLorean needs to time travel.", source: SRC.delorean },
            warp_factor_tos:       { tag: "Star Trek", label: "warp factor (TOS scale)", kind: "fictional",
                                     toBase: w => Math.pow(w, 3) * C,
                                     fromBase: v => Math.cbrt(v / C),
                                     desc: "Star Trek (original series scale): speed = warp³ × c, so warp 6 = 216c.", source: SRC.warp },
            warp_factor_tng:       { tag: "Star Trek", label: "warp factor (TNG scale)", domain: [0, 9], domainNote: "TNG formula stops at warp 9", kind: "fictional",
                                     toBase: w => (w >= 0 && w <= 9) ? Math.pow(w, 10 / 3) * C : NaN,
                                     fromBase: v => (v >= 0 && v / C <= Math.pow(9, 10 / 3) + 1e-9) ? Math.pow(v / C, 3 / 10) : NaN,
                                     limit: "The TNG scale only has a formula up to warp 9 (~1,516c); above that it climbs toward infinity at warp 10.",
                                     desc: "Star Trek (TNG scale): speed = warp^(10/3) × c up to warp 9, so warp 8 = 1,024c. Warp 10 is infinite.", source: SRC.warp },
        },
    },

    time: {
        label: "Time",
        base: "seconds",
        units: {
            seconds:      { size: 1, kind: "standard", desc: "SI base unit of time.", source: SRC.nist },
            minutes:      { size: 60, kind: "standard", desc: "60 seconds.", source: SRC.nist },
            hours:        { size: 3600, kind: "standard", desc: "60 minutes.", source: SRC.nist },
            days:         { size: DAY, kind: "standard", desc: "24 hours.", source: SRC.nist },
            weeks:        { size: 7 * DAY, kind: "standard", desc: "7 days.", source: SRC.nist },
            years:        { size: JULIAN_YEAR, kind: "standard", desc: "Julian year: exactly 365.25 days.", source: SRC.julianYear },
            centuries:    { size: 100 * JULIAN_YEAR, kind: "standard", desc: "100 Julian years.", source: SRC.julianYear },
            microcenturies: { size: 100 * JULIAN_YEAR * 1e-6, kind: "nerdy", desc: "A millionth of a century (~52 min 36 s) — von Neumann's maximum length for a lecture.", source: SRC.humorous },
            minecraft_days: { label: "Minecraft days", tag: "Minecraft", size: 20 * 60, kind: "fictional", desc: "Minecraft: one full day–night cycle lasts 20 real-time minutes.", source: SRC.mcDay },
            yen:          { tag: "Tolkien", label: "yéni", size: 52596 * DAY, kind: "fictional", desc: "Tolkien: the Elvish 'long year' of 144 solar years (52,596 days).", source: SRC.yen },
        },
    },

    power: {
        label: "Power",
        base: "watts",
        units: {
            watts:      { size: 1, kind: "standard", desc: "SI unit of power: 1 joule per second.", source: SRC.nist },
            kilowatts:  { size: 1e3, kind: "standard", desc: "1,000 W.", source: SRC.nist },
            megawatts:  { size: 1e6, kind: "standard", desc: "1 million W.", source: SRC.nist },
            gigawatts:  { size: 1e9, kind: "standard", desc: "1 billion W (Doc Brown says 'jigowatts').", source: SRC.nist },
            horsepower: { size: 745.69987158227022, kind: "standard", desc: "Mechanical horsepower: 550 ft·lbf/s (~745.7 W).", source: SRC.horsepower },
            metric_horsepower: { size: 735.49875, kind: "standard", desc: "75 kgf·m/s (~735.5 W).", source: SRC.horsepower },
            flux_capacitor_charges: { tag: "Back to the Future", size: 1.21e9, kind: "fictional", desc: "Back to the Future: the 1.21 gigawatts needed for one time jump (~1.62 million hp).", source: SRC.delorean },
        },
    },

    currency: {
        label: "Currency",
        base: "(per universe)",
        note: "Fictional currencies only convert within their own universe — there's no canon exchange rate between Galleons and bottle caps.",
        units: {
            copper_pieces:   { size: 1, universe: "D&D", kind: "fictional", desc: "D&D 5e: 1 cp. 10 cp = 1 sp.", source: SRC.dnd },
            silver_pieces:   { size: 10, universe: "D&D", kind: "fictional", desc: "D&D 5e: 10 cp. 10 sp = 1 gp.", source: SRC.dnd },
            electrum_pieces: { size: 50, universe: "D&D", kind: "fictional", desc: "D&D 5e: worth half a gold piece.", source: SRC.dnd },
            gold_pieces:     { tag: "D&D", size: 100, universe: "D&D", kind: "fictional", desc: "D&D 5e: 100 cp. 10 gp = 1 pp.", source: SRC.dnd },
            platinum_pieces: { size: 1000, universe: "D&D", kind: "fictional", desc: "D&D 5e: 10 gp.", source: SRC.dnd },
            knuts:           { label: "Knuts", size: 1, universe: "Harry Potter", kind: "fictional", desc: "Bronze coin. 29 Knuts = 1 Sickle.", source: SRC.hpWizard },
            sickles:         { label: "Sickles", size: 29, universe: "Harry Potter", kind: "fictional", desc: "Silver coin. 17 Sickles = 1 Galleon.", source: SRC.hpWizard },
            galleons:        { label: "Galleons", size: 29 * 17, universe: "Harry Potter", kind: "fictional", desc: "Gold coin: 493 Knuts. Rowling put it at about £5.", source: SRC.hpWizard },
            pounds_sterling_rowling: { label: "pounds sterling (Rowling's rate)", size: 29 * 17 / 5, universe: "Harry Potter", kind: "fictional", desc: "Muggle money at Rowling's rate of ~£5 per Galleon ('though the exchange rate varies!').", source: SRC.hpWizard },
            bottle_caps:     { size: 1, universe: "Fallout: New Vegas", kind: "fictional", desc: "Standard currency of the Mojave Wasteland by 2281; originally backed by water by the Hub merchants.", source: SRC.cap },
            ncr_dollars:     { label: "NCR dollars", size: 0.4, universe: "Fallout: New Vegas", kind: "fictional", desc: "Worth about 40% of a cap.", source: SRC.ncr },
            legion_denarii:  { label: "Legion denarii", size: 4, universe: "Fallout: New Vegas", kind: "fictional", desc: "Silver Legion coin. An NCR dollar is 10% of a denarius, so ~4 caps.", source: SRC.ncr },
        },
    },

    force_sensitivity: {
        label: "Force Sensitivity",
        base: "midi-chlorians per cell",
        note: "Star Wars canon measures Force potential as a midi-chlorian count per cell.",
        units: {
            midichlorians_per_cell: { label: "midi-chlorians per cell", tag: "Star Wars", size: 1, kind: "fictional", desc: "A single midi-chlorian per cell.", source: SRC.midichlorian },
            average_beings:         { tag: "Star Wars", size: 2500, kind: "fictional", desc: "About 2,500 per cell — a typical living being.", source: SRC.midichlorian },
            jedi_thresholds:        { label: "Jedi thresholds", tag: "Star Wars", size: 5000, kind: "fictional", desc: "About 4,000–5,000 per cell is the minimum for Force sensitivity (upper end used).", source: SRC.midichlorian },
            anakins:                { label: "Anakins", tag: "Star Wars", size: 20000, kind: "fictional", desc: "Anakin Skywalker: over 20,000 — higher than Yoda. 'No Jedi has.'", source: SRC.midichlorian },
        },
    },
};

/** The small label shown with a unit: its universe, or "Nerdy" for real-but-humorous units. */
function unitTag(unit) {
    return unit.tag || unit.universe || (unit.kind === "nerdy" ? "Nerdy" : "");
}

/** Human-readable label for a unit key. */
function unitLabel(key, unit) {
    return (unit && unit.label) || key.replace(/_/g, " ");
}

/** Format a number for display; uses scientific notation for very large/small values. */
const SUPERSCRIPT = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

function formatNumber(n) {
    if (n === 0) return '0';
    const abs = Math.abs(n);
    if (abs >= 1e9 || abs < 1e-4) {
        const [mantissa, exp] = n.toExponential(4).split('e');
        const cleanMantissa = mantissa.replace(/\.?0+$/, '');
        const cleanExp = String(Number(exp)).replace(/./g, ch => SUPERSCRIPT[ch]);
        return `${cleanMantissa} × 10${cleanExp}`;
    }
    // Fewer decimals as numbers get bigger: 0.114692 · 620.13592 · 2,835.85 · 1,622,637
    const digits = abs >= 1e5 ? 0 : abs >= 1000 ? 2 : 6;
    return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

/** A unit's label in the singular, for sentences like "1 smoot = 1.7018 meters". */
const SINGULAR_WORDS = {
    feet: 'foot', inches: 'inch', 'yéni': 'yén', rangar: 'ranga', denarii: 'denarius',
    'Stones of Barenziah': 'Stone of Barenziah', 'pounds sterling': 'pound sterling',
};
function singularLabel(label) {
    const cut = label.search(/ \(| per /);
    const head = cut === -1 ? label : label.slice(0, cut);
    const tail = cut === -1 ? '' : label.slice(cut);
    if (SINGULAR_WORDS[head]) return SINGULAR_WORDS[head] + tail;
    const words = head.split(' ');
    let last = words.pop();
    if (SINGULAR_WORDS[last]) last = SINGULAR_WORDS[last];
    else if (/ies$/.test(last)) last = last.slice(0, -3) + 'y';
    else if (/[^su]s$/.test(last)) last = last.slice(0, -1);
    words.push(last);
    return words.join(' ') + tail;
}

/** Label to use next to a number: singular for exactly 1. */
function labelFor(value, key, unit) {
    const label = unitLabel(key, unit);
    return Math.abs(value) === 1 ? singularLabel(label) : label;
}
