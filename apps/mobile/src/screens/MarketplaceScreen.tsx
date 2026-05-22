import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';

interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  image: string;
  location: string;
}

export default function MobileMarketplaceScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchListings() {
      setLoading(true);
      
      const candidates = [
        'http://localhost:3000/api/listings',
        'http://10.0.2.2:3000/api/listings'
      ];

      let fetchedData: Listing[] | null = null;

      for (const url of candidates) {
        try {
          console.log(`Attempting to fetch mobile listings from: ${url}`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              fetchedData = data.map((item: any) => ({
                id: item.id,
                title: item.title,
                price: item.price,
                description: item.description,
                image: Array.isArray(item.images) && item.images.length > 0 
                  ? item.images[0] 
                  : 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1200',
                location: item.location || 'Local'
              }));
              console.log(`Successfully fetched listings from ${url}`);
              break;
            }
          }
        } catch (err) {
          console.log(`Failed to fetch from ${url}:`, err);
        }
      }

      if (!active) return;

      if (fetchedData) {
        setListings(fetchedData);
      } else {
        console.log('Using simulated offline fallback listings.');
        setListings([
          {
            id: '1',
            title: 'Porsche 911 Carrera S',
            price: 114900,
            description: '12,400 miles, immaculate condition, single owner.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAqsSCSMYnw9O-79PL71UWyoAfEV9RMemPJ7B5Z9Z_d9IccfWO5fjksvb51iaFRWLQEsljXGX63OgdAlqsXMcCj2LrQJvuC-ovGG14cISik8KOb_o7TxW--t98sl8iHCM_AiO4EEEEIAePwGITv5Rt1a0SwpprWh_DPN7JeBjTgz74KyKw8jFUBD5zVN_ivKUiNBJxuulz3turHY9hBgFBQ_6c28CZcmbyKQbh0vmJDu-uiuiBjfx1X4ciMDBvagFnVJwqy32vaPo',
            location: 'New York, NY'
          },
          {
            id: '2',
            title: 'BMW M4 Competition',
            price: 78500,
            description: 'Matte white exterior, Carbon fiber package. Brand new tires.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDy11pSSycveszZZS6UcuRZRtXTy2xXbTpDOi5CMddiU8MmLk3Sa9jUq7ShvTsXi2bJcRYPV2KxUijLsIIUCuE3Vrem7wgMxZ8MbSKbdI--tJy7suRvY06PSf9n7_Ekf9nHzDLheANtq3mX9Cgrm7G4zr6TbEw-FcSDn_FSX6gOopsz87KZD4MvpTN1M62n6M1H8ZqujSFG3tHtqQYyW7hoc1OsQ1eRDpEzeUJgziDno6gyMlMYfIu5U9yeScoErOy_BRb2hh3oa2s',
            location: 'Los Angeles, CA'
          }
        ]);
      }
      setLoading(false);
    }

    fetchListings();

    return () => {
      active = false;
    };
  }, []);

  const filteredListings = listings.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const renderCard = ({ item }: { item: Listing }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardPrice}>${item.price.toLocaleString()}</Text>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.footerRow}>
          <Text style={styles.location}>📍 {item.location}</Text>
          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>View Detail</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>GroupMarket</Text>
        <TextInput
          placeholder="Search listings..."
          style={styles.searchBar}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          renderItem={renderCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  searchBar: {
    height: 44,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#0f172a',
  },
  list: {
    padding: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f1f5f9',
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 10,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  location: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  btn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
