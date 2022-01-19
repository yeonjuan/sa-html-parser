/**
 * https://github.com/fkling/astexplorer/blob/master/website/src/utils/stringify.js
 */
export default function stringify(value: any): string {
  switch (typeof value) {
    case "function":
      return value.toString().match(/function[^(]*\([^)]*\)/)[0];
    case "object":
      return value ? JSON.stringify(value, stringify) : "null";
    case "undefined":
      return "undefined";
    case "number":
    case "bigint":
      return Number.isNaN(value) ? "NaN" : String(value);
    default:
      return JSON.stringify(value);
  }
}
