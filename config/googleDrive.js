import { google } from "googleapis";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getDriveService = async () => {
  try {
    const credentials = JSON.parse(
      readFileSync(join(__dirname, "../credentials.json"))
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    return google.drive({ version: "v3", auth });
  } catch (error) {
    console.error("Error creating drive service:", error);
    throw error;
  }
};
