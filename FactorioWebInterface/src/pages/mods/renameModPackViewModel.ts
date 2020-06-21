﻿import { ModsService } from "./modsService";
import { ErrorService } from "../../services/errorService";
import { ObservableObjectCloseBaseViewModel } from "../../utils/CloseBaseViewModel";
import { IObservableErrors, ObservableErrors } from "../../utils/observableErrors";
import { Validator, NotEmptyString } from "../../utils/validator";
import { DelegateCommand, ICommand } from "../../utils/command";
import { ModPackMetaData } from "../servers/serversTypes";

export class RenameModPackViewModel extends ObservableObjectCloseBaseViewModel implements IObservableErrors {
    private _modsService: ModsService;
    private _errorService: ErrorService;

    private _validator: Validator<RenameModPackViewModel>;
    private _errors = new ObservableErrors();

    private _modPack: ModPackMetaData;

    private _name = '';

    private _renameCommand: DelegateCommand;
    private _cancelCommand: DelegateCommand;

    get errors(): ObservableErrors {
        return this._errors;
    }

    get name(): string {
        return this._name;
    }
    set name(value: string) {
        if (this._name === value) {
            return;
        }

        this._name = value;
        this.raise('name', value);

        this.validateAll();
    }

    get renameCommand(): ICommand {
        return this._renameCommand;
    }

    get cancelCommand(): ICommand {
        return this._cancelCommand;
    }

    constructor(modPack: ModPackMetaData, modsService: ModsService, errorService: ErrorService) {
        super();

        this._modsService = modsService;
        this._errorService = errorService;

        this._modPack = modPack;
        this._name = modPack.Name;

        this._validator = new Validator(this, [
            new NotEmptyString('name', 'Name')
        ]);

        this._renameCommand = new DelegateCommand(async () => {
            if (!this.validateAll()) {
                return;
            }

            let result = await this._modsService.renameModPack(this._modPack.Name, this._name);
            if (!result.Success) {
                this._errorService.reportIfError(result);
                return;
            }

            this.close();
        })

        this._cancelCommand = new DelegateCommand(() => this.close());
    }

    private validateAll(): boolean {
        let validationResult = this._validator.validate('name');
        this.errors.setError('name', validationResult);

        return validationResult.valid;
    }
}