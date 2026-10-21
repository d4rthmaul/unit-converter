/*
 * Day / night theme. Night is the "cockpit at night" palette.
 * Loaded in <head> so the right theme is applied before the page paints.
 * Default: follow the visitor's system setting. A click on the toggle is remembered on this device.
 */
(function () {
    var KEY = 'nerdy-converter-theme';
    var root = document.documentElement;
    var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function stored() {
        try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }
    function store(value) {
        try { localStorage.setItem(KEY, value); } catch (e) { /* private mode etc. — fine */ }
    }
    function systemTheme() {
        return media && media.matches ? 'dark' : 'light';
    }
    function apply(theme) {
        root.setAttribute('data-theme', theme);
        var buttons = document.querySelectorAll('[data-theme-toggle]');
        buttons.forEach(function (btn) {
            var dark = theme === 'dark';
            var label = btn.querySelector('.theme-toggle-label');
            if (label) label.textContent = dark ? 'Switch to day mode' : 'Switch to night mode';
        });
    }

    apply(stored() || systemTheme());

    if (media && media.addEventListener) {
        media.addEventListener('change', function () {
            if (!stored()) apply(systemTheme());
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        apply(root.getAttribute('data-theme'));
        document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                store(next);
                apply(next);
            });
        });
    });
})();
