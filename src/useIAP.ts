import {useCallback, useEffect, useState} from 'react';
import {Alert, EmitterSubscription, Linking, Platform} from 'react-native';
import RNIap, {
  PurchaseError,
  Subscription,
  finishTransaction,
  purchaseErrorListener,
  purchaseUpdatedListener,
  Product,
  Purchase,
} from 'react-native-iap';
import {ReceiptValidationStatus} from 'react-native-iap/src/types/apple';
import {getItemType, ITEM_TYPE} from './products';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';
let purchaseUpdateSubscription: EmitterSubscription;
let purchaseErrorSubscription: EmitterSubscription;

export const CURRENT_SUBSCRIPTION_KEY = '@CURRENT_SUBSCRIPTION_KEY';

// canceling subscriptions, user has to visit either these url.
const ANDROID_URL =
  'https://play.google.com/store/account/subscriptions?package=YOUR_PACKAGE_NAME&sku=YOUR_PRODUCT_ID';
const IOS_URL = 'https://apps.apple.com/account/subscriptions';

Linking.openURL(IOS_URL);

export const useIAP = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const storage = useAsyncStorage('@CURRENT_SUBSCRIPTION_KEY');
  const [currentPlan, setCurrentPlan] = useState<string | null>('');

  useEffect(() => {
    initConnection();

    return () => {
      purchaseUpdateSubscription?.remove();
      purchaseErrorSubscription?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initConnection = async () => {
    try {
      //1. set up IAP connection service
      const connectionStatus = await RNIap.initConnection();

      //2. update local state on connection status (boolean)
      setIsConnected(connectionStatus);

      //3. setup listeners for when a purchase request is made
      purchaseUpdateSubscription = purchaseUpdatedListener(
        async (purchase: Purchase) => {
          if (Platform.OS === 'ios') {
            await proccessApplePayment(purchase);
          } else {
            //send receipt to a backend server to validate on android
            //workaround is to use IAPHub
          }

          readSubscriptionStatusFromStorage();
        },
      );

      //4. setup listeners for when there is an error in a purchase
      purchaseErrorSubscription = purchaseErrorListener(
        (error: PurchaseError) => {
          if (error.code === 'E_USER_CANCELLED') {
            Alert.alert('Purchase Cancelled');
          } else {
            Alert.alert('Error', error.message);
          }
        },
      );
    } catch (err) {
      if (err instanceof Error) {
        console.warn(err.message);
      }
    }
  };

  // used for consumables and non-consumables products
  const getProducts = async (productIDs: string[]) => {
    if (isConnected) {
      const _products = await RNIap.getProducts(productIDs);
      setProducts(_products);
    }
  };

  // used for auto-renewable and non-renewable subscriptions
  const getSubscriptions = async (itemIds: string[]) => {
    if (isConnected) {
      const _subscriptions = await RNIap.getSubscriptions(itemIds);
      setSubscriptions(_subscriptions);
    }
  };

  // onPurchase
  const onPurchase = (item: Subscription) => {
    if (getItemType(item) === ITEM_TYPE.SUBSCRIPTION) {
      // this check helps differentiate the product type from consumable and auto renewable subscriptions
      RNIap.requestSubscription(item.productId);
    } else {
      RNIap.requestPurchase(item.productId);
    }
  };

  const proccessApplePayment = useCallback(
    async (purchase: Purchase) => {
      const receiptBody = {
        'receipt-data': purchase.transactionReceipt,
        password: '******', // shared secret on AppleStoreConnect
      };

      try {
        // 1. send receipt for server validation
        const result = await RNIap.validateReceiptIos(
          receiptBody,
          true, //specify  true or false if it's a test environment or production
        );

        if (!result) {
          throw new Error('error occured');
        }

        const {
          status,
          // receipt,
          // latest_expired_receipt_info,
          // latest_receipt,
          // latest_receipt_info,
          // pending_renewal_info,
        } = result;

        //2. when receipt is successfully verified, complete transaction
        if (status === ReceiptValidationStatus.SUCCESS) {
          await finishTransaction(purchase);
          // persist receipt in asyncstorage...temporary workaround.normally when validation is successful, we attach an identifier of the product to the user in database
          storage.setItem(purchase.productId);
        }

        //3. receipt validation will only pass for sandbox and PROD mode, but fail for local StoreKit file,
        // so we need to temporarily fake the receipt validation to be true in DEV mode
        if (
          status === ReceiptValidationStatus.INVALID_RECEIPT_DATA &&
          __DEV__
        ) {
          await finishTransaction(purchase);
          // persist receipt in asyncstorage.. as a temporary workaround in DEV mode
          storage.setItem(purchase.productId);
        }
      } catch (err) {
        if (err instanceof Error) {
          console.log('error occured----', err.message);
        }
      }
    },
    [storage],
  );

  const readSubscriptionStatusFromStorage = async () => {
    const item = await storage.getItem();
    setCurrentPlan(item);
  };

  const cancelSubscription = () => {
    // inProd or sandbox mode .
    if (!__DEV__) {
      Platform.select({
        android: Linking.openURL(ANDROID_URL),
        ios: Linking.openURL(IOS_URL),
      });
    }

    // currently, to cancel subscription with inStoreKit,
    // check readme file
    //delete reference from storage
    storage.removeItem();
  };

  // const processGooglePayment= async()=>{}

  return {
    products,
    subscriptions,
    getProducts,
    getSubscriptions,
    isConnected,
    onPurchase,
    currentPlan,
    cancelSubscription,
  };
};
