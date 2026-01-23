export function outputJSON(data: unknown): void {
   console.log(JSON.stringify(data, null, 2));
}

export function outputText(message: string): void {
   console.log(message);
}

export function outputProgress(percent: number): void {
   process.stdout.write(`\r   Progress: ${percent}%`);
}

export function outputSuccess(message: string): void {
   console.log(`✅ ${message}`);
}

export function outputError(message: string): void {
   console.error(`❌ ${message}`);
}
