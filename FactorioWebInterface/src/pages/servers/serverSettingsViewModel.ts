﻿import { ObservableObject } from "../../utils/observableObject";
import { IObservableErrors, ObservableErrors } from "../../utils/observableErrors";
import { ServerSettingsService } from "./serverSettingsService";
import { FactorioServerSettings, FactorioServerSettingsType } from "./serversTypes";
import { Validator, MaxStringLength } from "../../utils/validator";
import { DelegateCommand, ICommand } from "../../utils/command";
import { CollectionChangeType, Utils } from "../../ts/utils";
import { CopyToClipboardService } from "../../services/copyToClipboardService";
import { MathHelper } from "../../utils/mathHelper";
import { ErrorService } from "../../services/errorService";

interface FormFields {
    Name: string;
    Description: string;
    Tags: string;
    MaxPlayers: number;
    GamePassword: string;
    MaxUploadSlots: number;
    AutoPause: boolean;
    UseDefaultAdmins: boolean;
    Admins: string;
    AutosaveInterval: number;
    AutosaveSlots: number;
    NonBlockingSaving: boolean;
    PublicVisible: boolean;
}

export class ServerSettingsViewModel extends ObservableObject implements IObservableErrors {
    static readonly normalPasteText = 'Paste settings here';
    static readonly errorPasteText = 'Invalid settings';
    static readonly appliedPasteText = 'Settings applied';

    private static readonly formFieldsDefaultValues: FormFields = {
        Name: '',
        Description: '',
        Tags: '',
        MaxPlayers: 0,
        GamePassword: '',
        MaxUploadSlots: 32,
        AutoPause: true,
        UseDefaultAdmins: true,
        Admins: '',
        AutosaveInterval: 5,
        AutosaveSlots: 20,
        NonBlockingSaving: true,
        PublicVisible: true
    }

    private _suppressUpdate = false;

    private _serverSettingsService: ServerSettingsService;
    private _copyToClipoardService: CopyToClipboardService;
    private _errorService: ErrorService;

    private _formFields: FormFields = Object.assign({}, ServerSettingsViewModel.formFieldsDefaultValues);

    private _saved: boolean;

    private _validator: Validator<ServerSettingsViewModel>;
    private _errors = new ObservableErrors();

    private _saveCommand: DelegateCommand;
    private _undoCommand: DelegateCommand;
    private _copyCommand: DelegateCommand;

    private _pasteText = ServerSettingsViewModel.normalPasteText;

    get Name() {
        return this._formFields.Name;
    }
    set Name(value: string) {
        let trimmedValue = value.trim();
        this.setField('Name', trimmedValue, true);
    }

    get Description() {
        return this._formFields.Description;
    }
    set Description(value: string) {
        let trimmedValue = value.trim();
        this.setField('Description', trimmedValue, true);
    }

    get Tags() {
        return this._formFields.Tags;
    }
    set Tags(value: string) {
        let trimmedValue = value.trim();
        this.setField('Tags', trimmedValue, true);
    }

    get MaxPlayers() {
        return this._formFields.MaxPlayers;
    }
    set MaxPlayers(value: number) {
        value = MathHelper.toIntegerOrDefault(value);
        if (value < 0) {
            value = ServerSettingsViewModel.formFieldsDefaultValues.MaxPlayers;
        }

        this.setField('MaxPlayers', value, true);
    }

    get GamePassword() {
        return this._formFields.GamePassword;
    }
    set GamePassword(value: string) {
        this.setField('GamePassword', value);
    }

    get MaxUploadSlots() {
        return this._formFields.MaxUploadSlots;
    }
    set MaxUploadSlots(value: number) {
        value = MathHelper.toIntegerOrDefault(value);
        if (value < 0) {
            value = ServerSettingsViewModel.formFieldsDefaultValues.MaxUploadSlots;
        }

        this.setField('MaxUploadSlots', value, true);
    }

    get AutoPause() {
        return this._formFields.AutoPause;
    }
    set AutoPause(value: boolean) {
        this.setField('AutoPause', value);
    }

