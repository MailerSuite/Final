import axios from "@/http/axios";

const AIMLAPI_BASE_URL = "https://api.aimlapi.com";
const AIMLAPI_HEADERS = {
  Authorization: `Bearer a1a22d1472c24021a5c3f0c724efa431`,
  "Content-Type": "application/json",
};

export interface ModelResponse {
  name: string;
}

export const fetchModels = async (): Promise<string[]> => {
  const { data } = await axios.get<ModelResponse[]>(
    `${AIMLAPI_BASE_URL}/v1/models`,
    { headers: AIMLAPI_HEADERS },
  );
  return data.map((m) => m.name);
};

export interface ChatRequest {
  messages: { role: string; content: string }[];
  model: string;
}

export const sendChat = async (payload: ChatRequest) => {
  const { data } = await axios.post(
    `${AIMLAPI_BASE_URL}/v1/chat/completions`,
    payload,
    { headers: AIMLAPI_HEADERS },
  );
  return data;
};

// Default export object with all methods
const aimlApi = {
  fetchModels,
  sendChat,
};

export default aimlApi;
