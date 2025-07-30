import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { vehicleAPI } from '../services/api';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';

const ProfileScreen = ({ navigation }) => {
  const { user, updateProfile, updateVehicle, getVehicle, logout, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  
  const [vehicleData, setVehicleData] = useState({
    model: '',
    mileage: '',
    fuelType: 'petrol',
  });

  // Load vehicle data on component mount
  useEffect(() => {
    const loadVehicleData = async () => {
      try {
        const result = await getVehicle();
        if (result.success && result.data) {
          setVehicleData({
            model: result.data.model || '',
            mileage: result.data.mileage?.toString() || '',
            fuelType: result.data.fuelType || 'petrol',
          });
        }
      } catch (error) {
        console.error('Error loading vehicle data:', error);
      }
    };

    loadVehicleData();
  }, []);

  const handleUpdateProfile = async () => {
    if (!profileData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    // Phone number validation (if provided)
    if (profileData.phone.trim() && profileData.phone.length > 15) {
      Alert.alert('Error', 'Phone number cannot be longer than 15 digits');
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setIsEditing(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVehicle = async () => {
    if (!vehicleData.model.trim()) {
      Alert.alert('Error', 'Vehicle model is required');
      return;
    }

    if (!vehicleData.mileage || parseFloat(vehicleData.mileage) <= 0) {
      Alert.alert('Error', 'Valid mileage is required');
      return;
    }

    setLoading(true);
    try {
      const result = await updateVehicle(vehicleData);
      if (result.success) {
        Alert.alert('Success', 'Vehicle updated successfully');
        setIsEditingVehicle(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to update vehicle');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVehicle = async () => {
    setLoading(true);
    try {
      const response = await vehicleAPI.deleteVehicle();
      if (response.data.success) {
        setVehicleData({ model: '', mileage: '', fuelType: 'petrol' });
        Alert.alert('Success', 'Vehicle information removed');
      } else {
        Alert.alert('Error', 'Failed to remove vehicle');
      }
    } catch (error) {
      console.error('Error removing vehicle:', error);
      Alert.alert('Error', 'Failed to remove vehicle');
    } finally {
      setLoading(false);
    }
  };

  const updateProfileField = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const updateVehicleField = (field, value) => {
    setVehicleData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={[globalStyles.header, { paddingTop: Platform.OS === 'ios' ? 85 : 55 }]}>
          <View style={[globalStyles.row, globalStyles.spaceBetween]}>
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <MaterialIcons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={globalStyles.headerTitle}>Profile</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        <View style={globalStyles.padding}>
          {/* Personal Information */}
          <View style={globalStyles.card}>
            <View style={[globalStyles.row, globalStyles.spaceBetween, globalStyles.marginBottom]}>
              <Text style={globalStyles.subtitle}>Personal Information</Text>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={{ padding: 8 }}
              >
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={globalStyles.marginBottom}>
              <Text style={[globalStyles.caption, { marginBottom: 8 }]}>Name</Text>
              {isEditing ? (
                <TextInput
                  style={globalStyles.input}
                  value={profileData.name}
                  onChangeText={(value) => updateProfileField('name', value)}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textSecondary}
                />
              ) : (
                <Text style={globalStyles.bodyText}>
                  {profileData.name || 'Not set'}
                </Text>
              )}
            </View>

            <View style={globalStyles.marginBottom}>
              <Text style={[globalStyles.caption, { marginBottom: 8 }]}>Phone</Text>
              {isEditing ? (
                <TextInput
                  style={globalStyles.input}
                  value={profileData.phone}
                  onChangeText={(value) => updateProfileField('phone', value)}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={globalStyles.bodyText}>
                  {profileData.phone || 'Not set'}
                </Text>
              )}
            </View>

            {isEditing && (
              <TouchableOpacity
                style={[
                  globalStyles.button,
                  loading && globalStyles.buttonDisabled
                ]}
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                <Text style={globalStyles.buttonText}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Vehicle Information */}
          <View style={globalStyles.card}>
            <View style={[globalStyles.row, globalStyles.spaceBetween, globalStyles.marginBottom]}>
              <Text style={globalStyles.subtitle}>Vehicle Information</Text>
              <TouchableOpacity
                onPress={() => setIsEditingVehicle(!isEditingVehicle)}
                style={{ padding: 8 }}
              >
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {isEditingVehicle ? 'Cancel' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={globalStyles.marginBottom}>
              <Text style={[globalStyles.caption, { marginBottom: 8 }]}>Vehicle Model</Text>
              {isEditingVehicle ? (
                <TextInput
                  style={globalStyles.input}
                  value={vehicleData.model}
                  onChangeText={(value) => updateVehicleField('model', value)}
                  placeholder="Enter vehicle model"
                  placeholderTextColor={colors.textSecondary}
                />
              ) : (
                <Text style={globalStyles.bodyText}>
                  {vehicleData.model || 'Not set'}
                </Text>
              )}
            </View>

            <View style={globalStyles.marginBottom}>
              <Text style={[globalStyles.caption, { marginBottom: 8 }]}>Mileage (km/l)</Text>
              {isEditingVehicle ? (
                <TextInput
                  style={globalStyles.input}
                  value={vehicleData.mileage}
                  onChangeText={(value) => updateVehicleField('mileage', value)}
                  placeholder="Enter mileage"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={globalStyles.bodyText}>
                  {vehicleData.mileage ? `${vehicleData.mileage} km/l` : 'Not set'}
                </Text>
              )}
            </View>

            <View style={globalStyles.marginBottom}>
              <Text style={[globalStyles.caption, { marginBottom: 8 }]}>Fuel Type</Text>
              {isEditingVehicle ? (
                <View style={globalStyles.row}>
                  {['petrol', 'diesel', 'electric', 'hybrid'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        {
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 16,
                          marginRight: 8,
                          borderWidth: 1,
                          borderColor: colors.border,
                        },
                        vehicleData.fuelType === type && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() => updateVehicleField('fuelType', type)}
                    >
                      <Text
                        style={[
                          { fontSize: 12, textTransform: 'capitalize' },
                          vehicleData.fuelType === type && { color: colors.surface },
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={globalStyles.bodyText}>
                  {vehicleData.fuelType ? vehicleData.fuelType.toUpperCase() : 'Not set'}
                </Text>
              )}
            </View>

            {isEditingVehicle && (
              <TouchableOpacity
                style={[
                  globalStyles.button,
                  loading && globalStyles.buttonDisabled
                ]}
                onPress={handleUpdateVehicle}
                disabled={loading}
              >
                <Text style={globalStyles.buttonText}>
                  {loading ? 'Updating...' : 'Update Vehicle'}
                </Text>
              </TouchableOpacity>
            )}

            {!isEditingVehicle && vehicleData.model && (
              <TouchableOpacity
                style={[globalStyles.button, { backgroundColor: colors.error, marginTop: 12 }]}
                onPress={() => {
                  Alert.alert(
                    'Remove Vehicle',
                    'Are you sure you want to remove your vehicle information?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: handleRemoveVehicle },
                    ]
                  );
                }}
                disabled={loading}
              >
                <Text style={[globalStyles.buttonText, { color: colors.surface }]}>
                  Remove Vehicle
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen; 