    get UseDefaultAdmins() {
        return this._formFields.UseDefaultAdmins;
    }
    set UseDefaultAdmins(value: boolean) {
        if (this.setField('UseDefaultAdmins', value)) {
            this.raise('adminsEditEnabled', this.adminsEditEnabled);
        }
    }

    get Admins() {
        return this._formFields.Admins;
    }
    set Admins(value: string) {
        let trimmedValue = value.trim();
        this.setField('Admins', trimmedValue, true);
    }

    get AutosaveInterval() {
        return this._formFields.AutosaveInterval;
    }
    set AutosaveInterval(value: number) {
        value = MathHelper.toIntegerOrDefault(value);
        if (value < 1) {
            value = ServerSettingsViewModel.formFieldsDefaultValues.AutosaveInterval;
        }

        this.setField('AutosaveInterval', value, true);
    }

    get AutosaveSlots() {
        return this._formFields.AutosaveSlots;
    }
    set AutosaveSlots(value: number) {
        value = MathHelper.toIntegerOrDefault(value);
        if (value < 0) {
            value = ServerSettingsViewModel.formFieldsDefaultValues.AutosaveSlots;
        }

        this.setField('AutosaveSlots', value, true);
    }

    get NonBlockingSaving() {
        return this._formFields.NonBlockingSaving;
    }
    set NonBlockingSaving(value: boolean) {
        this.setField('NonBlockingSaving', value);
    }

    get PublicVisible() {
        return this._formFields.PublicVisible;
    }
    set PublicVisible(value: boolean) {
        this.setField('PublicVisible', value);
    }

    get saved(): boolean {
        return this._saved;
    }
    private setSaved(value: boolean) {
        if (this._saved === value) {
            return;
        }

        this._saved = value;
        this.raise('saved', value);
        this._saveCommand.raiseCanExecuteChanged();
        this._undoCommand.raiseCanExecuteChanged();
    }

    get adminsEditEnabled(): boolean {
        return !this._formFields.UseDefaultAdmins;
    }

    get errors(): ObservableErrors {
        return this._errors;
    }

    get saveCommand(): ICommand {
        return this._saveCommand;
    }

    get undoCommand(): ICommand {
        return this._undoCommand;
    }

    get copyCommand(): ICommand {
        return this._copyCommand;
    }

    get pasteText(): string {
        return this._pasteText;
    }
    private setPasteText(value: string) {
        if (this._pasteText == value) {
            return;
        }

        this._pasteText = value;
        this.raise('pasteText', value);
    }

    constructor(serverSettingsService: ServerSettingsService, copyToClipoardService: CopyToClipboardService, errorService: ErrorService) {
        super();

        this._serverSettingsService = serverSettingsService;
        this._copyToClipoardService = copyToClipoardService;
        this._errorService = errorService;

        this.update(serverSettingsService.settings);
        serverSettingsService.settingsChanged.subscribe(event => this.update(event.NewItems as FactorioServerSettings));

        this._saved = serverSettingsService.saved;
        serverSettingsService.savedChanged.subscribe(event => this.setSaved(event));

        this._validator = new Validator(this, [
            new MaxStringLength<this>('Name', 49)
        ]);

        this._saveCommand = new DelegateCommand(() => this.saveSettings(), () => !this.saved);
        this._undoCommand = new DelegateCommand(() => this._serverSettingsService.undoSettings(), () => !this.saved);
        this._copyCommand = new DelegateCommand(() => this.copySettings());
    }

    private setAndDoValidation(propertyName: string, value: any): boolean {
        if (this.setAndRaise(this._formFields, propertyName, value)) {
            let validationResult = this._validator.validate(propertyName);
            this.errors.setError(propertyName, validationResult);
            return true;
        }

        return false;
    }

    private update(settings: FactorioServerSettings) {
        for (let propertyName in settings) {
            let value = ServerSettingsViewModel.convertToFormField(propertyName as FactorioServerSettingsType, settings[propertyName])
            if (this.setAndDoValidation(propertyName, value) && propertyName === 'UseDefaultAdmins') {
                this.raise('adminsEditEnabled', this.adminsEditEnabled);
            }
        }
    }

