import axios from 'axios';
import useEnv from './useEnv';

const apiBaseUrl = useEnv('API_BASE_URL', 'http://localhost:3000');

const useApi = (token?: string) => {
  const options = {
    baseURL: apiBaseUrl,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
  const instance = axios.create(options);

  return {
    get: instance.get,
    post: instance.post,
    put: instance.put,
    delete: instance.delete,
  };
};

export default useApi;
