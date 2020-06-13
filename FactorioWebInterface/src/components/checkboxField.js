import "./checkboxField.ts.less";
import { FieldBase } from "./fieldBase";
import { EventListener } from "../utils/eventListener";
import { FieldId } from "../utils/fieldId";
import { Tooltip } from "./tooltip";
export class CheckboxField extends FieldBase {
    constructor(property, header) {
        super();
        this._property = property;
        let id = FieldId.getNextId();
        this._container = document.createElement('div');
        this.append(this._container);
        this._input = document.createElement('input');
        this._input.type = 'checkbox';
        this._input.id = id;
        this._container.append(this._input);
        this._label = document.createElement('label');
        this._label.htmlFor = id;
        this._label.innerText = header;
        this._container.append(this._label);
    }
    get header() {
        return this._label.innerText;
    }
    set header(text) {
        this._label.innerText = text;
    }
    get value() {
        return this._input.checked;
    }
    set value(checked) {
        this._input.checked = checked;
    }
    get error() {
        return '';
    }
    set error(errorText) {
    }
    get enabled() {
        return !this._input.disabled;
    }
    set enabled(value) {
        this._input.disabled = !value;
    }
    onChange(handler) {
        let callback = () => handler(this.value);
        return EventListener.onChange(this._input, callback);
    }
    setTooltip(content) {
        let tooltip = new Tooltip(content);
        this._label.appendChild(tooltip);
        return this;
    }
}
customElements.define('a-checkbox-field', CheckboxField);
//# sourceMappingURL=checkboxField.js.map