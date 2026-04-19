import { Feather, Ionicons } from "@expo/vector-icons";
import api from "@/lib/api";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {Dropdown} from 'react-native-element-dropdown';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/auth";
import Toast, {ToastType} from "../(app)/results/components/Toast";

const screenWidth = Dimensions.get("window").width;

const roles = ["All Roles", "Admin", "Coordinator", "Volunteer", "Athlete", "Guardian"];

const UserManagerScreen = () => {
  const { userData, isReady , role,userId  } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [volunteerTasks, setVolunteerTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [toastDuration, setToastDuration] = useState(3000);
  const showToast = (message: string, type: ToastType, duration?: number) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setToastDuration(duration || 3000);
  };
  useEffect(() => {
    if (isReady && role !== "admin" && role !== "coordinator") {
      router.replace("/dashboard");
    }else{
      fetchUsers();
      fetchVolunteerRoles();
    }
  }, [isReady]);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
        setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };
  const fetchVolunteerRoles = async()=>{
    try{
      let res = await api.get('/volunteer_tasks');
      res.data.volunteer_tasks.unshift({title:"Assign New Volunteer Task",_id:null});
      setVolunteerTasks(res.data.volunteer_tasks || []);
    }catch(err){
      console.error('Failed to fetch volunteer roles', err);
    }finally{
      setLoading(false);
    }
  };
  const changeVolunteerTask = async(item:any)=>{
    
    if (item === null || item._id === null) {
      setSelectedUser(null);
      setCurrentTask(null);
      return;
    }
    
    try{
      const res = await api.post('/volunteer_task_assignment',{
        volunteer_id: selectedUser._id,
        task_id: item._id,
        assigned_by: userId,
        Shift_Start_Date_Time: new Date().toISOString().split('.')[0],

      })
      showToast('Volunteer task assigned successfully', 'success');
    }catch(error){
      console.error('Failed to assign volunteer task', error);
      showToast('Failed to assign volunteer task', 'error');
    }finally{
        setSelectedUser(null);
        setCurrentTask(null);
    }
  }
  

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullName = `${user.first_name} ${user.last_name}`;
      const matchesSearch =
        searchTerm === "" ||
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.member_id.toString()?.includes(searchTerm);

      const matchesRole = selectedRole === "All Roles" || user.role.toLowerCase() === selectedRole.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => setSelectedUser(item)}>
      <View style={styles.avatarContainer}>
        {item.profile_picture ? (
          <Image source={{ uri: item.profile_picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center" }]}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              {item.first_name?.[0] ?? ""}
              {item.last_name?.[0] ?? ""}
            </Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.first_name} {item.last_name}</Text>
          <Text style={styles.roleBadge}>{item.role}</Text>
        </View>
        <Text style={styles.userDetail}>Member ID: {item.member_id}</Text>
        <Text style={styles.userDetail}>{item.email}</Text>
        <Text style={styles.userDetail}>{item.phone}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#C4161C" />
    </TouchableOpacity>
  );

  if (!isReady || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#C4161C" />
        <Text style={{ marginTop: 10 }}>Loading users...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
        duration={toastDuration}
      />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.header}>User Manager</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#C4161C" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subHeader}>Manage and view all user accounts</Text>

        <View style={styles.bar} />

        <View style={styles.filterCard}>
          <TextInput
            style={styles.input}
            placeholder="Search by Member ID, Name, or Email..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilterRow}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[styles.roleButton, selectedRole === role && styles.roleButtonActive]}
                onPress={() => setSelectedRole(role)}
              >
                <Text style={selectedRole === role ? styles.roleTextActive : styles.roleText}>{role}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.totalUsers}>Total Users: {filteredUsers.length}</Text>
        </View>

        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </ScrollView>

      <Modal visible={!!selectedUser} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={styles.modalTitle}>{selectedUser?.first_name} {selectedUser?.last_name}</Text>
              <Text style={styles.modalSub}>{selectedUser?.role}</Text>
              <Text style={styles.modalInfo}>Member ID: {selectedUser?.member_id}</Text>
              <Text style={styles.modalInfo}>Email: {selectedUser?.email}</Text>
              <Text style={styles.modalInfo}>Phone: {selectedUser?.phone}</Text>
              <Text style={styles.modalInfo}>DOB: {selectedUser?.dob}</Text>
              <Text style={styles.modalInfo}>Pronouns: {selectedUser?.pronouns}</Text>
              <Text style={styles.modalInfo}>Guardian Name: {selectedUser?.guardian_name}</Text>
              <Text style={styles.modalInfo}>Medical Info: {selectedUser?.medical_info}</Text>
              {selectedUser?.role === "volunteer" && (role==="admin" || role==="coordinator")&&
              <Dropdown style={styles.dropdown} search data={volunteerTasks} labelField="title" valueField="_id" onChange={(item)=>setCurrentTask(item)} placeholder="Assign New Volunteer Task" placeholderStyle={styles.placeholderText} 
              selectedTextStyle={styles.placeholderText} itemTextStyle={styles.placeholderText} searchPlaceholder="Search..." inputSearchStyle={styles.placeholderText}></Dropdown>
                }
              
            </ScrollView>
            <TouchableOpacity onPress={() => changeVolunteerTask(currentTask)} style={styles.closeButton}>
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default UserManagerScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF",
    padding: 16,
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#000",
  },
  subHeader: {
    fontSize: 14,
    marginBottom: 16,
    color: "#666",
  },
  bar: {
    height: 10,
    backgroundColor: "#C4161C",
    borderRadius: 10,
    marginBottom: 16,
  },
  filterCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderBottomWidth: 4,
    borderBottomColor: "#C4161C",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: "#C4161C",
    padding: 8,
    marginBottom: 12,
  },
  roleFilterRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  roleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginRight: 8,
  },
  roleButtonActive: {
    backgroundColor: "#C4161C",
  },
  roleText: {
    color: "#333",
    fontSize: 12,
  },
  roleTextActive: {
    color: "#FFF",
    fontSize: 12,
  },
  totalUsers: {
    marginTop: 8,
    fontWeight: "bold",
    color: "#000",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#C4161C",
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontWeight: "bold",
    color: "#000",
    marginRight: 8,
  },
  roleBadge: {
    backgroundColor: "#C4161C",
    color: "#FFF",
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  userDetail: {
    fontSize: 12,
    color: "#555",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    width: "100%",
    maxHeight: "85%",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#000",
  },
  modalSub: {
    textAlign: "center",
    backgroundColor: "#C4161C",
    color: "#fff",
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalInfo: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
  },
  closeButton: {
    backgroundColor: "#C4161C",
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  dropdown:{
    marginBottom:8,
    width:"50%",
    borderColor: "#333",
    borderWidth:1,
    borderRadius:12,
    padding:12,
    shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,

      elevation: 2,
  },
  placeholderText:{
    fontSize: 14,
    color: "#333",
  },
  selectedText:{
    fontSize: 14,
    color: "#333",
  }

});
