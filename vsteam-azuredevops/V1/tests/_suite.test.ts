import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';

describe('Sample task tests', function () {

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
        process.env["SYSTEM_DEFAULTWORKINGDIRECTORY"] = "C:\\My\Default\\Working\\Dir";
        process.env["SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"] = "https://abc.visualstudio.com/";
        process.env['AGENT_VERSION'] = '2.115.0';

        process.env['ENDPOINT_URL_ENDPOINT1'] = "https://endpoint1.visualstudio.com/path";
        process.env['ENDPOINT_AUTH_ENDPOINT1'] = "{\"parameters\":{\"apitoken\":\"mytoken123\"},\"scheme\":\"Token\"}";
        process.env["ENDPOINT_AUTH_SCHEME_ENDPOINT1"] = "Token";
        process.env['ENDPOINT_AUTH_PARAMETER_ENDPOINT1_APITOKEN'] = "mytoken123";
    });

    after(() => {

    });

    it('should succeed with simple inputs', function (done: Mocha.Done) {
        this.timeout(3000);

        let tp = path.join(__dirname, 'successParams.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        runValidations(() => {
            assert.equal(tr.succeeded, true, 'should have succeeded');
            assert.equal(tr.warningIssues.length, 0, "should have no warnings");
            assert.equal(tr.errorIssues.length, 0, "should have no errors");
            //assert.equal(tr.stdout.indexOf('Hello human') >= 0, true, "should display Hello human");
        }, tr, done)
    });

    /* it('it should fail if tool returns 1', function(done: Mocha.Done) {
         this.timeout(1000);

         let tp = path.join(__dirname, 'failureParams.js');
         let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
         console.log(tr.succeeded);
         assert.equal(tr.succeeded, false, 'should have failed');
         assert.equal(tr.warningIssues, 0, "should have no warnings");
         assert.equal(tr.errorIssues.length, 1, "should have 1 error issue");
         assert.equal(tr.errorIssues[0], 'Bad input was given', 'error issue output');

         done();
     });*/


});