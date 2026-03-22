import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Image, View, NativeScrollEvent, NativeSyntheticEvent, Dimensions } from 'react-native';

type ImageCarouselProps = {
    images: string[];
    height?: number;
};

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, height = 220 }) => {
    const [index, setIndex] = useState(0);
    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;
    const cardWidth = Dimensions.get('window').width - 40;

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

    if (images.length === 0) {
        return null;
    }

    return (
        <View>
            <FlatList
                data={images}
                horizontal
                pagingEnabled
                snapToInterval={cardWidth}
                keyExtractor={(item, idx) => `${item}-${idx}`}
                renderItem={({ item }) => (
                    <Image source={{ uri: item }} className="rounded-3xl" style={{ height, width: cardWidth }} />
                )}
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            />
            <View className="flex-row justify-center mt-3">
                {images.map((_, dotIndex) => (
                    <View
                        key={`dot-${dotIndex}`}
                        className={`h-2 w-2 rounded-full mx-1 ${dotIndex === index ? 'bg-[#02757A]' : 'bg-gray-300 dark:bg-gray-700'}`}
                    />
                ))}
            </View>
        </View>
    );
};
