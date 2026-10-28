import path from "node:path";

export function uploadsDirectory() {
  // Runtime storage (a shared symlink on the server), not a build input.
  return path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads");
}
