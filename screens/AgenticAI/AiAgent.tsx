import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Easing, Modal, PermissionsAndroid, Platform, Pressable, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tts from 'react-native-tts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../ThemeContext';
import { Message, sendChatRequest } from './BackendAI';

const AiAgent: React.FC = () => {
    const navigation = useNavigation();
    const [animationVisible, setAnimationVisible] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { colors, theme } = useTheme();
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        setAnimationVisible(true);
        setupVoice();
        setupTts();

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
            Tts.stop();
        };
    }, []);

    const setupVoice = async () => {
        (Voice as any).onSpeechStart = onSpeechStart;
        (Voice as any).onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        (Voice as any).onSpeechVolumeChanged = onSpeechVolumeChanged;
        (Voice as any).onSpeechError = (e: any) => {
            if (e.error?.message?.includes('5') || e.error?.code === '5') {
      
                console.log('Voice suppressed error:', e);
                setIsListening(false);
                return;
            }
            console.error('Voice Error:', e);
            setIsListening(false);
        };
    };

    const setupTts = async () => {
        Tts.setDefaultLanguage('en-US');
        Tts.addEventListener('tts-start', () => setIsSpeaking(true));
        Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
        Tts.addEventListener('tts-cancel', () => setIsSpeaking(false));
    };

    const requestMicrophonePermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'TravelPlanner needs access to your microphone to hear your questions.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const startListening = async () => {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Microphone permission is required to use this feature.');
            return;
        }

        try {
    
            await Voice.stop();
            await Voice.destroy();
            await setupVoice();

      
            await Voice.start('en-IN');
            setIsListening(true);
            setIsSpeaking(false);
            Tts.stop();
        } catch (e: any) {
            console.error(e);
            if (e.message && e.message.includes('5')) {
              
                setIsListening(false);
            }
        }
    };

    const stopListening = async () => {
        try {
            await Voice.stop();
            setIsListening(false);
        } catch (e) {
            console.error(e);
        }
    };

    const onSpeechStart = (e: any) => {
        console.log('Voice started', e);
    };

    const onSpeechEnd = (e: any) => {
        console.log('Voice ended', e);
        setIsListening(false);
    };

    const onSpeechVolumeChanged = (e: any) => {
        const value = e.value ?? 0;
        const newScale = 1 + Math.min(Math.max(value / 20, 0), 0.5);

        Animated.timing(scaleAnim, {
            toValue: newScale,
            duration: 100,
            useNativeDriver: true,
            easing: Easing.linear
        }).start();
    };

    const onSpeechResults = async (e: SpeechResultsEvent) => {
        if (isLoading) return;

        
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true
        }).start();

        try {
            await Voice.stop(); 
            setIsListening(false);
        } catch (err) {
            console.log('Error stopping voice:', err);
        }

        const text = e.value?.[0];
        console.log('Voice results:', text);
        if (text) {
            handleVoiceQuery(text);
        }
    };

    const handleVoiceQuery = async (question: string) => {
        setIsLoading(true);
        if (Platform.OS === 'android') {
            ToastAndroid.show("Thinking...", ToastAndroid.SHORT);
        }
        try {
         
            const messages: Message[] = [
                { id: Date.now().toString(), role: 'user', content: question }
            ];

            const response = await sendChatRequest(messages);

            if (response && response.choices && response.choices[0]?.message?.content) {
                const answer = response.choices[0].message.content;
                speakAnswer(answer);
            } else {
                speakAnswer("I'm sorry, I couldn't get an answer at the moment.");
            }
        } catch (error) {
            console.error('Error fetching answer:', error);
            speakAnswer("Sorry, something went wrong while checking that.");
        } finally {
            setIsLoading(false);
        }
    };

    const speakAnswer = async (text: string) => {
        setIsSpeaking(true);
        const isHindi = /[\u0900-\u097F]/.test(text);
        try {
            if (isHindi) {
                await Tts.setDefaultLanguage('hi-IN');
            } else {
                await Tts.setDefaultLanguage('en-US');
            }
            Tts.speak(text);
        } catch (e) {
            console.log("TTS Error trying to set language", e);
            Tts.speak(text); // Fallback to default
        }
    };

    const handleMicPress = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Pressable onPress={() => navigation.goBack()} style={{ padding: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </Pressable>
                <Text style={[styles.title, { color: colors.text }]}>Ai Agent</Text>
            </View>
            <View style={styles.content}>
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={animationVisible}
                    onRequestClose={() => setAnimationVisible(false)}
                >
                    <View style={[styles.modalContainer]}>
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <LottieView
                                source={
                                    isListening
                                        ? require('../../assets/images/AIAnimation.json')
                                        : isSpeaking
                                            ? require('../../assets/images/AIAnimation.json')
                                            : require('../../assets/images/AIHey.json')
                                }
                                autoPlay
                                loop
                                style={styles.animation}
                            />
                        </Animated.View>



                        <View style={styles.buttonContainer}>
                            <Pressable
                                style={[styles.iconButton, isListening && styles.listeningButton]}
                                onPress={handleMicPress}
                            >
                                <Ionicons name={isListening ? "mic-off" : "mic"} size={30} color="#fff" />
                            </Pressable>
                            <Pressable
                                style={[styles.iconButton, { backgroundColor: '#ff4444' }]}
                                onPress={() => {
                                    stopListening();
                                    Tts.stop();
                                    setAnimationVisible(false);
                                    navigation.navigate('Home' as never);
                                }}
                            >
                                <Ionicons name="close" size={30} color="#fff" />
                            </Pressable>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)', 
    },
    modalContent: {
        width: 300,
        height: 400,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
    },
    animation: {
        width: 450,
        height: 450,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 80,
        flexDirection: 'row',
        gap: 30,
        zIndex: 10,
    },
    iconButton: {
        backgroundColor: '#662d91',
        padding: 20,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    listeningButton: {
        backgroundColor: '#ff4444',
        transform: [{ scale: 1.1 }],
    },
    loadingContainer: {
        position: 'absolute',
        top: '60%',
        alignItems: 'center',
    }
});

export default AiAgent;
