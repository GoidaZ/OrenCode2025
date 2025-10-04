export async function useApiFetch<T>(path: string, options: any = {}) {
    const { settings } = await useSettings();
    const base = settings.value.api_base || '';

    return await useFetch<T>(`${base}${path}`, {
        ...options,
    });
}