import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { chatService } from "./chatService";
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import {
  ChatMessage,
  DiningHall,
  DiningHallResponse,
  Recommendation,
  Location as LocationType,
} from "./types";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

const UMICH_COLORS = {
  maize: "#FFCB05",
  blue: "#00274C",
  white: "#FFFFFF",
  lightMaize: "#FFE068",
  lightBlue: "#1C4E80",
};

const sampleMessages: ChatMessage[] = [
  {
    text: "👋 Hi! I'm your MI Dining Assistant. How can I help you today?",
    isBot: true,
    timestamp: new Date(),
  },
];

const diningOptions = [
  {
    name: "East Quad",
    image: require("../assets/east_quad.jpg"),
    tags: ["BBQ", "Pie", "Spicy Food", "Not Busy"],
    menuItems: [
      {
        name: "Thai BBQ Chicken",
        calories: "123 Cal",
        protein: "14g Protein",
        allergens: "soy, wheat/barley/rye",
        rating: "4.7",
      },
      {
        name: "Strawberry Rhubarb Pie",
        calories: "245 Cal",
        sugars: "13g Sugars",
        allergens: "wheat/barley/rye",
        rating: "5",
      },
      {
        name: "Spicy Chili Soup",
        calories: "130 Cal",
        sodium: "500mg Sodium",
        allergens: "soy, wheat/barley/rye",
        rating: "4.7",
      },
    ],
  },
  {
    name: "North Quad",
    image: require("../assets/north_quad.jpg"),
    tags: ["BBQ", "Pie", "Busy"],
    menuItems: [
      {
        name: "Thai BBQ Chicken",
        calories: "123 Cal",
        protein: "14g Protein",
        allergens: "soy, wheat/barley/rye",
        rating: "4.7",
      },
      {
        name: "Strawberry Rhubarb Pie",
        calories: "245 Cal",
        sugars: "13g Sugars",
        allergens: "wheat/barley/rye",
        rating: "5",
      },
      {
        name: "Spicy Chili Soup",
        calories: "130 Cal",
        sodium: "500mg Sodium",
        allergens: "soy, wheat/barley/rye",
        rating: "4.7",
      },
    ],
  },
  {
    name: "South Quad",
    image: require("../assets/south_quad.jpg"),
    tags: ["BBQ", "Pie"],
    menuItems: [
      {
        name: "Thai BBQ Chicken",
        calories: "123 Cal",
        protein: "14g Protein",
        allergens: "soy, wheat/barley/rye",
        rating: "4.7",
      },
      {
        name: "Strawberry Rhubarb Pie",
        calories: "245 Cal",
        sugars: "13g Sugars",
        allergens: "wheat/barley/rye",
        rating: "5",
      },
      {
        name: "Spicy Chili Soup",
        calories: "130 Cal",
        sodium: "500mg Sodium",
        allergens: "soy, wheat/barley/rye",
        rating: "4.7",
      },
    ],
  },
];

