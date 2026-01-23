#!/usr/bin/env node

import { app } from 'electron';
import { Command } from 'commander';
import { CommandRegistry } from './cli/CommandRegistry';

const program = new Command();

program
   .name('ginger')
   .description('Ginger Media Player - Command Line Interface')
   .version('1.0.3');

// Initialize and register all commands
app.whenReady().then(async () => {
   const registry = new CommandRegistry(program);
   await registry.registerAll();
   program.parse();
});
