/*
 * 環境変数を取得するカスタムフック
 * @param key 環境変数のキー VITE_は省略することができます
 * @param defaultValue 環境変数が存在しない場合のデフォルト値
 * @return 環境変数の値またはデフォルト値
 */
const useEnv = (key: string, defaultValue: string = ''): string => {
  const envKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
  return import.meta.env[envKey] ?? defaultValue;
}

export default useEnv;
