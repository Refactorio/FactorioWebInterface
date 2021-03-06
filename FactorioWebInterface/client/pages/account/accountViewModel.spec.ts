﻿import { strict } from "assert";
import { AccountPageTestServiceLocator } from "../../testUtils/testServiceLocator";
import { AccountViewModel } from "./accountViewModel";
import { UploadService } from "../../services/uploadService";
import { UploadServiceMockBase } from "../../testUtils/services/uploadServiceMockBase";
import { MethodInvocation } from "../../testUtils/invokeBase";
import { FormDataMock } from "../../testUtils/models/formDataMock";
import { IHiddenInputService } from "../../services/iHiddenInputService";
import { HiddenInputServiceMockBase } from "../../testUtils/services/hiddenInputServiceMockBase";

describe('AccountViewModel', function () {
    it('page initialized on load', function () {
        // Arrange.
        let services = new AccountPageTestServiceLocator();

        // Act.
        let viewModel: AccountViewModel = services.get(AccountViewModel);

        // Assert.
        strict.equal(viewModel.username, 'username');
        strict.equal(viewModel.newPassword, '');
        strict.equal(viewModel.confirmNewPassword, '');
        strict.equal(viewModel.hasPassword, false);
        strict.equal(viewModel.submitButtonText, 'Create Password');
        strict.equal(viewModel.passwordUpdated, false);
        strict.equal(viewModel.errorUpdating, false);
    });

    it('page initialized on load after update password', function () {
        // Arrange.
        let services = new AccountPageTestServiceLocator();

        let hiddenInputservice: HiddenInputServiceMockBase = services.get(IHiddenInputService);
        hiddenInputservice._map.set('__hasPassword', 'true');
        hiddenInputservice._map.set('__passwordUpdated', 'true');

        // Act.
        let viewModel: AccountViewModel = services.get(AccountViewModel);

        // Assert.
        strict.equal(viewModel.username, 'username');
        strict.equal(viewModel.newPassword, '');
        strict.equal(viewModel.confirmNewPassword, '');
        strict.equal(viewModel.hasPassword, true);
        strict.equal(viewModel.submitButtonText, 'Update Password');
        strict.equal(viewModel.passwordUpdated, true);
        strict.equal(viewModel.errorUpdating, false);
    });

    it('page initialized on load after error', function () {
        // Arrange.
        let services = new AccountPageTestServiceLocator();

        let hiddenInputservice: HiddenInputServiceMockBase = services.get(IHiddenInputService);
        hiddenInputservice._map.set('__accountError', 'true');

        // Act.
        let viewModel: AccountViewModel = services.get(AccountViewModel);

        // Assert.
        strict.equal(viewModel.username, 'username');
        strict.equal(viewModel.newPassword, '');
        strict.equal(viewModel.confirmNewPassword, '');
        strict.equal(viewModel.hasPassword, false);
        strict.equal(viewModel.submitButtonText, 'Create Password');
        strict.equal(viewModel.passwordUpdated, false);
        strict.equal(viewModel.errorUpdating, true);
    });

    describe('password validation', function () {
        it('when password too short there is validation error', function () {
            // Arrange.
            let services = new AccountPageTestServiceLocator();

            let viewModel: AccountViewModel = services.get(AccountViewModel);

            // Act.
            viewModel.newPassword = '1';

            // Assert.
            let validationResult = viewModel.errors.getError('newPassword');
            strict.equal(validationResult.valid, false);
            strict.equal(validationResult.error, 'New Password must be between 6 and 100 characters but is 1.');
        });

        it('when password too long there is validation error', function () {
            // Arrange.
            let services = new AccountPageTestServiceLocator();

            let viewModel: AccountViewModel = services.get(AccountViewModel);

            // Act.
            viewModel.newPassword = '1'.repeat(101);

            // Assert.
            let validationResult = viewModel.errors.getError('newPassword');
            strict.equal(validationResult.valid, false);
            strict.equal(validationResult.error, 'New Password must be between 6 and 100 characters but is 101.');
        });

        it('when confirm password does not match there is validation error', function () {
            // Arrange.
            let services = new AccountPageTestServiceLocator();

            let viewModel: AccountViewModel = services.get(AccountViewModel);

            // Act.
            viewModel.newPassword = '1';
            viewModel.confirmNewPassword = '2';

            // Assert.
            let validationResult = viewModel.errors.getError('confirmNewPassword');
            strict.equal(validationResult.valid, false);
            strict.equal(validationResult.error, 'Confirm New Password must be equal to New Password.');
        });

        it('when new password and confirm password are valid there is not validation errors', function () {
            // Arrange.
            let services = new AccountPageTestServiceLocator();

            let viewModel: AccountViewModel = services.get(AccountViewModel);

            // Act.
            viewModel.newPassword = '123456';
            viewModel.confirmNewPassword = '123456';

            // Assert.
            let validationResult = viewModel.errors.getError('confirmNewPassword');
            strict.equal(validationResult.valid, true);
        });
    });

    describe('submit command', function () {
        it('can execute when new password and confirm password are valid', function () {
            // Arrange.
            let services = new AccountPageTestServiceLocator();

            let uploadService: UploadServiceMockBase = services.get(UploadService);

            let actualEvent: MethodInvocation;
            uploadService.methodCalled.subscribe(event => {
                actualEvent = event;
            });

            let viewModel: AccountViewModel = services.get(AccountViewModel);
            viewModel.newPassword = '123456';
            viewModel.confirmNewPassword = '123456';

            // Act.
            viewModel.submitCommand.execute();

            // Assert.
            strict.equal(actualEvent.name, 'submitForm');

            let url: string = actualEvent.args[0];
            let formData: FormDataMock = actualEvent.args[1];
            strict.equal(url, '/admin/account?handler=UpdatePassword');
            strict.equal(formData._entries.get('Input.Password')[0], '123456');

            strict.equal(viewModel.submitCommand.canExecute(), true);
        });

        describe('can not execute when validation error', function () {

            let validationErrorTestCases = [
                { name: 'New Password too short', newPassword: '1', confirmNewPassword: '1' },
                { name: 'New Password too long', newPassword: '1'.repeat(101), confirmNewPassword: '1'.repeat(101) },
                { name: 'Confirm New Password does not match', newPassword: '123456', confirmNewPassword: '654321' }
            ];

            for (let validationErrorTestCase of validationErrorTestCases) {
                it(validationErrorTestCase.name, function () {
                    // Arrange.
                    let services = new AccountPageTestServiceLocator();

                    let uploadService: UploadServiceMockBase = services.get(UploadService);

                    let actualEvent: MethodInvocation;
                    uploadService.methodCalled.subscribe(event => {
                        actualEvent = event;
                    });

                    let viewModel: AccountViewModel = services.get(AccountViewModel);
                    viewModel.newPassword = validationErrorTestCase.newPassword;
                    viewModel.confirmNewPassword = validationErrorTestCase.confirmNewPassword;

                    // Act.
                    viewModel.submitCommand.execute();

                    // Assert.
                    strict.equal(actualEvent, undefined);
                    strict.equal(viewModel.submitCommand.canExecute(), false);
                });
            }
        });

        it('empty form gives validation error after submit', function () {
            // Arrange.
            let services = new AccountPageTestServiceLocator();

            let uploadService: UploadServiceMockBase = services.get(UploadService);

            let actualEvent: MethodInvocation;
            uploadService.methodCalled.subscribe(event => {
                actualEvent = event;
            });

            let viewModel: AccountViewModel = services.get(AccountViewModel);

            // Act.
            viewModel.submitCommand.execute();

            // Assert.
            strict.equal(actualEvent, undefined);
            strict.equal(viewModel.submitCommand.canExecute(), false);
            strict.equal(viewModel.errors.hasErrors, true);
        });
    });
});