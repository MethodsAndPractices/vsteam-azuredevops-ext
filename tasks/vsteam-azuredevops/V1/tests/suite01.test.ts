import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';
import utils = require("./../utils");
import { exception } from 'console';

describe('VSTeam task tests', function () {

    const timeout = 10000

    function runValidations(validator: () => void, tr, done) {
        try {
            validator();
            done();
        }
        catch (error) {
            console.log("---STDERR--- \n", tr.stderr);
            console.log("---STDOUT--- \n", tr.stdout);
            done(error);
        }
    }

    before(function () {
        process.env['ENDPOINT_URL_ENDPOINT1'] = "https://endpoint1.visualstudio.com/path";
        process.env['ENDPOINT_AUTH_ENDPOINT1'] = "{\"parameters\":{\"apitoken\":\"mytoken123\"},\"scheme\":\"Token\"}";
        process.env["ENDPOINT_AUTH_SCHEME_ENDPOINT1"] = "Token";
        process.env['ENDPOINT_AUTH_PARAMETER_ENDPOINT1_APITOKEN'] = "mytoken123";
    });

    after(() => {

    });

    it('should succeed with inline powershell input', function (done: Mocha.Done) {
        this.timeout(timeout);

        let tp = path.join(__dirname, 'suite01.inline.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();

        runValidations(() => {
            assert.equal(tr.succeeded, true, 'should have succeeded');
            assert.equal(tr.warningIssues.length, 0, "should have no warnings");
            assert.equal(tr.errorIssues.length, 0, "should have no errors");
            assert.equal(tr.stdout.indexOf('my inline script output') >= 0, true, "should display 'my inline script output'");
            assert.equal(tr.stdout.indexOf('running via inline file') >= 0, true, "should display 'running via inline file'");
            assert.equal(tr.stdout.indexOf('fail on standard error activated') >= 0, true, "should run with standard error activated");
        }, tr, done)
    });

    it('should succeed with file path powershell input', function (done: Mocha.Done) {
        this.timeout(timeout);

        let tp = path.join(__dirname, 'suite01.file.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();

        runValidations(() => {
            assert.equal(tr.succeeded, true, 'should have succeeded');
            assert.equal(tr.warningIssues.length, 0, "should have no warnings");
            assert.equal(tr.errorIssues.length, 0, "should have no errors");
            assert.equal(tr.stdout.indexOf('Command length') >= 0, true, "should log 'my inline script output'");
            assert.equal(tr.stdout.indexOf('my file script output') >= 0, true, "should display 'my file script output'");
            assert.equal(tr.stdout.indexOf('running via script file') >= 0, true, "should display 'running via script file'");
            assert.equal(tr.stdout.indexOf('fail on standard error activated') == -1, true, "should not run with standard error activated");
        }, tr, done)
    });

    it('should not succeed with non-zero exit code', function (done: Mocha.Done) {
        this.timeout(timeout);

        let tp = path.join(__dirname, 'suite01.exitCode.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();

        runValidations(() => {
            assert.equal(tr.succeeded, false, 'should have failed');
            assert.equal(tr.warningIssues.length, 0, "should have no warnings");
            assert.equal(tr.errorIssues.length, 1, "should have 1 error");
            assert.equal(tr.stdout.indexOf('JS_ExitCode') >= 0, true, "Error message should throw 'PatTokenCannotBeEmpty'");
        }, tr, done)
    });

    it('should not succeed with std error', function (done: Mocha.Done) {
        this.timeout(timeout);

        let tp = path.join(__dirname, 'suite01.stderr.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        tr.run();

        runValidations(() => {
            assert.equal(tr.succeeded, false, 'should have failed');
            assert.equal(tr.warningIssues.length, 0, "should have no warnings");
            assert.equal(tr.errorIssues.length, 1, "should have 1 error");
            assert.equal(tr.stdout.indexOf('JS_Stderr') >= 0, true, "Error message should throw 'PatTokenCannotBeEmpty'");
        }, tr, done)
    });

    it('should only allow Token auth scheme', function (done: Mocha.Done) {
        this.timeout(timeout);

        let tp = path.join(__dirname, 'suite01.failureConnection.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        process.env['ENDPOINT_URL_ENDPOINT1'] = "https://endpoint1.visualstudio.com/path";
        process.env['ENDPOINT_AUTH_ENDPOINT1'] = "{\"parameters\":{\"apitoken\":\"mytoken123\"},\"scheme\":\"NoToken\"}";
        process.env["ENDPOINT_AUTH_SCHEME_ENDPOINT1"] = "NoToken";

        tr.run();

        runValidations(() => {
            assert.equal(tr.succeeded, false, 'should have failed');
            assert.equal(tr.warningIssues.length, 0, "should have no warnings");
            assert.equal(tr.errorIssues.length, 1, "should have 1 error");
            assert.equal(tr.stdout.indexOf('OnlyTokenAuthAllowed') >= 0, true, "Error message should throw 'OnlyTokenAuthAllowed'");
        }, tr, done)
    });

    it('should not succeed without host url', function (done: Mocha.Done) {
        this.timeout(timeout);

        let tp = path.join(__dirname, 'suite01.failureConnection.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        process.env['ENDPOINT_URL_ENDPOINT1'] = "";
        process.env['ENDPOINT_AUTH_ENDPOINT1'] = "{\"parameters\":{\"apitoken\":\"mytoken123\"},\"scheme\":\"Token\"}";
        process.env["ENDPOINT_AUTH_SCHEME_ENDPOINT1"] = "Token";

        tr.run();

        runValidations(() => {
            assert.equal(tr.succeeded, false, 'should have failed');
            assert.equal(tr.warningIssues.length, 0, "should have no warnings");
            assert.equal(tr.errorIssues.length, 1, "should have 1 error");
            assert.equal(tr.stdout.indexOf('UrlCannotBeEmpty') >= 0, true, "Error message should throw 'UrlCannotBeEmpty'");
        }, tr, done)
    });

    it('should not succeed without PAT token', function (done: Mocha.Done) {
        this.timeout(timeout);

        let tp = path.join(__dirname, 'suite01.failureConnection.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        process.env['ENDPOINT_URL_ENDPOINT1'] = "https://endpoint1.visualstudio.com/path";
        process.env['ENDPOINT_AUTH_ENDPOINT1'] = "{\"parameters\":{\"apitoken\":\"\"},\"scheme\":\"Token\"}";
        process.env['ENDPOINT_AUTH_PARAMETER_ENDPOINT1_APITOKEN'] = "";

        tr.run();

        runValidations(() => {
            assert.equal(tr.succeeded, false, 'should have failed');
            assert.equal(tr.warningIssues.length, 0, "should have no warnings");
            assert.equal(tr.errorIssues.length, 1, "should have 1 error");
            assert.equal(tr.stdout.indexOf('PatTokenCannotBeEmpty') >= 0, true, "Error message should throw 'PatTokenCannotBeEmpty'");
        }, tr, done)
    });

    it('should not succeed with non existing PS error preference', function (done: Mocha.Done) {
        this.timeout(timeout);

        let tp = path.join(__dirname, 'suite01.errorPreference.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        process.env['ENDPOINT_URL_ENDPOINT1'] = "https://endpoint1.visualstudio.com/path";
        process.env['ENDPOINT_AUTH_ENDPOINT1'] = "{\"parameters\":{\"apitoken\":\"mytoken123\"},\"scheme\":\"Token\"}";
        process.env["ENDPOINT_AUTH_SCHEME_ENDPOINT1"] = "Token";
        process.env['ENDPOINT_AUTH_PARAMETER_ENDPOINT1_APITOKEN'] = "mytoken123";

        tr.run();

        runValidations(() => {
            assert.equal(tr.succeeded, false, 'should have failed');
            assert.equal(tr.warningIssues.length, 0, "should have no warnings");
            assert.equal(tr.errorIssues.length, 1, "should have 1 error");
            assert.equal(tr.stdout.indexOf('Option does not exist: NONEXISTINGPREFERENCE') >= 0, true, "Error message should throw 'PatTokenCannotBeEmpty'");
        }, tr, done)
    });

});