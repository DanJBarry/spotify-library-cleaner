import { retrieveAccessToken } from "./src/client.ts";
import {
  getCurrentUser,
  getCurrentUsersPlaylists,
  getPlaylistTracks,
  getSavedAlbums,
  getSavedTracks,
  getTracks,
  removeSavedAlbums,
  removeSavedTracks,
  saveAlbums,
  saveTracks,
  SpotifyClient,
} from "jsr:@soundify/web-api";
import { PageIterator } from "jsr:@soundify/web-api/pagination";
import { chunk } from "jsr:@es-toolkit/es-toolkit";
import { parseArgs } from "jsr:@std/cli/parse-args";
import denoJson from "./deno.json" with { type: "json" };

const SPOTIFY_CLIENT_ID = "c2dc32d50fc64839ae7e451429c62205";

const removeOldAlbums = async (client: SpotifyClient) => {
  const albumIter = new PageIterator(
    (offset) =>
      getSavedAlbums(client, {
        offset,
        limit: 50,
      }),
  );

  const allAlbums = await albumIter.collect();
  const oldAlbums = allAlbums.filter(({ album }) =>
    !album.available_markets?.includes("US")
  );

  const firstTracks = chunk(
    oldAlbums.map(({ album }) => album.tracks.items[0].id),
    20,
  );

  const newAlbums = await Promise.all(
    firstTracks.map((batch) =>
      getTracks(client, batch, "US").then((tracks) =>
        saveAlbums(client, tracks.map((track) => track.album.id))
      )
    ),
  );
  console.table(newAlbums);

  const removedAlbums = await Promise.all(
    chunk(oldAlbums, 20).map((batch) =>
      removeSavedAlbums(client, batch.map(({ album }) => album.id))
    ),
  );
  console.table(removedAlbums);
};

const removeOldTracksFromLikedSongs = async (client: SpotifyClient) => {
  const trackIter = new PageIterator(
    (offset) =>
      getSavedTracks(client, {
        offset,
        limit: 50,
      }),
  );

  const allTracks = await trackIter.collect();
  const oldTracks = chunk(
    allTracks.filter(({ track }) => !track.available_markets?.includes("US")),
    20,
  );

  console.log("Adding tracks...");
  const newTracks = await Promise.all(
    oldTracks.map((batch) =>
      getTracks(client, batch.map(({ track }) => track.id), "US").then(
        (tracks) => saveTracks(client, tracks.map((track) => track.id)),
      )
    ),
  );

  console.log("Removing tracks...");
  const removedTracks = await Promise.all(
    oldTracks.map((batch) =>
      removeSavedTracks(client, batch.map(({ track }) => track.id))
    ),
  );
};

const removeOldTracksFromPlaylists = async (client: SpotifyClient) => {
  const currentUser = await getCurrentUser(client);
  const playlistIter = new PageIterator(
    (offset) =>
      getCurrentUsersPlaylists(client, {
        offset,
        limit: 50,
      }),
  );

  const followedPlaylists = await playlistIter.collect();
  followedPlaylists.forEach(async (playlist) => {
    if (playlist.owner.id !== currentUser.id) {
      return;
    }
    const playlistIter = new PageIterator(
      (offset) =>
        getPlaylistTracks(client, playlist.id, {
          offset,
          limit: 50,
        }),
    );

    const playlistTracks = await playlistIter.collect();
    await Promise.all(playlistTracks.map(({ track }) => {
      if (track.id === null) {
        console.log(`${playlist.name} - ${track.name} null`);
        return;
      }
      // const trackDetails = await getTrack(client, track.id);
      // if (!trackDetails.available_markets?.includes("US")) {
      //   console.log(`${playlist.name} - ${track.name} ${trackDetails.available_markets}`);
      // }
      // if (track.id !== trackDetails.id) {
      //   console.log(`${playlist.name} - ${track.name} ${trackDetails.id}`)
      // }
    }));
  });
};

const main = async () => {
  const flags = parseArgs(Deno.args, {
    boolean: [
      "help",
      "version",
      "clean-albums",
      "clean-liked-songs",
      "clean-playlists",
    ],
    string: ["client-id"],
    default: { "client-id": SPOTIFY_CLIENT_ID },
  });

  if (flags.help) {
    console.log(
      "Usage: deno run --allow-net --allow-run --allow-read main.ts [options]",
    );
    console.log("Options:");
    console.log("  --help                Show this help message");
    console.log("  --version             Show version information");
    console.log("  --clean-albums        Remove old albums from library");
    console.log("  --clean-liked-songs   Remove old tracks from liked songs");
    console.log("  --clean-playlists     Remove old tracks from playlists");
    console.log(`  --client-id <id>      Spotify App client ID (default: ${SPOTIFY_CLIENT_ID})`);
    return 0;
  }

  if (flags.version) {
    console.log(`Spotify Library Cleaner version: v${denoJson.version}`);
    return 0;
  }

  const accessToken = await retrieveAccessToken(flags["client-id"]);
  console.log("Access Token:", accessToken);

  const client = new SpotifyClient(accessToken);

  // do all actions if no flags are set
  const cleanAll = !(flags["clean-albums"] || flags["clean-liked-songs"] ||
    flags["clean-playlists"]);

  if (cleanAll || flags["clean-albums"]) {
    await removeOldAlbums(client);
  }
  if (cleanAll || flags["clean-liked-songs"]) {
    await removeOldTracksFromLikedSongs(client);
  }
  if (cleanAll || flags["clean-playlists"]) {
    await removeOldTracksFromPlaylists(client);
  }
  return 0;
};

if (import.meta.main) {
  Deno.exit(await main());
}
