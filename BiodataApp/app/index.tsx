import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { api } from "../src/api/api";
import { SharedFolderData, File, Folder } from "../src/types";

export default function Page() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SharedFolderData>({
    folders: [],
    files: [],
    breadcrumbs: [],
    folderName: "",
  });

  // Get token from params or use a default test token
  const token =
    typeof params.token === "string"
      ? params.token
      : "c8e9c018d287b9e24140575cfdd70674c80f933ae5ebec8d6a9bee2aae9f7d79";

  // console.log("Params:", params);
  const folderId =
    typeof params.folderId === "string" ? params.folderId : undefined;

  useEffect(() => {
    loadContent();
  }, [token, folderId]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      // console.log("Loading content with token:", token, "folderId:", folderId);

      const response = await api.getSharedFolder(token, folderId);
      // console.log("Processed response:", response);

      setData(response);
    } catch (error) {
      console.error("Error loading content:", error);
      setError(
        "Failed to load content. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderFolder = ({ item }: { item: Folder }) => (
    <TouchableOpacity
      style={styles.folderItem}
      onPress={() =>
        router.push({
          pathname: "/" as never,
          params: { token, folderId: item.id },
        })
      }
    >
      <FontAwesome name="folder" size={24} color="#ffd700" />
      <View style={styles.folderDetails}>
        <Text style={styles.folderName}>{item.name}</Text>
        <Text style={styles.folderDate}>
          {new Date(item.createdTime).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFile = ({ item }: { item: File }) => (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() =>
        router.push({
          pathname: "/pdf",
          params: {
            fileId: item.id,
            fileName: item.name,
          },
        })
      }
    >
      <FontAwesome name="file-pdf-o" size={24} color="#ff4444" />
      <View style={styles.fileDetails}>
        <Text style={styles.fileName}>{item.name}</Text>
        <Text style={styles.fileInfo}>
          {item.formattedSize} •{" "}
          {new Date(item.createdTime).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[...data.folders, ...data.files]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          "mimeType" in item && item.mimeType?.includes("folder")
            ? renderFolder({ item: item as Folder })
            : renderFile({ item: item as File })
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={() => (
          <View style={styles.breadcrumbs}>
            {data.breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.id}>
                {index > 0 && <Text style={styles.breadcrumbSeparator}>/</Text>}
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/" as never,
                      params: { token, folderId: crumb.id },
                    })
                  }
                >
                  <Text style={styles.breadcrumb}>{crumb.name}</Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text>No files or folders found. Token: {token}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  breadcrumbs: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  breadcrumb: {
    color: "#0066cc",
    fontSize: 14,
  },
  breadcrumbSeparator: {
    color: "#666",
    marginHorizontal: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
  },
  folderItem: {
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  fileItem: {
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  folderDetails: {
    marginLeft: 10,
  },
  fileDetails: {
    marginLeft: 10,
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  folderDate: {
    fontSize: 12,
    color: "#666",
  },
  fileInfo: {
    fontSize: 12,
    color: "#666",
  },
  errorText: {
    color: "#ff4444",
    textAlign: "center",
    marginHorizontal: 20,
  },
});
