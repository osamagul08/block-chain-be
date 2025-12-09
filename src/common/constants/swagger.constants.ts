export const SwaggerSummary = {
  AuthRequestChallenge: 'Request a login challenge',
  AuthVerifySignature: 'Verify a wallet signature and issue access token',
  AuthGetProfile: 'Get the authenticated user profile from token',
  ProfileGet: 'Retrieve the authenticated user profile',
  ProfileUpdate: 'Update the authenticated user profile',
} as const;

export const SwaggerTags = {
  Auth: 'Auth',
  Profile: 'Profile',
} as const;

export const SwaggerDescriptions = {
  ProfileGetSuccess: 'User profile retrieved successfully',
  ProfileUpdateSuccess: 'User profile updated successfully',
  BearerAuthDescription: 'Provide the JWT returned by /auth/verify.',
} as const;

export const SwaggerDoc = {
  Title: 'Blockchain API',
  Description: 'API documentation for the blockchain backend services.',
  Version: '1.0.0',
  DocsPath: 'api/docs',
  type: 'http',
  schema: 'bearer',
  bearerFormat: 'JWT',
  descriptionAuth: 'Provide the JWT returned by /auth/verify.',
} as const;
