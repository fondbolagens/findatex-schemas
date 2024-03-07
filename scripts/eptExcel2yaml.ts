// Copyright (c) 2024 Captor Fund Management AB.
// see LICENSE file

import excelToJson from "convert-excel-to-json";
import { program } from "commander";
import {
  stringify,
  DocumentOptions,
  SchemaOptions,
  ParseOptions,
  CreateNodeOptions,
  ToStringOptions,
} from "yaml";
import * as fs from "fs";
import { version } from "../package.json";

const stringifyOptions: DocumentOptions &
  SchemaOptions &
  ParseOptions &
  CreateNodeOptions &
  ToStringOptions = {
  defaultKeyType: "PLAIN",
  //defaultStringType: "QUOTE_DOUBLE",
};

program
  .version(version)
  .argument("<files...>", "one or more excel files")
  .action((files: string[]) => {
    if (!files) {
      console.error("no file specified");
      process.exit(1);
    }
    files.forEach((filePath) => {
      if (!filePath.endsWith("xlsx")) {
        console.error(filePath + " does not seems to be an .xlsx file");
        process.exit(1);
      }

      const document = excelToJson({
        sourceFile: filePath,
        columnToKey: {
          "*": "{{columnHeader}}",
        },
      });

      const sheetNames: string[] = Object.keys(document);
      let yamlFile = filePath.replace(/\.xlsx/, "") + ".yaml";
      yamlFile = yamlFile.split(/[\\/]/).pop();

      const data: Record<string, any>[] = document[sheetNames[0]];
      data.shift(); // remove headers

      fs.writeFileSync(yamlFile, stringify(data, stringifyOptions), "utf8");
      console.log("wrote " + yamlFile);
    });
  })
  .parse(process.argv);
