import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('FileOrInline', 'Inline');
tmr.setInput('PowerShellInline', 'Write-Host "Hello Test"');
tmr.setInput('failOnStderr', 'false');
tmr.setInput('ConnectedServiceName', 'ENDPOINT1');
tmr.setInput('workingDirectory', 'C:\\My\\Working\\Path');
tmr.setInput('errorActionPreference', 'stop');

import { mockUpClones } from './mockupHelper';
const clones = new mockUpClones();

tmr.registerMock('azure-pipelines-task-lib/mock-task', clones.getTaskLibClone());

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "checkPath": {
        "C:\\My\\Working\\Path": true,
        "My/Temp/Dir": true,
        "C:\\My\Default\\Working\\Dir": true,
    },
    "which": {
        'powershell': 'path/to/powershell'
    },
    "exec": {
        'path/to/powershell -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Unrestricted -Command . \'My\\Temp\\Dir\\fileName.ps1\'': {
            "code": 1,
            "stdout": "my inline script output"
        },
        'path/to/powershell -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Unrestricted -Command . \'My/Temp/Dir/fileName.ps1\'': {
            "code": 1,
            "stdout": "my inline script output"
        }
    }
};
tmr.setAnswers(a);

tmr.registerMock('fs',clones.getFsClone());
tmr.registerMock('uuid/v4', clones.getUuidv4Clone());

tmr.run();