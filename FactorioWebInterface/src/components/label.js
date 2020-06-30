import "./label.ts.less";
import { HTMLLabelBaseElement } from "./htmlLabelBaseElement";
export class Label extends HTMLLabelBaseElement {
}
Label.classes = {
    headedLabel: 'headed-label'
};
customElements.define('a-label', Label, { extends: 'label' });
export function headedLabel(header, text) {
    let headerEle = document.createElement('header');
    headerEle.textContent = header;
    let label = new Label();
    label.append(headerEle, text);
    label.classList.add(Label.classes.headedLabel);
    return label;
}
//# sourceMappingURL=label.js.map