import { VirtualComponent } from "../../components/virtualComponent";
import { Modal } from "../../components/modal";
import { StackPanel } from "../../components/stackPanel";
import { VirtualForm } from "../../components/virtualForm";
import { TextField } from "../../components/textField";
import { Button } from "../../components/button";
import { Field } from "../../components/field";
export class NewModPackView extends VirtualComponent {
    constructor(newModPackViewModel) {
        super();
        let title = document.createElement('h4');
        title.textContent = 'New Mod Pack';
        let buttonsPanel = new StackPanel(StackPanel.direction.row);
        buttonsPanel.classList.add('no-spacing');
        let createButton = new Button('Create', Button.classes.success).setCommand(newModPackViewModel.createCommand);
        let cancelButton = new Button('Cancel', Button.classes.primary).setCommand(newModPackViewModel.cancelCommand);
        buttonsPanel.append(createButton, cancelButton);
        let form = new VirtualForm(newModPackViewModel, [
            new TextField('name', 'Name'),
            new Field(buttonsPanel)
        ]);
        form.isHorizontal = true;
        let modal = new Modal(form.root)
            .setHeader(title);
        modal.style.minWidth = '480px';
        this._root = modal;
    }
}
//# sourceMappingURL=newModPackView.js.map