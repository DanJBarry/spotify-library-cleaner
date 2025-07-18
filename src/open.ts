export async function open(uri: URL): Promise<void> {
  const encodedUri = uri.toString();

  const platform = Deno.build.os;
  const start = platform === "darwin"
    ? "open"
    : platform === "windows"
    ? "cmd"
    : "xdg-open";

  const args = [encodedUri];
  if (platform === "windows") {
    args[0] = args[0].replace(/&/g, "^&");
    args.unshift("/s", "/c", "start", "", "/b");
  }

  console.log("Prompting user to log in", encodedUri);
  await new Deno.Command(start, { args }).spawn().output();
}
