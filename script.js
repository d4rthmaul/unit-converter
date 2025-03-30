document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('category');
    const fromUnit = document.getElementById('fromUnit');
    const toUnit = document.getElementById('toUnit');
    const inputValue = document.getElementById('inputValue');
    const outputValue = document.getElementById('outputValue');
    const swapButton = document.getElementById('swapButton');

    const units = {
        length: {
            meters: 1,                    // Base unit
            kilometers: 0.001,           // 1 km = 1000 m
            centimeters: 100,           // 1 m = 100 cm
            millimeters: 1000,          // 1 m = 1000 mm
            micrometers: 1000000,       // 1 m = 1,000,000 μm
            nanometers: 1000000000,     // 1 m = 1,000,000,000 nm
            inches: 39.3701,           // 1 m = 39.3701 in
            feet: 3.28084,            // 1 m = 3.28084 ft
            yards: 1.09361,           // 1 m = 1.09361 yd
            miles: 0.000621371,       // 1 m = 0.000621371 mi
            nautical_miles: 0.000539957, // 1 m = 0.000539957 nmi
            light_years: 1.057e-16,    // 1 m = 1.057e-16 ly
            parsecs: 3.24078e-17,     // 1 m = 3.24078e-17 pc
            cubits: 2.18723,          // 1 m = 2.18723 cubits (ancient, ~45.72 cm)
            // New units:
            hands: 9.84252,           // 1 m = 9.84252 hands (equestrian, ~10.16 cm)
            furlongs: 0.00497097,     // 1 m = 0.00497097 furlongs (~201.168 m)
            astronomical_units: 6.68459e-12, // 1 m = 6.68459e-12 AU (~149.6 million km)
            warp_miles: 0.0000001      // Fictional (Star Trek-inspired), arbitrary small value
        },
        weight: {
            kilograms: 1,              // Base unit
            grams: 1000,              // 1 kg = 1000 g
            milligrams: 1000000,      // 1 kg = 1,000,000 mg
            micrograms: 1000000000,   // 1 kg = 1,000,000,000 μg
            pounds: 2.20462,         // 1 kg = 2.20462 lb
            ounces: 35.274,          // 1 kg = 35.274 oz
            tons: 0.001,             // 1 kg = 0.001 metric tons
            stone: 0.157473,         // 1 kg = 0.157473 stone (~6.35 kg)
            carats: 5000,            // 1 kg = 5000 carats (200 mg each)
            stones_of_barenziah: 2000, // Fictional (Skyrim), ~0.5 g each
            credits: 1000,           // Fictional (Mass Effect), arbitrary
            // New units:
            tonnes: 0.001,           // 1 kg = 0.001 tonnes (metric ton, same as tons here)
            grains: 15432.4,         // 1 kg = 15,432.4 grains (~64.8 mg)
            drams: 564.383,          // 1 kg = 564.383 drams (~1.7718 g)
            dilithium_crystals: 0.01   // Fictional (Star Trek), arbitrary heavy unit
        },
        temperature: {
            celsius: 'c',             // Base for conversion logic
            fahrenheit: 'f',
            kelvin: 'k',
            rankine: 'r',
            midichlorian: 'm',        // Fictional (Star Wars), custom formula
            // New units:
            delisle: 'd',            // Historical scale: 0°C = 150°De, decreases as temp rises
            reaumur: 're',           // Historical: 0°C = 0°Ré, 100°C = 80°Ré
            romer: 'ro',             // Historical: 0°C = 7.5°Rø, 100°C = 60°Rø
            plasma_points: 'p'       // Fictional (sci-fi plasma energy), arbitrary
        },
        volume: {
            liters: 1,                // Base unit
            milliliters: 1000,       // 1 L = 1000 mL
            cubic_meters: 0.001,     // 1 L = 0.001 m³
            cubic_centimeters: 1000, // 1 L = 1000 cm³ (same as mL)
            cubic_inches: 61.0237,   // 1 L = 61.0237 in³
            gallons_us: 0.264172,    // 1 L = 0.264172 US gal
            quarts_us: 1.05669,      // 1 L = 1.05669 US qt
            pints_us: 2.11338,       // 1 L = 2.11338 US pt
            cups: 4.22675,           // 1 L = 4.22675 cups
            fluid_ounces_us: 33.814, // 1 L = 33.814 fl oz (US)
            tablespoons: 67.628,     // 1 L = 67.628 tbsp
            teaspoons: 202.884,      // 1 L = 202.884 tsp
            nuka_cola_caps: 4000,    // Fictional (Fallout), ~0.25 mL per cap
            barrels_of_grog: 0.00625, // Fictional (pirate-inspired), ~160 L
            // New units:
            gallons_uk: 0.219969,    // 1 L = 0.219969 UK gal (~4.546 L)
            bushels: 0.0283776,      // 1 L = 0.0283776 bushels (~35.239 L)
            vials_of_mana: 2000,     // Fictional (fantasy RPG), ~0.5 mL per vial
            hyperspace_fuel: 0.0001   // Fictional (sci-fi), arbitrary small unit
        }
    };

    function populateUnits(category) {
        const unitOptions = Object.keys(units[category]);
        fromUnit.innerHTML = '';
        toUnit.innerHTML = '';

        unitOptions.forEach(unit => {
            const option1 = document.createElement('option');
            const option2 = document.createElement('option');
            option1.value = option2.value = unit;
            option1.text = option2.text = unit.replace(/_/g, ' ');
            fromUnit.appendChild(option1);
            toUnit.appendChild(option2);
        });

        fromUnit.value = unitOptions[0];
        toUnit.value = unitOptions[1];
        convert();
    }

    function convert() {
        const category = categorySelect.value;
        const from = fromUnit.value;
        const to = toUnit.value;
        const input = parseFloat(inputValue.value);

        if (isNaN(input) || !units[category][from] || !units[category][to]) {
            outputValue.value = '';
            return;
        }

        let result;
        if (category === 'temperature') {
            let celsius;
            // Convert to Celsius first
            if (from === 'celsius') celsius = input;
            else if (from === 'fahrenheit') celsius = (input - 32) * 5/9;
            else if (from === 'kelvin') celsius = input - 273.15;
            else if (from === 'rankine') celsius = (input - 491.67) * 5/9;
            else if (from === 'midichlorian') celsius = (input * 2) - 100;
            else if (from === 'delisle') celsius = 100 - (input * 2/3); // 0°C = 150°De, 100°C = 0°De
            else if (from === 'reaumur') celsius = input * 1.25; // 0°Ré = 0°C, 80°Ré = 100°C
            else if (from === 'romer') celsius = (input - 7.5) * 40/21; // 7.5°Rø = 0°C, 60°Rø = 100°C
            else if (from === 'plasma_points') celsius = input * 1000 - 5000; // Arbitrary sci-fi scale

            // Convert from Celsius to target unit
            if (to === 'celsius') result = celsius;
            else if (to === 'fahrenheit') result = (celsius * 9/5) + 32;
            else if (to === 'kelvin') result = celsius + 273.15;
            else if (to === 'rankine') result = (celsius + 273.15) * 9/5;
            else if (to === 'midichlorian') result = (celsius + 100) / 2;
            else if (to === 'delisle') result = (100 - celsius) * 3/2; // Reverse Delisle scale
            else if (to === 'reaumur') result = celsius * 0.8; // 0°C = 0°Ré, 100°C = 80°Ré
            else if (to === 'romer') result = (celsius * 21/40) + 7.5; // 0°C = 7.5°Rø, 100°C = 60°Rø
            else if (to === 'plasma_points') result = (celsius + 5000) / 1000; // Arbitrary sci-fi scale
        } else {
            const baseValue = input / units[category][from];
            result = baseValue * units[category][to];
        }

        outputValue.value = result.toFixed(4);
    }

    populateUnits('length');

    categorySelect.addEventListener('change', () => populateUnits(categorySelect.value));
    fromUnit.addEventListener('change', convert);
    toUnit.addEventListener('change', convert);
    inputValue.addEventListener('input', convert);
    swapButton.addEventListener('click', () => {
        const temp = fromUnit.value;
        fromUnit.value = toUnit.value;
        toUnit.value = temp;
        convert();
    });
});