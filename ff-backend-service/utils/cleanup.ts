import fs from "fs";

export default async function cleanup(): Promise<void> {
  try {
    await fs.promises.rmdir("./tmp", {
      recursive: true,
    });
  } catch (e) {
    
  }
}
