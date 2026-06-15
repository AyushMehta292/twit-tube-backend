import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("⚙️  Server is running on Port:", PORT);
    });
  })
  .catch((err) => {
    console.error("MONGODB CONNECTION FAILED:", err.message);
    process.exit(1);
  });
