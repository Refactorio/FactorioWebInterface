﻿import { CloseBaseViewModel } from "../../utils/CloseBaseViewModel";
import { DelegateCommand, ICommand } from "../../utils/command";
import { CollectionView } from "../../utils/collectionView";
import { ObservableCollection } from "../../utils/observableCollection";
import { ManageVersionService } from "./manageVersionService";
import { IterableHelper } from "../../utils/iterableHelper";
import { ErrorService } from "../../services/errorService";
import { CollectionChangeType } from "../../ts/utils";
import { ObservableProperty, IObservableProperty } from "../../utils/observableProperty";
import { FactorioServerStatus } from "./serversTypes";
import { FactorioServerStatusUtils } from "./factorioServerStatusUtils";

export class ManageVersionViewModel extends CloseBaseViewModel {
    private _manageVersionService: ManageVersionService;
    private _status: IObservableProperty<FactorioServerStatus>;
    private _errorService: ErrorService;

    private _downloadableVersions: CollectionView<string>;
    private _isFetchingVersions = new ObservableProperty<boolean>(true);

    private _downloadAndUpdateCommand: DelegateCommand;
    private _updateCommand: DelegateCommand<string>;

    private _subscriptions: (() => void)[] = [];

    get downloadableVersions(): CollectionView<string> {
        return this._downloadableVersions;
    }

    get isFetchingVersions(): IObservableProperty<boolean> {
        return this._isFetchingVersions;
    }

    get cachedVersions(): ObservableCollection<string> {
        return this._manageVersionService.cachedVersions;
    }

    get downloadAndUpdateCommand(): ICommand {
        return this._downloadAndUpdateCommand;
    }

    get updateCommand(): ICommand<string> {
        return this._updateCommand;
    }

    constructor(manageVersionService: ManageVersionService, status: IObservableProperty<FactorioServerStatus>, errorService: ErrorService) {
        super();

        this._manageVersionService = manageVersionService;
        this._status = status;
        this._errorService = errorService;

        this._downloadableVersions = new CollectionView<string>(manageVersionService.downloadableVersions);
        this.updatedSelected();
        this._subscriptions.push(
            manageVersionService.downloadableVersions.subscribe(event => {
                if (event.Type === CollectionChangeType.Reset) {
                    this.updatedSelected();
                }

                this._isFetchingVersions.raise(false);
            }));

        this._downloadAndUpdateCommand = new DelegateCommand(
            () => {
                let selected = IterableHelper.firstOrDefault(this._downloadableVersions.selected)?.value;
                this.update(selected);
            },
            () => {
                if (!FactorioServerStatusUtils.IsUpdatable(this._status.value)) {
                    return false;
                }

                let selected = IterableHelper.firstOrDefault(this._downloadableVersions.selected);
                return selected != null;
            });

        this._updateCommand = new DelegateCommand(version => this.update(version),
            version => FactorioServerStatusUtils.IsUpdatable(this._status.value));

        this._downloadableVersions.selectedChanged.subscribe(() => this._downloadAndUpdateCommand.raiseCanExecuteChanged());
        this._subscriptions.push(
            this._status.subscribe(event => {
                this._downloadAndUpdateCommand.raiseCanExecuteChanged();
                this._updateCommand.raiseCanExecuteChanged();
            }));

        manageVersionService.requestDownloadableVersion();
        manageVersionService.requestCachedVersions();
    }

    async update(version: string): Promise<void> {
        let result = await this._manageVersionService.update(version);
        this._errorService.reportIfError(result);
    }

    delete(version: string): void {
        this._manageVersionService.deleteCachedVersion(version);
    }

    dispose() {
        for (let sub of this._subscriptions) {
            sub();
        }

        this._subscriptions.length = 0;
    }

    private updatedSelected() {
        if (this._downloadableVersions.selectedCount === 0) {
            this._downloadableVersions.setFirstSingleSelected();
        }
    }
}