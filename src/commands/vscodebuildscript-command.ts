import { window, workspace } from "vscode";
import { injectable, inject } from "inversify";
import { ICommand } from "./icommand";
import { MessageService } from "../message-service";
import { FileSystemService } from "../filesystem-service";
import TYPES from "../types";

@injectable()
export class VsCodeBuildScriptCommand implements ICommand {
  constructor(
    @inject(TYPES.MessageService) private messageService: MessageService,
    @inject(TYPES.FileSystemService) private fileSystemService: FileSystemService,
  ) {}

  get id() {
    return "cakerecipe.vscodebuildscript";
  }

  async execute() {
    if (workspace.rootPath === undefined) {
      this.messageService.showError('You have not yet opened a folder.');
      return;
    }

    let name = await this.messageService.showInput("Enter the name for your new build script", "recipe.cake");

    let gitHubOwnerName = await this.messageService.showInput("Enter the name of the owner/organisation for the GitHub Repository", "");

    let gitHubRepositoryName = await this.messageService.showInput("Enter the name of the GitHub Repository", "");

    if (!name) {
      this.messageService.showWarning('No script name provided! Try again and make sure to provide a file name.');
      return;
    }

    if (!gitHubOwnerName) {
      this.messageService.showWarning('No GitHub Owner name provided! Try again and make sure to provide a GitHub Owner name.');
      return;
    }

    if (!gitHubRepositoryName) {
      this.messageService.showWarning('No GitHub Repository name provided! Try again and make sure to provide a GitHub Repository name.');
      return;
    }

    let buildScriptPath = this.fileSystemService.combinePath(workspace.rootPath, name);

    let buildFile = this.fileSystemService.createAppendWriteStream(buildScriptPath);

    buildFile.write('#load nuget:https://www.myget.org/F/gep13/api/v2?package=Cake.VsCode.Recipe&prerelease\n');
    buildFile.write('\n');
    buildFile.write('Environment.SetVariableNames();\n');
    buildFile.write('\n');
    buildFile.write('BuildParameters.SetParameters(context: Context,\n');
    buildFile.write('                            buildSystem: BuildSystem,\n');
    buildFile.write(`                            title: \"${gitHubRepositoryName}\",\n`);
    buildFile.write(`                            repositoryOwner: \"${gitHubOwnerName}\",\n`)
    buildFile.write(`                            repositoryName: \"${gitHubRepositoryName}\",\n`);
    buildFile.write(`                            appVeyorAccountName: \"${gitHubOwnerName.replace("-", "")}\",\n`);
    buildFile.write('                            shouldRunGitVersion: true);\n');
    buildFile.write('\n');
    buildFile.write('BuildParameters.PrintParameters(Context);\n');
    buildFile.write('\n');
    buildFile.write('Build.Run();');

    buildFile.end();

    buildFile.on('finish', function() {
      workspace.openTextDocument(buildFile.path.toString()).then((document) => {
          window.showTextDocument(document);
      });
    });
  }
}
