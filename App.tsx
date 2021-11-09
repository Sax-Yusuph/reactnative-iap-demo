import React, {Dispatch, SetStateAction, useEffect, useState} from 'react';
import {
  Button,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Subscription} from 'react-native-iap';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {appSubscriptionIDs} from './src/products';
import {useIAP} from './src/useIAP';

const App = () => {
  const [selectedPlan, setSelectedPlan] = useState<Subscription | null>(null);

  const {
    subscriptions,
    onPurchase,
    getSubscriptions,
    isConnected,
    currentPlan,
    // cancelSubscription,
  } = useIAP();

  // this hook can also be moved to UseIAP hook to make it cleaner
  // helps to fetch products or subscriptions when IAP module is initialized
  useEffect(() => {
    // cancelSubscription();
    if (!subscriptions.length && isConnected) {
      getSubscriptions(appSubscriptionIDs);
    }
  }, [subscriptions, getSubscriptions, isConnected]);

  const activeSubscriptionStyles = currentPlan?.includes('thtpro')
    ? {backgroundColor: 'red'}
    : currentPlan?.includes('thtplus')
    ? {backgroundColor: 'orange'}
    : null;

  return (
    <View style={[styles.backgroundStyle, activeSubscriptionStyles]}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.backgroundStyle, activeSubscriptionStyles]}>
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              Boolean(currentPlan) && {color: Colors.white},
            ]}>
            {currentPlan?.includes('thtpro')
              ? 'THT PRO'
              : currentPlan?.includes('thtplus')
              ? 'THT Plus'
              : 'Apple Pay Demo'}
          </Text>
        </View>

        {/* PRODUCTS TO BE PURCHASED */}
        <View style={styles.content}>
          {subscriptions.map(item => (
            <ProductPlan
              key={item.productId}
              {...{item, selectedPlan, setSelectedPlan, currentPlan}}
            />
          ))}

          <Button
            title="Subscribe now"
            disabled={!selectedPlan}
            onPress={() =>
              selectedPlan ? onPurchase(selectedPlan) : undefined
            }
          />
        </View>
      </View>
    </View>
  );
};

interface IProductPlan {
  setSelectedPlan: Dispatch<SetStateAction<Subscription | null>>;
  item: Subscription;
  selectedPlan: Subscription | null;
  currentPlan: string | null;
}

const ProductPlan = ({
  setSelectedPlan,
  item,
  selectedPlan,
  currentPlan,
}: IProductPlan) => {
  const isActive = selectedPlan?.productId === item.productId;

  return (
    <TouchableOpacity
      onPress={() => setSelectedPlan(item)}
      key={item.productId}
      style={[styles.product, isActive ? styles.activeStyles : null]}>
      <View style={styles.mainOffer}>
        {/* TITLE */}
        <Text style={styles.heading}>
          {item.title}{' '}
          <Text style={styles.price}>
            ({item.localizedPrice}
            {item.subscriptionPeriodNumberIOS !== '0'
              ? '/' + item.subscriptionPeriodUnitIOS
              : null}
            )
          </Text>
        </Text>

        <Text>{item.description}</Text>
      </View>

      {item.introductoryPrice ? (
        <View
          style={[styles.additionalOffer, isActive && styles.activeBgstyles]}>
          {currentPlan === item.productId ? (
            <Text style={styles.additionalOfferText}>Subscribed</Text>
          ) : (
            <Text style={styles.additionalOfferText}>
              FIRST {item.introductoryPriceSubscriptionPeriodIOS} for{' '}
              {item.introductoryPrice}
            </Text>
          )}
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  header: {
    height: Dimensions.get('window').height / 3,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  title: {
    fontSize: 40,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  heading: {fontSize: 20, fontWeight: '500', marginBottom: 5},
  mainOffer: {padding: 10},
  product: {
    borderColor: 'rgba(0,0,0,0.2)',
    backgroundColor: 'rgba(200,200,200,0.3)',
    borderWidth: 1,
    margin: 10,
    borderRadius: 12,
    overflow: 'hidden',
    height: 105,
  },
  additionalOffer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  price: {
    color: Colors.dark,
    fontSize: 14,
  },
  additionalOfferText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  checkbox: {position: 'absolute', top: 10, right: 10},
  activeStyles: {
    borderColor: 'rgba(0,0,0,0.5)',
    borderWidth: 2,
  },
  height: {height: 30},
  backgroundStyle: {
    backgroundColor: Colors.lighter,
    flex: 1,
  },

  activeBgstyles: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export default App;
