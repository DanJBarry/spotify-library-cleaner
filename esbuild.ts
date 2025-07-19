import * as esbuild from "https://deno.land/x/esbuild@v0.25.7/mod.js";

if (!import.meta.main) {
  throw new Error(
    "This script is intended to be run as a build script, not imported as a module.",
  );
}

await esbuild.build({
  banner: {
    js: "/* Copyright (C) 2025  Daniel Barry\n" +
      "\n" +
      "This program is free software: you can redistribute it and/or modify\n" +
      "it under the terms of the GNU General Public License as published by\n" +
      "the Free Software Foundation, either version 3 of the License, or\n" +
      "(at your option) any later version.\n" +
      "\n" +
      "This program is distributed in the hope that it will be useful,\n" +
      "but WITHOUT ANY WARRANTY; without even the implied warranty of\n" +
      "MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n" +
      "GNU General Public License for more details.\n" +
      "\n" +
      "You should have received a copy of the GNU General Public License\n" +
      "along with this program.  If not, see <https://www.gnu.org/licenses/>. */",
  },
  entryPoints: ["main.ts"],
  bundle: true,
  outfile: "dist/spotify-library-fixer.js",
  format: "esm",
  platform: "node",
  minify: true,
  external: ["jsr:*"],
});
await esbuild.stop();
