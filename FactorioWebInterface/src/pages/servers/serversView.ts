﻿import { VirtualComponent } from "../../components/virtualComponent";
import { ServersViewModel } from "./serversViewModel";
import { FileView } from "./fileView";
import { ServersConsoleView } from "./serversConsoleView";
import { LogFileView } from "./logFileView";
import { ScenariosView } from "./scenariosView";
import { ModPacksView } from "./modPacksView";
import { StackPanel } from "../../components/stackPanel";
import { ServerSettingsView } from "./serverSettingsView";
import { ServerExtraSettingsView } from "./serverExtraSettingsView";
import { ServerFileManagementView } from "./serverFileManagementView";

export class ServersView extends VirtualComponent {
    constructor(serversViewModel: ServersViewModel) {
        super();

        let mainPanel = new StackPanel(StackPanel.direction.row);
        mainPanel.classList.add('columns');
        this._root = mainPanel;

        let leftPanel = new StackPanel(StackPanel.direction.column);
        leftPanel.classList.add('column');
        let rightPanel = new StackPanel(StackPanel.direction.column);
        rightPanel.classList.add('column');
        mainPanel.append(leftPanel, rightPanel);

        let serversConsoleView = new ServersConsoleView(serversViewModel.serverConsoleViewModel);
        let serverSettingsView = new ServerSettingsView(serversViewModel.serverSettingsViewModel);
        let serverExtraSettingsView = new ServerExtraSettingsView(serversViewModel.serverExtraSettingsViewModel);
        leftPanel.append(serversConsoleView.root, serverSettingsView.root, serverExtraSettingsView.root);

        let fileManagementView = new ServerFileManagementView(serversViewModel.serverFileManagementViewModel);
        let tempFiles = new FileView(serversViewModel.tempFileViewModel);
        let localFiles = new FileView(serversViewModel.localFileViewModel);
        let globalFiles = new FileView(serversViewModel.globalFileViewModel);
        let scenarios = new ScenariosView(serversViewModel.scenariosViewModel);
        let modPacks = new ModPacksView(serversViewModel.modPacksViewModel);
        let logFiles = new LogFileView(serversViewModel.logFileViewModel);
        let chatLogFiles = new LogFileView(serversViewModel.chatLogFileViewModel);
        rightPanel.append(fileManagementView.root, tempFiles.root, localFiles.root, globalFiles.root, scenarios.root, modPacks.root, logFiles.root, chatLogFiles.root);
    }
}