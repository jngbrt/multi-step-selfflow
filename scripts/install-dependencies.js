// Install required Node.js dependencies
const { execSync } = require("child_process")

const dependencies = ["js-yaml", "@types/js-yaml"]

console.log("Installing required dependencies...")

try {
  execSync(`npm install ${dependencies.join(" ")}`, { stdio: "inherit" })
  console.log("Dependencies installed successfully!")
} catch (error) {
  console.error("Error installing dependencies:", error.message)
}

console.log("\nMake sure you have the following system dependencies installed:")
console.log("- ExifTool: https://exiftool.org/install.html")
console.log("- Python 3 with your baton_runner.py script")
