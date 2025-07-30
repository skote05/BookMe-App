import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  StyleSheet,
  Modal,
  Image,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { locationAPI, fareAPI } from '../services/api';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  const mapRef = useRef(null);
  
  const [currentLocation, setCurrentLocation] = useState(null);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distance, setDistance] = useState(0);
  const [fareData, setFareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (distance > 0) {
      calculateFares();
    }
  }, [distance]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });
      setSourceCoords([longitude, latitude]);
      
      // Center map on current location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get current location');
    }
  };

  const searchLocation = async (query, isSource = true) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Clear previous timeout
    if (searchLocation.timeout) {
      clearTimeout(searchLocation.timeout);
    }

    // Debounce the search
    searchLocation.timeout = setTimeout(async () => {
      try {
        const results = await locationAPI.searchLocation(query, currentLocation);
        if (Array.isArray(results) && results.length > 0) {
          setSearchResults(results);
          if (isSource) {
            setShowSourceSuggestions(true);
            setShowDestSuggestions(false);
          } else {
            setShowDestSuggestions(true);
            setShowSourceSuggestions(false);
          }
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching location:', error);
        setSearchResults([]);
      }
    }, 500); // 500ms delay
  };

  const selectLocation = (location, isSource = true) => {
    const coords = [parseFloat(location.lon), parseFloat(location.lat)];
    
    if (isSource) {
      setSourceCoords(coords);
      setSource(location.display_name);
      setShowSourceSuggestions(false);
    } else {
      setDestCoords(coords);
      setDestination(location.display_name);
      setShowDestSuggestions(false);
    }

    setSearchResults([]);

    // Update map marker
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const getRoute = async () => {
    if (!sourceCoords || !destCoords) {
      Alert.alert('Error', 'Please select both source and destination');
      return;
    }

    setLoading(true);
    try {
      const routeData = await locationAPI.getRoute(sourceCoords, destCoords);
      const distanceData = await locationAPI.getDistance(sourceCoords, destCoords);
      
      if (routeData && routeData.routes && routeData.routes.length > 0) {
        const route = routeData.routes[0];
        setRouteCoordinates(route.geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0],
        })));
        setDistance(distanceData);
        
        // Zoom out to show both source and destination
        if (mapRef.current) {
          const coordinates = [
            { latitude: sourceCoords[1], longitude: sourceCoords[0] },
            { latitude: destCoords[1], longitude: destCoords[0] }
          ];
          
          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      }
    } catch (error) {
      console.error('Error getting route:', error);
      Alert.alert('Error', 'Unable to get route');
    } finally {
      setLoading(false);
    }
  };

  const calculateFares = async () => {
    try {
      const response = await fareAPI.calculateFares({
        distance,
        source,
        destination
      });
      
      if (response.data.success) {
        setFareData(response.data.data);
      }
    } catch (error) {
      console.error('Error calculating fares:', error);
      
      // If it's an auth error, redirect to login
      if (error.response?.status === 401) {
        Alert.alert(
          'Authentication Error',
          'Please log in again to continue.',
          [
            { text: 'OK', onPress: () => navigation.navigate('Login') }
          ]
        );
      }
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setShowServiceModal(true);
  };

  const handleServiceTypeSelect = (serviceType) => {
    const service = selectedService.services[serviceType];
    Alert.alert(
      'Service Selected',
      `${selectedService.name} ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}\nPrice: ₹${service.price}\nETA: ${service.eta}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book Now', onPress: () => console.log('Booking:', selectedService.name, serviceType) }
      ]
    );
    setShowServiceModal(false);
    setSelectedService(null);
  };

  const PersonalVehicleCard = ({ vehicle, cost }) => (
    <View style={styles.personalVehicleCard}>
      <View style={styles.personalVehicleHeader}>
        <MaterialIcons name="directions-car" size={24} color={colors.info} />
        <Text style={styles.personalVehicleTitle}>Personal Vehicle</Text>
      </View>
      <View style={styles.personalVehicleContent}>
        <View>
          <Text style={styles.vehicleModel}>{vehicle?.model || 'Your Vehicle'}</Text>
          <Text style={styles.vehicleDetails}>
            {vehicle?.mileage ? `${vehicle.mileage} km/l` : 'Mileage not set'} • {vehicle?.fuelType || 'Fuel type not set'}
          </Text>
        </View>
        <View style={styles.personalVehiclePrice}>
          <Text style={styles.priceText}>₹{cost}</Text>
          <Text style={styles.priceLabel}>Fuel cost</Text>
        </View>
      </View>
    </View>
  );

  const ServiceCard = ({ service, onPress }) => {
    const getLogoSource = (appName) => {
      switch (appName.toLowerCase()) {
        case 'uber':
          return require('../../assets/uber.png');
        case 'ola':
          return require('../../assets/ola.png');
        case 'rapido':
          return require('../../assets/rapido.png');
        case 'blablacar':
          return require('../../assets//BlaBla.jpg');
        default:
          return require('../../assets/uber.png');
      }
    };

    return (
      <TouchableOpacity
        style={globalStyles.serviceCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[globalStyles.row, globalStyles.spaceBetween]}>
          <View style={globalStyles.row}>
            <Image source={getLogoSource(service.name)} style={styles.appLogo} />
            <View>
              <Text style={globalStyles.subtitle}>{service.name}</Text>
              <Text style={globalStyles.caption}>
                Auto: ₹{service.services.auto.price}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[globalStyles.subtitle, { color: colors.primary }]}>
              ₹{service.services.auto.price}
            </Text>
            <Text style={globalStyles.caption}>Starting from</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSuggestion = ({ item, isSource }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => selectLocation(item, isSource)}
    >
      <Text style={styles.suggestionText} numberOfLines={2}>
        {item.display_name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 85 : 55 }]}>
          <View style={[globalStyles.row, globalStyles.spaceBetween]}>
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <MaterialIcons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={globalStyles.headerTitle}>BookMe</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* Search Inputs - Only show when no route is found */}
        {!fareData && (
          <View style={styles.searchContainer}>
            <View style={globalStyles.marginBottom}>
              <Text style={[globalStyles.caption, { marginBottom: 8 }]}>Source</Text>
              <TextInput
                style={globalStyles.input}
                placeholder="Enter source location"
                placeholderTextColor={colors.textSecondary}
                value={source}
                onChangeText={(text) => {
                  setSource(text);
                  if (text.trim()) {
                    searchLocation(text, true);
                  } else {
                    setShowSourceSuggestions(false);
                    setSearchResults([]);
                  }
                }}
                onFocus={() => {
                  if (source.trim()) {
                    searchLocation(source, true);
                  }
                }}
              />
              {showSourceSuggestions && searchResults.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => renderSuggestion({ item, isSource: true })}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              )}
            </View>

            <View style={globalStyles.marginBottom}>
              <Text style={[globalStyles.caption, { marginBottom: 8 }]}>Destination</Text>
              <TextInput
                style={globalStyles.input}
                placeholder="Enter destination location"
                placeholderTextColor={colors.textSecondary}
                value={destination}
                onChangeText={(text) => {
                  setDestination(text);
                  if (text.trim()) {
                    searchLocation(text, false);
                  } else {
                    setShowDestSuggestions(false);
                    setSearchResults([]);
                  }
                }}
                onFocus={() => {
                  if (destination.trim()) {
                    searchLocation(destination, false);
                  }
                }}
              />
              {showDestSuggestions && searchResults.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => renderSuggestion({ item, isSource: false })}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                globalStyles.button,
                loading && globalStyles.buttonDisabled
              ]}
              onPress={getRoute}
              disabled={loading}
            >
              <Text style={globalStyles.buttonText}>
                {loading ? 'Finding Route...' : 'Find Route'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Map */}
        <View style={[styles.mapContainer, fareData && { margin: 0 }]}>
          <MapView
            ref={mapRef}
            style={{ flex: 1, borderRadius: fareData ? 0 : 12 }}
            initialRegion={
              currentLocation
                ? {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }
                : null
            }
          >
            {currentLocation && (
              <Marker
                coordinate={currentLocation}
                title="Your Location"
                pinColor={colors.primary}
                tracksViewChanges={false}
              />
            )}
            
            {sourceCoords && (
              <Marker
                coordinate={{
                  latitude: sourceCoords[1],
                  longitude: sourceCoords[0],
                }}
                title="Source"
                pinColor={colors.success}
                tracksViewChanges={false}
              />
            )}
            
            {destCoords && (
              <Marker
                coordinate={{
                  latitude: destCoords[1],
                  longitude: destCoords[0],
                }}
                title="Destination"
                pinColor={colors.error}
                tracksViewChanges={false}
              />
            )}
            
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={colors.routeColor}
                strokeWidth={3}
              />
            )}
          </MapView>
        </View>

        {/* Ride Services */}
        {fareData && (
          <View style={styles.servicesContainer}>
            <View style={styles.servicesHeader}>
              <View style={[globalStyles.row, globalStyles.spaceBetween]}>
                <View>
                  <Text style={globalStyles.subtitle}>Available Rides</Text>
                  <Text style={globalStyles.caption}>
                    Distance: {(distance / 1000).toFixed(1)} km
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setFareData(null);
                    setRouteCoordinates([]);
                    setDistance(0);
                    setSource('');
                    setDestination('');
                    setSourceCoords(null);
                    setDestCoords(null);
                  }}
                >
                  <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView 
              style={globalStyles.padding} 
              showsVerticalScrollIndicator={false}
              bounces={true}
              decelerationRate="fast"
            >
              {fareData?.rideServices?.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onPress={() => handleServiceSelect(service)}
                />
              ))}
              
              {fareData?.personalVehicle?.cost > 0 && (
                <PersonalVehicleCard
                  vehicle={fareData.personalVehicle.vehicle}
                  cost={fareData.personalVehicle.cost}
                />
              )}
            </ScrollView>
          </View>
        )}

        {/* Service Selection Modal */}
        <Modal
          visible={showServiceModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowServiceModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedService?.name}</Text>
                <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.serviceOptions}>
                <TouchableOpacity
                  style={styles.serviceOption}
                  onPress={() => handleServiceTypeSelect('bike')}
                >
                  <Text style={styles.serviceIcon}>🏍️</Text>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>Bike</Text>
                    <Text style={styles.servicePrice}>₹{selectedService?.services.bike.price}</Text>
                    <Text style={styles.serviceEta}>{selectedService?.services.bike.eta}</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.serviceOption}
                  onPress={() => handleServiceTypeSelect('auto')}
                >
                  <Text style={styles.serviceIcon}>🛺</Text>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>Auto</Text>
                    <Text style={styles.servicePrice}>₹{selectedService?.services.auto.price}</Text>
                    <Text style={styles.serviceEta}>{selectedService?.services.auto.eta}</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.serviceOption}
                  onPress={() => handleServiceTypeSelect('cab')}
                >
                  <Text style={styles.serviceIcon}>🚗</Text>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>Cab</Text>
                    <Text style={styles.servicePrice}>₹{selectedService?.services.cab.price}</Text>
                    <Text style={styles.serviceEta}>{selectedService?.services.cab.eta}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    zIndex: 1000,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
  },
  servicesContainer: {
    height: height * 0.4,
    backgroundColor: colors.surface,
  },
  servicesHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1001,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  serviceOptions: {
    gap: 16,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  serviceIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 4,
  },
  serviceEta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  currentLocationMarker: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  currentLocationPulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.primary,
    opacity: 0.3,
  },
  locationPin: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinText: {
    fontSize: 20,
  },
  personalVehicleCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  personalVehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  personalVehicleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  personalVehicleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleModel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  vehicleDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  personalVehiclePrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  appLogo: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  cancelButton: {
    padding: 8,
  },
});

export default HomeScreen; 