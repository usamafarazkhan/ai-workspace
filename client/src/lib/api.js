import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth & Users
export const getCurrentUser = () => api.get('/auth/me');
export const switchActiveUser = (data) => api.post('/auth/switch-active-member', data);

// Projects
export const getProjects = () => api.get('/projects');
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const getProjectMembers = (id) => api.get(`/projects/${id}/members`);
export const addProjectMember = (id, data) => api.post(`/projects/${id}/members`, data);
export const updateProjectMember = (projectId, memberId, data) => api.put(`/projects/${projectId}/members/${memberId}`, data);
export const deleteProjectMember = (projectId, memberId) => api.delete(`/projects/${projectId}/members/${memberId}`);

// Classes / Workstreams
export const getProjectClasses = (projectId) => api.get(`/projects/${projectId}/classes`);
export const createProjectClass = (projectId, data) => api.post(`/projects/${projectId}/classes`, data);
export const updateProjectClass = (classId, data) => api.put(`/classes/${classId}`, data);
export const deleteProjectClass = (classId) => api.delete(`/classes/${classId}`);

// Conversations & Messages
export const getConversations = (projectId, classId = null) =>
  api.get(`/chats/project/${projectId}`, { params: { class_id: classId } });
export const createConversation = (data) => api.post('/chats', data);
export const getMessages = (conversationId) => api.get(`/chats/${conversationId}/messages`);
export const sendMessage = (conversationId, content, senderName, senderMemberId = null, senderRole = null) =>
  api.post(`/chats/${conversationId}/messages`, {
    conversation_id: conversationId,
    content,
    sender_name: senderName,
    sender_member_id: senderMemberId,
    sender_role: senderRole
  });
export const convertMessageToTask = (messageId) => api.post(`/chats/messages/${messageId}/convert-to-task`);

// Personal Assistant Drawer
export const getAssistantMessages = (projectId = null) =>
  api.get('/personal-assistant/messages', { params: { project_id: projectId } });
export const sendAssistantMessage = (projectId, content) =>
  api.post('/personal-assistant/chat', { project_id: projectId, content });
export const transferAssistantDraft = (data) => api.post('/personal-assistant/transfer', data);

// Project Memory
export const getMemories = (projectId) => api.get(`/memories/project/${projectId}`);
export const createMemory = (projectId, data) => api.post(`/memories/project/${projectId}`, data);
export const deleteMemory = (memoryId) => api.delete(`/memories/${memoryId}`);

// Knowledge Files & RAG
export const getFiles = (projectId) => api.get(`/files/project/${projectId}`);
export const uploadFile = (projectId, file) => {
  const formData = new FormData();
  formData.append('project_id', projectId);
  formData.append('file', file);
  return api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Tasks & Kanban
export const getTasks = (projectId, params = {}) => api.get(`/tasks/project/${projectId}`, { params });
export const createTask = (projectId, data) => api.post(`/tasks/project/${projectId}`, data);
export const updateTask = (taskId, data) => api.put(`/tasks/${taskId}`, data);
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);
export const generateAITasks = (projectId, goalPrompt) =>
  api.post(`/tasks/project/${projectId}/ai-breakdown`, null, { params: { goal_prompt: goalPrompt } });

// Artifacts Studio
export const getArtifacts = (projectId, classId = null) =>
  api.get(`/artifacts/project/${projectId}`, { params: { class_id: classId } });
export const createArtifact = (projectId, data) => api.post(`/artifacts/project/${projectId}`, data);
export const updateArtifact = (artifactId, data) => api.put(`/artifacts/${artifactId}`, null, { params: data });
export const getArtifactVersions = (artifactId) => api.get(`/artifacts/${artifactId}/versions`);
export const restoreArtifactVersion = (artifactId, versionId) => api.post(`/artifacts/${artifactId}/restore/${versionId}`);

// Global Search
export const searchWorkspace = (query, projectId = null) =>
  api.get('/search', { params: { q: query, project_id: projectId } });

// Activity Audit & Member History (Requirement 2)
export const getActivityLogs = (projectId, params = {}) =>
  api.get(`/activity/project/${projectId}`, { params });
export const getRoleGroupedActivity = (projectId) =>
  api.get(`/activity/project/${projectId}/grouped-by-role`);
export const logActivity = (data) =>
  api.post('/activity/log', data);

export default api;
