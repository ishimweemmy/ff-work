import { PropsWithChildren, useMemo } from 'react';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

export function EmotionCacheProvider(props: PropsWithChildren) {
    const cache = useMemo(() => {
        return createCache({
            key: 'css-module',
            prepend: true,
            speedy: true,
        });
    }, []);

    return <CacheProvider value={ cache }>{ props.children }</CacheProvider>;
}
