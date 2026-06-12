import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const downloadsDirectory = resolve("dist", "downloads");
await rm(downloadsDirectory, { recursive: true, force: true });
