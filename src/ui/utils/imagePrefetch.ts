import { Image } from 'react-native';

export const prefetchImages = async (
    urls: Array<string | null | undefined>,
    max = 60
): Promise<void> => {
    const unique = new Set<string>();

    for (const url of urls) {
        const trimmed = String(url || '').trim();
        if (!trimmed) continue;
        unique.add(trimmed);
        if (unique.size >= max) break;
    }

    const list = Array.from(unique);
    if (list.length === 0) return;

    await Promise.all(
        list.map((uri) => Image.prefetch(uri).catch(() => false))
    );
};