const HomeScreen = () => {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(sampleMessages);
  const [newMessage, setNewMessage] = useState("");
  const [slideAnim] = useState(new Animated.Value(0));
  const messagesEndRef = useRef<ScrollView | null>(null);

  // Dining halls and location state
  const [diningHalls, setDiningHalls] = useState<DiningHall[]>([]);
  const [recommended, setRecommended] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      await getUserLocation();
      await fetchDiningHalls();
    };

    initializeApp();
  }, []);

  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Location permission denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: "", 
      });
      return location;
    } catch (error) {
      setLocationError("Error getting location");
      console.error(error);
    }
  };

  const calculateDistance = (location: LocationType): string => {
    if (!userLocation) return "N/A";

    const R = 3959; 
    const dLat = ((location.latitude - userLocation.latitude) * Math.PI) / 180;
    const dLon =
      ((location.longitude - userLocation.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.latitude * Math.PI) / 180) *
        Math.cos((location.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return `${distance.toFixed(1)} mi`;
  };

  const fetchDiningHalls = async () => {
    try {
      let latitude = "42.2739968"
      let longitude = "-83.7287936"
      console.log(latitude, longitude)

      setIsLoading(true);
      const response = await fetch("http://localhost:5000/getmenu/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "location": `${latitude},${longitude}`,
        },
      });
      const data: DiningHallResponse = await response.json();
      console.log("Dining halls:", data);
      setDiningHalls(data.dining_info);
      setRecommended(data.recommendation);
    } catch (error) {
      console.error("Error fetching dining halls:", error);
      Alert.alert("Error", "Failed to load dining halls");
    } finally {
      setIsLoading(false);
    }
  };


  const openDirections = (location: LocationType) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      location.address
    )}`;
    Linking.openURL(url);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollToEnd({ animated: true });
  };

  const toggleChat = () => {
    if (isChatOpen) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsChatOpen(false));
    } else {
      setIsChatOpen(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim()) {
      const userMessage = {
        text: newMessage,
        isBot: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setNewMessage("");
      scrollToBottom();

      try {
        const response = await chatService.sendMessage(
          "1234",
          userMessage.text
        );

        if (response && response.response) {
          const botMessage = {
            text: response.response,
            isBot: true,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
          scrollToBottom();
        }
      } catch (error) {
        console.error("Error getting response:", error);
        const errorMessage = {
          text: "Sorry, I'm having trouble responding right now. Please try again.",
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        scrollToBottom();
      }
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === "Enter") {
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={UMICH_COLORS.maize} />
        <Text style={styles.loadingText}>Loading dining halls...</Text>
      </View>
    );
  }
  

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../assets/dining.webp")}
            style={styles.headerLogo}
          />
        </View>

        <View style={styles.headerNav}>
          <TouchableOpacity
            onPress={() => router.push("/home")}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/about")}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>About Me</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/menu")}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Menu</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container}>
        <Text style={styles.welcomeTitle}>Welcome to MI AI Dining!</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AI Based Recommendation</Text>
          <Text style={styles.cardText}>{recommended?.reasoning}</Text>
        </View>

        {diningHalls?.length > 0 ? (
          diningHalls.map((hall, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{hall.dining_hall}</Text>
                {userLocation && hall.distance && (
                  <View style={styles.locationInfo}>
                    <View style={styles.distanceContainer}>
                      <Image
                        source={require("../assets/location.png")}
                        style={styles.locationIcon}
                      />
                      <Text style={styles.distanceText}>
                        {hall.distance}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <Image
                source={
                    hall.dining_hall === "East Quad"
                    ? require("../assets/east_quad.jpg")
                    : hall.dining_hall === "North Quad"
                    ? require("../assets/north_quad.jpg")
                    : hall.dining_hall === "South Quad"
                    ? require("../assets/south_quad.jpg")
                    : hall.dining_hall === "Markley"
                    ? require("../assets/markley.jpg")
                    : hall.dining_hall === "Bursley"
                    ? require("../assets/bursley.jpg")
                    : hall.dining_hall === "Mosher Jordan"
                    ? require("../assets/mosher_jordan.jpg")
                    : require("../assets/mosher_jordan.jpg")
                }
                style={styles.cardImage}
              />

              <View style={styles.tagContainer}>
                {/* Add status tags based on current time */}
                <View style={[styles.tag, styles.defaultTag]}>
                  <Text style={styles.tagText}>{hall.status}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No dining halls available</Text>
          </View>
        )}
      </ScrollView>

      {/* <ScrollView style={styles.container}>
        <Text style={styles.welcomeTitle}>Welcome to MI AI Dining!</Text>

        {diningOptions.map((quad, index) => (
          <View key={index} style={styles.card}>
            <Image source={quad.image} style={styles.cardImage} />
            <Text style={styles.cardTitle}>{quad.name}</Text>

            <View style={styles.tagContainer}>
              {quad.tags.map((tag, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tag,
                    tag.includes("Busy")
                      ? styles.busyTag
                      : tag.includes("Not Busy")
                      ? styles.notBusyTag
                      : styles.defaultTag,
                  ]}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            {quad.menuItems.map((item, itemIdx) => (
              <View key={itemIdx} style={styles.menuItem}>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  <Text style={styles.menuItemDetails}>
                    {item.calories} •{" "}
                    {item.protein || item.sugars || item.sodium}
                  </Text>
                  <Text style={styles.menuItemAllergens}>
                    Contains: {item.allergens}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>
                      Student Rating: {item.rating}
                    </Text>
                    <Text style={styles.starRating}>★</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </ScrollView> */}

      <TouchableOpacity style={styles.chatbotBtn} onPress={toggleChat}>
        <Image
          source={require("../assets/chatbot.png")}
          style={styles.chatbotIcon}
        />
      </TouchableOpacity>

      <Modal visible={isChatOpen} transparent={true} animationType="none">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <Animated.View
            style={[
              styles.chatContainer,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.chatHeader}>
              <View style={styles.titleContainer}>
                <Text style={styles.chatTitle}>MI Dining Assistant</Text>
              </View>
              <TouchableOpacity onPress={toggleChat}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.messagesContainer}
              ref={messagesEndRef}
              onContentSizeChange={scrollToBottom}
            >
              {messages.map((msg, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageBubble,
                    msg.isBot ? styles.botBubble : styles.userBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      msg.isBot ? styles.botText : styles.userText,
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type your message..."
                placeholderTextColor="#999"
                multiline
                onKeyPress={handleKeyPress}
                returnKeyType="send"
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !newMessage.trim() && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim()}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: UMICH_COLORS.blue,
  },
  header: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerLeft: {
    flex: 1,
  },
  headerLogo: {
    width: 90,
    height: 70,
    backgroundColor: "#fff",
  },
  headerNav: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  headerButton: {
    backgroundColor: UMICH_COLORS.maize,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginHorizontal: 10,
  },
  headerButtonText: {
    fontSize: 15,
    color: UMICH_COLORS.blue,
    fontWeight: "600",
    textAlign: "center",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginVertical: 24,
  },
  card: {
    backgroundColor: UMICH_COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 5,
    borderColor: UMICH_COLORS.maize,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: UMICH_COLORS.blue,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: UMICH_COLORS.blue,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: UMICH_COLORS.blue,
    marginTop: 12,
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 4,
    borderLeftColor: UMICH_COLORS.maize,
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
  },
  noDataText: {
    color: UMICH_COLORS.white,
    fontSize: 16,
  },
  loadingText: {
    color: UMICH_COLORS.white,
    marginTop: 10,
    fontSize: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  locationInfo: {
    alignItems: "flex-end",
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  distanceText: {
    fontSize: 14,
    color: UMICH_COLORS.blue,
    fontWeight: "500",
  },
  directionsButton: {
    backgroundColor: "#006A4E",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  directionsButtonText: {
    color: UMICH_COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  defaultTag: {
    backgroundColor: "#FFD700",
  },
  busyTag: {
    backgroundColor: "#C6373C",
  },
  notBusyTag: {
    backgroundColor: "#4CAF50",
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
    color: UMICH_COLORS.blue,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#f8f9fa",
  },
  menuItemContent: {
    flex: 1,
    marginRight: 12,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: UMICH_COLORS.blue,
    marginBottom: 4,
  },
  menuItemDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  menuItemAllergens: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    color: "#666",
    marginRight: 4,
  },

  starRating: {
    color: "#FFD700",
    fontSize: 14,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: UMICH_COLORS.blue,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  chatbotBtn: {
    position: "absolute",
    bottom: 24,
    right: 24,
    padding: 16,
    borderRadius: 28,
    backgroundColor: UMICH_COLORS.blue,
    borderWidth: 2,
    borderColor: UMICH_COLORS.maize,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  chatbotIcon: {
    width: 20,
    height: 20,
  },
  chatbotText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  chatContainer: {
    backgroundColor: UMICH_COLORS.white,
    height: "75%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderTopColor: UMICH_COLORS.maize,
    borderTopWidth: 3,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: UMICH_COLORS.blue,
    marginHorizontal: -20,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: UMICH_COLORS.maize,
    textAlign: "center",
  },
  closeButton: {
    fontSize: 28,
    color: UMICH_COLORS.white,
    padding: 5,
  },
  messagesContainer: {
    flex: 1,
    marginVertical: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  botBubble: {
    backgroundColor: UMICH_COLORS.blue,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: UMICH_COLORS.maize,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  botText: {
    color: UMICH_COLORS.white,
  },
  userText: {
    color: UMICH_COLORS.blue,
  },
  inputContainer: {
    flexDirection: "row",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: UMICH_COLORS.blue,
    width: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default HomeScreen;


