import { NextRequest, NextResponse } from 'next/server';
import { azureConfig, generateCodeVerifier, generateCodeChallenge, storePkceVerifier, storeAuthState } from '../utils';

export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get('host');

    const searchParams = request.nextUrl.searchParams;
    const returnUrl = searchParams.get('returnUrl') || '/';

    const redirectUri = `https://${domain}/api/azure/callback`;

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    await storePkceVerifier(codeVerifier);

    const authUrl = new URL(`https://login.microsoftonline.com/${azureConfig.tenantId}/oauth2/v2.0/authorize`);

    authUrl.searchParams.append('client_id', azureConfig.clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', azureConfig.scopes.join(' '));
    authUrl.searchParams.append('response_mode', 'query');

    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    const state = Buffer.from(returnUrl).toString('base64');

    await storeAuthState(state);
    authUrl.searchParams.append('state', state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Azure login redirect error:', error);
    return NextResponse.json({ error: 'Failed to redirect to login' }, { status: 500 });
  }
}

