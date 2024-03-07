// Copyright (c) 2024 Captor Fund Management AB.
// see LICENSE file

// Convert the EPT_V2.1_Final.json file to a json schema file
// npx ts-node scripts/generate-ept-schema.ts

import { JSONSchema4 } from "json-schema";
import { codes } from "currency-codes";
import { writeFileSync } from "fs";

import { iso639_2Languages } from "./iso639_2Languages";
import data from "../json/EPT_V2.1_Final.json";

const STRING_TYPE_EXPRESSION = RegExp(/^string\s*\[(\d+)\]$/);
const NUMBER_RANGE_EXPRESSION = RegExp(/^number\s*\[(\d+)\s*-\s*(\d+)\]/);

const input = data["EPT 2.1 "]; // yes should be a space in the end

// these
const doesNotSeemToBeMandatory = [
  "04060_Other_Materially_Relevant_Risk_Narrative_Portfolio",
  "06005_German_MOPs_Reference_Date",
  "06010_Bonds_Weight",
  "06020_Annualized_Return_Volatility",
  "06030_Duration_Bonds",
  "06040_Existing_Capital_Preservation",
  "06070_Uses_PI",
  "08020_UK_Ongoing_Costs_Portfolio_Transaction_Costs",
  "08030_UK_Transactions_costs_methodology",
  "08090_UK_Performance_Information_Main_Factors",
  "08110_UK_Performance_Information_Higher_Returns",
  "08120_UK_Performance_Information_Lower_Returns_Or_Loss",
  "08130_UK_Performance_Information_Adverse_Conditions",
  "08150_UCITS_KIID_Publication_Date",
  "08160_UCITS_KIID_Web_Address",
  "08170_UCITS_SRRI",
  "08180_UCITS_Ongoing_Charges",
  "08190_UCITS_Existing_Performance_Fees",
];

const schema: JSONSchema4 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  oneOf: [
    {
      $ref: "#/components/schemas/ept",
    },
    {
      type: "array",
      items: {
        $ref: "#/components/schemas/ept",
      },
    },
  ],
};

