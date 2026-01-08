import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { AuthContext } from '../AuthContext';
import { API_URL } from '../constants/config';
import { useTheme } from '../ThemeContext';

interface User {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
}

const SettingsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { userId, setToken, setUserInfo } = useContext(AuthContext);
    const { theme, toggleTheme, colors } = useTheme();
    const [user, setUser] = useState<User | null>(null);

    // Settings States
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchUserData();
        }
    }, [userId]);

    const fetchUserData = async () => {
        try {
            const response = await fetch(`${API_URL}/user/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setUser(data);
                setUserInfo(data);
            }
        } catch (error) {
            console.log('Error fetching user data:', error);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('authToken');
                            setToken(null);
                        } catch (error) {
                            console.log('Error logging out:', error);
                        }
                    },
                },
            ]
        );
    };

    const SettingItem = ({ icon, title, value, type, onPress }: any) => (
        <Pressable style={[styles.settingItem, { borderBottomColor: colors.border }]} onPress={onPress}>
            <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={22} color="orange" />
                </View>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
            </View>
            <View style={styles.settingRight}>
                {type === 'switch' && (
                    <Switch
                        trackColor={{ false: '#767577', true: 'orange' }}
                        thumbColor={value ? '#fff' : '#f4f3f4'}
                        onValueChange={onPress}
                        value={value}
                    />
                )}
                {type === 'arrow' && (
                    <Ionicons name="chevron-forward" size={20} color={colors.text} />
                )}
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#f2f2f7' }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Profile Card */}
                <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
                    <Image
                        source={{
                            uri: user?.profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                        }}
                        style={styles.profileImage}
                    />
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'Traveler'}</Text>
                        <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
                    </View>
                    <Pressable style={styles.editButton}>
                        <Ionicons name="pencil" size={20} color="gray" />
                    </Pressable>
                </View>

                {/* Account Settings */}
                <Text style={styles.sectionHeader}>Account</Text>
                <View style={[styles.sectionContainer, { backgroundColor: colors.card }]}>
                    <SettingItem
                        icon="person-outline"
                        title="Edit Profile"
                        type="arrow"
                        onPress={() => console.log('Edit Profile')}
                    />
                    <SettingItem
                        icon="lock-closed-outline"
                        title="Change Password"
                        type="arrow"
                        onPress={() => console.log('Change Password')}
                    />
                    <SettingItem
                        icon="notifications-outline"
                        title="Notifications"
                        type="switch"
                        value={notificationsEnabled}
                        onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                    />
                </View>

                {/* Preferences */}
                <Text style={styles.sectionHeader}>Preferences</Text>
                <View style={[styles.sectionContainer, { backgroundColor: colors.card }]}>
                    <SettingItem
                        icon="globe-outline"
                        title="Language"
                        type="arrow"
                        onPress={() => console.log('Language')}
                    />
                    <SettingItem
                        icon="moon-outline"
                        title="Dark Mode"
                        type="switch"
                        value={theme === 'dark'}
                        onPress={toggleTheme}
                    />
                </View>

                {/* Support */}
                <Text style={styles.sectionHeader}>Support</Text>
                <View style={[styles.sectionContainer, { backgroundColor: colors.card }]}>
                    <SettingItem
                        icon="help-circle-outline"
                        title="Help & Support"
                        type="arrow"
                        onPress={() => console.log('Help')}
                    />
                    <SettingItem
                        icon="information-circle-outline"
                        title="About App"
                        type="arrow"
                        onPress={() => console.log('About')}
                    />
                </View>

                {/* Logout */}
                <Pressable style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color="white" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </Pressable>

                <Text style={styles.versionText}>Version 1.0.0</Text>

            </ScrollView>
        </SafeAreaView>
    );
};

export default SettingsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        // Shadow for header
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginTop: 20,
        marginHorizontal: 20,
        borderRadius: 15,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#eee',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 15,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    profileEmail: {
        fontSize: 14,
        color: 'gray',
        marginTop: 2,
    },
    editButton: {
        padding: 10,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: 'gray',
        marginLeft: 25,
        marginTop: 25,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    sectionContainer: {
        marginHorizontal: 20,
        borderRadius: 15,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 35,
        height: 35,
        borderRadius: 10,
        backgroundColor: '#FFF4E5', // Light orange bg
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    settingRight: {},
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B6B',
        marginHorizontal: 20,
        marginTop: 30,
        paddingVertical: 15,
        borderRadius: 15,
        gap: 10,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    logoutText: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    versionText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
        fontSize: 12,
    },
});
