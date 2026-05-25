import { vegImagesIndex } from '../../../../assets/vegImages/index';
import { nonVegImagesIndex } from '../../../../assets/nonVegImages/index';
import rotiImg from '../../../../assets/roti.png';
import naanImg from '../../../../assets/naan.png';

let didLogVegImagesIndex = false;

export const logVegImagesIndexOnce = () => {
    if (didLogVegImagesIndex) return;
    didLogVegImagesIndex = true;
    console.log('OG vegImagesIndex:', vegImagesIndex);
};

export const manualTiffinImages: Record<string, any[]> = {
    // Veg tiffins
    '68691dc6f9a76470f5821845': [
        vegImagesIndex.img11,
        vegImagesIndex.img41,
        vegImagesIndex.img19,
        vegImagesIndex.img3,
        vegImagesIndex.img25,
    ],
    '68691dc7f9a76470f5821873': [
        vegImagesIndex.img1,
        vegImagesIndex.img4,
        vegImagesIndex.img19,
        vegImagesIndex.img3,
        vegImagesIndex.img15,
    ],
    '68691dc7f9a76470f58218f1': [
        vegImagesIndex.img7,
        vegImagesIndex.img42,
        vegImagesIndex.img19,
        vegImagesIndex.img54,
        vegImagesIndex.img69,
    ],

    '68691dc8f9a76470f5821935': [
        vegImagesIndex.img88,
        vegImagesIndex.img3,
        vegImagesIndex.img61,
        vegImagesIndex.img32,
        vegImagesIndex.img75,
    ],

    '68691dc8f9a76470f5821967': [
        vegImagesIndex.img14,
        vegImagesIndex.img73,
        vegImagesIndex.img29,
    ],

    '68691dc8f9a76470f5821987': [
        vegImagesIndex.img55,
        vegImagesIndex.img9,
        vegImagesIndex.img80,
    ],

    '68691dc9f9a76470f5821a04': [
        vegImagesIndex.img33,
        vegImagesIndex.img66,
        vegImagesIndex.img21,
    ],

    '68691dcaf9a76470f5821af9': [
        vegImagesIndex.img12,
        vegImagesIndex.img90,
        vegImagesIndex.img47,
    ],

    '68691dcaf9a76470f5821b27': [
        vegImagesIndex.img28,
        vegImagesIndex.img51,
        vegImagesIndex.img6,
    ],

    '68691dcbf9a76470f5821bed': [
        vegImagesIndex.img84,
        vegImagesIndex.img2,
        vegImagesIndex.img59,
    ],

    '68691dcbf9a76470f5821c4e': [
        vegImagesIndex.img41,
        vegImagesIndex.img17,
        vegImagesIndex.img70,
    ],

    '68691dcbf9a76470f5821c7d': [
        vegImagesIndex.img25,
        vegImagesIndex.img63,
        vegImagesIndex.img38,
    ],

    '68691dccf9a76470f5821ce3': [
        vegImagesIndex.img11,
        vegImagesIndex.img77,
        vegImagesIndex.img49,
    ],

    '68691dccf9a76470f5821d30': [
        vegImagesIndex.img4,
        vegImagesIndex.img68,
        vegImagesIndex.img86,
    ],

    '68691dcdf9a76470f5821db0': [
        vegImagesIndex.img31,
        vegImagesIndex.img56,
        vegImagesIndex.img15,
    ],

    '68691dcdf9a76470f5821dd0': [
        vegImagesIndex.img83,
        vegImagesIndex.img20,
        vegImagesIndex.img44,
    ],

    '68691dcdf9a76470f5821e47': [
        vegImagesIndex.img1,
        vegImagesIndex.img72,
        vegImagesIndex.img37,
    ],

    '68691dcef9a76470f5821e7d': [
        vegImagesIndex.img65,
        vegImagesIndex.img10,
        vegImagesIndex.img58,
    ],

    '68691dcef9a76470f5821f26': [
        vegImagesIndex.img23,
        vegImagesIndex.img79,
        vegImagesIndex.img34,
    ],

    '68691dcff9a76470f5821f5f': [
        vegImagesIndex.img60,
        vegImagesIndex.img16,
        vegImagesIndex.img87,
    ],

    '68691dcff9a76470f582201d': [
        vegImagesIndex.img45,
        vegImagesIndex.img27,
        vegImagesIndex.img71,
    ],

    '68691dd0f9a76470f5822075': [
        vegImagesIndex.img8,
        vegImagesIndex.img52,
        vegImagesIndex.img64,
    ],

    '68691dd0f9a76470f5822095': [
        vegImagesIndex.img18,
        vegImagesIndex.img39,
        vegImagesIndex.img74,
    ],

    '68691dd0f9a76470f58220b4': [
        vegImagesIndex.img50,
        vegImagesIndex.img22,
        vegImagesIndex.img85,
    ],

    '68691dd1f9a76470f582215f': [
        vegImagesIndex.img62,
        vegImagesIndex.img30,
        vegImagesIndex.img43,
    ],

    '68691dd1f9a76470f5822198': [
        vegImagesIndex.img13,
        vegImagesIndex.img81,
        vegImagesIndex.img5,
    ],

    '68691dd1f9a76470f58221b4': [
        vegImagesIndex.img67,
        vegImagesIndex.img24,
        vegImagesIndex.img48,
    ],

    '68691dd1f9a76470f58221ce': [
        vegImagesIndex.img76,
        vegImagesIndex.img40,
        vegImagesIndex.img53,
    ],

    '68691dd2f9a76470f58222b8': [
        vegImagesIndex.img35,
        vegImagesIndex.img89,
        vegImagesIndex.img26,
    ],

    '68691dd2f9a76470f58222d2': [
        vegImagesIndex.img32,
        vegImagesIndex.img75,
        vegImagesIndex.img57,
    ],

    '68691dd2f9a76470f58222ec': [
        vegImagesIndex.img78,
        vegImagesIndex.img36,
        vegImagesIndex.img82,
    ],

    '68691dd2f9a76470f5822320': [
        vegImagesIndex.img54,
        vegImagesIndex.img69,
        vegImagesIndex.img3,
    ],

    '68691dd2f9a76470f582237c': [
        vegImagesIndex.img46,
        vegImagesIndex.img14,
        vegImagesIndex.img88,
    ],

    '68691dd2f9a76470f5822393': [
        vegImagesIndex.img29,
        vegImagesIndex.img61,
        vegImagesIndex.img12,
    ],

    '68795deca4f9069b982e9a62': [
        vegImagesIndex.img7,
        vegImagesIndex.img33,
        vegImagesIndex.img80,
    ],

    '68ab6bb43df16af258c0ac5a': [
        vegImagesIndex.img21,
        vegImagesIndex.img66,
        vegImagesIndex.img17,
    ],

    '68ab6c083df16af258c0ac84': [
        vegImagesIndex.img42,
        vegImagesIndex.img58,
        vegImagesIndex.img90,
    ],

    '68b16f7e17308966a6f844e5': [
        vegImagesIndex.img11,
        vegImagesIndex.img73,
        vegImagesIndex.img28,
    ],

    '68b16f8b17308966a6f844ed': [
        vegImagesIndex.img5,
        vegImagesIndex.img64,
        vegImagesIndex.img19,
    ],

    '68b3ea72327c68ded6fea76a': [
        vegImagesIndex.img77,
        vegImagesIndex.img31,
        vegImagesIndex.img60,
    ],

    '68b3eaa7327c68ded6fea77b': [
        vegImagesIndex.img9,
        vegImagesIndex.img45,
        vegImagesIndex.img83,
    ],

    '690b777c18ac8d93de4e1df5': [
        vegImagesIndex.img14,
        vegImagesIndex.img52,
        vegImagesIndex.img68,
    ],

    '69183c4f955a8477c1d951fe': [
        vegImagesIndex.img23,
        vegImagesIndex.img41,
        vegImagesIndex.img87,
    ],

    '69183e30955a8477c1d95255': [
        vegImagesIndex.img2,
        vegImagesIndex.img56,
        vegImagesIndex.img74,
    ],

    '69183f01955a8477c1d9528b': [
        vegImagesIndex.img12,
        vegImagesIndex.img38,
        vegImagesIndex.img61,
    ],

    '69183f55955a8477c1d9529d': [
        vegImagesIndex.img25,
        vegImagesIndex.img49,
        vegImagesIndex.img80,
    ],

    '69183f77955a8477c1d952af': [
        vegImagesIndex.img6,
        vegImagesIndex.img70,
        vegImagesIndex.img84,
    ],

    '691875502f377e01f3241102': [
        vegImagesIndex.img18,
        vegImagesIndex.img33,
        vegImagesIndex.img59,
    ],

    '691876652f377e01f324113e': [
        vegImagesIndex.img1,
        vegImagesIndex.img44,
        vegImagesIndex.img72,
    ],

    '691876732f377e01f3241147': [
        vegImagesIndex.img29,
        vegImagesIndex.img63,
        vegImagesIndex.img86,
    ],

    '691876ad2f377e01f324115c': [
        vegImagesIndex.img10,
        vegImagesIndex.img53,
        vegImagesIndex.img78,
    ],

    '6918783f2f377e01f32411ae': [
        vegImagesIndex.img15,
        vegImagesIndex.img36,
        vegImagesIndex.img67,
    ],

    '69187a5c2f377e01f324120b': [
        vegImagesIndex.img22,
        vegImagesIndex.img47,
        vegImagesIndex.img81,
    ],

    '6919633d237ea116ffc957c7': [
        vegImagesIndex.img3,
        vegImagesIndex.img55,
        vegImagesIndex.img90,
    ],

    '69196434237ea116ffc957f6': [
        vegImagesIndex.img13,
        vegImagesIndex.img48,
        vegImagesIndex.img71,
    ],

    '6919693b237ea116ffc959ed': [
        vegImagesIndex.img24,
        vegImagesIndex.img62,
        vegImagesIndex.img85,
    ],

    '69199c51dd8d2012c07dcd3f': [
        vegImagesIndex.img30,
        vegImagesIndex.img58,
        vegImagesIndex.img76,
    ],

    '69199cafdd8d2012c07dcd9a': [
        vegImagesIndex.img8,
        vegImagesIndex.img39,
        vegImagesIndex.img66,
    ],

    '6919d0e13928befa9f7efc58': [
        vegImagesIndex.img17,
        vegImagesIndex.img52,
        vegImagesIndex.img73,
    ],

    '6919e6eaff26a66643d6ae89': [
        vegImagesIndex.img27,
        vegImagesIndex.img64,
        vegImagesIndex.img88,
    ],

    '6919e96eff26a66643d6aef8': [
        vegImagesIndex.img5,
        vegImagesIndex.img41,
        vegImagesIndex.img69,
    ],

    '691b26c91267895586ba0671': [
        vegImagesIndex.img11,
        vegImagesIndex.img46,
        vegImagesIndex.img82,
    ],

    '691b27091267895586ba0682': [
        vegImagesIndex.img20,
        vegImagesIndex.img57,
        vegImagesIndex.img75,
    ],

    '691dd87f357f93c543d3130d': [
        vegImagesIndex.img14,
        vegImagesIndex.img60,
        vegImagesIndex.img83,
    ],

    '691dd8d5357f93c543d31331': [
        vegImagesIndex.img7,
        vegImagesIndex.img34,
        vegImagesIndex.img79,
    ],

    '6925c533b578ecbc5feb3711': [
        vegImagesIndex.img2,
        vegImagesIndex.img50,
        vegImagesIndex.img68,
    ],

    '695293c27495f56bcbe3a3f4': [
        vegImagesIndex.img16,
        vegImagesIndex.img43,
        vegImagesIndex.img87,
    ],

    '695bcea71be59ef4def21cd8': [
        vegImagesIndex.img28,
        vegImagesIndex.img65,
        vegImagesIndex.img90,
    ],

    'manual-1': [
        vegImagesIndex.img19,
        vegImagesIndex.img37,
        vegImagesIndex.img81,
    ],

    //nonveg tiffins

    '68691dc7f9a76470f5821898': [
        nonVegImagesIndex.imgnv17,
        nonVegImagesIndex.imgnv3,
        nonVegImagesIndex.imgnv91,
        nonVegImagesIndex.imgnv42,
    ],

    '68691dc7f9a76470f58218ca': [
        nonVegImagesIndex.imgnv8,
        nonVegImagesIndex.imgnv55,
        nonVegImagesIndex.imgnv12,
        nonVegImagesIndex.imgnv73,
    ],

    '68691dc9f9a76470f58219c9': [
        nonVegImagesIndex.imgnv29,
        nonVegImagesIndex.imgnv64,
        nonVegImagesIndex.imgnv6,
        nonVegImagesIndex.imgnv88,
    ],

    '68691dc9f9a76470f5821a32': [
        nonVegImagesIndex.imgnv14,
        nonVegImagesIndex.imgnv47,
        nonVegImagesIndex.imgnv33,
        nonVegImagesIndex.imgnv2,
    ],

    '68691dc9f9a76470f5821a7c': [
        nonVegImagesIndex.imgnv70,
        nonVegImagesIndex.imgnv9,
        nonVegImagesIndex.imgnv81,
        nonVegImagesIndex.imgnv25,
    ],

    '68691dc9f9a76470f5821abc': [
        nonVegImagesIndex.imgnv60,
        nonVegImagesIndex.imgnv18,
        nonVegImagesIndex.imgnv92,
        nonVegImagesIndex.imgnv41,
    ],

    '68691dcaf9a76470f5821b40': [
        nonVegImagesIndex.imgnv11,
        nonVegImagesIndex.imgnv76,
        nonVegImagesIndex.imgnv38,
        nonVegImagesIndex.imgnv57,
    ],

    '68691dcaf9a76470f5821b60': [
        nonVegImagesIndex.imgnv22,
        nonVegImagesIndex.imgnv85,
        nonVegImagesIndex.imgnv4,
        nonVegImagesIndex.imgnv66,
    ],

    '68691dcbf9a76470f5821baa': [
        nonVegImagesIndex.imgnv31,
        nonVegImagesIndex.imgnv93,
        nonVegImagesIndex.imgnv15,
        nonVegImagesIndex.imgnv49,
    ],

    '68691dcbf9a76470f5821c19': [
        nonVegImagesIndex.imgnv58,
        nonVegImagesIndex.imgnv7,
        nonVegImagesIndex.imgnv90,
        nonVegImagesIndex.imgnv26,
    ],

    '68691dcbf9a76470f5821c9b': [
        nonVegImagesIndex.imgnv44,
        nonVegImagesIndex.imgnv13,
        nonVegImagesIndex.imgnv79,
        nonVegImagesIndex.imgnv34,
    ],

    '68691dccf9a76470f5821cc4': [
        nonVegImagesIndex.imgnv20,
        nonVegImagesIndex.imgnv61,
        nonVegImagesIndex.imgnv5,
        nonVegImagesIndex.imgnv87,
    ],

    '68691dccf9a76470f5821d0e': [
        nonVegImagesIndex.imgnv95,
        nonVegImagesIndex.imgnv27,
        nonVegImagesIndex.imgnv10,
        nonVegImagesIndex.imgnv52,
    ],

    '68691dccf9a76470f5821d62': [
        nonVegImagesIndex.imgnv36,
        nonVegImagesIndex.imgnv84,
        nonVegImagesIndex.imgnv21,
        nonVegImagesIndex.imgnv67,
    ],

    '68691dccf9a76470f5821d84': [
        nonVegImagesIndex.imgnv43,
        nonVegImagesIndex.imgnv99,
        nonVegImagesIndex.imgnv16,
        nonVegImagesIndex.imgnv71,
    ],

    '68691dcdf9a76470f5821df4': [
        nonVegImagesIndex.imgnv1,
        nonVegImagesIndex.imgnv78,
        nonVegImagesIndex.imgnv35,
        nonVegImagesIndex.imgnv62,
    ],

    '68691dcdf9a76470f5821e2c': [
        nonVegImagesIndex.imgnv48,
        nonVegImagesIndex.imgnv23,
        nonVegImagesIndex.imgnv96,
        nonVegImagesIndex.imgnv19,
    ],

    '68691dcef9a76470f5821e9c': [
        nonVegImagesIndex.imgnv32,
        nonVegImagesIndex.imgnv74,
        nonVegImagesIndex.imgnv56,
        nonVegImagesIndex.imgnv11,
    ],

    '68691dcef9a76470f5821ec6': [
        nonVegImagesIndex.imgnv83,
        nonVegImagesIndex.imgnv28,
        nonVegImagesIndex.imgnv45,
        nonVegImagesIndex.imgnv65,
    ],

    '68691dcef9a76470f5821ee6': [
        nonVegImagesIndex.imgnv94,
        nonVegImagesIndex.imgnv37,
        nonVegImagesIndex.imgnv50,
        nonVegImagesIndex.imgnv14,
    ],

    '68691dcef9a76470f5821f06': [
        nonVegImagesIndex.imgnv80,
        nonVegImagesIndex.imgnv24,
        nonVegImagesIndex.imgnv68,
        nonVegImagesIndex.imgnv3,
    ],

    '68691dcff9a76470f5821f42': [
        nonVegImagesIndex.imgnv72,
        nonVegImagesIndex.imgnv97,
        nonVegImagesIndex.imgnv40,
        nonVegImagesIndex.imgnv6,
    ],

    '68691dcff9a76470f5821f97': [
        nonVegImagesIndex.imgnv53,
        nonVegImagesIndex.imgnv82,
        nonVegImagesIndex.imgnv30,
        nonVegImagesIndex.imgnv98,
    ],

    '68691dcff9a76470f5821fc4': [
        nonVegImagesIndex.imgnv9,
        nonVegImagesIndex.imgnv63,
        nonVegImagesIndex.imgnv75,
        nonVegImagesIndex.imgnv17,
    ],

    '68691dcff9a76470f5821ff1': [
        nonVegImagesIndex.imgnv46,
        nonVegImagesIndex.imgnv86,
        nonVegImagesIndex.imgnv25,
        nonVegImagesIndex.imgnv12,
    ],

    '68691dcff9a76470f5822035': [
        nonVegImagesIndex.imgnv77,
        nonVegImagesIndex.imgnv39,
        nonVegImagesIndex.imgnv51,
        nonVegImagesIndex.imgnv2,
    ],

    '68691dd0f9a76470f582205e': [
        nonVegImagesIndex.imgnv69,
        nonVegImagesIndex.imgnv100,
        nonVegImagesIndex.imgnv20,
        nonVegImagesIndex.imgnv41,
    ],

    '68691dd0f9a76470f58220d0': [
        nonVegImagesIndex.imgnv33,
        nonVegImagesIndex.imgnv59,
        nonVegImagesIndex.imgnv89,
        nonVegImagesIndex.imgnv7,
    ],

    '68691dd1f9a76470f58220f7': [
        nonVegImagesIndex.imgnv18,
        nonVegImagesIndex.imgnv92,
        nonVegImagesIndex.imgnv44,
        nonVegImagesIndex.imgnv60,
    ],

    '68691dd1f9a76470f582211d': [
        nonVegImagesIndex.imgnv26,
        nonVegImagesIndex.imgnv73,
        nonVegImagesIndex.imgnv5,
        nonVegImagesIndex.imgnv81,
    ],

    '68691dd1f9a76470f582213c': [
        nonVegImagesIndex.imgnv35,
        nonVegImagesIndex.imgnv11,
        nonVegImagesIndex.imgnv96,
        nonVegImagesIndex.imgnv22,
    ],

    '68691dd1f9a76470f582217c': [
        nonVegImagesIndex.imgnv66,
        nonVegImagesIndex.imgnv14,
        nonVegImagesIndex.imgnv58,
        nonVegImagesIndex.imgnv83,
    ],

    '68691dd1f9a76470f58221e8': [
        nonVegImagesIndex.imgnv93,
        nonVegImagesIndex.imgnv31,
        nonVegImagesIndex.imgnv47,
        nonVegImagesIndex.imgnv8,
    ],

    '68691dd1f9a76470f5822202': [
        nonVegImagesIndex.imgnv70,
        nonVegImagesIndex.imgnv27,
        nonVegImagesIndex.imgnv54,
        nonVegImagesIndex.imgnv19,
    ],

    '68691dd1f9a76470f582221c': [
        nonVegImagesIndex.imgnv85,
        nonVegImagesIndex.imgnv3,
        nonVegImagesIndex.imgnv62,
        nonVegImagesIndex.imgnv90,
    ],

    '68691dd1f9a76470f5822236': [
        nonVegImagesIndex.imgnv42,
        nonVegImagesIndex.imgnv75,
        nonVegImagesIndex.imgnv16,
        nonVegImagesIndex.imgnv98,
    ],

    'nv-1': [
        nonVegImagesIndex.imgnv1,
        nonVegImagesIndex.imgnv2,
        nonVegImagesIndex.imgnv3,
        nonVegImagesIndex.imgnv4,
        nonVegImagesIndex.imgnv5,
    ],
    '68691dc7f9a76470f5823001': [
        nonVegImagesIndex.imgnv5,
        nonVegImagesIndex.imgnv6,
        nonVegImagesIndex.imgnv7,
        nonVegImagesIndex.imgnv8,
        nonVegImagesIndex.imgnv9,
    ],
    'nv-3': [
        nonVegImagesIndex.imgnv10,
        nonVegImagesIndex.imgnv11,
        nonVegImagesIndex.imgnv12,
        nonVegImagesIndex.imgnv13,
        nonVegImagesIndex.imgnv14,
    ],
    'nv-4': [
        nonVegImagesIndex.imgnv14,
        nonVegImagesIndex.imgnv15,
        nonVegImagesIndex.imgnv16,
        nonVegImagesIndex.imgnv17,
    ],
    'nv-5': [
        nonVegImagesIndex.imgnv18,
        nonVegImagesIndex.imgnv19,
        nonVegImagesIndex.imgnv20,
        nonVegImagesIndex.imgnv33,
        nonVegImagesIndex.imgnv34,
    ],
    'nv-6': [
        nonVegImagesIndex.imgnv21,
        nonVegImagesIndex.imgnv22,
        nonVegImagesIndex.imgnv23,
        nonVegImagesIndex.imgnv24,
        nonVegImagesIndex.imgnv25,
    ],
    'nv-7': [
        nonVegImagesIndex.imgnv24,
        nonVegImagesIndex.imgnv25,
        nonVegImagesIndex.imgnv26,
        nonVegImagesIndex.imgnv27,
        nonVegImagesIndex.imgnv28,
    ],
    'nv-8': [
        nonVegImagesIndex.imgnv27,
        nonVegImagesIndex.imgnv28,
        nonVegImagesIndex.imgnv29,
        nonVegImagesIndex.imgnv30,
        nonVegImagesIndex.imgnv31,

    ],
    'nv-9': [
        nonVegImagesIndex.imgnv31,
        nonVegImagesIndex.imgnv32,
        nonVegImagesIndex.imgnv33,
        nonVegImagesIndex.imgnv34,
        nonVegImagesIndex.imgnv35,
    ],
    'nv-10': [
        nonVegImagesIndex.imgnv35,
        nonVegImagesIndex.imgnv36,
        nonVegImagesIndex.imgnv37,
        nonVegImagesIndex.imgnv38,
        nonVegImagesIndex.imgnv39,
    ],
    'nv-11': [
        nonVegImagesIndex.imgnv38,
        nonVegImagesIndex.imgnv39,
        nonVegImagesIndex.imgnv40,
        nonVegImagesIndex.imgnv41,
        nonVegImagesIndex.imgnv42,
    ],
    'nv-12': [
        nonVegImagesIndex.imgnv43,
        nonVegImagesIndex.imgnv44,
        nonVegImagesIndex.imgnv45,
        nonVegImagesIndex.imgnv46,
        nonVegImagesIndex.imgnv47,
    ],
    'nv-13': [
        nonVegImagesIndex.imgnv47,
        nonVegImagesIndex.imgnv48,
        nonVegImagesIndex.imgnv49,
        nonVegImagesIndex.imgnv50,
        nonVegImagesIndex.imgnv51,
    ],
    'nv-14': [
        nonVegImagesIndex.imgnv51,
        nonVegImagesIndex.imgnv52,
        nonVegImagesIndex.imgnv53,
        nonVegImagesIndex.imgnv54,
        nonVegImagesIndex.imgnv55,
    ],
    'nv-15': [
        nonVegImagesIndex.imgnv56,
        nonVegImagesIndex.imgnv57,
        nonVegImagesIndex.imgnv58,
        nonVegImagesIndex.imgnv59,
        nonVegImagesIndex.imgnv60,
    ],
    
};