const properties: JSONSchema4["properties"] = {};
let required: string[] = [];
let missingTypeCnt = 0;
const allFieldNames = [];
input.forEach((field) => {
  if (field.definition) {
    allFieldNames.push(field.field);
    let description: string = field.definition;

    if (field.comment) {
      description = description + "\r\n" + field.comment;
    }

    if (field.codification) {
      description = description + "\r\n" + field.codification;
    }

    const schema: JSONSchema4 = {
      description: description,
    };

    if (field.codification === "V21 or V21UK") {
      schema.type = "string";
      schema.enum = ["V21", "V21UK"];
    }

    if (field.codification && STRING_TYPE_EXPRESSION.test(field.codification)) {
      schema.type = "string";
      schema.maxLength = parseInt(
        STRING_TYPE_EXPRESSION.exec(field.codification)[1]
      );
    }

    if (
      field.codification &&
      NUMBER_RANGE_EXPRESSION.test(field.codification)
    ) {
      schema.type = "number";
      schema.minimum = parseInt(
        NUMBER_RANGE_EXPRESSION.exec(field.codification)[1]
      );
      schema.maximum = parseInt(
        NUMBER_RANGE_EXPRESSION.exec(field.codification)[2]
      );
    }

    if (
      field.codification &&
      field.codification.startsWith("floating decimal")
    ) {
      schema.type = "number";
    }

    if (field.codification && field.codification === "integer") {
      schema.type = "integer";
    }

    if (field.codification === "in years (not an integer)") {
      schema.type = "integer";
      //schema.type = "string";
      //schema.pattern = "^\\d+$";
    }

    if (field.codification === "Y/N" || field.codification === "Y / N") {
      schema.type = "string";
      schema.enum = ["Y", "N"];
    }

    if (field.codification === "Alphanum (max 255)") {
      schema.type = "string";
      schema.maxLength = 255;
      //schema.pattern = "^[ A-Za-z0-9()]*$";
    }

    if (field.codification === "Alphanum(20) ISO 17442") {
      schema.type = "string";
      schema.maxLength = 20;
      schema.pattern = "^[ A-Za-z0-9]*$";
    }

    if (field.codification === "string") {
      schema.type = "string";
    }

    if (field.codification === "YYYY-MM-DD         ISO 8601") {
      schema.type = "string";
      schema.format = "date";
    }
    if (
      field.codification === "YYYY-MM-DD  hh:mm:ss       ISO 8601     (UTC+0)"
    ) {
      schema.type = "string";
      schema.format = "date-time";
    }

    if (field.codification === "Code ISO 4217") {
      schema["$ref"] = "#/components/schemas/currency";
    }

    if (field.codification === "ISO 639-2") {
      schema["$ref"] = "#/components/schemas/language";
    }

    if (
      field.codification ===
      "S.06.02 (old: Assets D1)  - Remark:  first two digits are expected to be XL ( not country code)"
    ) {
      schema.type = "string";
      schema.pattern = "^XL[A-Za-z0-9]{2}$";
    }

    if (
      field.codification &&
      field.codification ===
        'Frequency ("0" = other than /"1"= annual  / "2"= biannual / "4"=quarterly / "12"= monthly / "24"=bimonthly / "52"=weekly / "104"=biweekly, "252"=daily)'
    ) {
      schema.type = "number";
      schema.enum = [0, 1, 2, 4, 12, 24, 52, 104, 252];
    }

    if (
      field.codification &&
      field.codification ===
        'Frequency (/"1"= annual  / "2"= biannual / "4"=quarterly / "12"= monthly / "24"=bimonthly / "52"=weekly / "104"=biweekly/"252"=daily /"YYYY-MM-DD"=fixed date)'
    ) {
      schema.oneOf = [
        {
          type: "number",
          enum: [0, 1, 2, 4, 12, 24, 52, 104, 252],
        },
        {
          type: "string",
          format: "date",
        },
      ];
    }

    if (field.codification === '"M", "I", "L"') {
      schema.type = "string";
      schema.enum = ["M", "I", "L"];
    }

    if (field.codification === "1, or 2, or 3") {
      schema.type = "number";
      schema.enum = [1, 2, 3];
    }

    if (field.codification === "1 to 4") {
      schema.type = "number";
      schema.minimum = 1;
      schema.maximum = 4;
    }

    if (field.codification === "UKPRIIP/UCITS/Both") {
      schema.type = "string";
      schema.enum = ["UKPRIIP", "UCITS", "Both"];
    }

    if (field.field === "07080_One_Off_Costs_Portfolio_Exit_Cost") {
      // a little unsure of this
      schema.type = "string";
    }

    if (
      field.field ===
      "07100_Ongoing_Costs_Management_Fees_And_Other_Administrative_Or_Operating_Costs"
    ) {
      // a little unsure of this
      schema.type = "string";
    }

    if (
      field.field ===
      "00040_Type_Of_Identification_Code_For_The_Fund_Share_Or_Portfolio"
    ) {
      schema.type = "number";
      schema.enum = [1, 2, 3, 4, 5, 6, 7, 8, 9, 99];
    }

    if (field.field === "00030_Portfolio_Identifying_Data") {
      schema.type = "string";
    }

    if (field.field.includes("_Email")) {
      schema.type = "string";
      schema.format = "email";
      delete schema.pattern;
    }

    //properties["f" + field.field] = schema; // would be so much better if the field names did not start with a number. Cant make variables that start with numbers
    properties[field.field] = schema;
    if (
      field.mandatory === "M" &&
      !doesNotSeemToBeMandatory.includes(field.field)
    ) {
      required.push(field.field);
    }

    if (!schema.type && !schema["$ref"] && !schema["oneOf"]) {
      missingTypeCnt += 1;
      console.log(field.field + "  '" + field.codification + "'");
    }
  }
});

console.log(
  "missingTypeCnt: ",
  missingTypeCnt,
  " out of ",
  Object.values(properties).length
);

// https://datapartner.fefundinfo.com/format-validator thinks these are mandatory
const mandatory = [
  "00120_Reference_Language",
  "01020_Portfolio_VEV_Reference",
  "02190_Past_Performance_Link",
  "02200_Previous_Performance_Scenarios_Calculation_Link",
  "02210_Past_Performance_Number_Of_Years",
];

required = [...required, ...mandatory].sort();
required = [...new Set(required)];

const components = {
  schemas: {
    currency: {
      type: "string",
      enum: codes(),
    },
    language: {
      type: "string",
      enum: Object.keys(iso639_2Languages),
    },
    ept: {
      type: "object",
      properties: properties,
      required: required,
      additionalProperties: false,
    },
  },
};

schema.components = components;

writeFileSync("schemas/ept.schema.json", JSON.stringify(schema, null, 2));

//console.log(JSON.stringify(allFieldNames, null, 2));
