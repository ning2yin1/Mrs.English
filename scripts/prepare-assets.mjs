// Generated public assets. Source photographs, WAVs and both design kits stay intact.
import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
mkdirSync("public/assets", { recursive: true });
for (const kind of ["photos", "audio"])
  cpSync(`assets/${kind}`, `public/assets/${kind}`, { recursive: true });
for (const kind of ["ui", "backgrounds", "branding"]) {
  const target = `public/assets/${kind}`;
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  const walk = (dir) => {
    for (const e of readdirSync(`assets/${kind}/${dir}`, {
      withFileTypes: true,
    })) {
      const relative = join(dir, e.name);
      if (e.isDirectory()) {
        walk(relative);
        continue;
      }
      const wanted =
        kind === "backgrounds"
          ? e.name.endsWith(".webp")
          : kind === "branding"
            ? [
                "icon-192.png",
                "icon-512.png",
                "apple-touch-icon.png",
                "mrs_green_apple_loading_symbol.png",
              ].includes(e.name)
            : e.name.endsWith(".png") ||
              (e.name.endsWith(".svg") &&
                (dir === "icons" || relative === "result/heart-mask.svg"));
      if (wanted) {
        mkdirSync(join(target, dir), { recursive: true });
        cpSync(`assets/${kind}/${relative}`, join(target, relative));
      }
    }
  };
  walk("");
}
