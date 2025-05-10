// import React from "react";
// import { View, FlatList, TouchableOpacity, Text, StyleSheet } from "react-native";

// const LOCATIONS = [
//   { id: "1", name: "Aga Khan Hospital" },
//   { id: "2", name: "Jinnah Hospital" },
//   { id: "3", name: "Liaquat National Hospital" },
//   { id: "4", name: "Indus Hospital" },
//   { id: "5", name: "Civil Hospital" },
// ];

// const LocationSearchPanel = ({ onSelect }: { onSelect: (location: string) => void }) => {
//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={LOCATIONS}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <TouchableOpacity style={styles.item} onPress={() => onSelect(item.name)}>
//             <Text style={styles.itemText}>{item.name}</Text>
//           </TouchableOpacity>
//         )}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     padding: 20,
//     backgroundColor: "#fff",
//     borderTopLeftRadius: 15,
//     borderTopRightRadius: 15,
//     elevation: 5,
//   },
//   item: {
//     padding: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#ddd",
//   },
//   itemText: {
//     fontSize: 16,
//     color: "#333",
//   },
// });

// export default LocationSearchPanel;
