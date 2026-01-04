import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';

// Mock Voice removed. Ensure package is installed.

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Linking,
    PermissionsAndroid,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Ionicons from 'react-native-vector-icons/Ionicons';
import { generateSystemPrompt, sendChatRequest } from '../api/aiService';
import { AuthContext } from '../AuthContext';
import { API_URL } from '../constants/config';
import { RootStackParamList } from '../navigation/StackNavigator';

type AiScreenRouteProp = RouteProp<RootStackParamList, 'Ai'>;

// Extended to support tripId passed manually or via type modification
type AiParams = {
    name: string;
    tripId?: string;
};

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
};

const AiScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<AiScreenRouteProp>();

    // Cast params to include tripId if it's not in the type definition yet
    const { name, tripId } = (route.params || {}) as AiParams;
    const { userId } = useContext(AuthContext);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tripDetails, setTripDetails] = useState<any>(null);
    const [userDetails, setUserDetails] = useState<any>(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (tripId) {
            fetchTripDetails();
        }
        if (userId) {
            fetchUserDetails();
        }
    }, [tripId, userId]);

    const fetchTripDetails = async () => {
        try {
            const response = await fetch(`${API_URL}/trip/${tripId}`);
            if (response.ok) {
                const data = await response.json();
                setTripDetails(data);
                console.log("AI Context Loaded Trip:", data.tripName);
            }
        } catch (error) {
            console.error("Failed to fetch trip context for AI", error);
        }
    };

    const fetchUserDetails = async () => {
        try {
            const response = await fetch(`${API_URL}/user/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setUserDetails(data);
                console.log("AI Context Loaded User:", data.name);
            }
        } catch (error) {
            console.error("Failed to fetch user context for AI", error);
        }
    };

    useEffect(() => {
        loadHistory();
        setupVoice();
        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    const setupVoice = async () => {
        try {
            (Voice as any).onSpeechStart = onSpeechStart;
            (Voice as any).onSpeechEnd = onSpeechEnd;
            Voice.onSpeechResults = onSpeechResults;
            (Voice as any).onSpeechError = onSpeechError;
        } catch (e) {
            console.error(e);
        }
    };

    const onSpeechStart = () => setIsListening(true);
    const onSpeechEnd = () => setIsListening(false);

    const onSpeechResults = (e: SpeechResultsEvent) => {
        if (e.value && e.value[0]) {
            const text = e.value[0];
            setInputText(prev => prev ? `${prev} ${text}` : text);
            setIsListening(false);
            Voice.stop();
        }
    };

    const requestVoicePermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'App needs access to your microphone to recognize speech.',
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

    const toggleListening = async () => {
        try {
            if (isListening) {
                console.log("Stopping voice...");
                await Voice.stop();
                setIsListening(false);
            } else {
                console.log("Requesting permission...");
                const hasPermission = await requestVoicePermission();
                if (!hasPermission) {
                    Alert.alert(
                        'Permission Required',
                        'Microphone access is needed for voice features. Please enable it in settings.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Open Settings', onPress: () => Linking.openSettings() }
                        ]
                    );
                    return;
                }

                console.log("Starting voice...");
                // Clear any existing session before starting
                await Voice.destroy();

                try {
                    await Voice.start('en-US');
                    setIsListening(true);
                } catch (startError: any) {
                    console.error("Voice start error", startError);
                    setIsListening(false);
                    Alert.alert("Voice Error", `Failed to start: ${startError.message || startError}`);
                }
            }
        } catch (e: any) {
            console.error("Toggle listening error", e);
            setIsListening(false);
            Alert.alert('Voice Error', `Could not toggle voice: ${e.message || e}`);
        }
    };

    const onSpeechError = (e: any) => {
        console.log('Voice Error Event:', e);
        // Ignore "No match" error (Code 7) as it just means silence/unrecognized speech
        if (e.error?.code === '7' || e.error?.message?.includes('7/No match')) {
            setIsListening(false);
            return;
        }

        setIsListening(false);
        Alert.alert("Speech Recognition Error", JSON.stringify(e.error));
    };

    const clearChatHistory = async () => {
        Alert.alert(
            "Delete History",
            "Are you sure you want to delete all chat history?",
            [
                { text: "Cancel", style: "cancel", onPress: () => setMenuVisible(false) },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem(`chat_history_${name || 'default'}`);
                            setMessages([]);
                            const initialMsg: Message = {
                                id: Date.now().toString(),
                                role: 'assistant',
                                content: `Hello ${userDetails?.name || ''}! Chat history cleared. How can I help you?`,
                                timestamp: Date.now(),
                            };
                            setMessages([initialMsg]);
                        } catch (e) {
                            console.error("Failed to clear history", e);
                        } finally {
                            setMenuVisible(false);
                        }
                    }
                }
            ]
        );
    };

    const loadHistory = async () => {
        try {
            const stored = await AsyncStorage.getItem(`chat_history_${name || 'default'}`);
            if (stored) {
                setMessages(JSON.parse(stored));
            } else {

                const initialMsg: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `Hello ${userDetails?.name || ''}! I'm your AI travel assistant for ${name || 'your trip'}. I have your itinerary and details ready. How can I help you?`,
                    timestamp: Date.now(),
                };
                setMessages([initialMsg]);
            }
        } catch (e) {
            console.log('Failed to load history', e);
        }
    };

    const saveHistory = async (newMessages: Message[]) => {
        try {
            await AsyncStorage.setItem(`chat_history_${name || 'default'}`, JSON.stringify(newMessages));
        } catch (e) {
            console.log('Failed to save history', e);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText.trim(),
            timestamp: Date.now(),
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInputText('');
        saveHistory(updatedMessages);
        setIsLoading(true);

        // Scroll to bottom
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const systemPrompt = generateSystemPrompt(name || 'Trip', userDetails, tripDetails);

            // Construct the full message history for the AI, including the system prompt
            const apiMessages: any[] = [
                { role: 'system', content: systemPrompt },
                ...updatedMessages.map(m => ({ role: m.role, content: m.content }))
            ];

            const data = await sendChatRequest(apiMessages);

            if (data.choices && data.choices.length > 0) {
                const aiContent = data.choices[0].message.content;
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: aiContent,
                    timestamp: Date.now(),
                };

                const finalMessages = [...updatedMessages, aiMsg];
                setMessages(finalMessages);
                saveHistory(finalMessages);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            } else {
                console.error("OpenAI Error", data);
                Alert.alert("AI Error", "Failed to get response from AI");
            }

        } catch (error) {
            console.error(error);
            Alert.alert("Network Error", `Could not connect to AI service: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageContent = (content: string, textStyle: any) => {
        const parts = [];
        let lastIndex = 0;
        const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
            // Text before image
            if (match.index > lastIndex) {
                parts.push(
                    <Text key={`text-${lastIndex}`} style={textStyle}>
                        {content.substring(lastIndex, match.index)}
                    </Text>
                );
            }

            // Image
            const imageUrl = match[2];
            parts.push(
                <Image
                    key={`img-${match.index}`}
                    source={{ uri: imageUrl }}
                    style={{ width: 250, height: 150, borderRadius: 10, marginVertical: 8 }}
                    resizeMode="cover"
                />
            );

            lastIndex = match.index + match[0].length;
        }

        // Remaining text
        if (lastIndex < content.length) {
            parts.push(
                <Text key={`text-${lastIndex}`} style={textStyle}>
                    {content.substring(lastIndex)}
                </Text>
            );
        }

        return parts.length > 0 ? parts : <Text style={textStyle}>{content}</Text>;
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';
        return (
            <View style={[
                styles.messageBubble,
                isUser ? styles.userBubble : styles.aiBubble
            ]}>
                {renderMessageContent(item.content, [styles.messageText, isUser ? styles.userText : styles.aiText])}
            </View>
        );
    };

    return (
        <ImageBackground
            source={require('../assets/images/Robot.gif')}
            style={styles.container}
            resizeMode="contain"
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </Pressable>
                    <Text style={styles.headerTitle}>AI Assistant</Text>

                    <View>
                        <Pressable onPress={() => setMenuVisible(!menuVisible)}>
                            <Ionicons name="ellipsis-horizontal" size={24} color="black" />
                        </Pressable>
                        {menuVisible && (
                            <View style={styles.dropdownMenu}>
                                <Pressable onPress={clearChatHistory} style={styles.menuOption}>
                                    <Text style={styles.menuOptionText}>Clear Chat</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                >
                    {/* Chat List */}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        style={styles.list}
                    />

                    {/* Input Area */}
                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Ask about your trip..."
                                placeholderTextColor="black"
                                multiline
                            />
                            <Pressable
                                style={[styles.iconButton, isListening && styles.listeningButton]}
                                onPress={toggleListening}
                            >
                                <Ionicons name={isListening ? "mic" : "mic-outline"} size={20} color={isListening ? "white" : "#666"} />
                            </Pressable>
                        </View>

                        <Pressable style={styles.sendButton} onPress={sendMessage} disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Ionicons name="send" size={20} color="white" />
                            )}
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
};

export default AiScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    safeArea: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 20,
        paddingBottom: 60,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
        marginBottom: 10,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F0F0',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
    },
    userText: {
        color: '#fff',
    },
    aiText: {
        color: '#333',
        fontFamily: 'PlayfairDisplay',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
        marginBottom: -9,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingVertical: 4,
        borderRadius: 60,
        paddingRight: 5,
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 16,
        color: '#0b0000ff',
    },
    iconButton: {
        padding: 8,
        borderRadius: 20,
    },
    listeningButton: {
        backgroundColor: '#ff4444',
    },
    sendButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dropdownMenu: {
        position: 'absolute',
        top: 30,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        padding: 5,
        zIndex: 1000,
        minWidth: 120,
    },
    menuOption: {
        padding: 10,
    },
    menuOptionText: {
        fontSize: 14,
        color: 'red',
    },
});
