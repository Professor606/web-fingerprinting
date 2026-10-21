/**
 * UserMenu — dropdown button for the dashboard header.
 *
 * new UserMenu(container, {
 *   label: '☰ Menu',
 *   items: [{ label, onClick, variant? }, ...],   // variant: 'danger' | undefined
 * });
 */
class UserMenu {
    constructor(container, { label = 'Menu', items = [] } = {}) {
        this.container = container;
        this.label = label;
        this.items = items;
        this.isOpen = false;

        this._onDocumentClick = (e) => {
            if (!this.root.contains(e.target)) this.close();
        };
        this._onKeydown = (e) => {
            if (e.key === 'Escape') this.close();
        };

        this._render();
    }

    _render() {
        this.root = document.createElement('div');
        this.root.className = 'user-menu';

        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        this.trigger.className = 'user-menu-trigger';
        this.trigger.setAttribute('aria-haspopup', 'menu');
        this.trigger.setAttribute('aria-expanded', 'false');
        this.trigger.textContent = `${this.label} ▾`;
        this.trigger.addEventListener('click', () => this.toggle());

        this.list = document.createElement('div');
        this.list.className = 'user-menu-list hidden';
        this.list.setAttribute('role', 'menu');

        this.items.forEach((item) => this.list.appendChild(this._renderItem(item)));

        this.root.append(this.trigger, this.list);
        this.container.appendChild(this.root);
    }

    _renderItem({ label, onClick, variant }) {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'menuitem');
        button.className = 'user-menu-item' + (variant ? ` ${variant}` : '');
        button.textContent = label;
        button.addEventListener('click', () => {
            this.close();
            onClick();
        });
        return button;
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        this.list.classList.remove('hidden');
        this.trigger.setAttribute('aria-expanded', 'true');
        document.addEventListener('click', this._onDocumentClick);
        document.addEventListener('keydown', this._onKeydown);
    }

    close() {
        this.isOpen = false;
        this.list.classList.add('hidden');
        this.trigger.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', this._onDocumentClick);
        document.removeEventListener('keydown', this._onKeydown);
    }
}
