﻿import { strict } from "assert";
import { ServersPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { ServersViewModel } from "./serversViewModel";
import { ServersHubService } from "./serversHubService";
import { ServersHubServiceMockBase } from "../../testUtils/pages/servers/serversHubServiceMockBase";
import { CollectionChangeType } from "../../ts/utils";
import { FileMetaData, FactorioServerStatus, ScenarioMetaData } from "./serversTypes";

const tempFile: FileMetaData = {
    Name: 'file.zip',
    Size: 0,
    Directory: 'temp_saves',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
};

const tempFile2: FileMetaData = {
    Name: 'file2.zip',
    Size: 0,
    Directory: 'temp_saves',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
};

const scenario: ScenarioMetaData = {
    Name: 'scenario',
    CreatedTime: '2020-01-01 00:00:00',
    LastModifiedTime: '2020-01-01 00:00:00'
}

describe('ServerConsoleViewModel', function () {
    describe('resume command', function () {
        it('can execute when server is startable and there is a temp file.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let resumeCalled = false;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'resume') {
                    resumeCalled = true;
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            // Act.
            viewModel.resumeCommand.execute();

            // Assert.
            strict.equal(resumeCalled, true);
            strict.equal(viewModel.resumeCommand.canExecute(), true);
        });

        it('can not execute when server is running.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let resumeCalled = false;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'resume') {
                    resumeCalled = true;
                }
            });

            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Act.
            viewModel.resumeCommand.execute();

            // Assert.
            strict.equal(resumeCalled, false);
            strict.equal(viewModel.resumeCommand.canExecute(), false);
        });

        it('can not execute when no temp file.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let resumeCalled = false;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'resume') {
                    resumeCalled = true;
                }
            });

            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [] });

            // Act.
            viewModel.resumeCommand.execute();

            // Assert.
            strict.equal(resumeCalled, false);
            strict.equal(viewModel.resumeCommand.canExecute(), false);
        });

        let testCases = [
            {
                name: 'status',
                act: (hubService: ServersHubServiceMockBase) => hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown })
            },
            {
                name: 'temp files',
                act: (hubService: ServersHubServiceMockBase) => hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] })
            },
        ]

        for (let testCase of testCases) {
            it(`canExecuteChanged raised: ${testCase.name}.`, function () {
                // Arrange.          
                let services = new ServersPageTestServiceLocator();

                let mainViewModel: ServersViewModel = services.get(ServersViewModel);
                let viewModel = mainViewModel.serverConsoleViewModel;

                let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

                let raised = false;
                viewModel.resumeCommand.canExecuteChanged.subscribe(() => raised = true);

                // Act.
                testCase.act(hubService);

                // Assert.
                strict.equal(raised, true);
            });
        }
    });

    describe('load command', function () {
        it('can execute when server is startable and there is a single selected file.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualDirectory = undefined;
            let actualFile = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'load') {
                    actualDirectory = event.args[0];
                    actualFile = event.args[1];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            tempFiles.setSingleSelected(tempFiles.getBoxByKey(tempFile.Name));

            // Act.
            viewModel.loadCommand.execute();

            // Assert.
            strict.equal(actualDirectory, tempFile.Directory);
            strict.equal(actualFile, tempFile.Name);
            strict.equal(viewModel.loadCommand.canExecute(), true);
        });

        it('can not execute when server is running.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualDirectory = undefined;
            let actualFile = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'load') {
                    actualDirectory = event.args[0];
                    actualFile = event.args[1];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            tempFiles.setSingleSelected(tempFiles.getBoxByKey(tempFile.Name));

            // Act.
            viewModel.loadCommand.execute();

            // Assert.
            strict.equal(actualDirectory, undefined);
            strict.equal(actualFile, undefined);
            strict.equal(viewModel.loadCommand.canExecute(), false);
        });

        it('can not execute when no selected file.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualDirectory = undefined;
            let actualFile = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'load') {
                    actualDirectory = event.args[0];
                    actualFile = event.args[1];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Act.
            viewModel.loadCommand.execute();

            // Assert.
            strict.equal(actualDirectory, undefined);
            strict.equal(actualFile, undefined);
            strict.equal(viewModel.loadCommand.canExecute(), false);
        });

        it('can not execute when mutliple selected files.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualDirectory = undefined;
            let actualFile = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'load') {
                    actualDirectory = event.args[0];
                    actualFile = event.args[1];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });
            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile, tempFile2] });

            let tempFiles = mainViewModel.tempFileViewModel.files;
            tempFiles.selectAll();

            // Act.
            viewModel.loadCommand.execute();

            // Assert.
            strict.equal(actualDirectory, undefined);
            strict.equal(actualFile, undefined);
            strict.equal(viewModel.loadCommand.canExecute(), false);
        });

        it('canExecuteChanged raised: status.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let raised = false;
            viewModel.loadCommand.canExecuteChanged.subscribe(() => raised = true);

            // Act.
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(raised, true);
        });

        it('canExecuteChanged raised: file selected.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            hubService._tempSaveFiles.raise({ Type: CollectionChangeType.Reset, serverId: '1', NewItems: [tempFile] });
            let tempFiles = mainViewModel.tempFileViewModel.files;

            let raised = false;
            viewModel.loadCommand.canExecuteChanged.subscribe(() => raised = true);

            // Act.
            tempFiles.selectAll();

            // Assert.
            strict.equal(raised, true);
        });
    });

    describe('start scenario command', function () {
        it('can execute when server is startable and there is a single scenario selected.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualScenario = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'startScenario') {
                    actualScenario = event.args[0];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });
            hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario] });

            let scenarios = mainViewModel.scenariosViewModel.scenarios;
            scenarios.setSingleSelected(scenarios.getBoxByKey(scenario.Name));

            // Act.
            viewModel.startScenarioCommand.execute();

            // Assert.
            strict.equal(actualScenario, scenario.Name);
            strict.equal(viewModel.startScenarioCommand.canExecute(), true);
        });

        it('can not execute when server is running.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualScenario = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'startScenario') {
                    actualScenario = event.args[0];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });
            hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario] });

            let scenarios = mainViewModel.scenariosViewModel.scenarios;
            scenarios.setSingleSelected(scenarios.getBoxByKey(scenario.Name));

            // Act.
            viewModel.startScenarioCommand.execute();

            // Assert.
            strict.equal(actualScenario, undefined);
            strict.equal(viewModel.startScenarioCommand.canExecute(), false);
        });

        it('can not execute when no selected scenario.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let actualScenario = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'startScenario') {
                    actualScenario = event.args[0];
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });
            hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario] });

            // Act.
            viewModel.startScenarioCommand.execute();

            // Assert.
            strict.equal(actualScenario, undefined);
            strict.equal(viewModel.startScenarioCommand.canExecute(), false);
        });

        it('canExecuteChanged raised: status.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let raised = false;
            viewModel.startScenarioCommand.canExecuteChanged.subscribe(() => raised = true);

            // Act.
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(raised, true);
        });

        it('canExecuteChanged raised: scenario selected.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            hubService._scenarios.raise({ Type: CollectionChangeType.Reset, NewItems: [scenario] });
            let scenarios = mainViewModel.scenariosViewModel.scenarios;

            let raised = false;
            viewModel.startScenarioCommand.canExecuteChanged.subscribe(() => raised = true);

            // Act.
            scenarios.setSingleSelected(scenarios.getBoxByKey(scenario.Name));

            // Assert.
            strict.equal(raised, true);
        });
    });

    describe('save command', function () {
        it('can execute when server is running', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let saveRaised = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'save') {
                    saveRaised = true;
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Act.
            viewModel.saveCommand.execute();

            // Assert.
            strict.equal(saveRaised, true);
            strict.equal(viewModel.saveCommand.canExecute(), true);
        });

        it('can not execute when server is not running', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let saveRaised = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'save') {
                    saveRaised = true;
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Act.
            viewModel.saveCommand.execute();

            // Assert.
            strict.equal(saveRaised, undefined);
            strict.equal(viewModel.saveCommand.canExecute(), false);
        });

        it('canExecuteChanged raised: status.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let raised = false;
            viewModel.saveCommand.canExecuteChanged.subscribe(() => raised = true);

            // Act.
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(raised, true);
        });
    });

    describe('stop command', function () {
        it('can execute when server stoppable', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let stopRaised = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'stop') {
                    stopRaised = true;
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Running, oldStatus: FactorioServerStatus.Unknown });

            // Act.
            viewModel.stopCommand.execute();

            // Assert.
            strict.equal(stopRaised, true);
            strict.equal(viewModel.stopCommand.canExecute(), true);
        });

        it('can not execute when server not stoppable', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let stopRaised = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'stop') {
                    stopRaised = true;
                }
            });

            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Act.
            viewModel.stopCommand.execute();

            // Assert.
            strict.equal(stopRaised, undefined);
            strict.equal(viewModel.stopCommand.canExecute(), false);
        });

        it('canExecuteChanged raised: status.', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let raised = false;
            viewModel.saveCommand.canExecuteChanged.subscribe(() => raised = true);

            // Act.
            hubService._onFactorioStatusChanged.raise({ newStatus: FactorioServerStatus.Stopped, oldStatus: FactorioServerStatus.Unknown });

            // Assert.
            strict.equal(raised, true);
        });
    });

    describe('force stop command', function () {
        it('can execute', function () {
            // Arrange.          
            let services = new ServersPageTestServiceLocator();

            let mainViewModel: ServersViewModel = services.get(ServersViewModel);
            let viewModel = mainViewModel.serverConsoleViewModel;

            let hubService: ServersHubServiceMockBase = services.get(ServersHubService);

            let forceStopRaised = undefined;
            hubService.methodCalled.subscribe(event => {
                if (event.name === 'forceStop') {
                    forceStopRaised = true;
                }
            });

            // Act.
            viewModel.forceStopCommand.execute();

            // Assert.
            strict.equal(forceStopRaised, true);
            strict.equal(viewModel.forceStopCommand.canExecute(), true);
        });
    });
});