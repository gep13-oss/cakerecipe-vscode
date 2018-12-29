import {commands, window, workspace} from "vscode";
import * as path from "path"
import * as fs from "fs";

export function activate(): void {
  commands.registerCommand("cakerecipe.buildscript", () => addDefaultBuildFile());
}

async function addDefaultBuildFile():Promise<void> {
  if (workspace.rootPath === undefined) {
    window.showErrorMessage('You have not yet opened a folder.');
    return;
  }

  let name = await window.showInputBox({
    placeHolder: "Enter the name for your new build script",
    value: "recipe.cake"
  });

  let sourceFolderName = await window.showInputBox({
    placeHolder: "Enter the name of the folder where your source code resides",
    value: "Source"
  });

  let gitHubOwnerName = await window.showInputBox({
    placeHolder: "Enter the name of the owner/organisation for the GitHub Repository",
    value: ""
  });

  let gitHubRepositoryName = await window.showInputBox({
    placeHolder: "Enter the name of the GitHub Repository",
    value: ""
  });

  if (!name) {
    window.showWarningMessage(
        'No script name provided! Try again and make sure to provide a file name.'
    );
    return;
  }

  if (!sourceFolderName) {
    window.showWarningMessage(
        'No source folder name provided! Try again and make sure to provide a source folder name.'
    );
    return;
  }

  if (!gitHubOwnerName) {
    window.showWarningMessage(
        'No GitHub Owner name provided! Try again and make sure to provide a GitHub Owner name.'
    );
    return;
  }

  if (!gitHubRepositoryName) {
    window.showWarningMessage(
        'No GitHub Repository name provided! Try again and make sure to provide a GitHub Repository name.'
    );
    return;
  }

  let buildScriptPath = path.join(workspace.rootPath, name);

  let buildFile = fs.createWriteStream(buildScriptPath, {
    flags: 'a'
  });

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
