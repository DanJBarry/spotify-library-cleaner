# Spotify Library Cleaner

A Deno-based tool to help clean up and fix your Spotify library by re-adding unavailable albums and tracks, and cleaning up playlists.

## Features

- Detects and re-adds albums and tracks that are no longer available in your region (e.g., US).
- Removes unavailable albums and tracks from your saved library.
- Scans your playlists and identifies tracks that are no longer available.
- Uses the [@soundify/web-api](https://jsr.io/@soundify/web-api) and [@panva/oauth4webapi](https://jsr.io/@panva/oauth4webapi) for Spotify API access and OAuth authentication.

## Requirements

- [Deno](https://deno.com/) (see [mise.toml](mise.toml) for version)
- Spotify account

## Setup

1. **Clone the repository:**
   ```sh
   git clone https://github.com/DanJBarry/spotify-library-cleaner.git
   cd spotify-library-cleaner
   ```

2. **Install Deno** (if not already installed):
   See [Deno installation guide](https://deno.com/manual/getting_started/installation).

3. **(Optional) Configure Spotify API credentials:**
   A valid Spotify App client ID is required to access the Spotify Web API. If the provided client ID stops working, you can create your own [here](https://developer.spotify.com/documentation/web-api) (use `http://127.0.0.1/callback` as the redirect URI), and then pass in the new client ID using the `client-id` option.

## Usage

Run the main script:

```sh
deno run --allow-net --allow-read --allow-run main.ts
```

Or use the provided task:

```sh
deno task dev
```

You will be prompted to log in to your Spotify account and authorize the application.

### Command-line Options

- `--help`                Show help message
- `--version`             Show version information
- `--clean-albums`        Remove old albums from library
- `--clean-liked-songs`   Remove old tracks from liked songs
- `--clean-playlists`     Remove old tracks from playlists

## Project Structure

- [`main.ts`](main.ts): Entry point, orchestrates the fixing process.
- [`src/client.ts`](src/client.ts): Handles OAuth flow and Spotify API client setup.
- [`src/auth.ts`](src/auth.ts): Spotify OAuth helper functions.
- [`src/open.ts`](src/open.ts): Opens URLs in the user's browser.

## Development

Run tests with:

```sh
deno test
```

## License

GNU General Public License v3.0

---

**Note:** This project is for personal use. Use at your own risk.
