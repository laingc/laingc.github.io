import { HtmlValidate } from 'html-validate';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const validator = new HtmlValidate({ extends: ['html-validate:standard'] });
const directories = process.argv.slice(2);
if (!directories.length) directories.push('.test-output/builds/current', '.test-output/builds/subdirectory');
let count = 0;
let errors = 0;
for (const directory of directories) {
  for (const name of await readdir(directory, { recursive: true })) {
    if (!name.endsWith('.html')) continue;
    const filename = path.join(directory, name);
    const report = await validator.validateFile(filename);
    count++;
    if (!report.valid) {
      errors += report.errorCount;
      for (const result of report.results) {
        for (const { ruleId, message, line } of result.messages) console.error(`${filename}:${line}: ${ruleId}: ${message}`);
      }
    }
  }
}
console.log(`${count} HTML documents checked; ${errors} errors.`);
if (errors) process.exitCode = 1;
