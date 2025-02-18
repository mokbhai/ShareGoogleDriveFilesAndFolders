import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const deployApp = async (req, res) => {
  try {
    // Verify deploy secret
    const deploySecret =
      req.headers["x-deploy-secret"] || req.query.deploySecret;
    if (deploySecret !== process.env.DEPLOY_SECRET) {
      return res.status(401).json({ error: "Unauthorized deployment attempt" });
    }

    console.log("🚀 Starting deployment...");

    // Pull latest changes
    console.log("📥 Pulling from GitHub...");
    await execAsync("git pull");

    // Install dependencies
    console.log("📦 Installing dependencies...");
    await execAsync("npm install");

    // Restart PM2 process
    console.log("🔄 Restarting PM2 process...");
    await execAsync("pm2 restart 0");

    console.log("✅ Deployment completed successfully!");

    res.json({
      success: true,
      message: "Deployment completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    res.status(500).json({
      success: false,
      error: "Deployment failed",
      details: error.message,
    });
  }
};
