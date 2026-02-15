import app from "./app";
import { connectDatabase } from "./config/database";
import { bootstrapAdminUser } from "./services/authService";

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

async function startServer() {
  await connectDatabase();
  await bootstrapAdminUser();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
