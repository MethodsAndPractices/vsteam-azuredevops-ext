import tl = require("azure-pipelines-task-lib/task");

export class AzureDevOpsCred {

    private hostUrl: string;
    private patToken: string;

    constructor(hostUrl: string, patToken: string) {
        if (typeof hostUrl.valueOf() !== 'string' || !hostUrl) {
            throw new Error("HostUrlCannotBeEmpty");
        }

        if (typeof patToken.valueOf() !== 'string' || !patToken) {
            throw new Error("PatTokenCannotBeEmpty");
        }

        this.hostUrl = hostUrl;
        this.patToken = patToken;
    }

    public getPatToken(): string {
        return this.patToken;
    }

    public getHostUrl(): string {
        return this.hostUrl;
    }

}

export class VsTeamTaskParameters {

    public scriptType: string
    public scriptPath: string
    public scriptInline: string
    public scriptArguments: string
    public failOnStandardError: boolean
    public workingDirectory: string
    public errorActionPreference: string
    public azureDevOpsCred : AzureDevOpsCred


    public getAzDPatToken(azDServiceConnection: string): AzureDevOpsCred {
        let endpointAuth = tl.getEndpointAuthorization(azDServiceConnection, true);
        if (endpointAuth.scheme === 'Token') {
            let hostUrl = tl.getEndpointUrl(azDServiceConnection, true);
            let patToken: string = endpointAuth.parameters["apitoken"];
            if (typeof hostUrl.valueOf() !== 'string' || !hostUrl) {
                throw new Error("UrlCannotBeEmpty");
            }

            if (typeof patToken.valueOf() !== 'string' || !patToken) {
                throw new Error("PatTokenCannotBeEmpty");
            }
            let credentials = new AzureDevOpsCred(hostUrl, patToken);
            return credentials;
        }
        else {
            throw new Error("OnlyTokenAuthAllowed");
        }
    }

    public getTaskParameters(): VsTeamTaskParameters {
        try {
            let errorActionPreference: string = tl.getInput('errorActionPreference', false) || 'Stop';
            switch (errorActionPreference.toUpperCase()) {
                case 'STOP':
                case 'CONTINUE':
                case 'SILENTLYCONTINUE':
                    break;
                default:
                    throw new Error("Option does not exist: " + errorActionPreference);
            }

            this.errorActionPreference = errorActionPreference.toUpperCase();
            this.scriptType = tl.getInput('FileOrInline', /*required*/false);
            this.scriptPath = tl.getPathInput('PowerShellFilePath', false);
            this.scriptInline = tl.getInput('PowerShellInline', false);
            this.scriptArguments = tl.getInput('PsArguments', false);
            this.failOnStandardError = tl.getBoolInput('failOnStderr', false);
            let serviceName : string = tl.getInput('ConnectedServiceName',/*required*/true);
            this.azureDevOpsCred = this.getAzDPatToken(serviceName)
            this.workingDirectory = tl.getPathInput('workingDirectory', /*required*/ true, /*check*/ true);

            return this

        } catch (error) {
            throw new Error("Error in Argumentconstruction:" + error.message);
        }
    }

}