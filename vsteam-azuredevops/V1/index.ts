import fs = require('fs');
import path = require('path');
import os = require('os');
import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');
var uuidV4 = require('uuid/v4');

async function run() {
try {


    tl.setResourcePath(path.join(__dirname, 'task.json'));

    // Get inputs.
    let errorActionPreference: string = tl.getInput('errorActionPreference', false) || 'Stop';
    switch (errorActionPreference.toUpperCase()) {
        case 'STOP':
        case 'CONTINUE':
        case 'SILENTLYCONTINUE':
            break;
        default:
            throw new Error("Option does not exist: "+ errorActionPreference);
    }

    let scriptType: string = tl.getInput('FileOrInline', /*required*/true);
    let scriptPath = tl.getPathInput('PowerShellFilePath', false);
    let scriptInline: string = tl.getInput('PowerShellInline', false);
    let scriptArguments: string = tl.getInput('PsArguments', false);
    let failOnStandardError = tl.getBoolInput('failOnStderr', false);
    //let serviceName = tl.getInput('ConnectedServiceNameARM',/*required*/true);
    let input_workingDirectory = tl.getPathInput('workingDirectory', /*required*/ true, /*check*/ true);

    // Generate the script contents.
    console.log(tl.loc('GeneratingScript'));
    let contents: string[] = [];

/*

Add header & footer content here

*/

    //file script or inline
    if (scriptType.toUpperCase() == 'FILEPATH') {

        contents.push(`. '${scriptPath.replace(/'/g, "''")}' ${scriptArguments}`.trim());
        console.log("Command length", contents[contents.length - 1]);
    }
    else {
        contents.push(scriptInline);
    }

    // Write the script to disk.
    tl.assertAgent('2.115.0');
    let tempDirectory = tl.getVariable('agent.tempDirectory');
    tl.checkPath(tempDirectory, `${tempDirectory} (agent.tempDirectory)`);
    let filePath = path.join(tempDirectory, uuidV4() + '.ps1');

    await fs.writeFile(
        filePath,
        '\ufeff' + contents.join(os.EOL), // Prepend the Unicode BOM character.
        { encoding: 'utf8' }, null);           // Since UTF8 encoding is specified, node will
    // encode the BOM into its UTF8 binary sequence.

    // Run the script.
    //
    // Note, prefer "pwsh" over "powershell". At some point we can remove support for "powershell".
    //
    // Note, use "-Command" instead of "-File" to match the Windows implementation. Refer to
    // comment on Windows implementation for an explanation why "-Command" is preferred.
    let powershell = tl.tool(tl.which('pwsh') || tl.which('powershell') || tl.which('pwsh', true))
        .arg('-NoLogo')
        .arg('-NoProfile')
        .arg('-NonInteractive')
        .arg('-ExecutionPolicy')
        .arg('Unrestricted')
        .arg('-Command')
        .arg(`. '${filePath.replace(/'/g, "''")}'`);

    let options = <tr.IExecOptions>{
        cwd: input_workingDirectory,
        failOnStdErr: false,
        errStream: process.stdout, // Direct all output to STDOUT, otherwise the output may appear out
        outStream: process.stdout, // of order since Node buffers it's own STDOUT but not STDERR.
        ignoreReturnCode: true
    };

    // Listen for stderr.
    let stderrFailure = false;
    if (failOnStandardError) {
        powershell.on('stderr', (data) => {
            stderrFailure = true;
        });
    }

    // Run bash.
    let exitCode: number = await powershell.exec(options);

    // Fail on exit code.
    if (exitCode !== 0) {
        tl.setResult(tl.TaskResult.Failed, tl.loc('JS_ExitCode', exitCode));
    }

    // Fail on stderr.
    if (stderrFailure) {
        tl.setResult(tl.TaskResult.Failed, tl.loc('JS_Stderr'));
    }


    /*

    getting connection info

     const externalAuthInfo = auth.GetExternalAuthInfo("externalEndpoints");
            if (!externalAuthInfo)
            {
                tl.setResult(tl.TaskResult.Failed, tl.loc("Error_NoSourceSpecifiedForPublish"));
                return;
            }

            serviceUri = externalAuthInfo.packageSource.accountUrl;

            const feedProject = getProjectAndFeedIdFromInputParam("feedPublishExternal");
            feedId = feedProject.feedId;
            projectId = feedProject.projectId;

            packageName = tl.getInput("packagePublishExternal");

            // Assuming only auth via PAT works for now
            accessToken = (externalAuthInfo as auth.TokenExternalAuthInfo).token;
            toolRunnerOptions.env.UNIVERSAL_PUBLISH_PAT = accessToken;

    */

} catch(error) {
    tl.setResult(tl.TaskResult.Failed, error.message || 'run() failed');
}
}

run();