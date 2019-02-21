import 'reflect-metadata';

import { Container } from 'inversify';
import TYPES from './types';
import { ICommand } from './commands/icommand';
import { CommandManager } from './commands/command-manager';
import { BuildScriptCommand } from './commands/buildscript-command';
import { VsCodeBuildScriptCommand } from './commands/vscodebuildscript-command';
import { MessageService } from './message-service';
import { FileSystemService } from './filesystem-service';

const container = new Container();
container.bind(TYPES.MessageService).to(MessageService).inSingletonScope();
container.bind(TYPES.FileSystemService).to(FileSystemService).inSingletonScope();
container.bind<ICommand>(TYPES.Command).to(BuildScriptCommand);
container.bind<ICommand>(TYPES.Command).to(VsCodeBuildScriptCommand);

container.bind<CommandManager>(TYPES.CommandManager).to(CommandManager);

export default container;
