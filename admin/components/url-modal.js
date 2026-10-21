/**
 * UrlModal — self-contained modal to register the redirect URL.
 * Builds its own DOM; the page only needs to load url-modal.css.
 *
 * const modal = new UrlModal({
 *   onSave: async (url) => { ... },   // throw an Error to show a message in the modal
 * });
 * modal.open(currentUrl);
 */
class UrlModal {
    constructor({ onSave }) {
        this.onSave = onSave;
        this._onKeydown = (e) => {
            if (e.key === 'Escape') this.close();
        };
        this._render();
    }

    _render() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'url-modal-overlay hidden';
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        const dialog = document.createElement('div');
        dialog.className = 'url-modal';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'url-modal-title');

        const header = document.createElement('div');
        header.className = 'url-modal-header';

        const title = document.createElement('h3');
        title.id = 'url-modal-title';
        title.textContent = 'Cadastrar URL';

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'url-modal-close';
        closeButton.setAttribute('aria-label', 'Fechar');
        closeButton.textContent = '✕';
        closeButton.addEventListener('click', () => this.close());

        header.append(title, closeButton);

        this.form = document.createElement('form');
        this.form.className = 'url-modal-body';
        this.form.noValidate = true;
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this._save();
        });

        const hint = document.createElement('p');
        hint.className = 'url-modal-hint';
        hint.textContent =
            'Depois de coletar os dados, o visitante será redirecionado para esta URL. Deixe vazio para não redirecionar.';

        this.input = document.createElement('input');
        this.input.type = 'url';
        this.input.className = 'url-modal-input';
        this.input.placeholder = 'https://exemplo.com';
        this.input.autocomplete = 'off';
        this.input.setAttribute('aria-label', 'URL de redirecionamento');

        this.error = document.createElement('p');
        this.error.className = 'url-modal-error hidden';
        this.error.setAttribute('role', 'alert');

        const actions = document.createElement('div');
        actions.className = 'url-modal-actions';

        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'url-modal-btn secondary';
        cancelButton.textContent = 'Cancelar';
        cancelButton.addEventListener('click', () => this.close());

        this.saveButton = document.createElement('button');
        this.saveButton.type = 'submit';
        this.saveButton.className = 'url-modal-btn primary';
        this.saveButton.textContent = 'Salvar';

        actions.append(cancelButton, this.saveButton);
        this.form.append(hint, this.input, this.error, actions);
        dialog.append(header, this.form);
        this.overlay.appendChild(dialog);
        document.body.appendChild(this.overlay);
    }

    open(currentUrl = '') {
        this.input.value = currentUrl;
        this._setError('');
        this.overlay.classList.remove('hidden');
        document.addEventListener('keydown', this._onKeydown);
        this.input.focus();
    }

    close() {
        this.overlay.classList.add('hidden');
        document.removeEventListener('keydown', this._onKeydown);
    }

    _setError(message) {
        this.error.textContent = message;
        this.error.classList.toggle('hidden', !message);
    }

    async _save() {
        const url = this.input.value.trim();

        if (url && !/^https?:\/\//i.test(url)) {
            this._setError('A URL deve começar com http:// ou https://');
            return;
        }

        this.saveButton.disabled = true;
        this._setError('');
        try {
            await this.onSave(url);
            this.close();
        } catch (err) {
            this._setError(err.message || 'Não foi possível salvar a URL');
        } finally {
            this.saveButton.disabled = false;
        }
    }
}
