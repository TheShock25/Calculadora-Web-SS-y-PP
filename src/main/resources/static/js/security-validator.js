/**
 * Utilidad global de seguridad y validación de entradas para la Calculadora Web.
 * Protege contra XSS, inyección de caracteres inválidos, desbordamientos numéricos y manipulación de inputs.
 */
const SecurityValidator = (function() {
    'use strict';

    /**
     * Escapa caracteres HTML peligrosos para prevenir ataques Cross-Site Scripting (XSS).
     */
    function sanitizeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Obtiene de forma segura un número finito dentro de un rango permitido.
     */
    function parseSafeNumber(val, fallback = 0, min = -Infinity, max = Infinity) {
        if (val === null || val === undefined || val === '') return fallback;
        const num = Number(val);
        if (!Number.isFinite(num) || Number.isNaN(num)) return fallback;
        if (num < min) return min;
        if (num > max) return max;
        return num;
    }

    /**
     * Configura el filtrado y validación estricta de un campo de texto numérico.
     */
    function attachNumericFilter(input, options = {}) {
        if (!input) return;

        const allowDecimal = !!options.allowDecimal;
        const min = options.min !== undefined ? options.min : (allowDecimal ? 0 : 1);
        const max = options.max !== undefined ? options.max : 999;
        const maxDecimals = options.maxDecimals || 2;
        const maxLength = options.maxLength || (allowDecimal ? 6 : 3);
        const errorEl = options.errorElementId ? document.getElementById(options.errorElementId) : null;
        const onValidate = typeof options.onValidate === 'function' ? options.onValidate : null;

        // Configurar atributos HTML seguros
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('inputmode', allowDecimal ? 'decimal' : 'numeric');
        input.setAttribute('maxlength', String(maxLength));

        function limpiarValor(str) {
            if (!str) return '';
            let limpio = String(str).trim();

            if (allowDecimal) {
                limpio = limpio.replace(/,/g, '.');
                limpio = limpio.replace(/[^0-9.]/g, '');
                const partes = limpio.split('.');
                if (partes.length > 2) {
                    limpio = partes[0] + '.' + partes.slice(1).join('');
                }
                if (partes.length > 1 && partes[1].length > maxDecimals) {
                    limpio = partes[0] + '.' + partes[1].substring(0, maxDecimals);
                }
            } else {
                limpio = limpio.replace(/\D/g, '');
            }

            if (limpio.length > maxLength) {
                limpio = limpio.substring(0, maxLength);
            }

            return limpio;
        }

        function validarYActualizarUI() {
            const val = input.value.trim();
            if (val === '') {
                input.classList.remove('valid', 'invalid');
                if (errorEl) errorEl.classList.remove('show');
                if (onValidate) onValidate(false, null);
                return false;
            }

            const num = parseFloat(val);
            const esValido = !Number.isNaN(num) && Number.isFinite(num) && num >= min && num <= max;

            if (esValido) {
                input.classList.add('valid');
                input.classList.remove('invalid');
                if (errorEl) errorEl.classList.remove('show');
            } else {
                input.classList.add('invalid');
                input.classList.remove('valid');
                if (errorEl) errorEl.classList.add('show');
            }

            if (onValidate) onValidate(esValido, esValido ? num : null);
            return esValido;
        }

        // 1. Bloqueo de teclas no numéricas
        input.addEventListener('keydown', function(e) {
            // Permitir teclas de navegación y control
            if ([8, 46, 9, 27, 13, 37, 38, 39, 40].includes(e.keyCode)) return;
            // Permitir combinaciones Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
            if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88, 90].includes(e.keyCode)) return;

            // Teclado numérico principal o numpad
            const isDigit = (e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105);
            if (isDigit) return;

            // Punto decimal
            if (allowDecimal && (e.key === '.' || e.key === ',' || e.keyCode === 190 || e.keyCode === 110)) {
                if (!this.value.includes('.')) {
                    if (e.key === ',') {
                        e.preventDefault();
                        this.value += '.';
                    }
                    return;
                }
            }

            // Bloquear cualquier otra tecla
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        // 2. Limpieza en el evento input
        input.addEventListener('input', function() {
            const limpio = limpiarValor(this.value);
            if (this.value !== limpio) {
                this.value = limpio;
            }
            validarYActualizarUI();
        });

        // 3. Limpieza en el pegado (paste)
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const textoPegado = (e.clipboardData || window.clipboardData).getData('text');
            const limpio = limpiarValor(textoPegado);
            this.value = limpio;
            validarYActualizarUI();
        });

        // 4. Bloquear arrastre (drop) de contenido externo peligroso
        input.addEventListener('drop', function(e) {
            e.preventDefault();
        });

        // 5. Validación final al perder el foco
        input.addEventListener('blur', function() {
            validarYActualizarUI();
        });

        return {
            validate: validarYActualizarUI,
            getValue: () => {
                const val = parseFloat(input.value);
                return Number.isFinite(val) ? val : null;
            }
        };
    }

    return {
        sanitizeHTML: sanitizeHTML,
        parseSafeNumber: parseSafeNumber,
        attachNumericFilter: attachNumericFilter
    };
})();
