(function initCoffreModule(globalScope) {
    const maxCode = 7;

    const codeColors = {
        0: { name: 'noir', hex: '#101010', text: '#fffdf8' },
        1: { name: 'rouge', hex: '#c94a38', text: '#fffdf8' },
        2: { name: 'vert', hex: '#617c46', text: '#fffdf8' },
        3: { name: 'jaune', hex: '#f5c36a', text: '#101726' },
        4: { name: 'bleu', hex: '#2f8f9d', text: '#fffdf8' },
        5: { name: 'magenta', hex: '#9d4f82', text: '#fffdf8' },
        6: { name: 'cyan', hex: '#71c7d8', text: '#101726' },
        7: { name: 'blanc', hex: '#fffdf8', text: '#101726' }
    };

    function randomCode(random = Math.random) {
        return Math.floor(random() * (maxCode + 1));
    }

    function toggleBit(selectedValue, bit) {
        return selectedValue ^ bit;
    }

    function isCorrect(selectedValue, targetCode) {
        return selectedValue === targetCode;
    }

    function colorForCode(code) {
        return codeColors[code] || codeColors[0];
    }

    function binaryLabel(value) {
        return value.toString(2).padStart(3, '0');
    }

    function setupPage() {
        const screen = document.getElementById('coffre-screen');
        const selection = document.getElementById('coffre-selection');
        const result = document.getElementById('coffre-result');
        const validateButton = document.getElementById('coffre-validate');
        const replayButton = document.getElementById('coffre-replay');
        const switchButtons = Array.from(document.querySelectorAll('.coffre-switch'));
        const hideButtonText = document.getElementById('hide-button-text');
        const hideScreenText = document.getElementById('hide-screen-text');
        const freezeScreenColor = document.getElementById('freeze-screen-color');

        if (!screen || !selection || !result || !validateButton || !replayButton || switchButtons.length === 0) return;

        let currentCode = randomCode();
        let selectedValue = 0;
        let frozenColor = null;

        function updateScreen() {
            const visibleColor = colorForCode(currentCode);
            const color = freezeScreenColor.checked && frozenColor ? frozenColor : visibleColor;

            screen.style.backgroundColor = color.hex;
            screen.style.color = color.text;
            screen.dataset.colorName = color.name;
            frozenColor = color;

            screen.innerHTML = hideScreenText.checked ? '<span aria-hidden="true"></span>' : `<span>Code : ${currentCode}</span>`;
        }

        function updateSelection() {
            selection.textContent = `${binaryLabel(selectedValue)} = ${selectedValue}`;
            switchButtons.forEach((button) => {
                const bit = Number(button.dataset.bit);
                const active = (selectedValue & bit) === bit;
                button.classList.toggle('is-active', active);
                button.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
        }

        function updateButtonLabels() {
            switchButtons.forEach((button) => {
                button.textContent = hideButtonText.checked ? '' : button.dataset.label;
                button.setAttribute('aria-label', button.dataset.label);
            });
        }

        function clearResult() {
            result.textContent = '';
            result.className = 'coffre-result';
        }

        function replay() {
            currentCode = randomCode();
            selectedValue = 0;
            validateButton.hidden = false;
            replayButton.hidden = true;
            clearResult();
            updateScreen();
            updateSelection();
        }

        switchButtons.forEach((button) => {
            button.addEventListener('click', () => {
                selectedValue = toggleBit(selectedValue, Number(button.dataset.bit));
                clearResult();
                updateSelection();
            });
        });

        validateButton.addEventListener('click', () => {
            if (isCorrect(selectedValue, currentCode)) {
                result.textContent = 'Bravo, le coffre est ouvert.';
                result.classList.add('is-success');
                validateButton.hidden = true;
                replayButton.hidden = false;
                return;
            }

            result.textContent = `Pas encore : ton code vaut ${selectedValue}.`;
            result.classList.add('is-error');
        });

        replayButton.addEventListener('click', replay);
        hideButtonText.addEventListener('change', updateButtonLabels);
        hideScreenText.addEventListener('change', updateScreen);
        freezeScreenColor.addEventListener('change', updateScreen);

        updateButtonLabels();
        updateScreen();
        updateSelection();
    }

    const api = {
        maxCode,
        randomCode,
        toggleBit,
        isCorrect,
        colorForCode,
        binaryLabel
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    globalScope.PouzatCoffre = api;

    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', setupPage);
    }
})(typeof window !== 'undefined' ? window : globalThis);
