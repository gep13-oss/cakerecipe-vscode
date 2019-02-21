import { window, workspace } from "vscode";
import { injectable, inject } from "inversify";
import { ICommand } from "./icommand";
import { MessageService } from "../message-service";
import { FileSystemService } from "../filesystem-service";
import TYPES from "../types";

@injectable()
export class BuildScriptCommand implements ICommand {
  constructor(
    @inject(TYPES.MessageService) private messageService: MessageService,
    @inject(TYPES.FileSystemService) private fileSystemService: FileSystemService,
  ) {}

  get id() {
    return "cakerecipe.buildscript";
  }

  async execute() {
    if (workspace.rootPath === undefined) {
      this.messageService.showError('You have not yet opened a folder.');
      return;
    }

    let name = await this.messageService.showInput("Enter the name for your new build script", "recipe.cake");

    let sourceFolderName = await this.messageService.showInput("Enter the name of the folder where your source code resides", "Source");

    let gitHubOwnerName = await this.messageService.showInput("Enter the name of the owner/organisation for the GitHub Repository", "");

    let gitHubRepositoryName = await this.messageService.showInput("Enter the name of the GitHub Repository", "");

    if (!name) {
      this.messageService.showWarning('No script name provided! Try again and make sure to provide a file name.');
      return;
    }

    if (!sourceFolderName) {
      this.messageService.showWarning('No source folder name provided! Try again and make sure to provide a source folder name.');
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

    buildFile.write('#load nuget:https://www.myget.org/F/cake-contrib/api/v2?package=Cake.Recipe&prerelease\n');
    buildFile.write('\n');
    buildFile.write('Environment.SetVariableNames();\n');
    buildFile.write('\n');
    buildFile.write('BuildParameters.SetParameters(context: Context,\n');
    buildFile.write('                            buildSystem: BuildSystem,\n');
    buildFile.write(`                            sourceDirectoryPath: \"./${sourceFolderName}\",\n`);
    buildFile.write(`                            title: \"${gitHubRepositoryName}\",\n`);
    buildFile.write(`                            repositoryOwner: \"${gitHubOwnerName}\",\n`);
    buildFile.write(`                            repositoryName: \"${gitHubRepositoryName}\",\n`);
    buildFile.write(`                            appVeyorAccountName: \"${gitHubOwnerName.replace("-", "")}\",\n`);
    buildFile.write('                            shouldRunGitVersion: true);\n');
    buildFile.write('\n');
    buildFile.write('BuildParameters.PrintParameters(Context);\n');
    buildFile.write('\n');
    buildFile.write('ToolSettings.SetToolSettings(context: Context,\n');
    buildFile.write('                            dupFinderExcludePattern: new string[] {\n');
    buildFile.write(`                            BuildParameters.RootDirectoryPath + \"/${sourceFolderName}/${gitHubRepositoryName}.Tests/*.cs\",\n`);
    buildFile.write(`                            BuildParameters.RootDirectoryPath + \"/${sourceFolderName}/${gitHubRepositoryName}/**/*.AssemblyInfo.cs\" },\n`);
    buildFile.write('                            testCoverageFilter: \"+[*]* -[xunit.*]* -[Cake.Core]* -[Cake.Testing]* -[*.Tests]* \",\n');
    buildFile.write('                            testCoverageExcludeByAttribute: \"*.ExcludeFromCodeCoverage*\",\n');
    buildFile.write('                            testCoverageExcludeByFile: \"*/*Designer.cs;*/*.g.cs;*/*.g.i.cs\");\n');
    buildFile.write('\n');
    buildFile.write('Build.RunDotNetCore();');

    buildFile.end();

    buildFile.on('finish', function() {
      workspace.openTextDocument(buildFile.path.toString()).then((document) => {
          window.showTextDocument(document);
      });
    });
  }
}
