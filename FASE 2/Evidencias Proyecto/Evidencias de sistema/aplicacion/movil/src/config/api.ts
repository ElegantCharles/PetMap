export const API_CONFIG = {
  BASE_URL: 'http://172.20.10.5:3000/api',
  TIMEOUT_MS: 10000,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/auth/me',
    },
    PETS: {
      LIST: '/pets',
      DETAIL: (id: string | number) => `/pets/${id}`,
    },
    MAP: {
      LOCATIONS: '/map/locations',
    },
  },
};
