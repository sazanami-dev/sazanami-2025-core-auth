import axios from 'axios';
import useEnv from './useEnv';

const apiBaseUrl = useEnv('API_BASE_URL', 'http://localhost:3000');

const useApi = (token: string) => {
  const instance = axios.create({
    baseURL: apiBaseUrl,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    get: instance.get,
    post: instance.post,
    put: instance.put,
    delete: instance.delete,
  };
};

export default useApi;
