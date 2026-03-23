export const ENDPOINTS = {
    config: '/api/config',
    search: '/search',
    takeaway: {
        list: '/firm/getnearbyrest',
        detail: (id: string) => `/firm/getOne/${id}`,
        menuSections: (id: string) => `/firm/restaurants/menu-sections-items/${id}`,
        recentlyViewed: {
            list: '/firm/getrecently-viewed',
            track: (id: string) => `/firm/recently-viewed/${id}`,
        },
        favorites: {
            add: (id: string) => `/firm/fav/${id}`,
            remove: (id: string) => `/firm/favRemove/${id}`,
            check: (id: string) => `/firm/favCheck/${id}`,
            like: (id: string) => `/firm/users/${id}/liked`,
            list: '/firm/user/liked-restaurants',
            isLike: (id: string) => `/firm/user/${id}/islike`,
        },
        orders: {
            list: '/api/orders/menu/user',
            create: '/api/create',
            favoriteList: '/api/orderFav',
            toggleFavorite: (id: string) => `/api/orderFav/${id}`,
        },
        offers: {
            apply: '/api/offers/takeaway/cart/apply-offers',
        },
        notifications: {
            list: '/api/getnotifications',
            update: '/api/postNotificationsInfo',
        },
    },
    tiffins: {
        list: '/api/tiffin',
        openNow: '/api/tiffin/tiffins/open-now',
        highRated: '/api/tiffin/tiffins/high-rated',
        detail: (id: string) => `/api/tiffin/${id}`,
        offers: (id: string) => `/api/tiffin/offers/${id}`,
        favorites: '/api/tiffins/liked',
        favoriteOrders: '/api/orderFav',
        toggleOrderFavorite: (id: string) => `/api/orderFav/${id}`,
        recentlyViewed: '/firm/getrecently-viewed',
        trackRecentlyViewed: (id: string) => `/firm/recently-viewed/${id}`,
    },
    events: {
        list: '/api/events',
        detail: (id: string) => `/api/events/${id}`,
        featured: '/api/events/featured',
        search: '/api/events/search',
    },
    restaurants: {
        list: '/firm/getnearbyrest',
        detail: (id: string) => `/firm/getOne/${id}`,
    },
};
