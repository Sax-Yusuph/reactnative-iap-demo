import {
  InAppPurchase,
  Product,
  Subscription,
  SubscriptionPurchase,
} from 'react-native-iap';
//list of  itemIDs to be purchased to
//must have been registered on Storekit or AppleStoreConnect
export const appProductIDs = [];

//list of  itemIDs to be subcribed to
//must have been registered on Storekit or AppleStoreConnect
export const appSubscriptionIDs = [
  'com.applepaydemo.thtpro',
  'com.applepaydemo.thtplus',
];

export enum ITEM_TYPE {
  PRODUCT = 'product',
  SUBSCRIPTION = 'subscription',
}
export type Purchase = InAppPurchase | SubscriptionPurchase;

export function getItemType(item: Product | Subscription): ITEM_TYPE {
  switch (item.type) {
    case 'iap':
    case 'inapp':
      return ITEM_TYPE.PRODUCT;

    case 'sub':
    case 'subs':
      return ITEM_TYPE.PRODUCT;
  }
}

//utils
export function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}
