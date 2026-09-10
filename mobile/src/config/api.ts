export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.6:3000/api',
  TIMEOUT_MS: 10000,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
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
