import fetchClient from '@core/http/base';
import logger from '@core/logger/base';
import { NextRequest, NextResponse } from 'next/server';
import { azureConfig, retrievePkceVerifier, retrieveAuthState } from '../utils';

const fetchConfig = {
  options: {
    timeout: 120000,
  },
};

interface AzureTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  [key: string]: unknown;
}

function validateRequestParams(
  code: string | null,
  receivedState: string | null,
  storedState: string | undefined,
  codeVerifier: string | undefined,
) {
  if (!code) {
    console.error('No authorization code received from Azure AD');
    return { valid: false, error: 'no_code' };
  }

  if (!storedState || !receivedState || receivedState !== storedState) {
    console.error('State validation failed', { receivedState, storedState });
    return { valid: false, error: 'invalid_state' };
  }

  if (!codeVerifier) {
    console.error('No PKCE code verifier found');
    return { valid: false, error: 'missing_verifier' };
  }

  return { valid: true };
}

async function exchangeCodeForTokens(code: string, redirectUri: string, codeVerifier: string) {
  try {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const { AZURE_CLIENT_SECRET } = process.env;

    const body = new URLSearchParams({
      client_id: azureConfig.clientId,
      client_secret: AZURE_CLIENT_SECRET || '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }).toString();

    logger.info('Azure token exchange request', {
      headers,
      body: body,
      fetchConfig
    });

    const tokenResponse = await fetchClient.post<AzureTokenResponse>(
      `https://login.microsoftonline.com/${azureConfig.tenantId}/oauth2/v2.0/token`,
      body,
      headers,
      fetchConfig,
    );

    logger.info('tokenResponse', tokenResponse);

    return { success: true, tokens: tokenResponse };
  } catch (error) {
    logger.info('token exchange error', error);
    return { success: false };
  }
}

function createAuthResponse(tokens: AzureTokenResponse, redirectUrl: URL) {
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set('azureToken', tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 45 * 60,
    path: '/',
  });

  if (tokens.refresh_token) {
    response.cookies.set('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 45 * 60,
      path: '/',
    });
  }
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const receivedState = searchParams.get('state');
    const storedState = await retrieveAuthState();
    const codeVerifier = await retrievePkceVerifier();

    const validation = validateRequestParams(code, receivedState, storedState, codeVerifier);
    if (!validation.valid) {
      return NextResponse.redirect(new URL(`/?error=${validation.error}`, request.url));
    }

    const domain = request.headers.get('host');

    const redirectUri = `https://${domain}/api/azure/callback`;

    const tokenResult = await exchangeCodeForTokens(code!, redirectUri, codeVerifier!);
    if (!tokenResult.success) {
      return NextResponse.redirect(new URL('/?error=token_exchange', request.url));
    }

    const redirectPath = Buffer.from(storedState!, 'base64').toString() || '/';

    const redirectUrl = new URL(
      redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`,
      `${request.nextUrl.protocol}//${domain}`,
    );

    console.log('Redirecting to:', redirectUrl.toString());
    if (!tokenResult.tokens) {
      return NextResponse.redirect(new URL('/?error=token_missing', request.url));
    }
    return createAuthResponse(tokenResult.tokens, redirectUrl);
  } catch (error) {
    console.error('Error in Azure AD callback:', error);
    return NextResponse.redirect(new URL('/?error=callback_error', request.url));
  }
}
