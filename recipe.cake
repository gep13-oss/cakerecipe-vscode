#load nuget:https://www.myget.org/F/gep13/api/v2?package=Cake.VsCode.Recipe&prerelease

if(BuildSystem.IsLocalBuild)
{
    Environment.SetVariableNames(
        githubUserNameVariable: "CAKERECIPEVSCODE_GITHUB_USERNAME",
        githubPasswordVariable: "CAKERECIPEVSCODE_GITHUB_PASSWORD"
    );
}
else
{
    Environment.SetVariableNames();
}

BuildParameters.SetParameters(context: Context,
                            buildSystem: BuildSystem,
                            title: "cakerecipe-vscode",
                            repositoryOwner: "gep13-oss",
                            repositoryName: "cakerecipe-vscode",
                            appVeyorAccountName: "gep13oss",
                            shouldRunGitVersion: true);

BuildParameters.PrintParameters(Context);

Build.Run();
