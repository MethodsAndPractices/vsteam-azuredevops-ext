import fs = require('fs');
import path = require('path');
import os = require('os');
import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');
import utils = require("./utils");
let uuidV4 = require('uuid/v4');

async function run() {
    try {

        tl.setResourcePath(path.join(__dirname, 'task.json'));

        // Get parameters.
        let vsTeamParameters = new utils.VsTeamTaskParameters()
        let parameters = vsTeamParameters.getTaskParameters()

        // Generate the script contents.
        console.log('GeneratingScript');
        let contents: string[] = [];

        contents.push(`Install-Module VSTeam -Scope CurrentUser -Force`);
        contents.push(`Set-VSTeamAccount -Account "${parameters.azureDevOpsCred.getHostUrl()}" -PersonalAccessToken "${parameters.azureDevOpsCred.getPatToken()}"`);
        contents.push(`$ErrorActionPreference='`+parameters.errorActionPreference.toUpperCase()+`'`)

        //file script or inline
        if (parameters.scriptType.toUpperCase() == 'FILE') {
            console.log("running via script file");
            contents.push(`. '${parameters.scriptPath.replace(/'/g, "''")}' ${parameters.scriptArguments}`.trim());
            console.log("Command length", contents[contents.length - 1]);
        }
        else {
            console.log("running via inline file");
            contents.push(parameters.scriptInline);
        }

        // Write the script to disk.
        tl.assertAgent('2.115.0');
        let tempDirectory = tl.getVariable('agent.tempDirectory');
        tl.checkPath(tempDirectory, `${tempDirectory} (agent.tempDirectory)`);
        let filePath = path.join(tempDirectory, uuidV4() + '.ps1');

        await fs.writeFile(
            filePath,
            '\ufeff' + contents.join(os.EOL), // Prepend the Unicode BOM character.
            function () {  });           // Using empty call back since it's requested but not needed currently

        // Run the script.
        // Note, use "-Command" instead of "-File" to match the Windows implementation. Refer to
        // comment on Windows implementation for an explanation why "-Command" is preferred.
        let powershell = tl.tool(tl.which('pwsh') || tl.which('powershell'))
            .arg('-NoLogo')
            .arg('-NoProfile')
            .arg('-NonInteractive')
            .arg('-ExecutionPolicy')
            .arg('Unrestricted')
            .arg('-Command')
            .arg(`. '${filePath.replace(/'/g, "''")}'`);

        let options = <tr.IExecOptions>{
            cwd: parameters.workingDirectory,
            failOnStdErr: false,
            errStream: process.stdout, // Direct all output to STDOUT, otherwise the output may appear out
            outStream: process.stdout, // of order since Node buffers it's own STDOUT but not STDERR.
            ignoreReturnCode: true
        };

        // Listen for stderr.
        let stderrFailure = false;
        if (parameters.failOnStandardError) {
            console.log("fail on standard error activated");
            powershell.on('stderr', (data) => {
                stderrFailure = true;
            });
        }

        // Run bash.
        let exitCode: number = await powershell.exec(options);

        // Fail on exit code.
        if (exitCode !== 0) {
            tl.setResult(tl.TaskResult.Failed, 'JS_ExitCode'+exitCode);
        }

        // Fail on stderr.
        if (stderrFailure) {
            tl.setResult(tl.TaskResult.Failed, 'JS_Stderr');
        }

    } catch (error) {
        tl.setResult(tl.TaskResult.Failed, error.message || 'run() failed');
    }
}

run();