    private setField(propertyName: string, value: any, forceRaise?: boolean): boolean {
        if (this.setAndDoValidation(propertyName, value)) {
            this.setSaved(false);

            if (!this._suppressUpdate) {
                let settingValue = ServerSettingsViewModel.convertToFactorioServerSettings(propertyName as FactorioServerSettingsType, value);
                let settings = {};
                settings[propertyName] = settingValue;
                this._serverSettingsService.updateSettings({ Type: CollectionChangeType.Add, NewItems: settings });
            }

            return true;
        }

        if (forceRaise) {
            this.raise(propertyName, value);
        }

        return false;
    }

    private static convertToFormField(key: FactorioServerSettingsType, settingValue: any): any {
        switch (key) {
            case 'Tags': {
                let tags = (settingValue ?? []) as string[];
                return tags.join('\n');
            }
            case 'Admins': {
                let admins = (settingValue ?? []) as string[];
                return admins.map(s => s.trim()).join(', ');
            }
            default: return settingValue ?? ServerSettingsViewModel.formFieldsDefaultValues[key];
        }
    }

    private static convertToFactorioServerSettings(key: FactorioServerSettingsType, fieldValue: any): any {
        let value = fieldValue ?? ServerSettingsViewModel.formFieldsDefaultValues[key as string];

        switch (key) {
            case 'Name': return value.trim();
            case 'Description': return value.trim();
            case 'Tags': {
                let tags = value as string
                return tags.trim().split('\n');
            }
            case 'Admins': {
                let admins = value as string;
                let adminsText = admins.trim().split(',');

                for (let i = 0; i < adminsText.length; i++) {
                    adminsText[i] = adminsText[i].trim();
                }

                return adminsText;
            }
            default: return value;
        }
    }

    private buildFactorioServerSettings(): FactorioServerSettings {
        let settings = {} as FactorioServerSettings;
        let fields = this._formFields;

        for (let propertyName in fields) {
            let key = propertyName as FactorioServerSettingsType;
            let value = ServerSettingsViewModel.convertToFactorioServerSettings(key, fields[propertyName]);
            settings[propertyName] = value;
        }

        return settings;
    }

    private async saveSettings() {
        let settings = this.buildFactorioServerSettings();

        let result = await this._serverSettingsService.saveSettings(settings);
        this._errorService.reportIfError(result);
    }

    private copySettings() {
        let settings = this.buildFactorioServerSettings();
        let text = JSON.stringify(settings);
        this._copyToClipoardService.copy(text);
    }

    pasteSettingsClicked() {
        this.setPasteText(ServerSettingsViewModel.normalPasteText);
    }

    pasteSettings(text: string) {
        let settings;
        try {
            settings = JSON.parse(text);
        }
        catch (ex) {
            this.setPasteText(ServerSettingsViewModel.errorPasteText);
            return;
        }

        if (!Utils.isObject(settings)) {
            this.setPasteText(ServerSettingsViewModel.errorPasteText);
            return;
        }

        let fields = this._formFields;
        let changeData = {};

        try {
            this._suppressUpdate = true;

            for (let propertyName in settings) {
                if (!fields.hasOwnProperty(propertyName)) {
                    continue;
                }

                let value = ServerSettingsViewModel.convertToFormField(propertyName as FactorioServerSettingsType, settings[propertyName]);
                if (value == null) {
                    continue;
                }

                this[propertyName] = value;
                changeData[propertyName] = ServerSettingsViewModel.convertToFactorioServerSettings(propertyName as FactorioServerSettingsType, this[propertyName]);
            }

            this.setPasteText(ServerSettingsViewModel.appliedPasteText);

            this._serverSettingsService.updateSettings({ Type: CollectionChangeType.Add, NewItems: changeData });
        } finally {
            this._suppressUpdate = false;
        }
    }
}