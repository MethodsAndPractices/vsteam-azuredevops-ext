const tl = require('azure-pipelines-task-lib/mock-task');
const fs = require('fs');

export class mockUpClones {

    //Create assertAgent and getVariable mocks, support not added in this version of task-lib
    public getTaskLibClone(): Object {


        const clone = Object.assign({}, tl);
        clone.getVariable = function (variable: string) {
            if (variable.toLowerCase() == 'agent.tempdirectory') {
                return 'My/Temp/Dir';
            }
            return null;
        };
        clone.assertAgent = function (variable: string) {
            return;
        };

        return clone
    }
    // Mock fs
    public getFsClone(): Object {

        const clone = Object.assign({}, fs);
        clone.writeFileSync = function (filePath, contents, options) {
            console.log(`Writing ${contents} to ${filePath}`);
        }
        return clone;
    }

    // Mock uuidv4
    public getUuidv4Clone() {
        return function () {
            return 'fileName';
        }
    }

}