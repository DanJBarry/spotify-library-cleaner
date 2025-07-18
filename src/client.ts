import { createAuthUrl, getAccessToken, validateAuthResponse } from "./auth.ts";
import * as oauth from "jsr:@panva/oauth4webapi";
import { OAUTH_SCOPES } from "@soundify/web-api/auth";
import { open } from "./open.ts";

const {
  USER_LIBRARY_MODIFY,
  USER_LIBRARY_READ,
  PLAYLIST_READ_PRIVATE,
  PLAYLIST_MODIFY_PRIVATE,
  PLAYLIST_MODIFY_PUBLIC,
} = OAUTH_SCOPES;

export async function retrieveAccessToken(clientId: string): Promise<string> {
  // request permissions upfront
  await Deno.permissions.request({ name: "net", host: "0.0.0.0:8888" });

  const codeVerifier = oauth.generateRandomCodeVerifier();
  const state = oauth.generateRandomState();
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);
  const authUrl = createAuthUrl(
    clientId,
    codeChallenge,
    [
      USER_LIBRARY_MODIFY,
      USER_LIBRARY_READ,
      PLAYLIST_READ_PRIVATE,
      PLAYLIST_MODIFY_PRIVATE,
      PLAYLIST_MODIFY_PUBLIC,
    ],
    state,
  );

  // ask user authorization
  await open(authUrl);

  // wait for user to have accepted
  // opens web server to accept the callback
  const params = await waitForAuthorization(clientId, {
    port: 8080,
    expectedState: state,
  });

  const result = await getAccessToken(clientId, params, codeVerifier);

  return result.access_token;
}

export function waitForAuthorization(
  clientId: string,
  options: { port: number; expectedState: string },
): Promise<URLSearchParams> {
  return new Promise<URLSearchParams>((resolve, _reject) => {
    const abortController = new AbortController();
    const server = Deno.serve({
      handler: (request: Request) => {
        console.debug("Received request", request);
        const params = validateAuthResponse(
          clientId,
          new URL(request.url),
          options.expectedState,
        );

        setTimeout(() => abortController.abort());
        resolve(server.finished.then(() => params));

        return new Response("You can now close this browser window.");
      },
      port: options.port,
      signal: abortController.signal,
      onListen: () => {
        console.log("Waiting for authorization...");
      },
    });
  });
}
