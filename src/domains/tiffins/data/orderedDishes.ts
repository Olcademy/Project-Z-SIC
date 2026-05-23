import roti from '../../../../assets/roti.jpg';
import naan from '../../../../assets/naan.jpg';
import garlicNaan from '../../../../assets/garlicNaan.jpg';
import alooParatha from '../../../../assets/alooParatha.jpg';
import bhindiMasala from '../../../../assets/bhindiMasala.jpg';
import choleBhature from '../../../../assets/choleBhature.jpg';
import dalTadka from '../../../../assets/dalTadka.jpg';
import jeeraRice from '../../../../assets/jeeraRice.jpg';
import kadhiPakora from '../../../../assets/kadhaiPakora.jpg';
import mixVeg from '../../../../assets/mixVegCurry.jpg';
import paneerButterMasala from '../../../../assets/paneerButterMasala.jpg';
import rajmaChawal from '../../../../assets/rajmaChawal.jpg';
import shahiPaneer from '../../../../assets/shahiPaneer.jpg';
import vegBiryani from '../../../../assets/vegBiryani.jpg';
import vegKofta from '../../../../assets/vegKoftaCurry.jpg';
import jeeraAloo from '../../../../assets/jeeraAloo.jpg';

import chickenTikka from '../../../../assets/chickenTikka.jpg';
import butterChicken from '../../../../assets/butterChicken.jpg';
import chickenBiryani from '../../../../assets/chickenBiriyani.jpg';
import muttonCurry from '../../../../assets/muttonCurry.jpg';
import eggRice from '../../../../assets/eggRice.jpg';
import chickenCurry from '../../../../assets/chickenCurry.jpg';
import chickenRoll from '../../../../assets/chickenRoll.jpg';
import prawnMasala from '../../../../assets/prawnMasala.jpg';
import eggCurry from '../../../../assets/eggCurry.jpg';
import chickenFriedRice from '../../../../assets/chickenFriedRice.jpg';
import chickenNaan from '../../../../assets/chickenNaan.jpg';
import fishCurry from '../../../../assets/fishCurry.jpg';
import chicken65 from '../../../../assets/chicken65.jpg';
import kebabPlatter from '../../../../assets/kebabPlatter.jpg';
import muttonBiryani from '../../../../assets/muttonBiriyani.jpg';


import { Dish } from '@/domains/tiffins/types';
import { nonVegImagesIndex } from 'assets/nonVegImages';

