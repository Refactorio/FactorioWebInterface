﻿import { ObservableObjectCloseBaseViewModel } from "../../utils/CloseBaseViewModel";
import { ModsService } from "./modsService";
import { DelegateCommand, ICommand } from "../../utils/command";
import { IObservableErrors, ObservableErrors } from "../../utils/observableErrors";
import { Validator, NotEmptyString, AllValidationRule, NoWhitespaceString } from "../../utils/validator";
import { ErrorService } from "../../services/errorService";
import { ModPackNameNotTakenValidator } from "./modPackNameNotTakenValidator";
import { Observable } from "../../utils/observable";

export class NewModPackViewModel extends ObservableObjectCloseBaseViewModel implements IObservableErrors {
    private _subscriptions: (() => void)[] = [];

    private _modsService: ModsService;
    private _errorService: ErrorService;

    private _validator: Validator<NewModPackViewModel>;
    private _errors = new ObservableErrors();

    private _name = '';

    private _createCommand: DelegateCommand;
    private _cancelCommand: DelegateCommand;

    get errors(): ObservableErrors {
        return this._errors;
    }

    get name(): string {
        return this._name;
    }
    set name(value: string) {
        value = value.trim();

        if (this._name === value) {
            this.raise('name', value);
            return;
        }

        this._name = value;
        this.raise('name', value);

        this.validateAll();
    }

    get createCommand(): ICommand {
        return this._createCommand;
    }

    get cancelCommand(): ICommand {
        return this._cancelCommand;
    }

    constructor(modsService: ModsService, errorService: ErrorService) {
        super();

        this._modsService = modsService;
        this._errorService = errorService;

        this._validator = new Validator(this, [
            new AllValidationRule('name',
                new NotEmptyString('name', 'Name'),
                new NoWhitespaceString('name', 'Name'),
                new ModPackNameNotTakenValidator('name', modsService.modPacks)
            )
        ]);

        this._createCommand = new DelegateCommand(async () => {
            if (!this.validateAll()) {
                return;
            }

            let result = await this._modsService.createModPack(this._name);
            if (!result.Success) {
                this._errorService.reportIfError(result);
                return;
            }

            this.close();
        });

        this._cancelCommand = new DelegateCommand(() => this.close());

        modsService.modPacks.subscribe(() => this.validateAll(), this._subscriptions);
    }

    disconnect(): void {
        Observable.unSubscribeAll(this._subscriptions);
    }

    private validateAll(): boolean {
        let validationResult = this._validator.validate('name');
        this.errors.setError('name', validationResult);

        return validationResult.valid;
    }
}