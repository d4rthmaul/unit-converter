document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('category');
    const fromUnit = document.getElementById('fromUnit');
    const toUnit = document.getElementById('toUnit');
    const inputValue = document.getElementById('inputValue');
    const outputValue = document.getElementById('outputValue');
    const swapButton = document.getElementById('swapButton');
    const tooltip = document.getElementById('unitTooltip');

    if (!tooltip) return;

    const units = {
        length: {
            meters: { value: 1, desc: "Standard unit of length (1 m)." },
            kilometers: { value: 0.001, desc: "1 km = 1000 meters." },
            centimeters: { value: 100, desc: "1 m = 100 cm." },
            millimeters: { value: 1000, desc: "1 m = 1000 mm." },
            micrometers: { value: 1000000, desc: "1 m = 1,000,000 μm." },
            nanometers: { value: 1000000000, desc: "1 m = 1 billion nm." },
            inches: { value: 39.3701, desc: "1 m = 39.37 inches." },
            feet: { value: 3.28084, desc: "1 m = 3.28 feet." },
            yards: { value: 1.09361, desc: "1 m = 1.09 yards." },
            miles: { value: 0.000621371, desc: "1 m = 0.000621 miles." },
            nautical_miles: { value: 0.000539957, desc: "1 m = 0.00054 nautical miles." },
            light_years: { value: 1.057e-16, desc: "Distance light travels in a year (~9.46 trillion km)." },
            parsecs: { value: 3.24078e-17, desc: "3.26 light-years, used in astronomy." },
            cubits: { value: 2.18723, desc: "Ancient unit (~45.72 cm)." },
            hands: { value: 9.84252, desc: "Used for horse height (~10.16 cm)." },
            furlongs: { value: 0.00497097, desc: "Historical field length (~201.168 m)." },
            astronomical_units: { value: 6.68459e-12, desc: "Earth-Sun distance (~149.6 million km)." }
        },
        weight: {
            kilograms: { value: 1, desc: "Standard unit of mass (1 kg)." },
            grams: { value: 1000, desc: "1 kg = 1000 g." },
            milligrams: { value: 1000000, desc: "1 kg = 1 million mg." },
            micrograms: { value: 1000000000, desc: "1 kg = 1 billion μg." },
            pounds: { value: 2.20462, desc: "1 kg = 2.205 lb." },
            ounces: { value: 35.274, desc: "1 kg = 35.274 oz." },
            tons: { value: 0.001, desc: "1 kg = 0.001 metric tons." },
            stone: { value: 0.157473, desc: "1 kg = 0.157 stone (~6.35 kg)." },
            carats: { value: 5000, desc: "1 kg = 5000 carats (200 mg each)." },
            stones_of_barenziah: { value: 2000, desc: "Fictional Skyrim gem (~0.5 g)." },
            gold_pieces: { value: 110.231, desc: "D&D 5e coin; 50 gp weigh 1 lb, so one is ~9.07 g." },
            tonnes: { value: 0.001, desc: "Metric ton, same as tons (1000 kg)." },
            grains: { value: 15432.4, desc: "Archaic unit (~64.8 mg)." },
            drams: { value: 564.383, desc: "Apothecary unit (~1.7718 g)." },
            dilithium_crystals: { value: 0.01, desc: "Fictional Star Trek power source (~100 kg)." }
        },
        temperature: {
            celsius: { value: 'c', desc: "Standard metric scale (0°C = water freezes)." },
            fahrenheit: { value: 'f', desc: "Common in the US (32°F = 0°C)." },
            kelvin: { value: 'k', desc: "Absolute scale (0 K = -273.15°C)." },
            rankine: { value: 'r', desc: "Absolute Fahrenheit (0°R = -459.67°F)." },
            delisle: { value: 'd', desc: "Historical, inverted (150°De = 0°C)." },
            reaumur: { value: 're', desc: "Historical (0°Ré = 0°C, 80°Ré = 100°C)." },
            romer: { value: 'ro', desc: "Historical (7.5°Rø = 0°C, 60°Rø = 100°C)." },
            plasma_points: { value: 'p', desc: "Fictional sci-fi high-energy scale." }
        },
        volume: {
            liters: { value: 1, desc: "Standard unit of volume (1 L)." },
            milliliters: { value: 1000, desc: "1 L = 1000 mL." },
            cubic_meters: { value: 0.001, desc: "1 L = 0.001 m³." },
            cubic_centimeters: { value: 1000, desc: "1 L = 1000 cm³ (same as mL)." },
            cubic_inches: { value: 61.0237, desc: "1 L = 61.02 in³." },
            gallons_us: { value: 0.264172, desc: "1 L = 0.264 US gallons." },
            quarts_us: { value: 1.05669, desc: "1 L = 1.057 US quarts." },
            pints_us: { value: 2.11338, desc: "1 L = 2.113 US pints." },
            cups: { value: 4.22675, desc: "1 L = 4.227 cups." },
            fluid_ounces_us: { value: 33.814, desc: "1 L = 33.814 US fl oz." },
            tablespoons: { value: 67.628, desc: "1 L = 67.628 tbsp." },
            teaspoons: { value: 202.884, desc: "1 L = 202.884 tsp." },
            nuka_cola_caps: { value: 4000, desc: "Fictional Fallout currency (~0.25 mL)." },
            barrels_of_grog: { value: 0.00625, desc: "Fictional pirate barrel (~160 L)." },
            gallons_uk: { value: 0.219969, desc: "1 L = 0.22 UK gallons (~4.546 L)." },
            bushels: { value: 0.0283776, desc: "1 L = 0.028 bushels (~35.239 L)." },
            vials_of_mana: { value: 2000, desc: "Fictional RPG potion (~0.5 mL)." },
            hyperspace_fuel: { value: 0.0001, desc: "Fictional sci-fi fuel unit." }
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
            option1.dataset.description = option2.dataset.description = units[category][unit].desc;
            fromUnit.appendChild(option1);
            toUnit.appendChild(option2);
        });

        fromUnit.value = unitOptions[0];
        toUnit.value = unitOptions[1];
        convert();
        updateTooltip();
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
            if (from === 'celsius') celsius = input;
            else if (from === 'fahrenheit') celsius = (input - 32) * 5/9;
            else if (from === 'kelvin') celsius = input - 273.15;
            else if (from === 'rankine') celsius = (input - 491.67) * 5/9;
            else if (from === 'delisle') celsius = 100 - (input * 2/3);
            else if (from === 'reaumur') celsius = input * 1.25;
            else if (from === 'romer') celsius = (input - 7.5) * 40/21;
            else if (from === 'plasma_points') celsius = input * 1000 - 5000;

            if (to === 'celsius') result = celsius;
            else if (to === 'fahrenheit') result = (celsius * 9/5) + 32;
            else if (to === 'kelvin') result = celsius + 273.15;
            else if (to === 'rankine') result = (celsius + 273.15) * 9/5;
            else if (to === 'delisle') result = (100 - celsius) * 3/2;
            else if (to === 'reaumur') result = celsius * 0.8;
            else if (to === 'romer') result = (celsius * 21/40) + 7.5;
            else if (to === 'plasma_points') result = (celsius + 5000) / 1000;
        } else {
            const baseValue = input / units[category][from].value;
            result = baseValue * units[category][to].value;
        }

        outputValue.value = result.toFixed(4);
    }

    function updateTooltip() {
        const fromDesc = fromUnit.selectedOptions[0]?.dataset.description || 'No unit selected';
        const toDesc = toUnit.selectedOptions[0]?.dataset.description || 'No unit selected';
        const tooltipText = `From: ${fromDesc} | To: ${toDesc}`;
        tooltip.textContent = tooltipText;
        tooltip.style.display = 'block';
    }

    // Initial setup
    populateUnits('length');

    // Event listeners
    categorySelect.addEventListener('change', () => {
        populateUnits(categorySelect.value);
    });
    fromUnit.addEventListener('change', () => {
        convert();
        updateTooltip();
    });
    toUnit.addEventListener('change', () => {
        convert();
        updateTooltip();
    });
    inputValue.addEventListener('input', convert);
    swapButton.addEventListener('click', () => {
        const temp = fromUnit.value;
        fromUnit.value = toUnit.value;
        toUnit.value = temp;
        convert();
        updateTooltip();
    });
});