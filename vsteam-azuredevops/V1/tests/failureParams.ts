import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('scriptType', '');
tmr.setInput('scriptPath', '');
tmr.setInput('scriptInline', '');
tmr.setInput('scriptArguments', '');
tmr.setInput('failOnStandardError', '');
tmr.setInput('azureDevOpsCred', '');
tmr.setInput('input_workingDirectory', '');
tmr.setInput('errorActionPreference', '');

tmr.run();