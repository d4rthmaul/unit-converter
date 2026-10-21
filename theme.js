/*
 * theme.js — day / night mode
 * ===========================
 * Night mode is the "cockpit at night" palette. The theme is a data-theme attribute on <html>
 * ("light" or "dark"); styles.css swaps its colour tokens on it.
 *
 * - Loaded in <head>, before the stylesheet, so the right theme is set before the page paints
 *   (no flash of the wrong colours).
 * - By default the page follows the visitor's system setting, and keeps following it if it
 *   changes. Once someone clicks the toggle, their choice is saved in localStorage and wins.
 * - Any button with a data-theme-toggle attribute works as a toggle; its .theme-toggle-label
 *   child is kept up to date ("Switch to night mode" / "Switch to day mode").
 */
(function () {
    var KEY = 'nerdy-converter-theme';
    var root = document.documentElement;
    var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    // localStorage can throw (private browsing, blocked storage); treat that as "no choice saved".
    function stored() {
        try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }
    function store(value) {
        try { localStorage.setItem(KEY, value); } catch (e) { /* private mode etc. — fine */ }
    }
    function systemTheme() {
        return media && media.matches ? 'dark' : 'light';
    }
    /** Set the theme and update every toggle's label to describe what a click will do. */
    function apply(theme) {
        root.setAttribute('data-theme', theme);
        var buttons = document.querySelectorAll('[data-theme-toggle]');
        buttons.forEach(function (btn) {
            var dark = theme === 'dark';
            var label = btn.querySelector('.theme-toggle-label');
            if (label) label.textContent = dark ? 'Switch to day mode' : 'Switch to night mode';
        });
    }

    // Run immediately (we're in <head>): saved choice first, then the system setting.
    apply(stored() || systemTheme());

    // Follow system changes (e.g. automatic dark mode at sunset) unless the visitor has chosen.

    if (media && media.addEventListener) {
        media.addEventListener('change', function () {
            if (!stored()) apply(systemTheme());
        });
    }

    // The toggle buttons don't exist yet while <head> runs, so wire them up once the page loads.
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
