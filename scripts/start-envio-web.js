const { execSync } = require("child_process");
const path = require("path");

process.chdir(path.resolve(__dirname, "../../envio-web"));
require("../envio-web/node_modules/next/dist/bin/next");
