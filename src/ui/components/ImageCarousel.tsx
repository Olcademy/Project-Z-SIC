import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { FlatList, Image, View, NativeScrollEvent, NativeSyntheticEvent, Dimensions, StyleProp, ImageStyle } from 'react-native';
import { prefetchImages } from '@/ui/utils/imagePrefetch';

type ImageCarouselProps = {
    images: string[];
    height?: number;
    width?: number;
    showDots?: boolean;
    imageStyle?: StyleProp<ImageStyle>;
};

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
    images,
    height = 220,
    width,
    showDots,
    imageStyle,
}) => {
    const [index, setIndex] = useState(0);
    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

    const itemWidth = useMemo(() => {
        if (typeof width === 'number' && width > 0) return width;
        return Dimensions.get('window').width - 40;
    }, [width]);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
        const nextIndex = viewableItems[0]?.index;
        if (typeof nextIndex === 'number') {
            setIndex(nextIndex);
        }
    }).current;

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const width = event.nativeEvent.layoutMeasurement.width;
        if (width > 0) {
            setIndex(Math.round(offsetX / width));
        }
    }, []);

    useEffect(() => {
        if (images.length > 1) {
            void prefetchImages(images, 40);
        }
    }, [images]);

    if (images.length === 0) {
        return null;
    }

    const shouldShowDots = typeof showDots === 'boolean' ? showDots : images.length > 1;

    return (
        <View>
            <FlatList
                data={images}
                horizontal
                pagingEnabled
                snapToInterval={itemWidth}
                keyExtractor={(item, idx) => `${item}-${idx}`}
                renderItem={({ item }) => (
                    <Image
                        source={{ uri: item }}
                        style={[
                            { height, width: itemWidth },
                            imageStyle,
                        ]}
                        resizeMode="cover"
                    />
                )}
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            />
            {shouldShowDots ? (
                <View className="flex-row justify-center mt-3">
                    {images.map((_, dotIndex) => (
                        <View
                            key={`dot-${dotIndex}`}
                            className={`h-2 w-2 rounded-full mx-1 ${dotIndex === index ? 'bg-[#FF7A00]' : 'bg-gray-300 dark:bg-gray-700'}`}
                        />
                    ))}
                </View>
            ) : null}
        </View>
    );
};