export const orderedDishes: Record<string, Dish> = {
    roti: {
        key: 'roti',
        title: 'roti',
        subtitle: 'Whole wheat · fresh & soft',
        description: 'Classic whole-wheat roti made fresh.',
        price: 12,
        rating: 4.6,
        veg: true,
        image: roti,
    },
    naan: {
        key: 'naan',
        title: 'naan',
        subtitle: 'Tandoori naan · buttery finish',
        description: 'Soft tandoori naan brushed with butter. A great pairing with rich non-veg curries.',
        price: 28,
        rating: 4.3,
        veg: false,
        image: naan,
    },
    alooParatha: {
        key: 'alooParatha',
        title: 'Aloo Paratha',
        subtitle: 'Stuffed · North Indian style',
        description: 'Whole wheat paratha stuffed with spiced mashed potatoes, served hot with curd or pickle.',
        price: 35,
        rating: 4.7,
        veg: true,
        image: alooParatha,
    },

    paneerButterMasala: {
        key: 'paneerButterMasala',
        title: 'Paneer Butter Masala',
        subtitle: 'Creamy · rich gravy',
        description: 'Soft paneer cubes cooked in a rich, creamy tomato-butter gravy.',
        price: 140,
        rating: 4.7,
        veg: true,
        image: paneerButterMasala,
    },

    jeeraRice: {
        key: 'jeeraRice',
        title: 'Jeera Rice',
        subtitle: 'Fragrant · cumin flavored',
        description: 'Basmati rice tempered with cumin seeds and mild spices.',
        price: 80,
        rating: 4.5,
        veg: true,
        image: jeeraRice,
    },

    garlicNaan: {
        key: 'garlicNaan',
        title: 'Garlic Naan',
        subtitle: 'Buttery · garlic infused',
        description: 'Soft naan topped with garlic and butter, baked in a tandoor.',
        price: 30,
        rating: 4.6,
        veg: true,
        image: garlicNaan,
    },

    dalTadka: {
        key: 'dalTadka',
        title: 'Dal Tadka',
        subtitle: 'Comfort food · lentils',
        description: 'Yellow lentils tempered with garlic, cumin, and spices.',
        price: 90,
        rating: 4.5,
        veg: true,
        image: dalTadka,
    },

    vegBiryani: {
        key: 'vegBiryani',
        title: 'Veg Biryani',
        subtitle: 'Fragrant · spiced rice',
        description: 'Aromatic basmati rice cooked with mixed vegetables and spices.',
        price: 120,
        rating: 4.6,
        veg: true,
        image: vegBiryani,
    },

    mixVeg: {
        key: 'mixVeg',
        title: 'Mixed Vegetable Curry',
        subtitle: 'Healthy · home-style',
        description: 'Fresh seasonal vegetables cooked in a lightly spiced gravy.',
        price: 110,
        rating: 4.4,
        veg: true,
        image: mixVeg,
    },

    choleBhature: {
        key: 'choleBhature',
        title: 'Chole Bhature',
        subtitle: 'Spicy · North Indian classic',
        description: 'Spiced chickpea curry served with fluffy fried bhature.',
        price: 100,
        rating: 4.6,
        veg: true,
        image: choleBhature,
    },
    kadhiPakora: {
        key: 'kadhiPakora',
        title: 'Kadhi Pakora',
        subtitle: 'Tangy · yogurt curry',
        description: 'Traditional North Indian kadhi with soft besan pakoras in a tangy yogurt gravy.',
        price: 95,
        rating: 4.5,
        veg: true,
        image: kadhiPakora,
    },

    shahiPaneer: {
        key: 'shahiPaneer',
        title: 'Shahi Paneer',
        subtitle: 'Rich · creamy gravy',
        description: 'Paneer cubes cooked in a mildly sweet, rich cashew-based gravy.',
        price: 150,
        rating: 4.8,
        veg: true,
        image: shahiPaneer,
    },

    bhindiMasala: {
        key: 'bhindiMasala',
        title: 'Bhindi Masala',
        subtitle: 'Dry · spiced okra',
        description: 'Stir-fried okra cooked with onions, tomatoes, and spices.',
        price: 85,
        rating: 4.4,
        veg: true,
        image: bhindiMasala,
    },

    rajmaChawal: {
        key: 'rajmaChawal',
        title: 'Rajma Chawal',
        subtitle: 'Comfort · kidney beans',
        description: 'Slow-cooked kidney beans in a thick gravy served with steamed rice.',
        price: 110,
        rating: 4.7,
        veg: true,
        image: rajmaChawal,
    },

    vegKofta: {
        key: 'vegKofta',
        title: 'Veg Kofta Curry',
        subtitle: 'Soft dumplings · rich gravy',
        description: 'Vegetable dumplings served in a creamy tomato-based gravy.',
        price: 130,
        rating: 4.6,
        veg: true,
        image: vegKofta,
    },

    jeeraAloo: {
        key: 'jeeraAloo',
        title: 'Jeera Aloo',
        subtitle: 'Simple · comforting',
        description: 'Boiled potatoes sautéed with cumin seeds and spices.',
        price: 70,
        rating: 4.3,
        veg: true,
        image: jeeraAloo,
    },
    //nonveg dishes

    chickenTikka: {
        key: 'chickenTikka',
        title: 'Chicken Tikka',
        subtitle: 'Smoky · grilled',
        description: 'Tandoor chicken.',
        price: 160,
        rating: 4.7,
        veg: false,
        image: chickenTikka,
    },

    butterChicken: {
        key: 'butterChicken',
        title: 'Butter Chicken',
        subtitle: 'Creamy · rich',
        description: 'Chicken in butter gravy.',
        price: 180,
        rating: 4.8,
        veg: false,
        image: butterChicken,
    },

    chickenBiryani: {
        key: 'chickenBiryani',
        title: 'Chicken Biryani',
        subtitle: 'Fragrant · spicy',
        description: 'Chicken layered biryani.',
        price: 170,
        rating: 4.8,
        veg: false,
        image: chickenBiryani,
    },

    muttonCurry: {
        key: 'muttonCurry',
        title: 'Mutton Curry',
        subtitle: 'Rich · slow cooked',
        description: 'Slow cooked mutton.',
        price: 220,
        rating: 4.7,
        veg: false,
        image: muttonCurry,
    },

    eggRice: {
        key: 'eggRice',
        title: 'Egg Fried Rice',
        subtitle: 'Quick · street style',
        description: 'Egg fried rice.',
        price: 110,
        rating: 4.5,
        veg: false,
        image: eggRice,
    },

    chickenCurry: {
        key: 'chickenCurry',
        title: 'Chicken Curry',
        subtitle: 'Homestyle',
        description: 'Traditional chicken curry.',
        price: 150,
        rating: 4.6,
        veg: false,
        image: chickenCurry,
    },

    chickenRoll: {
        key: 'chickenRoll',
        title: 'Chicken Roll',
        subtitle: 'Street style wrap',
        description: 'Chicken wrapped in paratha.',
        price: 120,
        rating: 4.5,
        veg: false,
        image: chickenRoll,
    },

    prawnMasala: {
        key: 'prawnMasala',
        title: 'Prawn Masala',
        subtitle: 'Coastal · spicy',
        description: 'Spicy prawn curry.',
        price: 200,
        rating: 4.7,
        veg: false,
        image: prawnMasala,
    },

    eggCurry: {
        key: 'eggCurry',
        title: 'Egg Curry',
        subtitle: 'Protein rich',
        description: 'Eggs in spicy gravy.',
        price: 100,
        rating: 4.4,
        veg: false,
        image: eggCurry,
    },

    chickenFriedRice: {
        key: 'chickenFriedRice',
        title: 'Chicken Fried Rice',
        subtitle: 'Wok tossed',
        description: 'Chicken rice mix.',
        price: 130,
        rating: 4.6,
        veg: false,
        image: chickenFriedRice,
    },

    chickenNaan: {
        key: 'chickenNaan',
        title: 'Chicken Naan',
        subtitle: 'Stuffed · juicy',
        description: 'Chicken stuffed naan.',
        price: 140,
        rating: 4.6,
        veg: false,
        image: chickenNaan,
    },

    fishCurry: {
        key: 'fishCurry',
        title: 'Fish Curry',
        subtitle: 'Coastal style',
        description: 'Spicy fish curry.',
        price: 190,
        rating: 4.6,
        veg: false,
        image: fishCurry,
    },

    chicken65: {
        key: 'chicken65',
        title: 'Chicken 65',
        subtitle: 'Spicy · crispy',
        description: 'Deep fried spicy chicken.',
        price: 160,
        rating: 4.7,
        veg: false,
        image: chicken65,
    },

    kebabPlatter: {
        key: 'kebabPlatter',
        title: 'Kebab Platter',
        subtitle: 'Mixed grill',
        description: 'Assorted kebabs.',
        price: 250,
        rating: 4.8,
        veg: false,
        image: kebabPlatter,
    },

    muttonBiryani: {
        key: 'muttonBiryani',
        title: 'Mutton Biryani',
        subtitle: 'Royal · rich',
        description: 'Mutton layered biryani.',
        price: 240,
        rating: 4.8,
        veg: false,
        image: muttonBiryani,
    },
};