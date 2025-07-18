import * as oauth from "jsr:@panva/oauth4webapi";
import { OAuthScope } from "@soundify/web-api/auth";

const issuer = new URL("https://accounts.spotify.com/");
const authServer = await oauth.processDiscoveryResponse(
  issuer,
  await oauth.discoveryRequest(issuer),
);

const SPOTIFY_REDIRECT_URI = "http://127.0.0.1:8080/callback";

export class OAuthError extends Error {
  constructor(public readonly params: oauth.OAuth2Error) {
    super(
      params.error +
        (params.error_description ? " : " + params.error_description : ""),
    );
  }
}

export function createAuthUrl(
  clientId: string,
  codeChallenge: string,
  scopes?: OAuthScope[],
  state?: string,
) {
  const authUrl = new URL(authServer.authorization_endpoint!);

  for (
    const [key, value] of Object.entries({
      client_id: clientId,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      response_type: "code",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    })
  ) {
    authUrl.searchParams.set(key, value);
  }

  if (scopes && scopes.length > 0) {
    authUrl.searchParams.set("scope", scopes.join(" "));
  }

  if (state) {
    authUrl.searchParams.set("state", state);
  }

  return authUrl;
}

export function validateAuthResponse(
  clientId: string,
  url: URL,
  expectedState: string,
) {
  return oauth.validateAuthResponse(
    authServer,
    {
      client_id: clientId,
      token_endpoint_auth_method: "none",
    },
    url,
    expectedState,
  );
}

export async function getAccessToken(
  clientId: string,
  params: URLSearchParams,
  codeVerifier: string,
) {
  const response = await oauth.authorizationCodeGrantRequest(
    authServer,
    {
      client_id: clientId,
      token_endpoint_auth_method: "none",
    },
    oauth.None(),
    params,
    SPOTIFY_REDIRECT_URI,
    codeVerifier,
  );
  console.debug("Got Authorization Code grant request:", response);

  const result = await oauth.processAuthorizationCodeResponse(
    authServer,
    {
      client_id: clientId,
      token_endpoint_auth_method: "none",
    },
    response,
  );
  console.debug("Processed Authorization Code response:", result);

  return result;
}
